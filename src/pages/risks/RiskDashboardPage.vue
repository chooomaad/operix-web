<template>
  <div class="p-6 space-y-5" v-if="data">
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">{{ t('risks.dashboardTitle') }}</h2>
        <p class="text-sm text-gray-500">{{ data.total }} {{ t('risks.registered') }}</p>
      </div>
      <RouterLink to="/risks" class="btn-secondary text-sm">{{ t('risks.register') }}</RouterLink>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="card-sm"><div class="text-2xl font-black text-gray-900">{{ data.total }}</div><div class="text-xs text-gray-500">{{ t('risks.kpiTotal') }}</div></div>
      <div class="card-sm"><div class="text-2xl font-black text-red-600">{{ data.critical_open }}</div><div class="text-xs text-gray-500">{{ t('risks.kpiCriticalOpen') }}</div></div>
      <div class="card-sm"><div class="text-2xl font-black text-orange-600">{{ data.overdue_actions }}</div><div class="text-xs text-gray-500">{{ t('risks.kpiOverdue') }}</div></div>
      <div class="card-sm"><div class="text-2xl font-black text-amber-600">{{ data.to_review }}</div><div class="text-xs text-gray-500">{{ t('risks.kpiToReview') }}</div></div>
    </div>

    <div class="grid lg:grid-cols-2 gap-4">
      <!-- Matrice heatmap -->
      <div class="card">
        <h3 class="font-semibold text-gray-900 mb-3">{{ t('risks.riskMatrix') }}</h3>
        <div class="flex justify-center py-2">
          <RiskMatrix readonly :counts="data.matrix" />
        </div>
        <div class="flex items-center justify-center gap-3 mt-2 text-xs text-gray-500">
          <span v-for="lv in RISK_LEVELS" :key="lv" class="flex items-center gap-1"><span class="w-3 h-3 rounded" :class="levelClasses(lv).dot"></span>{{ t('risks.levels.' + lv) }} · {{ data.by_level[lv] ?? 0 }}</span>
        </div>
      </div>

      <!-- Répartition par niveau (barres) -->
      <div class="card">
        <h3 class="font-semibold text-gray-900 mb-3">{{ t('risks.byLevel') }}</h3>
        <div class="space-y-2.5">
          <div v-for="lv in RISK_LEVELS" :key="lv">
            <div class="flex justify-between text-xs mb-1"><span :class="ltext(lv)">{{ t('risks.levels.' + lv) }}</span><span class="font-semibold tabular-nums">{{ data.by_level[lv] ?? 0 }}</span></div>
            <div class="h-2 rounded-full bg-gray-100 overflow-hidden"><div class="h-full rounded-full" :class="levelClasses(lv).dot" :style="{ width: pct(data.by_level[lv]) + '%' }"></div></div>
          </div>
        </div>
        <h3 class="font-semibold text-gray-900 mb-3 mt-5">{{ t('risks.evolution') }}</h3>
        <div class="flex items-end gap-1 h-24">
          <div v-for="(m, i) in 12" :key="i" class="flex-1 flex flex-col items-center justify-end">
            <div class="w-full rounded-t bg-brand-500/80" :style="{ height: monthPct(i+1) + '%' }" :title="`${monthVal(i+1)}`"></div>
            <span class="text-[9px] text-gray-400 mt-0.5">{{ monthLabels[i] }}</span>
          </div>
        </div>
      </div>

      <!-- Par catégorie -->
      <div class="card">
        <h3 class="font-semibold text-gray-900 mb-3">{{ t('risks.byCategory') }}</h3>
        <div v-if="categoryList.length" class="space-y-1.5">
          <div v-for="[cat, n] in categoryList" :key="cat" class="flex items-center gap-2 text-sm">
            <span class="flex-1 truncate">{{ t('risks.categories.' + cat) }}</span>
            <div class="w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden"><div class="h-full bg-teal-500 rounded-full" :style="{ width: catPct(n) + '%' }"></div></div>
            <span class="w-6 text-right tabular-nums text-gray-600">{{ n }}</span>
          </div>
        </div>
        <div v-else class="text-sm text-gray-400">{{ t('common.noData') }}</div>
      </div>

      <!-- Responsables en retard + zones -->
      <div class="card">
        <h3 class="font-semibold text-gray-900 mb-3">{{ t('risks.responsiblesOverdue') }}</h3>
        <div v-if="data.responsibles_overdue?.length" class="space-y-1.5 mb-4">
          <div v-for="r in data.responsibles_overdue" :key="r.id" class="flex items-center justify-between text-sm">
            <span class="flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center">{{ r.total }}</span>{{ r.name }}</span>
            <span class="text-xs text-red-600">{{ t('risks.overdueActionsShort') }}</span>
          </div>
        </div>
        <div v-else class="text-sm text-gray-400 mb-4">{{ t('risks.noOverdue') }}</div>

        <h3 class="font-semibold text-gray-900 mb-2">{{ t('risks.byZone') }}</h3>
        <div v-if="zoneList.length" class="flex flex-wrap gap-1.5">
          <span v-for="[z, n] in zoneList" :key="z" class="badge-gray text-xs">{{ z }} · {{ n }}</span>
        </div>
        <div v-else class="text-sm text-gray-400">{{ t('common.noData') }}</div>
      </div>
    </div>
  </div>
  <div v-else class="flex items-center justify-center h-64"><div class="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div></div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { risksApi } from '@/api'
import RiskMatrix from '@/components/risk/RiskMatrix.vue'
import { RISK_LEVELS, levelClasses } from '@/constants/risk'

const { t, tm } = useI18n()
const data = ref<any>(null)
const monthLabels = tm('safetyTracker.months') as string[]

const ltext = (lv: string) => levelClasses(lv).badge.split(' ').find(c => c.startsWith('text-')) ?? 'text-gray-700'
const maxLevel = computed(() => Math.max(1, ...RISK_LEVELS.map(l => data.value?.by_level[l] ?? 0)))
function pct(n?: number) { return Math.round(((n ?? 0) / maxLevel.value) * 100) }

const categoryList = computed<[string, number][]>(() => Object.entries(data.value?.by_category ?? {}) as any)
const maxCat = computed(() => Math.max(1, ...categoryList.value.map(([, n]) => n)))
function catPct(n: number) { return Math.round((n / maxCat.value) * 100) }

const zoneList = computed<[string, number][]>(() => Object.entries(data.value?.by_zone ?? {}) as any)

function monthVal(m: number) { const k = String(m).padStart(2, '0'); return data.value?.by_month?.[k] ?? 0 }
const maxMonth = computed(() => Math.max(1, ...Array.from({ length: 12 }, (_, i) => monthVal(i + 1))))
function monthPct(m: number) { return Math.round((monthVal(m) / maxMonth.value) * 100) }

onMounted(async () => { const { data: d } = await risksApi.dashboard(); data.value = d })
</script>
