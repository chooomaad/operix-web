<template>
  <div class="card-sm flex flex-col gap-1">
    <div class="text-xs text-gray-500 font-medium truncate">{{ label }}</div>
    <div :class="['text-2xl font-bold', colorClass]">
      {{ value }}<span v-if="suffix" class="text-xs font-normal text-gray-400 ml-1">{{ suffix }}</span>
    </div>
    <div v-if="trend !== undefined" :class="['text-xs flex items-center gap-1', trend >= 0 ? 'text-red-500' : 'text-green-500']">
      <span>{{ trend >= 0 ? '↑' : '↓' }}</span>
      <span>{{ Math.abs(trend) }}% vs mois précédent</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: number | string
  color?: string
  suffix?: string
  trend?: number
}>()

const colorClass = computed(() => ({
  red:   'text-red-600',
  amber: 'text-amber-600',
  orange:'text-orange-600',
  green: 'text-green-600',
  brand: 'text-brand-600',
  gray:  'text-gray-500',
}[props.color ?? 'gray']))
</script>
