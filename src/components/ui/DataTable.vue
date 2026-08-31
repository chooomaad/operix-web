<template>
  <div>
    <!-- Table -->
    <div class="overflow-x-auto rounded-xl border border-gray-200">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :class="['px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider', col.class]"
            >{{ col.label }}</th>
            <th v-if="$slots.actions" class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 bg-white">
          <tr v-if="loading">
            <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="px-4 py-8 text-center text-gray-400">
              <span class="inline-flex items-center gap-2"><span class="animate-spin">⟳</span> Chargement...</span>
            </td>
          </tr>
          <tr v-else-if="!rows.length">
            <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="px-4 py-8 text-center text-gray-400">{{ emptyText }}</td>
          </tr>
          <tr
            v-else
            v-for="row in rows"
            :key="(row as any).id"
            class="hover:bg-gray-50 transition-colors"
          >
            <td v-for="col in columns" :key="col.key" :class="['px-4 py-3 align-middle', col.class]">
              <slot :name="`cell-${col.key}`" :row="row" :value="(row as any)[col.key]">
                {{ (row as any)[col.key] ?? '—' }}
              </slot>
            </td>
            <td v-if="$slots.actions" class="px-4 py-3 text-right">
              <slot name="actions" :row="row" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="meta && meta.last_page > 1" class="flex items-center justify-between mt-4 text-sm text-gray-600">
      <span>{{ meta.total }} {{ t('common.results') }}</span>
      <div class="flex gap-2">
        <button @click="$emit('page', meta.current_page - 1)" :disabled="meta.current_page <= 1" class="btn-secondary py-1 px-3 text-xs disabled:opacity-40">{{ t('common.prev') }}</button>
        <span class="px-3 py-1 rounded-lg bg-gray-100">{{ meta.current_page }} / {{ meta.last_page }}</span>
        <button @click="$emit('page', meta.current_page + 1)" :disabled="meta.current_page >= meta.last_page" class="btn-secondary py-1 px-3 text-xs disabled:opacity-40">{{ t('common.next') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
defineProps<{
  columns: { key: string; label: string; class?: string }[]
  rows: unknown[]
  loading?: boolean
  emptyText?: string
  meta?: { total: number; current_page: number; last_page: number } | null
}>()
defineEmits<{ page: [number] }>()
</script>
