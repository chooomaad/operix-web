<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">{{ t('incidents.title') }}</h2>
        <p class="text-sm text-gray-500">{{ meta?.total ?? 0 }} {{ t('incidents.title').toLowerCase() }}</p>
      </div>
      <div class="flex items-center gap-2" v-if="auth.isAdmin">
        <button @click="exportExcel" class="btn-secondary text-sm"><ArrowDownTrayIcon class="w-4 h-4" /> Excel</button>
        <button @click="exportPdf"   class="btn-secondary text-sm"><DocumentArrowDownIcon class="w-4 h-4" /> PDF</button>
        <button @click="showForm = true" class="btn-primary text-sm"><PlusIcon class="w-4 h-4" /> {{ t('incidents.add') }}</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-4 gap-3">
      <div class="card-sm text-center"><div class="text-xl font-bold text-gray-900">{{ stats.total ?? 0 }}</div><div class="text-xs text-gray-500">{{ t('incidents.ytd') }}</div></div>
      <div class="card-sm text-center"><div class="text-xl font-bold text-red-600">{{ stats.open ?? 0 }}</div><div class="text-xs text-gray-500">{{ t('incidents.openCount') }}</div></div>
      <div class="card-sm text-center"><div class="text-xl font-bold text-green-600">{{ stats.closed ?? 0 }}</div><div class="text-xs text-gray-500">{{ t('incidents.closedCount') }}</div></div>
      <div class="card-sm text-center"><div class="text-xl font-bold text-brand-600">{{ stats.taux_frequence ?? 0 }}</div><div class="text-xs text-gray-500">{{ t('incidents.tf') }}</div></div>
    </div>

    <!-- Filters -->
    <div class="card-sm flex flex-wrap gap-3">
      <input v-model="filters.search" @input="debouncedLoad" :placeholder="t('incidents.searchPlaceholder')" class="input flex-1 min-w-48" />
      <select v-model="filters.severity" @change="load" class="input w-36">
        <option value="">{{ t('severity.allSeverities') }}</option>
        <option value="low">{{ t('severity.low') }}</option>
        <option value="medium">{{ t('severity.medium') }}</option>
        <option value="high">{{ t('severity.high') }}</option>
        <option value="critical">{{ t('severity.critical') }}</option>
      </select>
      <select v-model="filters.type" @change="load" class="input w-36">
        <option value="">{{ t('incidents.allTypes') }}</option>
        <option v-for="code in INCIDENT_TYPES" :key="code" :value="code">
          {{ t(`incidents.types.${code}`) }}
        </option>
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

    <DataTable :columns="columns" :rows="incidents" :loading="loading" :meta="meta" :empty-text="t('incidents.empty')" @page="loadPage">
      <template #cell-reference="{ value }"><span class="font-mono text-xs font-medium">{{ value }}</span></template>
      <template #cell-severity="{ value }">
        <span :class="`badge-${value}`">{{ t(`severity.${value}`) }}</span>
      </template>
      <template #cell-status="{ value }">
        <span :class="`badge-${value}`">{{ t(`status.${value}`) }}</span>
      </template>
      <template #cell-description="{ value }">
        <span class="text-xs text-gray-600">{{ (value ?? '').substring(0, 80) }}{{ (value?.length ?? 0) > 80 ? '...' : '' }}</span>
      </template>
      <template #actions="{ row }">
        <div class="flex justify-end gap-2">
          <RouterLink :to="`/incidents/${(row as any).id}`" class="btn-secondary text-xs py-1 px-2">{{ t('common.view') }}</RouterLink>
          <button v-if="auth.isAdmin && (row as any).status === 'open'" @click="closeIncident(row as any)" class="btn-primary text-xs py-1 px-2">{{ t('incidents.close') }}</button>
          <button v-if="auth.isAdmin" @click="exportOnePdf(row as any)" class="btn-secondary text-xs py-1 px-2">PDF</button>
        </div>
      </template>
    </DataTable>

    <IncidentFormModal v-if="showForm" @close="showForm = false" @created="load" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { incidentsApi, exportsApi, reportsApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useDownload } from '@/composables/useDownload'
import DataTable from '@/components/ui/DataTable.vue'
import LoadErrorBanner from '@/components/ui/LoadErrorBanner.vue'
import IncidentFormModal from './IncidentFormModal.vue'
import { PlusIcon, ArrowDownTrayIcon, DocumentArrowDownIcon } from '@heroicons/vue/24/outline'
import { INCIDENT_TYPES } from '@/types/incident'

const { t } = useI18n()
const auth   = useAuthStore()
const toast  = useToast()
const { downloadExcel, downloadPdf } = useDownload()

const incidents = ref<any[]>([])
const stats     = ref<any>({})
const loading   = ref(false)
const meta      = ref<any>(null)
const loadError = ref(false)
const showForm  = ref(false)
const filters   = reactive({ search: '', severity: '', type: '', status: '', from: '', to: '', page: 1 })

const columns = computed(() => [
  { key: 'reference',   label: t('incidents.reference') },
  { key: 'date',        label: t('incidents.date') },
  { key: 'location',    label: t('incidents.location') },
  { key: 'type',        label: t('incidents.type') },
  { key: 'severity',    label: t('incidents.severity') },
  { key: 'description', label: t('incidents.description'), class: 'max-w-xs' },
  { key: 'status',      label: t('incidents.status') },
])

let debounceTimer: ReturnType<typeof setTimeout>
function debouncedLoad() { clearTimeout(debounceTimer); debounceTimer = setTimeout(load, 300) }

async function load() {
  loading.value = true
  loadError.value = false
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    const [list, st] = await Promise.all([incidentsApi.list(params), incidentsApi.stats()])
    incidents.value = list.data.data
    meta.value      = list.data.meta
    stats.value     = st.data
  } catch (e) {
    // Un echec de chargement (backend injoignable, 500, hors-ligne) ne doit JAMAIS
    // faire tomber toute la page : on garde l'ecran affiche avec une banniere
    // « Reessayer » au lieu de laisser l'erreur remonter a l'ErrorBoundary global.
    loadError.value = true
  } finally { loading.value = false }
}

function loadPage(page: number) { filters.page = page; load() }
function resetFilters() { Object.assign(filters, { search:'', severity:'', type:'', status:'', from:'', to:'', page:1 }); load() }

async function closeIncident(inc: any) {
  const cause      = prompt(t('incidents.rootCause') + ' :')
  const corrective = prompt(t('incidents.correctiveAction') + ' :')
  if (!cause || !corrective) return
  await incidentsApi.close(inc.id, { root_cause: cause, corrective_action: corrective })
  toast.add({ severity: 'success', summary: t('incidents.closed_msg'), life: 3000 })
  load()
}

async function exportExcel()     { await downloadExcel(() => exportsApi.incidents(filters), 'incidents.xlsx') }
async function exportPdf()       { await downloadPdf(() => reportsApi.incidents(filters), 'incidents.pdf') }
async function exportOnePdf(inc: any) { await downloadPdf(() => reportsApi.incidentDetail(inc.id), `${inc.reference}.pdf`) }

onMounted(load)
</script>
