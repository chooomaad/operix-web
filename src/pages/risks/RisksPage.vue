<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">{{ t('risks.title') }}</h2>
        <p class="text-sm text-gray-500">{{ meta?.total ?? 0 }} {{ t('risks.registered') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button v-if="auth.can('reports.generate')" @click="exportPdf" class="btn-secondary text-sm"><DocumentArrowDownIcon class="w-4 h-4" /> PDF</button>
        <RouterLink to="/risks/dashboard" class="btn-secondary text-sm"><ChartBarIcon class="w-4 h-4" /> {{ t('risks.dashboard') }}</RouterLink>
        <div v-if="auth.can('risks.create')" class="relative">
          <button @click="menuOpen = !menuOpen" class="btn-primary text-sm"><PlusIcon class="w-4 h-4" /> {{ t('risks.newAssessment') }}</button>
          <div v-if="menuOpen" class="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
            <button v-for="a in ASSESSMENT_TYPES" :key="a" @click="openNew(a)" class="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm">
              <div class="font-medium text-gray-900">{{ t('risks.assessment.' + a) }}</div>
              <div class="text-xs text-gray-400">{{ t('risks.assessmentHint.' + a) }}</div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Répartition rapide par niveau -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <button v-for="lv in RISK_LEVELS" :key="lv" @click="toggleLevel(lv)"
        class="card-sm text-center transition-shadow" :class="filters.level === lv ? 'ring-2 ring-brand-500' : ''">
        <div class="text-xl font-bold" :class="ltext(lv)">{{ levelCounts[lv] ?? 0 }}</div>
        <div class="text-xs text-gray-500 flex items-center justify-center gap-1"><span class="w-2 h-2 rounded-full" :class="levelClasses(lv).dot"></span>{{ t('risks.levels.' + lv) }}</div>
      </button>
    </div>

    <div class="card-sm flex flex-wrap gap-3">
      <input v-model="filters.search" @input="debouncedLoad" :placeholder="t('risks.searchPlaceholder')" class="input flex-1 min-w-48" />
      <select v-model="filters.category" @change="load" class="input w-44">
        <option value="">{{ t('risks.allCategories') }}</option>
        <option v-for="c in RISK_CATEGORIES" :key="c" :value="c">{{ t('risks.categories.' + c) }}</option>
      </select>
      <select v-model="filters.assessment_type" @change="load" class="input w-40">
        <option value="">{{ t('risks.allTypes') }}</option>
        <option v-for="a in ASSESSMENT_TYPES" :key="a" :value="a">{{ t('risks.assessment.' + a) }}</option>
      </select>
      <select v-model="filters.status" @change="load" class="input w-36">
        <option value="">{{ t('status.allStatuses') }}</option>
        <option v-for="s in RISK_STATUSES" :key="s" :value="s">{{ t('risks.statuses.' + s) }}</option>
      </select>
      <label class="flex items-center gap-1.5 text-sm text-gray-600 px-2"><input type="checkbox" v-model="filters.to_review" @change="load" class="accent-brand-600" /> {{ t('risks.toReview') }}</label>
      <button @click="resetFilters" class="btn-secondary text-xs">{{ t('common.reset') }}</button>
    </div>

    <LoadErrorBanner v-if="loadError" :loading="loading" @retry="load" />

    <DataTable :columns="columns" :rows="records" :loading="loading" :meta="meta" :empty-text="t('risks.empty')" @page="loadPage">
      <template #cell-reference="{ value }"><span class="font-mono text-xs font-medium">{{ value }}</span></template>
      <template #cell-risk_description="{ row }">
        <div class="font-medium text-gray-900 text-sm">{{ (row as any).risk_description }}</div>
        <div class="text-xs text-gray-400 truncate">{{ (row as any).danger }}</div>
      </template>
      <template #cell-category="{ value }">{{ t('risks.categories.' + value) }}</template>
      <template #cell-level="{ row }">
        <div class="flex items-center gap-1.5">
          <span class="text-xs font-bold tabular-nums px-1.5 py-0.5 rounded" :class="levelClasses((row as any).level).badge">{{ (row as any).score }}</span>
          <span class="text-xs" :class="ltext((row as any).level)">{{ t('risks.levels.' + (row as any).level) }}</span>
        </div>
      </template>
      <template #cell-residual_level="{ row }">
        <span v-if="(row as any).residual_level" class="text-xs font-semibold px-1.5 py-0.5 rounded" :class="levelClasses((row as any).residual_level).badge">{{ (row as any).residual_score }} · {{ t('risks.levels.' + (row as any).residual_level) }}</span>
        <span v-else class="text-gray-300 text-xs">—</span>
      </template>
      <template #cell-status="{ value }"><span :class="`badge-${value === 'closed' ? 'closed' : 'open'}`">{{ t('risks.statuses.' + value) }}</span></template>
      <template #actions="{ row }">
        <div class="flex justify-end gap-2">
          <RouterLink :to="`/risks/${(row as any).id}`" class="btn-secondary text-xs py-1 px-2">{{ t('common.view') }}</RouterLink>
        </div>
      </template>
    </DataTable>

    <RiskFormModal v-if="showForm" :assessment-type="newType" @close="showForm = false" @saved="load" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { risksApi, reportsApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useDownload } from '@/composables/useDownload'
import DataTable from '@/components/ui/DataTable.vue'
import LoadErrorBanner from '@/components/ui/LoadErrorBanner.vue'
import RiskFormModal from './RiskFormModal.vue'
import { RISK_CATEGORIES, ASSESSMENT_TYPES, RISK_LEVELS, RISK_STATUSES, levelClasses } from '@/constants/risk'
import { PlusIcon, ChartBarIcon, DocumentArrowDownIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const auth  = useAuthStore()
const { downloadPdf } = useDownload()

async function exportPdf() {
  const params = Object.fromEntries(Object.entries(filters).filter(([k, v]) => v !== '' && v !== false && k !== 'page' && k !== 'search'))
  await downloadPdf(() => reportsApi.risks(params), 'registre-risques.pdf')
}

const records   = ref<any[]>([])
const meta      = ref<any>(null)
const loading   = ref(false)
const loadError = ref(false)
const showForm  = ref(false)
const menuOpen  = ref(false)
const newType   = ref('risk_assessment')
const levelCounts = ref<Record<string, number>>({})
const filters = reactive({ search: '', category: '', assessment_type: '', status: '', level: '', to_review: false, page: 1 })

const ltext = (lv: string) => levelClasses(lv).badge.split(' ').find(c => c.startsWith('text-')) ?? 'text-gray-700'

const columns = computed(() => [
  { key: 'reference',        label: t('risks.reference') },
  { key: 'risk_description', label: t('risks.risk') },
  { key: 'category',         label: t('risks.category') },
  { key: 'location',         label: t('risks.location') },
  { key: 'level',            label: t('risks.initialRisk') },
  { key: 'residual_level',   label: t('risks.residualRisk') },
  { key: 'status',           label: t('common.status') },
])

let timer: ReturnType<typeof setTimeout>
function debouncedLoad() { clearTimeout(timer); timer = setTimeout(() => { filters.page = 1; load() }, 300) }

function openNew(a: string) { newType.value = a; menuOpen.value = false; showForm.value = true }
function toggleLevel(lv: string) { filters.level = filters.level === lv ? '' : lv; load() }

async function load() {
  loading.value = true; loadError.value = false
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v !== false))
    const { data } = await risksApi.list(params)
    records.value = data.data; meta.value = data.meta
    // Compteurs par niveau via le dashboard (léger).
    const d = await risksApi.dashboard()
    levelCounts.value = d.data.by_level ?? {}
  } catch { loadError.value = true } finally { loading.value = false }
}
function loadPage(p: number) { filters.page = p; load() }
function resetFilters() { Object.assign(filters, { search: '', category: '', assessment_type: '', status: '', level: '', to_review: false, page: 1 }); load() }

onMounted(load)
</script>
