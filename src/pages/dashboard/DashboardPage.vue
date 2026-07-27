<template>
  <div class="p-6 space-y-6">

    <!-- Refresh indicator -->
    <div v-if="db.fromCache || db.loading" class="flex items-center gap-2 text-xs text-gray-400">
      <div v-if="db.loading" class="w-3 h-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      <span v-if="db.loading">{{ t('common.loading') }}</span>
      <span v-else-if="db.fromCache">{{ t('dashboard.fromCache') }}</span>
      <span v-if="db.lastFetch && !db.loading" class="ml-auto">
        {{ t('dashboard.lastUpdate') }} {{ timeAgo(db.lastFetch) }}
      </span>
    </div>

    <!-- Skeleton while first load (no cache) -->
    <template v-if="db.loading && !db.lastFetch">
      <div>
        <div class="h-4 bg-gray-200 rounded w-20 mb-3 animate-pulse"></div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <SkeletonCard v-for="i in 6" :key="i" />
        </div>
      </div>
      <div class="card animate-pulse h-20"></div>
      <div>
        <div class="h-4 bg-gray-200 rounded w-24 mb-3 animate-pulse"></div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <SkeletonCard v-for="i in 6" :key="i" />
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="card animate-pulse h-64"></div>
        <div class="card animate-pulse h-64"></div>
        <div class="card animate-pulse h-64"></div>
      </div>
    </template>

    <template v-else>

      <!-- ── Section Sécurité ─────────────────────────────────────────────── -->
      <section>
        <h2 class="section-label">{{ t('nav.sectionSafety') }}</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard :label="t('incidents.title') + ' / mois'" :value="db.safety.incidents_mois   ?? 0" color="red" />
          <KpiCard :label="t('dashboard.incidentsYtd')"          :value="db.safety.incidents_ytd    ?? 0" color="red" />
          <KpiCard :label="t('status.open')"                  :value="db.safety.incidents_ouverts ?? 0" color="amber" />
          <KpiCard :label="t('nav.nearMiss') + ' YTD'"        :value="db.safety.near_miss_ytd    ?? 0" color="orange" />
          <KpiCard :label="t('dashboard.ltiYtd')"               :value="db.safety.lti_ytd           ?? 0" color="red" />
          <KpiCard :label="t('incidents.tf')"                 :value="db.safety.taux_frequence    ?? 0" color="brand" suffix="TF" />
        </div>
      </section>

      <!-- ── Safety Tracker ─────────────────────────────────────────────── -->
      <div v-if="db.tracker" class="card flex items-center gap-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div class="text-center flex-shrink-0">
          <div class="text-5xl font-black text-green-600">{{ db.tracker.days_without_accident }}</div>
          <div class="text-[10px] font-bold text-green-700 mt-1 uppercase tracking-wider">{{ t('dashboard.daysWithoutAccident') }}</div>
        </div>
        <div class="flex-1">
          <div class="font-semibold text-green-800">{{ t('dashboard.safetyTrackerLabel') }}</div>
          <div class="text-sm text-green-600 mt-1">
            <span v-if="db.tracker.last_incident">{{ t('dashboard.lastAccident') }} : {{ db.tracker.last_incident.date }}</span>
            <span v-else>{{ t('dashboard.noAccident') }}</span>
          </div>
          <RouterLink to="/safety-tracker" class="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-900 mt-2 font-medium">
            {{ t('dashboard.seeDetail') }} →
          </RouterLink>
        </div>
        <div class="text-center flex-shrink-0">
          <div class="text-2xl font-bold text-green-700">{{ db.tracker.best_streak_days ?? '-' }}</div>
          <div class="text-xs text-green-600">{{ t('dashboard.bestRecord') }}</div>
        </div>
      </div>

      <!-- ── Section Personnels & Accès ─────────────────────────────────── -->
      <section>
        <h2 class="section-label">{{ t('dashboard.personnelAccess') }}</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <RouterLink to="/employees" class="card hover:shadow-md transition-shadow cursor-pointer">
            <div class="text-xs font-semibold text-gray-400 uppercase mb-2">{{ t('employees.totalActive') }}</div>
            <div class="text-3xl font-black text-blue-600">{{ db.employees.total_actifs ?? 0 }}</div>
            <div class="text-xs text-gray-500 mt-1">+{{ db.employees.nouvelles_entrees ?? 0 }} {{ t('dashboard.thisMonth') }}</div>
          </RouterLink>
          <div class="card">
            <div class="text-xs font-semibold text-gray-400 uppercase mb-2">{{ t('employees.totalInactive') }}</div>
            <div class="text-3xl font-black text-gray-400">{{ db.employees.total_inactifs ?? 0 }}</div>
            <div class="text-xs text-gray-500 mt-1">YTD: {{ db.employees.entrees_ytd ?? 0 }}</div>
          </div>
          <RouterLink to="/contractors" class="card hover:shadow-md transition-shadow cursor-pointer">
            <div class="text-xs font-semibold text-gray-400 uppercase mb-2">{{ t('nav.contractors') }}</div>
            <div class="text-3xl font-black text-purple-600">{{ db.contractors.total_actifs ?? 0 }}</div>
            <div class="flex items-center gap-1 mt-1">
              <span class="text-xs text-red-500 font-semibold">{{ db.contractors.total_suspendus ?? 0 }} {{ t('contractors.suspended').toLowerCase() }}</span>
            </div>
          </RouterLink>
          <div class="card">
            <div class="text-xs font-semibold text-gray-400 uppercase mb-2">{{ t('contractors.expiresSoon') }}</div>
            <div class="text-3xl font-black text-amber-500">{{ db.contractors.expires_30j ?? 0 }}</div>
            <RouterLink to="/contractors" class="text-xs text-amber-600 hover:underline mt-1 block">{{ t('common.view') }} →</RouterLink>
          </div>
          <RouterLink to="/visitors" class="card hover:shadow-md transition-shadow cursor-pointer">
            <div class="text-xs font-semibold text-gray-400 uppercase mb-2">{{ t('visitors.onSite') }}</div>
            <div class="text-3xl font-black text-green-600">{{ db.visitors.presents ?? 0 }}</div>
            <div class="text-xs text-gray-500 mt-1">{{ db.visitors.entrees_auj ?? 0 }} {{ t('dashboard.todayEntries') }}</div>
          </RouterLink>
          <div class="card">
            <div class="text-xs font-semibold text-gray-400 uppercase mb-2">{{ t('visitors.thisMonth') }}</div>
            <div class="text-3xl font-black text-teal-600">{{ db.visitors.entrees_mois ?? 0 }}</div>
            <div class="text-xs text-gray-500 mt-1">{{ t('dashboard.thisMonth') }}</div>
          </div>
        </div>
      </section>

      <!-- ── Charts ──────────────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900 text-sm">{{ t('nav.incidents') }} — {{ selectedYear }}</h3>
            <select v-model="selectedYear" @change="db.refreshTimeline(selectedYear)" class="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
              <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
          <IncidentsChart :data="db.timelineData" />
        </div>
        <div class="card">
          <h3 class="font-semibold text-gray-900 mb-4 text-sm">🔥 {{ t('dashboard.topRiskAreas') }}</h3>
          <TopZonesChart :zones="db.topZones" />
        </div>
        <div class="card">
          <h3 class="font-semibold text-gray-900 mb-4 text-sm">{{ t('dashboard.contractTypes') }}</h3>
          <ContractTypeChart
            :by-contract="db.empBreakdown.by_contract ?? {}"
            :by-gender="db.empBreakdown.by_gender ?? {}"
          />
        </div>
      </div>

      <!-- ── Section Opérations + Activité récente ────────────────────── -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <!-- Opérations KPIs -->
        <div class="xl:col-span-2">
          <h2 class="section-label">{{ t('nav.sectionOps') }}</h2>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div class="card">
              <div class="text-xs font-semibold text-gray-500 uppercase mb-3">{{ t('nav.environment') }}</div>
              <div class="space-y-2">
                <div class="flex justify-between text-sm"><span class="text-gray-600">YTD</span><strong>{{ db.environment.rapports_ytd ?? 0 }}</strong></div>
                <div class="flex justify-between text-sm"><span class="text-gray-600">{{ t('status.open') }}</span><strong class="text-red-600">{{ db.environment.rapports_ouverts ?? 0 }}</strong></div>
                <RouterLink to="/environment" class="text-xs text-brand-600 hover:underline">{{ t('common.view') }} →</RouterLink>
              </div>
            </div>
            <div class="card">
              <div class="text-xs font-semibold text-gray-500 uppercase mb-3">{{ t('nav.gemba') }}</div>
              <div class="space-y-2">
                <div class="flex justify-between text-sm"><span class="text-gray-600">{{ t('status.open') }}</span><strong>{{ db.gemba.total_ouverts ?? 0 }}</strong></div>
                <div class="flex justify-between text-sm"><span class="text-gray-600">{{ t('dashboard.late') }}</span><strong class="text-red-600">{{ db.gemba.en_retard ?? 0 }}</strong></div>
                <RouterLink to="/gemba-walks" class="text-xs text-brand-600 hover:underline">{{ t('common.view') }} →</RouterLink>
              </div>
            </div>
            <div class="card">
              <div class="text-xs font-semibold text-gray-500 uppercase mb-3">{{ t('nav.breaches') }}</div>
              <div class="space-y-2">
                <div class="flex justify-between text-sm"><span class="text-gray-600">{{ t('dashboard.thisMonth') }}</span><strong>{{ db.safety.infractions_mois ?? 0 }}</strong></div>
                <div class="flex justify-between text-sm"><span class="text-gray-600">YTD</span><strong class="text-amber-600">{{ db.safety.infractions_ytd ?? 0 }}</strong></div>
                <RouterLink to="/breaches" class="text-xs text-brand-600 hover:underline">{{ t('common.view') }} →</RouterLink>
              </div>
            </div>
          </div>
        </div>

        <!-- Activité récente -->
        <div class="card flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900 text-sm">{{ t('dashboard.recentActivity') }}</h3>
            <button @click="loadActivity" class="text-xs text-gray-400 hover:text-gray-600">
              <ArrowPathIcon class="w-4 h-4" />
            </button>
          </div>

          <div v-if="activityLoading" class="flex-1 flex items-center justify-center py-8">
            <div class="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>

          <div v-else-if="!activities.length" class="flex-1 flex flex-col items-center justify-center py-8 text-gray-300">
            <ClockIcon class="w-8 h-8 mb-2" />
            <p class="text-xs">{{ t('dashboard.noRecentActivity') }}</p>
          </div>

          <div v-else class="space-y-3 flex-1 overflow-y-auto">
            <RouterLink
              v-for="act in activities"
              :key="`${act.type}-${act.id}`"
              :to="act.link"
              class="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <!-- Icône -->
              <div :class="['w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', activityColor(act.type)]">
                <ExclamationTriangleIcon v-if="act.type === 'incident'" class="w-3.5 h-3.5" />
                <EyeIcon v-else-if="act.type === 'near_miss'" class="w-3.5 h-3.5" />
                <ShieldExclamationIcon v-else-if="act.type === 'breach'" class="w-3.5 h-3.5" />
                <UserIcon v-else class="w-3.5 h-3.5" />
              </div>

              <!-- Contenu -->
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-gray-900 truncate group-hover:text-brand-600">{{ act.title }}</p>
                <p class="text-xs text-gray-400 truncate">{{ act.subtitle }}</p>
                <p class="text-[10px] text-gray-300 mt-0.5">{{ timeAgoFromStr(act.created_at) }}</p>
              </div>

              <!-- Severity dot -->
              <div v-if="act.severity" :class="['w-2 h-2 rounded-full flex-shrink-0 mt-2', severityDot(act.severity)]" />
            </RouterLink>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDashboardStore } from '@/stores/dashboard'
import { dashboardApi } from '@/api'
import KpiCard from '@/components/ui/KpiCard.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import IncidentsChart from '@/components/charts/IncidentsChart.vue'
import TopZonesChart from '@/components/charts/TopZonesChart.vue'
import ContractTypeChart from '@/components/charts/ContractTypeChart.vue'
import {
  ArrowPathIcon, ClockIcon,
  ExclamationTriangleIcon, EyeIcon, ShieldExclamationIcon, UserIcon,
} from '@heroicons/vue/24/outline'

const { t } = useI18n()
const db    = useDashboardStore()

const currentYear  = new Date().getFullYear()
const selectedYear = ref(currentYear)
const years        = Array.from({ length: 5 }, (_, i) => currentYear - i)

const activities      = ref<any[]>([])
const activityLoading = ref(false)

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secs < 60)  return `${secs}s`
  if (secs < 3600) return `${Math.floor(secs / 60)}min`
  return `${Math.floor(secs / 3600)}h`
}

function timeAgoFromStr(dt: string): string {
  if (!dt) return ''
  const secs = Math.floor((Date.now() - new Date(dt).getTime()) / 1000)
  if (secs < 60)  return `Il y a ${secs}s`
  if (secs < 3600) return `Il y a ${Math.floor(secs / 60)}min`
  if (secs < 86400) return `Il y a ${Math.floor(secs / 3600)}h`
  return `Il y a ${Math.floor(secs / 86400)}j`
}

function activityColor(type: string): string {
  return {
    incident:  'bg-red-100 text-red-600',
    near_miss: 'bg-orange-100 text-orange-600',
    breach:    'bg-amber-100 text-amber-600',
    visitor:   'bg-blue-100 text-blue-600',
  }[type] ?? 'bg-gray-100 text-gray-500'
}

function severityDot(sev: string): string {
  return { critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-amber-400', low: 'bg-green-400' }[sev] ?? 'bg-gray-300'
}

async function loadActivity() {
  activityLoading.value = true
  try {
    const { data } = await dashboardApi.recentActivity()
    activities.value = data.activities ?? []
  } catch { activities.value = [] }
  finally { activityLoading.value = false }
}

onMounted(() => {
  db.loadFromCache()
  db.refresh()
  db.startAutoRefresh()
  loadActivity()
})

onUnmounted(() => {
  db.stopAutoRefresh()
})
</script>
