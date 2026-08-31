<template>
  <component
    :is="to ? 'RouterLink' : 'div'"
    :to="to || undefined"
    class="relative flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 transition-shadow"
    :class="to && 'hover:shadow-card cursor-pointer'"
  >
    <!-- Accent latéral : couleur UNIQUEMENT si l'indicateur porte un signal -->
    <span
      v-if="tone !== 'neutral'"
      class="absolute left-0 top-3 bottom-3 w-1 rounded-full"
      :class="accent.bar"
      aria-hidden="true"
    />

    <div class="flex items-start justify-between gap-2 pl-2">
      <span class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 leading-tight">{{ label }}</span>
      <span v-if="$slots.icon" :class="['flex h-6 w-6 items-center justify-center rounded-md', accent.chip]">
        <slot name="icon" />
      </span>
    </div>

    <div class="pl-2">
      <div class="text-2xl font-bold tabular-nums leading-none" :class="accent.value">
        {{ value ?? 0 }}<span v-if="suffix" class="ml-1 text-xs font-medium text-slate-400">{{ suffix }}</span>
      </div>
      <div v-if="context" class="mt-1 text-[11px] text-slate-400 truncate">{{ context }}</div>
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  value: number | string
  context?: string
  suffix?: string
  tone?: 'neutral' | 'info' | 'safe' | 'warn' | 'critical'
  to?: string
}>(), { tone: 'neutral' })

// Couleurs fonctionnelles : neutre = ardoise (aucune couleur décorative),
// les couleurs ne servent qu'à transmettre un état (info/safe/warn/critical).
const accent = computed(() => ({
  neutral:  { bar: '',                 chip: 'bg-slate-100 text-slate-500',   value: 'text-slate-900' },
  info:     { bar: 'bg-sky-500',       chip: 'bg-sky-50 text-sky-600',        value: 'text-slate-900' },
  safe:     { bar: 'bg-emerald-500',   chip: 'bg-emerald-50 text-emerald-600',value: 'text-slate-900' },
  warn:     { bar: 'bg-amber-500',     chip: 'bg-amber-50 text-amber-600',    value: 'text-amber-600' },
  critical: { bar: 'bg-red-500',       chip: 'bg-red-50 text-red-600',        value: 'text-red-600' },
}[props.tone]))
</script>
