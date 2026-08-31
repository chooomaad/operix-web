<template>
  <div class="p-4 sm:p-6 space-y-5 bg-slate-50/60 min-h-full">

    <!-- ══ HEADER ═══════════════════════════════════════════════════════════ -->
    <header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-xl font-bold tracking-tight text-slate-900">{{ t('dashboard.pageTitle') }}</h1>
        <p class="mt-0.5 text-sm text-slate-500">{{ t('dashboard.subtitle') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="mr-1 hidden items-center gap-1.5 text-sm text-slate-500 sm:inline-flex">
          <CalendarDaysIcon class="h-4 w-4 text-slate-400" />
          <span class="capitalize">{{ todayLabel }}</span>
        </span>
        <button
          @click="db.refresh(selectedYear)"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowPathIcon :class="['h-4 w-4', db.loading && 'animate-spin']" />
          <span class="hidden sm:inline">{{ t('dashboard.refresh') }}</span>
        </button>
      </div>
    </header>

    <div v-if="db.lastFetch || db.fromCache" class="-mt-2 flex items-center gap-2 text-xs text-slate-400">
      <span v-if="db.fromCache" class="inline-flex items-center gap-1">
        <span class="h-1.5 w-1.5 rounded-full bg-amber-400" />{{ t('dashboard.fromCache') }}
      </span>
      <span v-if="db.lastFetch">{{ t('dashboard.lastUpdate') }} · {{ relTime(db.lastFetch) }}</span>
    </div>

    <!-- ══ SKELETON (premier chargement sans cache) ═════════════════════════ -->
    <template v-if="db.loading && !db.lastFetch">
      <div class="grid gap-4 lg:grid-cols-3">
        <div class="h-32 animate-pulse rounded-xl bg-slate-200/70 lg:col-span-2" />
        <div class="h-32 animate-pulse rounded-xl bg-slate-200/70" />
      </div>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        <div v-for="i in 8" :key="i" class="h-24 animate-pulse rounded-xl bg-slate-200/70" />
      </div>
      <div class="grid gap-4 lg:grid-cols-3">
        <div class="h-72 animate-pulse rounded-xl bg-slate-200/70 lg:col-span-2" />
        <div class="h-72 animate-pulse rounded-xl bg-slate-200/70" />
      </div>
    </template>

    <template v-else>

      <!-- ══ ROW A — SAFETY STATUS + JOURS SANS ACCIDENT ════════════════════ -->
      <div class="grid gap-4 lg:grid-cols-3">
        <!-- Statut sécurité (dérivé de vraies données : ouverts + critiques) -->
        <div
          class="relative overflow-hidden rounded-xl border bg-white p-5 lg:col-span-2"
          :class="statusUi.border"
        >
          <span class="absolute inset-y-0 left-0 w-1.5" :class="statusUi.bar" aria-hidden="true" />
          <div class="flex flex-col gap-4 pl-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div class="text-xs font-semibold uppercase tracking-wider text-slate-400">{{ t('dashboard.safetyStatus') }}</div>
              <div class="mt-1 flex items-center gap-2">
                <component :is="statusUi.icon" :class="['h-7 w-7', statusUi.text]" />
                <span class="text-2xl font-bold" :class="statusUi.text">{{ statusUi.label }}</span>
              </div>
              <p class="mt-1 max-w-md text-xs text-slate-500">{{ statusUi.hint }}</p>
            </div>
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <div class="text-2xl font-bold tabular-nums" :class="openIncidents > 0 ? 'text-amber-600' : 'text-slate-900'">{{ openIncidents }}</div>
                <div class="mt-0.5 text-[11px] font-medium text-slate-500">{{ t('dashboard.openIncidents') }}</div>
              </div>
              <div>
                <div class="text-2xl font-bold tabular-nums" :class="criticalEvents > 0 ? 'text-red-600' : 'text-slate-900'">{{ criticalEvents }}</div>
                <div class="mt-0.5 text-[11px] font-medium text-slate-500">{{ t('dashboard.criticalEvents') }}</div>
              </div>
              <div>
                <div class="text-2xl font-bold tabular-nums text-slate-900">{{ db.safety.near_miss_ouverts ?? 0 }}</div>
                <div class="mt-0.5 text-[11px] font-medium text-slate-500">{{ t('dashboard.openNearMiss') }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Jours sans accident -->
        <RouterLink
          to="/safety-tracker"
          class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-card"
        >
          <div>
            <div class="text-xs font-semibold uppercase tracking-wider text-slate-400">{{ t('dashboard.daysWithoutAccident') }}</div>
            <div class="mt-1 text-4xl font-black tabular-nums text-emerald-600">{{ db.tracker?.days_without_accident ?? '—' }}</div>
            <div class="mt-1 text-[11px] text-slate-500">
              <template v-if="db.tracker?.best_streak_days">{{ t('dashboard.bestRecord') }} : {{ db.tracker.best_streak_days }}</template>
            </div>
          </div>
          <ShieldCheckIcon class="h-12 w-12 text-emerald-200" />
        </RouterLink>
      </div>

      <!-- ══ ROW B — EXECUTIVE OVERVIEW (KPI) ═══════════════════════════════ -->
      <section>
        <h2 class="section-label">{{ t('dashboard.executiveOverview') }}</h2>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          <StatKpi :label="t('dashboard.totalIncidents')" :value="db.safety.incidents_ytd ?? 0" :context="t('common.year') + ' ' + selectedYear" tone="neutral" to="/incidents">
            <template #icon><FireIcon class="h-4 w-4" /></template>
          </StatKpi>
          <StatKpi :label="t('dashboard.openIncidents')" :value="openIncidents" :tone="openIncidents > 0 ? 'warn' : 'neutral'" to="/incidents">
            <template #icon><ExclamationTriangleIcon class="h-4 w-4" /></template>
          </StatKpi>
          <StatKpi :label="t('nav.nearMiss')" :value="db.safety.near_miss_ytd ?? 0" tone="neutral" to="/near-miss">
            <template #icon><EyeIcon class="h-4 w-4" /></template>
          </StatKpi>
          <StatKpi :label="t('nav.environment')" :value="db.environment.rapports_ytd ?? 0" tone="neutral" to="/environment">
            <template #icon><BeakerIcon class="h-4 w-4" /></template>
          </StatKpi>
          <StatKpi :label="t('nav.breaches')" :value="db.safety.infractions_ytd ?? 0" tone="neutral" to="/breaches">
            <template #icon><ShieldExclamationIcon class="h-4 w-4" /></template>
          </StatKpi>
          <StatKpi label="LTI" :value="db.safety.lti_ytd ?? 0" :context="t('incidents.tf') + ' ' + (db.safety.taux_frequence ?? 0)" :tone="(db.safety.lti_ytd ?? 0) > 0 ? 'critical' : 'safe'">
            <template #icon><BoltIcon class="h-4 w-4" /></template>
          </StatKpi>
          <StatKpi label="MTC" :value="db.typeDist?.MTC ?? 0" tone="neutral">
            <template #icon><PlusCircleIcon class="h-4 w-4" /></template>
          </StatKpi>
          <StatKpi :label="t('dashboard.firstAid')" :value="db.typeDist?.FAC ?? 0" tone="neutral">
            <template #icon><PlusCircleIcon class="h-4 w-4" /></template>
          </StatKpi>
        </div>
      </section>

      <!-- ══ ROW C — TREND + DISTRIBUTION ═══════════════════════════════════ -->
      <div class="grid gap-4 lg:grid-cols-3">
        <div class="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-slate-800">{{ t('dashboard.trendTitle') }}</h3>
            <span class="text-xs text-slate-400">{{ selectedYear }}</span>
          </div>
          <IncidentsChart :data="db.timelineData" />
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-5">
          <h3 class="mb-4 text-sm font-semibold text-slate-800">{{ t('dashboard.eventDistribution') }}</h3>
          <MetricBars :rows="distributionRows" :empty-text="t('common.noData')" />
        </div>
      </div>

      <!-- ══ ROW D — ACTION REQUIRED + SEVERITY + PERFORMANCE ═══════════════ -->
      <div class="grid gap-4 lg:grid-cols-3">
        <!-- Action required -->
        <div class="rounded-xl border border-slate-200 bg-white p-5">
          <h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <ExclamationTriangleIcon class="h-4 w-4 text-amber-500" />{{ t('dashboard.actionRequired') }}
          </h3>
          <div v-if="!actionItems.length" class="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircleIcon class="mb-2 h-8 w-8 text-emerald-400" />
            <p class="text-xs text-slate-500">{{ t('dashboard.allClear') }}</p>
          </div>
          <ul v-else class="space-y-2">
            <RouterLink
              v-for="a in actionItems" :key="a.key" :to="a.link"
              class="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50"
            >
              <span :class="['flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold tabular-nums', a.chip]">{{ a.count }}</span>
              <span class="flex-1 text-xs text-slate-600">{{ a.label }}</span>
              <ChevronRightIcon class="h-4 w-4 text-slate-300" />
            </RouterLink>
          </ul>
        </div>

        <!-- Severity / risk -->
        <div class="rounded-xl border border-slate-200 bg-white p-5">
          <h3 class="mb-4 text-sm font-semibold text-slate-800">{{ t('dashboard.severityRisk') }}</h3>
          <MetricBars :rows="severityRows" :empty-text="t('common.noData')" />
        </div>

        <!-- HSSE performance -->
        <div class="rounded-xl border border-slate-200 bg-white p-5">
          <h3 class="mb-4 text-sm font-semibold text-slate-800">{{ t('dashboard.hssePerformance') }}</h3>
          <dl class="grid grid-cols-2 gap-x-4 gap-y-4">
            <div v-for="p in performanceItems" :key="p.label">
              <dt class="text-[11px] font-medium uppercase tracking-wide text-slate-400">{{ p.label }}</dt>
              <dd class="mt-0.5 text-lg font-bold tabular-nums text-slate-900">{{ p.value }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- ══ ROW E — RECENT ACTIVITY + ZONES/PERSONS ════════════════════════ -->
      <div class="grid gap-4 lg:grid-cols-3">
        <!-- Recent activity -->
        <div class="flex flex-col rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h3 class="mb-4 text-sm font-semibold text-slate-800">{{ t('dashboard.recentActivity') }}</h3>
          <div v-if="!db.activities.length" class="flex flex-1 flex-col items-center justify-center py-10 text-slate-300">
            <ClockIcon class="mb-2 h-8 w-8" />
            <p class="text-xs">{{ t('dashboard.noRecentActivity') }}</p>
          </div>
          <ul v-else class="divide-y divide-slate-100">
            <RouterLink
              v-for="act in db.activities" :key="`${act.type}-${act.id}`" :to="act.link"
              class="group flex items-center gap-3 py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded-lg"
            >
              <span :class="['flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', activityChip(act.type)]">
                <FireIcon v-if="act.type === 'incident'" class="h-4 w-4" />
                <EyeIcon v-else-if="act.type === 'near_miss'" class="h-4 w-4" />
                <ShieldExclamationIcon v-else-if="act.type === 'breach'" class="h-4 w-4" />
                <UserIcon v-else class="h-4 w-4" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-xs font-medium text-slate-800 group-hover:text-slate-900">{{ act.title }}</p>
                <p class="truncate text-[11px] text-slate-400">{{ act.subtitle }}</p>
              </div>
              <div class="flex shrink-0 flex-col items-end gap-1">
                <span v-if="act.severity" :class="`badge-${act.severity} !py-0 !text-[10px]`">{{ t(`severity.${act.severity}`) }}</span>
                <span class="text-[10px] text-slate-300">{{ relTimeStr(act.created_at) }}</span>
              </div>
            </RouterLink>
          </ul>
        </div>

        <!-- Zones + Persons -->
        <div class="space-y-4">
          <div class="rounded-xl border border-slate-200 bg-white p-5">
            <h3 class="mb-3 text-sm font-semibold text-slate-800">{{ t('dashboard.topRiskAreas') }}</h3>
            <TopZonesChart :zones="db.topZones" />
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-5">
            <h3 class="mb-3 text-sm font-semibold text-slate-800">{{ t('dashboard.topPersonsInvolved') }}</h3>
            <div v-if="!db.topPersons.length" class="py-4 text-center text-sm text-slate-400">{{ t('common.noData') }}</div>
            <ul v-else class="divide-y divide-slate-100">
              <li v-for="(p, i) in db.topPersons" :key="p.id" class="flex items-center gap-3 py-2">
                <span class="w-4 text-xs font-semibold tabular-nums text-slate-400">{{ i + 1 }}</span>
                <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                  {{ (p.name || '?').charAt(0) }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="truncate text-xs font-medium text-slate-800">{{ p.name }}</div>
                  <div class="text-[11px] text-slate-400">{{ p.matricule }}</div>
                </div>
                <span class="shrink-0 text-xs font-semibold tabular-nums text-slate-600">{{ p.count }} {{ t('dashboard.eventsShort') }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDashboardStore } from '@/stores/dashboard'
import StatKpi from '@/components/dashboard/StatKpi.vue'
import MetricBars from '@/components/dashboard/MetricBars.vue'
import IncidentsChart from '@/components/charts/IncidentsChart.vue'
import TopZonesChart from '@/components/charts/TopZonesChart.vue'
import {
  ArrowPathIcon, ClockIcon, ExclamationTriangleIcon, EyeIcon, ShieldExclamationIcon,
  ShieldCheckIcon, CheckCircleIcon, ChevronRightIcon, UserIcon, FireIcon, BeakerIcon,
  BoltIcon, PlusCircleIcon, CalendarDaysIcon,
} from '@heroicons/vue/24/outline'

const { t, locale } = useI18n()
const db = useDashboardStore()

const currentYear  = new Date().getFullYear()
const selectedYear = ref(currentYear)

// Date du jour complète, dans la langue active (ex. « lundi 31 août 2026 »).
const todayLabel = computed(() =>
  new Date().toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
)

// ── Signaux réels dérivés ────────────────────────────────────────────────────
const openIncidents  = computed(() => db.safety.incidents_ouverts ?? 0)
const criticalEvents = computed(() => db.severityDist?.critical ?? 0)
const openNearMiss   = computed(() => db.safety.near_miss_ouverts ?? 0)
const openEnv        = computed(() => db.environment.rapports_ouverts ?? 0)
const openBreaches   = computed(() => db.safety.infractions_ouverts ?? 0)
const inspectionsDue = computed(() => db.equipment.inspections_dues ?? 0)

/**
 * Statut sécurité calculé UNIQUEMENT à partir de données réelles :
 *  - CRITIQUE : au moins un incident ouvert ET au moins un événement critique (année)
 *  - ATTENTION : au moins un élément ouvert (incident / near miss / env / manquement)
 *  - NORMAL : rien d'ouvert
 */
const status = computed<'normal' | 'attention' | 'critical'>(() => {
  if (openIncidents.value > 0 && criticalEvents.value > 0) return 'critical'
  if (openIncidents.value + openNearMiss.value + openEnv.value + openBreaches.value > 0) return 'attention'
  return 'normal'
})

const statusUi = computed(() => ({
  normal:    { label: t('dashboard.statusNormal'),    hint: t('dashboard.statusNormalHint'),    text: 'text-emerald-600', bar: 'bg-emerald-500', border: 'border-emerald-200', icon: ShieldCheckIcon },
  attention: { label: t('dashboard.statusAttention'), hint: t('dashboard.statusAttentionHint'), text: 'text-amber-600',   bar: 'bg-amber-500',   border: 'border-amber-200',   icon: ExclamationTriangleIcon },
  critical:  { label: t('dashboard.statusCritical'),  hint: t('dashboard.statusCriticalHint'),  text: 'text-red-600',     bar: 'bg-red-500',     border: 'border-red-200',     icon: ExclamationTriangleIcon },
}[status.value]))

// ── Répartition par type d'événement (totaux YTD réels) ─────────────────────
const distributionRows = computed(() => [
  { label: t('nav.incidents'),   value: db.safety.incidents_ytd ?? 0,     color: 'bg-red-500' },
  { label: t('nav.nearMiss'),    value: db.safety.near_miss_ytd ?? 0,     color: 'bg-amber-400' },
  { label: t('nav.environment'), value: db.environment.rapports_ytd ?? 0, color: 'bg-sky-500' },
  { label: t('nav.breaches'),    value: db.safety.infractions_ytd ?? 0,   color: 'bg-slate-400' },
])

// ── Gravité (répartition réelle des incidents de l'année) ───────────────────
const severityRows = computed(() => [
  { label: t('severity.critical'), value: db.severityDist?.critical ?? 0, color: 'bg-red-500' },
  { label: t('severity.high'),     value: db.severityDist?.high ?? 0,     color: 'bg-orange-500' },
  { label: t('severity.medium'),   value: db.severityDist?.medium ?? 0,   color: 'bg-amber-400' },
  { label: t('severity.low'),      value: db.severityDist?.low ?? 0,      color: 'bg-emerald-500' },
])

// ── Actions requises — uniquement des compteurs réels > 0 ───────────────────
const actionItems = computed(() => {
  const items: { key: string; count: number; label: string; link: string; chip: string }[] = []
  if (criticalEvents.value > 0) items.push({ key: 'critical', count: criticalEvents.value, label: t('dashboard.actionCritical'), link: '/incidents', chip: 'bg-red-100 text-red-700' })
  if (openIncidents.value > 0)  items.push({ key: 'inc',      count: openIncidents.value,  label: t('dashboard.actionOpenIncidents'), link: '/incidents', chip: 'bg-amber-100 text-amber-700' })
  if (openBreaches.value > 0)   items.push({ key: 'breach',   count: openBreaches.value,   label: t('dashboard.actionOpenBreaches'), link: '/breaches', chip: 'bg-amber-100 text-amber-700' })
  if (openNearMiss.value > 0)   items.push({ key: 'nm',       count: openNearMiss.value,   label: t('dashboard.actionOpenNearMiss'), link: '/near-miss', chip: 'bg-slate-100 text-slate-600' })
  if (openEnv.value > 0)        items.push({ key: 'env',      count: openEnv.value,        label: t('dashboard.actionOpenEnvironment'), link: '/environment', chip: 'bg-slate-100 text-slate-600' })
  if (inspectionsDue.value > 0) items.push({ key: 'insp',     count: inspectionsDue.value, label: t('dashboard.actionInspectionsDue'), link: '/equipment', chip: 'bg-amber-100 text-amber-700' })
  return items
})

// ── Performance HSSE (indicateurs réels uniquement) ─────────────────────────
const performanceItems = computed(() => [
  { label: t('incidents.tf'),           value: db.safety.taux_frequence ?? db.tracker?.kpis?.taux_frequence ?? 0 },
  { label: t('dashboard.gravityRate'),  value: db.tracker?.kpis?.taux_gravite ?? 0 },
  { label: 'LTI ' + t('dashboard.ytdShort'), value: db.safety.lti_ytd ?? 0 },
  { label: t('nav.nearMiss'),           value: db.safety.near_miss_ytd ?? 0 },
  { label: t('nav.environment'),        value: db.environment.rapports_ytd ?? 0 },
  { label: t('nav.breaches'),           value: db.safety.infractions_ytd ?? 0 },
])

// ── Utilitaires ──────────────────────────────────────────────────────────────
function activityChip(type: string): string {
  return {
    incident:  'bg-red-50 text-red-600',
    near_miss: 'bg-amber-50 text-amber-600',
    breach:    'bg-slate-100 text-slate-600',
    visitor:   'bg-sky-50 text-sky-600',
  }[type] ?? 'bg-slate-100 text-slate-500'
}

const rtf = computed(() => new Intl.RelativeTimeFormat(locale.value === 'fr' ? 'fr' : 'en', { numeric: 'auto' }))
function relFromSecs(secs: number): string {
  if (secs < 60)    return rtf.value.format(-secs, 'second')
  if (secs < 3600)  return rtf.value.format(-Math.floor(secs / 60), 'minute')
  if (secs < 86400) return rtf.value.format(-Math.floor(secs / 3600), 'hour')
  return rtf.value.format(-Math.floor(secs / 86400), 'day')
}
function relTime(date: Date): string { return relFromSecs(Math.floor((Date.now() - date.getTime()) / 1000)) }
function relTimeStr(dt: string): string {
  if (!dt) return ''
  return relFromSecs(Math.floor((Date.now() - new Date(dt).getTime()) / 1000))
}

onMounted(() => {
  db.loadFromCache()
  db.refresh(selectedYear.value)
  db.startAutoRefresh()
})
onUnmounted(() => { db.stopAutoRefresh() })
</script>
