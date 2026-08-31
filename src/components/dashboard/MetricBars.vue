<template>
  <div class="space-y-2.5">
    <div v-if="!total" class="py-6 text-center text-sm text-slate-400">{{ emptyText }}</div>
    <div v-for="row in rows" :key="row.label" class="flex items-center gap-3">
      <span class="w-24 shrink-0 text-xs font-medium text-slate-600 truncate">{{ row.label }}</span>
      <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          class="h-full rounded-full transition-all"
          :class="row.color"
          :style="{ width: pct(row.value) + '%' }"
        />
      </div>
      <span class="w-14 shrink-0 text-right text-xs tabular-nums text-slate-500">
        {{ row.value }}<span class="ml-1 text-slate-300">{{ pct(row.value) }}%</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  rows: { label: string; value: number; color: string }[]
  emptyText: string
}>()

const total = computed(() => props.rows.reduce((s, r) => s + (r.value || 0), 0))
function pct(v: number): number {
  return total.value > 0 ? Math.round((v / total.value) * 100) : 0
}
</script>
