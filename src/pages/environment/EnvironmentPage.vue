<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">{{ t('environment.title') }}</h2>
        <p class="text-sm text-gray-500">{{ meta?.total ?? 0 }} {{ t('common.total').toLowerCase() }}</p>
      </div>
      <div class="flex gap-2" v-if="auth.isAdmin">
        <button @click="exportExcel" class="btn-secondary text-sm"><ArrowDownTrayIcon class="w-4 h-4" /> Excel</button>
        <button @click="exportPdf"   class="btn-secondary text-sm"><DocumentArrowDownIcon class="w-4 h-4" /> PDF</button>
        <button @click="showForm = true" class="btn-primary text-sm"><PlusIcon class="w-4 h-4" /> {{ t('environment.add') }}</button>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-3">
      <div class="card-sm text-center"><div class="text-xl font-bold text-gray-900">{{ stats.total ?? 0 }}</div><div class="text-xs text-gray-500">{{ t('common.total') }}</div></div>
      <div class="card-sm text-center"><div class="text-xl font-bold text-red-600">{{ stats.open ?? 0 }}</div><div class="text-xs text-gray-500">{{ t('status.open') }}</div></div>
      <div class="card-sm text-center"><div class="text-xl font-bold text-green-600">{{ stats.closed ?? 0 }}</div><div class="text-xs text-gray-500">{{ t('status.closed') }}</div></div>
      <div class="card-sm text-center"><div class="text-xl font-bold text-amber-600">{{ stats.this_month ?? 0 }}</div><div class="text-xs text-gray-500">{{ t('visitors.thisMonth') }}</div></div>
    </div>

    <div class="card-sm flex flex-wrap gap-3">
      <input v-model="filters.search" @input="debouncedLoad" :placeholder="t('environment.searchPlaceholder')" class="input flex-1 min-w-48" />
      <select v-model="filters.type" @change="load" class="input w-40">
        <option value="">{{ t('incidents.allTypes') }}</option>
        <option value="dechets">{{ t('environment.types.dechets') }}</option>
        <option value="deversement">{{ t('environment.types.deversement') }}</option>
        <option value="emissions">{{ t('environment.types.emissions') }}</option>
        <option value="bruit">{{ t('environment.types.bruit') }}</option>
        <option value="autre">{{ t('environment.types.autre') }}</option>
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

    <DataTable :columns="columns" :rows="records" :loading="loading" :meta="meta" :empty-text="t('environment.empty')" @page="loadPage">
      <template #cell-reference="{ value }"><span class="font-mono text-xs font-medium">{{ value }}</span></template>
      <template #cell-status="{ value }"><span :class="`badge-${value}`">{{ t(`status.${value}`) }}</span></template>
      <template #cell-description="{ value }"><span class="text-xs text-gray-600">{{ (value ?? '').substring(0,80) }}</span></template>
      <template #actions="{ row }">
        <div class="flex justify-end gap-2">
          <button @click="viewRow = row as any" class="btn-secondary text-xs py-1 px-2">{{ t('common.view') }}</button>
          <button v-if="auth.isAdmin && (row as any).status === 'open'" @click="closeRow(row as any)" class="btn-primary text-xs py-1 px-2">{{ t('common.close') }}</button>
        </div>
      </template>
    </DataTable>

    <EnvironmentFormModal v-if="showForm" @close="showForm = false" @created="load" />

    <!-- Slide-over detail -->
    <div v-if="viewRow" class="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div class="bg-white w-full max-w-lg h-full overflow-y-auto p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">{{ viewRow.reference }}</h3>
          <button @click="viewRow = null"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><span class="text-gray-500 block">{{ t('environment.date') }}</span><strong>{{ viewRow.date }}</strong></div>
          <div><span class="text-gray-500 block">{{ t('environment.location') }}</span><strong>{{ viewRow.location }}</strong></div>
          <div><span class="text-gray-500 block">{{ t('environment.type') }}</span><strong>{{ viewRow.type }}</strong></div>
          <div><span class="text-gray-500 block">{{ t('common.status') }}</span><span :class="`badge-${viewRow.status}`">{{ t(`status.${viewRow.status}`) }}</span></div>
        </div>
        <div v-if="viewRow.description" class="text-sm">
          <p class="font-semibold text-gray-700 mb-1">{{ t('environment.description') }}</p>
          <p class="text-gray-600">{{ viewRow.description }}</p>
        </div>
        <div v-if="viewRow.impact" class="text-sm">
          <p class="font-semibold text-gray-700 mb-1">{{ t('environment.impact') }}</p>
          <p class="text-gray-600">{{ viewRow.impact }}</p>
        </div>
        <div v-if="viewRow.corrective_action" class="text-sm">
          <p class="font-semibold text-gray-700 mb-1">{{ t('environment.correctiveAction') }}</p>
          <p class="text-gray-600">{{ viewRow.corrective_action }}</p>
        </div>
        <div v-if="auth.isAdmin && viewRow.status === 'open'" class="pt-4 border-t space-y-3">
          <label class="label">{{ t('environment.correctiveAction') }} *</label>
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
import { environmentApi, exportsApi, reportsApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useDownload } from '@/composables/useDownload'
import DataTable from '@/components/ui/DataTable.vue'
import EnvironmentFormModal from './EnvironmentFormModal.vue'
import { PlusIcon, ArrowDownTrayIcon, DocumentArrowDownIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const auth   = useAuthStore()
const toast  = useToast()
const { downloadExcel, downloadPdf } = useDownload()

const records  = ref<any[]>([])
const stats    = ref<any>({})
const loading  = ref(false)
const meta     = ref<any>(null)
const showForm = ref(false)
const viewRow  = ref<any>(null)
const closeCA  = ref('')
const filters  = reactive({ search: '', type: '', status: '', from: '', to: '', page: 1 })

const columns = computed(() => [
  { key: 'reference',   label: t('environment.reference') },
  { key: 'date',        label: t('environment.date') },
  { key: 'location',    label: t('environment.location') },
  { key: 'type',        label: t('environment.type') },
  { key: 'description', label: t('environment.description'), class: 'max-w-xs' },
  { key: 'status',      label: t('common.status') },
])

let timer: ReturnType<typeof setTimeout>
function debouncedLoad() { clearTimeout(timer); timer = setTimeout(load, 300) }

async function load() {
  loading.value = true
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    const [list, st] = await Promise.all([environmentApi.list(params), environmentApi.stats()])
    records.value = list.data.data; meta.value = list.data.meta; stats.value = st.data
  } finally { loading.value = false }
}

function loadPage(page: number) { filters.page = page; load() }
function resetFilters() { Object.assign(filters, { search:'', type:'', status:'', from:'', to:'', page:1 }); load() }

async function closeRow(row: any) {
  const ca = viewRow.value ? closeCA.value : prompt(t('environment.correctiveAction') + ' :')
  if (!ca) return
  try {
    await environmentApi.close(row.id, { corrective_action: ca })
    toast.add({ severity: 'success', summary: t('common.success'), life: 3000 })
    viewRow.value = null; closeCA.value = ''; load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? t('common.error'), life: 4000 })
  }
}

async function exportExcel() { await downloadExcel(() => exportsApi.environment(filters), 'environment.xlsx') }
async function exportPdf()   { await downloadPdf(() => reportsApi.environment(filters), 'environment.pdf') }
onMounted(load)
</script>
