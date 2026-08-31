<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">{{ t('users.title') }}</h2>
        <p class="text-sm text-gray-500">{{ meta?.total ?? 0 }} {{ t('users.count') }}</p>
      </div>
      <button @click="showForm = true" class="btn-primary text-sm"><PlusIcon class="w-4 h-4" /> {{ t('users.new') }}</button>
    </div>

    <div class="card-sm flex flex-wrap gap-3">
      <input v-model="filters.search" @input="debouncedLoad" :placeholder="t('users.searchPlaceholder')" class="input flex-1 min-w-48" />
      <select v-model="filters.role" @change="() => load()" class="input w-36">
        <option value="">{{ t('users.allRoles') }}</option>
        <option value="company_admin">{{ t('users.roleCompanyAdmin') }}</option>
        <option value="hsse_manager">{{ t('users.roleHsseManager') }}</option>
        <option value="supervisor">{{ t('users.roleSupervisor') }}</option>
        <option value="agent">{{ t('users.roleAgent') }}</option>
      </select>
      <select v-model="filters.is_active" @change="() => load()" class="input w-32">
        <option value="">{{ t('users.allStatuses') }}</option>
        <option value="1">{{ t('users.statusActive') }}</option>
        <option value="0">{{ t('users.statusInactive') }}</option>
      </select>
      <button @click="resetFilters" class="btn-secondary text-xs">{{ t('common.reset') }}</button>
    </div>

    <DataTable :columns="columns" :rows="records" :loading="loading" :meta="meta" :empty-text="t('users.noUsers')" @page="loadPage">
      <template #cell-name="{ value, row }">
        <div class="flex items-center gap-2">
          <span
            class="w-2 h-2 rounded-full flex-shrink-0"
            :class="(row as any).is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-300'"
            :title="(row as any).is_online ? t('users.online') : t('users.offline')"
          />
          <span>{{ value }}</span>
        </div>
      </template>
      <template #cell-role="{ value }">
        <span :class="roleBadgeClass(value)">{{ roleLabel(value) }}</span>
      </template>
      <template #cell-is_active="{ value }">
        <span :class="value ? 'badge-active' : 'badge-inactive'">{{ value ? t('users.statusActive') : t('users.statusInactive') }}</span>
      </template>
      <template #cell-last_login_at="{ value }"><span class="text-xs text-gray-500">{{ formatLastLogin(value) }}</span></template>
      <template #actions="{ row }">
        <div class="flex justify-end gap-2">
          <button @click="editRow = row as any" class="btn-secondary text-xs py-1 px-2">{{ t('users.editBtn') }}</button>
          <button @click="toggleActive(row as any)" class="btn-secondary text-xs py-1 px-2">
            {{ (row as any).is_active ? t('users.deactivate') : t('users.activate') }}
          </button>
          <!-- Suppression : indisponible sur son propre compte (garde-fou serveur aussi). -->
          <button
            v-if="(row as any).id !== auth.user?.id"
            @click="confirmDelete(row as any)"
            class="btn-secondary text-xs py-1 px-2 !text-red-600 !border-red-200 hover:!bg-red-50"
          >{{ t('users.deleteBtn') }}</button>
        </div>
      </template>
    </DataTable>

    <UserFormModal v-if="showForm || editRow" :user="editRow" @close="showForm = false; editRow = null" @saved="() => load()" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getLocale } from '@/i18n'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { usersApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import DataTable from '@/components/ui/DataTable.vue'
import UserFormModal from './UserFormModal.vue'
import { PlusIcon } from '@heroicons/vue/24/outline'

const { t }    = useI18n()
const toast    = useToast()
const confirm  = useConfirm()
const auth     = useAuthStore()
const records  = ref<any[]>([])
const loading  = ref(false)
const meta     = ref<any>(null)
const showForm = ref(false)
const editRow  = ref<any>(null)
const filters  = reactive({ search: '', role: '', is_active: '', page: 1 })

// Libelles et couleurs des roles, alignes sur la matrice du serveur. Une valeur
// inconnue est affichee telle quelle plutot que masquee : si le backend ajoute
// un role, il reste visible.
const ROLE_LABELS: Record<string, string> = {
  company_admin: 'users.roleCompanyAdmin',
  hsse_manager:  'users.roleHsseManager',
  supervisor:    'users.roleSupervisor',
  agent:         'users.roleAgent',
  super_admin:   'users.roleSuperAdmin',
}

function roleLabel(role: string): string {
  const key = ROLE_LABELS[role]
  return key ? t(key) : role
}

// Derniere connexion : date + heure, ou « — » si le compte ne s'est jamais connecte.
function formatLastLogin(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleString(getLocale() === 'fr' ? 'fr-FR' : 'en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function roleBadgeClass(role: string): string {
  if (role === 'super_admin') return 'badge-critical'
  if (role === 'company_admin') return 'badge-approved'
  if (role === 'hsse_manager' || role === 'supervisor') return 'badge-active'
  return 'badge-active'
}

const columns = computed(() => [
  { key: 'name',          label: t('users.columnName') },
  { key: 'email',         label: t('users.columnEmail') },
  { key: 'matricule',     label: t('users.columnEmployeeId') },
  { key: 'role',          label: t('users.columnRole') },
  { key: 'is_active',     label: t('users.columnStatus') },
  { key: 'last_login_at', label: t('users.columnLastLogin') },
])

let timer: ReturnType<typeof setTimeout>
function debouncedLoad() { clearTimeout(timer); timer = setTimeout(load, 300) }

async function load(silent = false) {
  if (!silent) loading.value = true
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    const { data } = await usersApi.list(params)
    records.value = data.data; meta.value = data.meta
  } catch { /* auto-refresh silencieux : on ignore une erreur transitoire */ }
  finally { if (!silent) loading.value = false }
}

function loadPage(page: number) { filters.page = page; load() }
function resetFilters() { Object.assign(filters, { search:'', role:'', is_active:'', page:1 }); load() }

async function toggleActive(row: any) {
  try {
    await usersApi.update(row.id, { is_active: !row.is_active })
    toast.add({ severity: 'success', summary: row.is_active ? t('users.deactivated') : t('users.activated'), life: 3000 })
    load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? t('common.error'), life: 4000 })
  }
}

// Suppression DÉFINITIVE d'un compte : action irréversible, donc confirmation
// explicite. La désactivation (préservant l'attribution) reste rappelée dans le
// message. Le serveur applique aussi ses garde-fous (dernier admin, propre compte).
function confirmDelete(row: any) {
  confirm.require({
    header: t('users.deleteTitle'),
    message: t('users.deleteConfirm', { name: row.name }),
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: t('users.deleteBtn'),
    rejectLabel: t('common.cancel'),
    acceptClass: 'p-button-danger',
    accept: () => removeUser(row),
  })
}

async function removeUser(row: any) {
  try {
    await usersApi.destroy(row.id)
    toast.add({ severity: 'success', summary: t('users.deleted'), life: 3000 })
    load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? t('common.error'), life: 5000 })
  }
}

// Rafraichissement automatique chaque minute : les dates de derniere connexion et
// l'etat « en ligne » (last_seen < 2 min) restent a jour sans action de l'utilisateur.
// Silencieux (sans spinner) pour ne pas gener la navigation ni la saisie.
let refreshTimer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  load()
  refreshTimer = setInterval(() => load(true), 60_000)
})
onBeforeUnmount(() => clearInterval(refreshTimer))
</script>
