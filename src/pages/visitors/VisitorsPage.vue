<template>
  <div class="p-4 sm:p-6 space-y-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">{{ t('visitors.title') }}</h2>
        <p class="text-sm text-gray-500">{{ meta?.total ?? 0 }} visiteur(s)</p>
      </div>
      <div class="flex gap-2">
        <button @click="exportExcel" class="btn-secondary text-sm"><ArrowDownTrayIcon class="w-4 h-4" /> Excel</button>
        <button v-if="auth.isAdmin" @click="showForm = true" class="btn-primary text-sm">
          <PlusIcon class="w-4 h-4" /> {{ t('visitors.register') }}
        </button>
      </div>
    </div>

    <!-- KPIs rapides -->
    <div class="grid grid-cols-3 gap-3">
      <div class="card-sm text-center">
        <div class="text-2xl font-black text-green-600">{{ onSiteCount }}</div>
        <div class="text-xs text-gray-500 font-medium mt-0.5">{{ t('visitors.onSite') }}</div>
      </div>
      <div class="card-sm text-center">
        <div class="text-2xl font-black text-blue-600">{{ todayCount }}</div>
        <div class="text-xs text-gray-500 font-medium mt-0.5">{{ t('visitors.today') }}</div>
      </div>
      <div class="card-sm text-center">
        <div class="text-2xl font-black text-gray-600">{{ meta?.total ?? 0 }}</div>
        <div class="text-xs text-gray-500 font-medium mt-0.5">{{ t('common.total') }}</div>
      </div>
    </div>

    <!-- Filtres -->
    <div class="card-sm flex flex-wrap gap-3">
      <input v-model="filters.search" @input="debouncedLoad" :placeholder="t('visitors.searchPlaceholder')" class="input flex-1 min-w-48" />
      <select v-model="filters.status" @change="load" class="input w-36">
        <option value="">{{ t('visitors.allStatuses') }}</option>
        <option value="in">{{ t('visitors.statusIn') }}</option>
        <option value="out">{{ t('visitors.statusOut') }}</option>
        <option value="planned">{{ t('visitors.statusPlanned') }}</option>
      </select>
      <input v-model="filters.from" type="date" @change="load" class="input w-36" />
      <input v-model="filters.to"   type="date" @change="load" class="input w-36" />
      <button @click="resetFilters" class="btn-secondary text-xs">{{ t('common.reset') }}</button>
    </div>

    <!-- Tableau -->
    <DataTable :columns="columns" :rows="records" :loading="loading" :meta="meta" :empty-text="t('visitors.noVisitors')" @page="loadPage">

      <template #cell-nom="{ row }">
        <span class="font-medium text-gray-900">{{ (row as any).prenom }} {{ (row as any).nom }}</span>
      </template>

      <template #cell-status="{ value }">
        <span :class="{
          'badge-active':   value === 'in',
          'badge-inactive': value === 'out',
          'badge-pending':  value === 'planned',
        }">
          {{ value === 'in' ? t('visitors.statusIn') : value === 'out' ? t('visitors.statusOut') : t('visitors.statusPlanned') }}
        </span>
      </template>

      <template #cell-checked_in_at="{ value }">
        <span class="text-sm text-gray-600">{{ value ?? '—' }}</span>
      </template>

      <template #cell-checked_out_at="{ value }">
        <span :class="value ? 'text-gray-500 text-sm' : 'text-green-600 text-sm font-medium'">
          {{ value ?? t('visitors.present') }}
        </span>
      </template>

      <template #actions="{ row }">
        <div class="flex justify-end gap-2">
          <RouterLink :to="`/people/visitor/${(row as any).id}`" class="btn-secondary text-xs py-1 px-2">{{ t('common.view') }}</RouterLink>
          <button
            v-if="(row as any).status === 'in' && auth.isAdmin"
            @click="checkout(row as any)"
            class="btn-primary text-xs py-1 px-2"
          >
            {{ t('visitors.checkoutBtn') }}
          </button>
          <button
            v-if="auth.isAdmin"
            @click="deleteVisitor(row as any)"
            class="text-red-500 hover:text-red-700 text-xs py-1 px-2"
          >
            {{ t('visitors.deleteBtn') }}
          </button>
        </div>
      </template>
    </DataTable>

    <VisitorFormModal v-if="showForm" @close="showForm = false" @created="load" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { visitorsApi, exportsApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useDownload } from '@/composables/useDownload'
import DataTable from '@/components/ui/DataTable.vue'
import VisitorFormModal from './VisitorFormModal.vue'
import { PlusIcon, ArrowDownTrayIcon } from '@heroicons/vue/24/outline'

const { t }  = useI18n()
const auth   = useAuthStore()
const toast  = useToast()
const { downloadExcel } = useDownload()

const records  = ref<any[]>([])
const loading  = ref(false)
const meta     = ref<any>(null)
const showForm = ref(false)
const filters  = reactive({ search: '', status: '', from: '', to: '', page: 1 })

const onSiteCount = computed(() => records.value.filter(r => r.status === 'in').length)
const todayCount  = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return records.value.filter(r => r.checked_in_at?.startsWith(today)).length
})

const columns = computed(() => [
  { key: 'nom',              label: t('visitors.columnVisitor') },
  { key: 'entreprise',       label: t('visitors.columnCompany') },
  { key: 'motif',            label: t('visitors.columnPurpose') },
  { key: 'personne_visitee', label: t('visitors.columnHost') },
  { key: 'badge_number',     label: t('visitors.columnBadge') },
  { key: 'status',           label: t('visitors.columnStatus') },
  { key: 'checked_in_at',    label: t('visitors.columnEntry') },
  { key: 'checked_out_at',   label: t('visitors.columnExit') },
])

let timer: ReturnType<typeof setTimeout>
function debouncedLoad() { clearTimeout(timer); timer = setTimeout(load, 300) }

async function load() {
  loading.value = true
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    const { data } = await visitorsApi.list(params)
    records.value = data.data
    meta.value    = data.meta
  } finally {
    loading.value = false
  }
}

function loadPage(page: number) { filters.page = page; load() }
function resetFilters() { Object.assign(filters, { search: '', status: '', from: '', to: '', page: 1 }); load() }

async function checkout(row: any) {
  if (!confirm(`Enregistrer la sortie de ${row.prenom} ${row.nom} ?`)) return
  try {
    await visitorsApi.checkout(row.id)
    toast.add({ severity: 'success', summary: t('visitors.checkoutRecorded'), life: 3000 })
    load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? 'Erreur', life: 4000 })
  }
}

async function deleteVisitor(row: any) {
  if (!confirm(`Supprimer la visite de ${row.prenom} ${row.nom} ?`)) return
  try {
    await visitorsApi.destroy(row.id)
    toast.add({ severity: 'success', summary: t('visitors.deleted'), life: 3000 })
    load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? 'Erreur', life: 4000 })
  }
}

async function exportExcel() { await downloadExcel(() => exportsApi.visitors(filters), 'visiteurs.xlsx') }

onMounted(load)
</script>
