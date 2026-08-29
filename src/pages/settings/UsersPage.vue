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
      <select v-model="filters.role" @change="load" class="input w-36">
        <option value="">{{ t('users.allRoles') }}</option>
        <option value="company_admin">{{ t('users.roleCompanyAdmin') }}</option>
        <option value="hsse_manager">{{ t('users.roleHsseManager') }}</option>
        <option value="supervisor">{{ t('users.roleSupervisor') }}</option>
        <option value="agent">{{ t('users.roleAgent') }}</option>
      </select>
      <select v-model="filters.is_active" @change="load" class="input w-32">
        <option value="">{{ t('users.allStatuses') }}</option>
        <option value="1">{{ t('users.statusActive') }}</option>
        <option value="0">{{ t('users.statusInactive') }}</option>
      </select>
      <button @click="resetFilters" class="btn-secondary text-xs">{{ t('common.reset') }}</button>
    </div>

    <DataTable :columns="columns" :rows="records" :loading="loading" :meta="meta" :empty-text="t('users.noUsers')" @page="loadPage">
      <template #cell-role="{ value }">
        <span :class="roleBadgeClass(value)">{{ roleLabel(value) }}</span>
      </template>
      <template #cell-is_active="{ value }">
        <span :class="value ? 'badge-active' : 'badge-inactive'">{{ value ? t('users.statusActive') : t('users.statusInactive') }}</span>
      </template>
      <template #cell-last_login_at="{ value }"><span class="text-xs text-gray-500">{{ value ? new Date(value).toLocaleDateString('fr-FR') : '—' }}</span></template>
      <template #actions="{ row }">
        <div class="flex justify-end gap-2">
          <button @click="editRow = row as any" class="btn-secondary text-xs py-1 px-2">{{ t('users.editBtn') }}</button>
          <button @click="toggleActive(row as any)" class="btn-secondary text-xs py-1 px-2">
            {{ (row as any).is_active ? t('users.deactivate') : t('users.activate') }}
          </button>
        </div>
      </template>
    </DataTable>

    <UserFormModal v-if="showForm || editRow" :user="editRow" @close="showForm = false; editRow = null" @saved="load" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { usersApi } from '@/api'
import DataTable from '@/components/ui/DataTable.vue'
import UserFormModal from './UserFormModal.vue'
import { PlusIcon } from '@heroicons/vue/24/outline'

const { t }    = useI18n()
const toast    = useToast()
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

async function load() {
  loading.value = true
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    const { data } = await usersApi.list(params)
    records.value = data.data; meta.value = data.meta
  } finally { loading.value = false }
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

onMounted(load)
</script>
