<template>
  <div class="card-sm flex items-center justify-between gap-3 border border-amber-200 bg-amber-50/60">
    <div class="flex items-center gap-2 text-sm text-amber-800">
      <ExclamationTriangleIcon class="w-5 h-5 flex-shrink-0 text-amber-500" />
      <span>{{ message || t('common.loadError') }}</span>
    </div>
    <button
      class="btn-secondary text-xs whitespace-nowrap"
      :disabled="loading"
      @click="$emit('retry')"
    >
      <ArrowPathIcon :class="['w-4 h-4', loading && 'animate-spin']" />
      {{ t('common.retry') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'

defineProps<{ message?: string; loading?: boolean }>()
defineEmits<{ (e: 'retry'): void }>()

const { t } = useI18n()
</script>
