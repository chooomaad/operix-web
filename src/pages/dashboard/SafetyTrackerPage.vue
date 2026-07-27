<template>
  <div class="p-6 space-y-6">
    <!-- Hero counter -->
    <div class="card text-center bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <div class="text-8xl font-black text-green-600 leading-none">{{ tracker?.days_without_accident ?? 0 }}</div>
      <div class="text-xl font-bold text-green-700 mt-2">{{ t('safetyTracker.daysWithoutAccident') }}</div>
      <div class="text-sm text-green-600 mt-1">{{ t('safetyTracker.since') }} {{ tracker?.streak_start }}</div>
      <div class="flex justify-center gap-12 mt-6">
        <div>
          <div class="text-2xl font-bold text-green-700">{{ tracker?.best_streak_days ?? '-' }}</div>
          <div class="text-xs text-green-600">{{ t('safetyTracker.bestRecord') }}</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-gray-700">{{ tracker?.kpis?.total_incidents_ytd ?? 0 }}</div>
          <div class="text-xs text-gray-500">{{ t('safetyTracker.incidentsYtd') }}</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-gray-700">{{ tracker?.kpis?.taux_frequence ?? 0 }}</div>
          <div class="text-xs text-gray-500">{{ t('safetyTracker.frequencyRate') }}</div>
        </div>
      </div>
    </div>

    <!-- Monthly chart -->
    <div class="card">
      <h3 class="font-semibold text-gray-900 mb-4">{{ t('safetyTracker.monthlyChart') }} — {{ currentYear }}</h3>
      <VueApexCharts type="line" height="240" :options="chartOptions" :series="chartSeries" />
    </div>

    <!-- Last incident -->
    <div v-if="tracker?.last_incident" class="card border-red-200 bg-red-50">
      <h3 class="font-semibold text-red-800 mb-3">{{ t('safetyTracker.lastAccident') }}</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div><span class="text-gray-500">{{ t('safetyTracker.reference') }}</span><div class="font-medium">{{ tracker.last_incident.reference }}</div></div>
        <div><span class="text-gray-500">{{ t('safetyTracker.date') }}</span><div class="font-medium">{{ tracker.last_incident.date }}</div></div>
        <div><span class="text-gray-500">{{ t('safetyTracker.type') }}</span><div class="font-medium">{{ tracker.last_incident.type }}</div></div>
        <div><span class="text-gray-500">{{ t('safetyTracker.location') }}</span><div class="font-medium">{{ tracker.last_incident.location }}</div></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import VueApexCharts from 'vue3-apexcharts'
import { safetyTrackerApi } from '@/api'

const { t, tm } = useI18n()
const currentYear = new Date().getFullYear()
const tracker     = ref<Record<string, any> | null>(null)

const monthLabels = tm('safetyTracker.months') as string[]

const chartSeries = computed(() => [{
  name: 'Incidents',
  data: Array.from({ length: 12 }, (_, i) => {
    const key = String(i + 1).padStart(2, '0')
    return tracker.value?.monthly_data?.[key]?.incidents ?? 0
  }),
}])

const chartOptions = {
  chart: { toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
  colors: ['#dc2626'],
  stroke: { curve: 'smooth' as const, width: 2 },
  xaxis: { categories: monthLabels },
  yaxis: { tickAmount: 4 },
  grid: { borderColor: '#f1f5f9', strokeDashArray: 3 },
  markers: { size: 4 },
}

onMounted(async () => {
  const { data } = await safetyTrackerApi.index(currentYear)
  tracker.value = data
})
</script>
