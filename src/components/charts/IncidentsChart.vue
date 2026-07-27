<template>
  <div>
    <VueApexCharts v-if="hasData" type="bar" height="220" :options="options" :series="series" />
    <div v-else class="h-[220px] flex items-center justify-center text-gray-400 text-sm">Aucune donnée disponible</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

const props = defineProps<{ data: Record<string, { incidents: number; near_miss: number }> }>()

const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

const incidents = computed(() =>
  Array.from({ length: 12 }, (_, i) => {
    const key = String(i + 1).padStart(2, '0')
    return props.data[key]?.incidents ?? 0
  })
)

const nearMiss = computed(() =>
  Array.from({ length: 12 }, (_, i) => {
    const key = String(i + 1).padStart(2, '0')
    return props.data[key]?.near_miss ?? 0
  })
)

const hasData = computed(() =>
  incidents.value.some(v => v > 0) || nearMiss.value.some(v => v > 0)
)

const series = computed(() => [
  { name: 'Incidents', data: incidents.value },
  { name: 'Presqu\'accidents', data: nearMiss.value },
])

const options = {
  chart: { toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
  colors: ['#dc2626', '#f97316'],
  plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
  dataLabels: { enabled: false },
  xaxis: { categories: monthLabels, labels: { style: { fontSize: '11px' } } },
  yaxis: { labels: { style: { fontSize: '11px' } }, tickAmount: 4 },
  legend: { position: 'top' as const, fontSize: '11px' },
  grid: { borderColor: '#f1f5f9', strokeDashArray: 3 },
}
</script>
