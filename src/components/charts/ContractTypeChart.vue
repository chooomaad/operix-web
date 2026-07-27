<template>
  <div>
    <VueApexCharts v-if="series[0]?.data.length > 0" type="bar" height="200" :options="options" :series="series" />
    <div v-else class="h-[200px] flex items-center justify-center text-gray-400 text-sm">Aucune donnée disponible</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

const props = defineProps<{
  byContract: Record<string, number>
  byGender:   Record<string, number>
}>()

const series = computed(() => [{
  name: 'Employés',
  data: Object.values(props.byContract).map(Number),
}])

const options = computed(() => ({
  chart: { fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
  xaxis: { categories: Object.keys(props.byContract) },
  colors: ['#2563eb'],
  plotOptions: { bar: { borderRadius: 4, columnWidth: '50%' } },
  dataLabels: { enabled: false },
  grid: { borderColor: '#f1f5f9' },
  yaxis: { labels: { style: { fontSize: '11px' } } },
}))
</script>
