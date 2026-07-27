<template>
  <div>
    <VueApexCharts v-if="series.length > 0" type="donut" height="200" :options="options" :series="series" />
    <div v-else class="h-[200px] flex items-center justify-center text-gray-400 text-sm">Aucune donnée disponible</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

const props = defineProps<{ data: Record<string, number> }>()

const labels  = computed(() => Object.keys(props.data))
const series  = computed(() => Object.values(props.data))

const options = computed(() => ({
  chart: { fontFamily: 'Inter, sans-serif' },
  labels: labels.value,
  colors: ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2','#db2777'],
  legend: { position: 'right' as const, fontSize: '11px' },
  dataLabels: { enabled: false },
  plotOptions: { pie: { donut: { size: '65%' } } },
}))
</script>
