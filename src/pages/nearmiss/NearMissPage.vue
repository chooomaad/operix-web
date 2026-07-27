<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">{{ t('nearMiss.title') }}</h2>
        <p class="text-sm text-gray-500">{{ meta?.total ?? 0 }} {{ t('common.total').toLowerCase() }}</p>
      </div>
      <div class="flex gap-2" v-if="auth.isAdmin">
        <button @click="exportExcel" class="btn-secondary text-sm"><ArrowDownTrayIcon class="w-4 h-4" /> Excel</button>
        <button @click="exportPdf"   class="btn-secondary text-sm"><DocumentArrowDownIcon class="w-4 h-4" /> PDF</button>
        <button @click="showForm = true" class="btn-primary text-sm"><PlusIcon class="w-4 h-4" /> {{ t('nearMiss.add') }}</button>
      </div>
    </div>

    <div class="card-sm flex flex-wrap gap-3">
      <input v-model="filters.search" @input="debouncedLoad" :placeholder="t('nearMiss.searchPlaceholder')" class="input flex-1 min-w-48" />
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

    <DataTable :columns="columns" :rows="records" :loading="loading" :meta="meta" :empty-text="t('nearMiss.empty')" @page="loadPage">
      <template #cell-reference="{ value }"><span class="font-mono text-xs font-medium">{{ value }}</span></template>
      <template #cell-severity="{ value }"><span :class="`badge-${value}`">{{ t(`severity.${value}`) }}</span></template>
      <template #cell-status="{ value }"><span :class="`badge-${value}`">{{ t(`status.${value}`) }}</span></template>
      <template #cell-description="{ value }"><span class="text-xs text-gray-600">{{ (value ?? '').substring(0,80) }}</span></template>
      <template #actions="{ row }">
        <RouterLink :to="`/near-miss/${(row as any).id}`" class="btn-secondary text-xs py-1 px-2">{{ t('common.view') }}</RouterLink>
      </template>
    </DataTable>

    <NearMissFormModal v-if="showForm" @close="showForm = false" @created="load" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { nearMissApi, exportsApi, reportsApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useDownload } from '@/composables/useDownload'
import DataTable from '@/components/ui/DataTable.vue'
import NearMissFormModal from './NearMissFormModal.vue'
import { PlusIcon, ArrowDownTrayIcon, DocumentArrowDownIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const auth  = useAuthStore()
const { downloadExcel, downloadPdf } = useDownload()

const records = ref<any[]>([])
const loading = ref(false)
const meta    = ref<any>(null)
const showForm= ref(false)
const filters = reactive({ search: '', severity: '', status: '', from: '', to: '', page: 1 })

const columns = computed(() => [
  { key:'reference',  label: t('nearMiss.reference') },
  { key:'date',       label: t('nearMiss.date') },
  { key:'location',   label: t('nearMiss.location') },
  { key:'severity',   label: t('nearMiss.severity') },
  { key:'description',label: t('common.description'), class:'max-w-xs' },
  { key:'status',     label: t('common.status') },
])

let timer: ReturnType<typeof setTimeout>
function debouncedLoad() { clearTimeout(timer); timer = setTimeout(load, 300) }

async function load() {
  loading.value = true
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== ''))
    const { data } = await nearMissApi.list(params)
    records.value = data.data; meta.value = data.meta
  } finally { loading.value = false }
}

function loadPage(page: number) { filters.page = page; load() }
function resetFilters() { Object.assign(filters, { search:'', severity:'', status:'', from:'', to:'', page:1 }); load() }

async function exportExcel() { await downloadExcel(() => exportsApi.nearMiss(filters), 'near-miss.xlsx') }
async function exportPdf()   { await downloadPdf(() => reportsApi.nearMiss(filters), 'near-miss.pdf') }

onMounted(load)
</script>
