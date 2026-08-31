<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">{{ t('breaches.title') }}</h2>
        <p class="text-sm text-gray-500">{{ meta?.total ?? 0 }} {{ t('common.total').toLowerCase() }}</p>
      </div>
      <div class="flex gap-2" v-if="auth.isAdmin">
        <button @click="exportExcel" class="btn-secondary text-sm"><ArrowDownTrayIcon class="w-4 h-4" /> Excel</button>
        <button @click="exportPdf"   class="btn-secondary text-sm"><DocumentArrowDownIcon class="w-4 h-4" /> PDF</button>
        <button @click="showForm = true" class="btn-primary text-sm"><PlusIcon class="w-4 h-4" /> {{ t('breaches.add') }}</button>
      </div>
    </div>

    <div class="card-sm flex flex-wrap gap-3">
      <input v-model="filters.search" @input="debouncedLoad" :placeholder="t('breaches.searchPlaceholder')" class="input flex-1 min-w-48" />
      <select v-model="filters.type" @change="load" class="input w-40">
        <option value="">{{ t('incidents.allTypes') }}</option>
        <option value="procedure">{{ t('breaches.types.procedure') }}</option>
        <option value="epi">{{ t('breaches.types.epi') }}</option>
        <option value="consigne">{{ t('breaches.types.consigne') }}</option>
        <option value="autre">{{ t('breaches.types.autre') }}</option>
      </select>
      <select v-model="filters.severity" @change="load" class="input w-36">
        <option value="">{{ t('severity.allSeverities') }}</option>
        <option value="low">{{ t('severity.low') }}</option>
        <option value="medium">{{ t('severity.medium') }}</option>
        <option value="high">{{ t('severity.high') }}</option>
        <option value="critical">{{ t('severity.critical') }}</option>
      </select>
      <select v-model="filters.status" @change="load" class="input w-36">
        <option value="">{{ t('status.allStatuses') }}</option>
        <option value="open">{{ t('status.open') }}</option>
        <option value="closed">{{ t('status.closed') }}</option>
      </select>
      <input v-model="filters.from" type="date" @change="load" class="input w-36" />
      <input v-model="filters.to"   type="date" @change="load" class="input w-36" />
      <button @click="resetFilters" class="btn-secondary text-xs">{{ t('common.reset') }}</button>
    </div>

    <LoadErrorBanner v-if="loadError" :loading="loading" @retry="load" />

    <DataTable :columns="columns" :rows="records" :loading="loading" :meta="meta" :empty-text="t('breaches.empty')" @page="loadPage">
      <template #cell-reference="{ value }"><span class="font-mono text-xs font-medium">{{ value }}</span></template>
      <template #cell-severity="{ value }"><span :class="`badge-${value}`">{{ t(`severity.${value}`) }}</span></template>
      <template #cell-status="{ value }"><span :class="`badge-${value}`">{{ t(`status.${value}`) }}</span></template>
      <template #cell-description="{ value }"><span class="text-xs text-gray-600">{{ (value ?? '').substring(0,80) }}</span></template>
      <template #actions="{ row }">
        <div class="flex justify-end gap-2">
          <button @click="viewRow = row as any" class="btn-secondary text-xs py-1 px-2">{{ t('common.view') }}</button>
          <button v-if="auth.isAdmin && (row as any).status === 'open'" @click="closeRow(row as any)" class="btn-primary text-xs py-1 px-2">{{ t('common.close') }}</button>
        </div>
      </template>
    </DataTable>

    <BreachFormModal v-if="showForm" @close="showForm = false" @created="load" />

    <!-- Detail drawer -->
    <div v-if="viewRow" class="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div class="bg-white w-full max-w-lg h-full overflow-y-auto p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">{{ viewRow.reference }}</h3>
          <button @click="viewRow = null"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><span class="text-gray-500 block">{{ t('breaches.date') }}</span><strong>{{ viewRow.date }}</strong></div>
          <div><span class="text-gray-500 block">{{ t('breaches.location') }}</span><strong>{{ viewRow.location }}</strong></div>
          <div><span class="text-gray-500 block">{{ t('breaches.type') }}</span><strong>{{ viewRow.type }}</strong></div>
          <div><span class="text-gray-500 block">{{ t('common.status') }}</span><span :class="`badge-${viewRow.status}`">{{ t(`status.${viewRow.status}`) }}</span></div>
        </div>
        <div v-if="viewRow.description" class="text-sm">
          <p class="font-semibold text-gray-700 mb-1">{{ t('breaches.description') }}</p>
          <p class="text-gray-600">{{ viewRow.description }}</p>
        </div>
        <div v-if="viewRow.corrective_action" class="text-sm">
          <p class="font-semibold text-gray-700 mb-1">{{ t('breaches.correctiveAction') }}</p>
          <p class="text-gray-600">{{ viewRow.corrective_action }}</p>
        </div>
        <div v-if="auth.isAdmin && viewRow.status === 'open'" class="pt-4 border-t space-y-3">
          <label class="label">{{ t('breaches.correctiveAction') }} *</label>
          <textarea v-model="closeCA" class="input" rows="3" />
          <button @click="closeRow(viewRow)" :disabled="!closeCA" class="btn-primary w-full">{{ t('common.close') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { breachesApi, exportsApi, reportsApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useDownload } from '@/composables/useDownload'
import DataTable from '@/components/ui/DataTable.vue'
import LoadErrorBanner from '@/components/ui/LoadErrorBanner.vue'
import BreachFormModal from './BreachFormModal.vue'
import { PlusIcon, ArrowDownTrayIcon, DocumentArrowDownIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const auth   = useAuthStore()
const toast  = useToast()
const { downloadExcel, downloadPdf } = useDownload()

const records  = ref<any[]>([])
const loading  = ref(false)
const meta     = ref<any>(null)
const loadError = ref(false)
const showForm = ref(false)
const viewRow  = ref<any>(null)
const closeCA  = ref('')
const filters  = reactive({ search: '', type: '', severity: '', status: '', from: '', to: '', page: 1 })

const columns = computed(() => [
  { key: 'reference',   label: t('breaches.reference') },
  { key: 'date',        label: t('breaches.date') },
  { key: 'location',    label: t('breaches.location') },
  { key: 'type',        label: t('breaches.type') },
  { key: 'severity',    label: t('breaches.severity') },
  { key: 'description', label: t('breaches.description'), class: 'max-w-xs' },
  { key: 'status',      label: t('common.status') },
])

let timer: ReturnType<typeof setTimeout>
function debouncedLoad() { clearTimeout(timer); timer = setTimeout(load, 300) }

async function load() {
  loading.value = true
  loadError.value = false
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    const { data } = await breachesApi.list(params)
    records.value = data.data; meta.value = data.meta
  } catch (e) {
    // Un echec de chargement ne doit jamais faire tomber toute la page :
    // on affiche une banniere « Reessayer » plutot que l'ErrorBoundary global.
    loadError.value = true
  } finally { loading.value = false }
}

function loadPage(page: number) { filters.page = page; load() }
function resetFilters() { Object.assign(filters, { search:'', type:'', severity:'', status:'', from:'', to:'', page:1 }); load() }

async function closeRow(row: any) {
  const ca = viewRow.value ? closeCA.value : prompt(t('breaches.correctiveAction') + ' :')
  if (!ca) return
  try {
    await breachesApi.close(row.id, { corrective_action: ca })
    toast.add({ severity: 'success', summary: t('common.success'), life: 3000 })
    viewRow.value = null; closeCA.value = ''; load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? t('common.error'), life: 4000 })
  }
}

async function exportExcel() { await downloadExcel(() => exportsApi.breaches(filters), 'breaches.xlsx') }
async function exportPdf()   { await downloadPdf(() => reportsApi.breaches(filters), 'breaches.pdf') }
onMounted(load)
</script>
