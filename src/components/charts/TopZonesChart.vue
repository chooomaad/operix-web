<template>
  <div>
    <VueApexCharts
      v-if="hasData"
      type="bar"
      :height="chartHeight"
      :options="options"
      :series="series"
    />
    <div v-else class="flex flex-col items-center justify-center py-10 text-gray-300">
      <svg class="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p class="text-sm">Aucune donnée disponible</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

interface Zone {
  location: string
  incidents: number
  near_miss: number
  breaches: number
  total: number
}

const props = defineProps<{ zones: Zone[] }>()

const hasData    = computed(() => props.zones.length > 0)
const chartHeight = computed(() => Math.max(180, props.zones.length * 38))

const categories = computed(() =>
  props.zones.map(z => z.location.length > 20 ? z.location.slice(0, 18) + '…' : z.location)
)

const series = computed(() => [
  { name: 'Incidents',       data: props.zones.map(z => z.incidents) },
  { name: "Presqu'accidents", data: props.zones.map(z => z.near_miss) },
  { name: 'Infractions',     data: props.zones.map(z => z.breaches) },
])

const options = computed(() => ({
  chart: {
    type: 'bar' as const,
    stacked: true,
    toolbar: { show: false },
    fontFamily: 'Inter, sans-serif',
  },
  plotOptions: {
    bar: {
      horizontal: true,
      barHeight: '65%',
      borderRadius: 3,
    },
  },
  colors: ['#dc2626', '#f97316', '#f59e0b'],
  dataLabels: { enabled: false },
  xaxis: {
    categories: categories.value,
    labels: { style: { fontSize: '11px' } },
  },
  yaxis: {
    labels: {
      style: { fontSize: '11px' },
      maxWidth: 130,
    },
  },
  legend: {
    position: 'top' as const,
    fontSize: '11px',
    markers: { size: 8 },
  },
  grid: { borderColor: '#f1f5f9', xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
  tooltip: {
    shared: true,
    intersect: false,
    y: { formatter: (v: number) => `${v} événement(s)` },
  },
}))
</script>
