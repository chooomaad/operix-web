<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">{{ t('propertyDamage.title') }}</h2>
        <p class="text-sm text-gray-500">{{ meta?.total ?? 0 }} {{ t('common.total').toLowerCase() }}</p>
      </div>
      <div class="flex gap-2" v-if="auth.can('property_damage.create')">
        <button @click="showForm = true" class="btn-primary text-sm"><PlusIcon class="w-4 h-4" /> {{ t('propertyDamage.add') }}</button>
      </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="card-sm text-center"><div class="text-xl font-bold text-gray-900">{{ stats.total ?? 0 }}</div><div class="text-xs text-gray-500">{{ t('common.total') }}</div></div>
      <div class="card-sm text-center"><div class="text-xl font-bold text-red-600">{{ stats.open ?? 0 }}</div><div class="text-xs text-gray-500">{{ t('status.open') }}</div></div>
      <div class="card-sm text-center"><div class="text-xl font-bold text-green-600">{{ stats.closed ?? 0 }}</div><div class="text-xs text-gray-500">{{ t('status.closed') }}</div></div>
      <div class="card-sm text-center"><div class="text-xl font-bold text-amber-600">{{ formatCost(stats.estimated_cost) }}</div><div class="text-xs text-gray-500">{{ t('propertyDamage.totalCost') }}</div></div>
    </div>

    <div class="card-sm flex flex-wrap gap-3">
      <input v-model="filters.search" @input="debouncedLoad" :placeholder="t('propertyDamage.searchPlaceholder')" class="input flex-1 min-w-48" />
      <select v-model="filters.type" @change="load" class="input w-40">
        <option value="">{{ t('incidents.allTypes') }}</option>
        <option value="vehicle">{{ t('propertyDamage.types.vehicle') }}</option>
        <option value="equipment">{{ t('propertyDamage.types.equipment') }}</option>
        <option value="infrastructure">{{ t('propertyDamage.types.infrastructure') }}</option>
        <option value="cargo">{{ t('propertyDamage.types.cargo') }}</option>
        <option value="container">{{ t('propertyDamage.types.container') }}</option>
        <option value="other">{{ t('propertyDamage.types.other') }}</option>
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

    <DataTable :columns="columns" :rows="records" :loading="loading" :meta="meta" :empty-text="t('propertyDamage.empty')" @page="loadPage">
      <template #cell-reference="{ value }"><span class="font-mono text-xs font-medium">{{ value }}</span></template>
      <template #cell-type="{ value }">{{ t('propertyDamage.types.' + value) }}</template>
      <template #cell-severity="{ value }"><span :class="severityClass(value)" class="text-xs font-bold px-2 py-0.5 rounded-full">{{ (value||'').toUpperCase() }}</span></template>
      <template #cell-estimated_cost="{ value }">{{ value ? formatCost(value) : '—' }}</template>
      <template #cell-status="{ value }"><span :class="`badge-${value}`">{{ t(`status.${value}`) }}</span></template>
      <template #actions="{ row }">
        <div class="flex justify-end gap-2">
          <button @click="viewRow = row as any" class="btn-secondary text-xs py-1 px-2">{{ t('common.view') }}</button>
          <button v-if="auth.can('property_damage.close') && (row as any).status === 'open'" @click="viewRow = row as any" class="btn-primary text-xs py-1 px-2">{{ t('common.close') }}</button>
        </div>
      </template>
    </DataTable>

    <PropertyDamageFormModal v-if="showForm" @close="showForm = false" @created="load" />

    <!-- Slide-over detail -->
    <div v-if="viewRow" class="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div class="bg-white w-full max-w-lg h-full overflow-y-auto p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">{{ viewRow.reference }}</h3>
          <button @click="viewRow = null"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><span class="text-gray-500 block">{{ t('propertyDamage.date') }}</span><strong>{{ viewRow.date }}</strong></div>
          <div><span class="text-gray-500 block">{{ t('propertyDamage.location') }}</span><strong>{{ viewRow.location }}</strong></div>
          <div><span class="text-gray-500 block">{{ t('propertyDamage.type') }}</span><strong>{{ t('propertyDamage.types.' + viewRow.type) }}</strong></div>
          <div><span class="text-gray-500 block">{{ t('propertyDamage.severity') }}</span><strong>{{ t('severity.' + viewRow.severity) }}</strong></div>
          <div><span class="text-gray-500 block">{{ t('propertyDamage.estimatedCost') }}</span><strong>{{ viewRow.estimated_cost ? formatCost(viewRow.estimated_cost) : '—' }}</strong></div>
          <div><span class="text-gray-500 block">{{ t('common.status') }}</span><span :class="`badge-${viewRow.status}`">{{ t(`status.${viewRow.status}`) }}</span></div>
        </div>
        <div v-if="viewRow.description" class="text-sm">
          <p class="font-semibold text-gray-700 mb-1">{{ t('propertyDamage.description') }}</p>
          <p class="text-gray-600">{{ viewRow.description }}</p>
        </div>
        <div v-if="viewRow.immediate_cause" class="text-sm">
          <p class="font-semibold text-gray-700 mb-1">{{ t('propertyDamage.immediateCause') }}</p>
          <p class="text-gray-600">{{ viewRow.immediate_cause }}</p>
        </div>
        <div v-if="viewRow.corrective_action" class="text-sm">
          <p class="font-semibold text-gray-700 mb-1">{{ t('propertyDamage.correctiveAction') }}</p>
          <p class="text-gray-600">{{ viewRow.corrective_action }}</p>
        </div>
        <div v-if="viewRow.involved_people?.length" class="text-sm">
          <p class="font-semibold text-gray-700 mb-1">{{ t('propertyDamage.personsInvolved') }}</p>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="p in viewRow.involved_people" :key="p.type + p.id" class="badge-gray text-xs">{{ p.full_name }} <span class="text-gray-400">· {{ p.identifier }}</span></span>
          </div>
        </div>
        <div v-if="viewRow.image_url" class="text-sm">
          <p class="font-semibold text-gray-700 mb-1">{{ t('common.photo') }}</p>
          <a :href="viewRow.image_url" target="_blank" rel="noopener"><img :src="viewRow.image_url" class="max-h-40 rounded border" /></a>
        </div>
        <div v-if="viewRow.report_file_url" class="text-sm">
          <a :href="viewRow.report_file_url" target="_blank" rel="noopener" class="btn-secondary text-sm inline-flex items-center gap-1.5">
            <DocumentArrowDownIcon class="w-4 h-4" /> {{ t('reportFile.download') }}
          </a>
        </div>
        <div v-if="auth.can('property_damage.close') && viewRow.status === 'open'" class="pt-4 border-t space-y-3">
          <label class="label">{{ t('propertyDamage.correctiveAction') }} *</label>
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
import { propertyDamageApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import DataTable from '@/components/ui/DataTable.vue'
import LoadErrorBanner from '@/components/ui/LoadErrorBanner.vue'
import PropertyDamageFormModal from './PropertyDamageFormModal.vue'
import { PlusIcon, XMarkIcon, DocumentArrowDownIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const auth   = useAuthStore()
const toast  = useToast()

const records  = ref<any[]>([])
const stats    = ref<any>({})
const loading  = ref(false)
const meta     = ref<any>(null)
const loadError = ref(false)
const showForm = ref(false)
const viewRow  = ref<any>(null)
const closeCA  = ref('')
const filters  = reactive({ search: '', type: '', status: '', from: '', to: '', page: 1 })

const columns = computed(() => [
  { key: 'reference',      label: t('propertyDamage.reference') },
  { key: 'date',           label: t('propertyDamage.date') },
  { key: 'location',       label: t('propertyDamage.location') },
  { key: 'type',           label: t('propertyDamage.type') },
  { key: 'severity',       label: t('propertyDamage.severity') },
  { key: 'estimated_cost', label: t('propertyDamage.estimatedCost') },
  { key: 'status',         label: t('common.status') },
])

function severityClass(s: string) {
  return ({ low: 'bg-green-100 text-green-700', medium: 'bg-amber-100 text-amber-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' } as Record<string, string>)[s] ?? 'bg-gray-100 text-gray-600'
}
function formatCost(v: any): string {
  const n = Number(v ?? 0)
  if (!n) return '0'
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' MRU'
}

let timer: ReturnType<typeof setTimeout>
function debouncedLoad() { clearTimeout(timer); timer = setTimeout(load, 300) }

async function load() {
  loading.value = true
  loadError.value = false
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    const [list, st] = await Promise.all([propertyDamageApi.list(params), propertyDamageApi.stats()])
    records.value = list.data.data; meta.value = list.data.meta; stats.value = st.data
  } catch (e) {
    loadError.value = true
  } finally { loading.value = false }
}

function loadPage(page: number) { filters.page = page; load() }
function resetFilters() { Object.assign(filters, { search: '', type: '', status: '', from: '', to: '', page: 1 }); load() }

async function closeRow(row: any) {
  if (!closeCA.value) return
  try {
    await propertyDamageApi.close(row.id, { corrective_action: closeCA.value })
    toast.add({ severity: 'success', summary: t('common.success'), life: 3000 })
    viewRow.value = null; closeCA.value = ''; load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? t('common.error'), life: 4000 })
  }
}

onMounted(load)
</script>
