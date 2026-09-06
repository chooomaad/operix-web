<template>
  <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh]">
      <div class="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
        <div class="flex items-center gap-2">
          <ShieldCheckIcon class="w-5 h-5 text-brand-600" />
          <h3 class="font-semibold text-gray-900">{{ t('profile.kpi.epi') }}</h3>
        </div>
        <button @click="$emit('close')" type="button"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
      </div>

      <div class="px-6 py-5 space-y-6 overflow-y-auto">
        <!-- Articles -->
        <section>
          <div class="text-xs uppercase tracking-wide text-gray-400 mb-2">{{ t('profile.epi.items') }}</div>
          <div v-if="(record.items ?? []).length" class="flex flex-wrap gap-2">
            <span v-for="it in record.items" :key="it" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-sm font-medium border border-brand-100">
              {{ t('profile.epi.itemsList.' + it) }}
            </span>
          </div>
          <div v-else class="text-gray-400 text-sm">—</div>
        </section>

        <!-- Catégories + quantité -->
        <section class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="sm:col-span-2">
            <div class="text-xs uppercase tracking-wide text-gray-400 mb-2">{{ t('profile.epi.category') }}</div>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="c in (record.categories ?? [])" :key="c" class="badge-gray text-xs">{{ t('profile.epi.categories.' + c) }}</span>
              <span v-if="!(record.categories ?? []).length" class="text-gray-400 text-sm">—</span>
            </div>
          </div>
          <div class="text-center bg-gray-50 rounded-xl py-3">
            <div class="text-3xl font-black text-brand-600 leading-none">{{ record.quantity ?? (record.categories ?? []).length }}</div>
            <div class="text-xs text-gray-500 mt-1">{{ t('profile.epi.quantity') }}</div>
          </div>
        </section>

        <!-- Métadonnées -->
        <section class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div><div class="text-gray-400 text-xs mb-0.5">{{ t('profile.epi.issuedAt') }}</div><strong>{{ record.issued_at ?? '—' }}</strong></div>
          <div><div class="text-gray-400 text-xs mb-0.5">{{ t('profile.epi.returnDue') }}</div><strong>{{ record.return_due ?? '—' }}</strong></div>
          <div>
            <div class="text-gray-400 text-xs mb-0.5">{{ t('profile.epi.condition') }}</div>
            <span :class="record.condition === 'a_remplacer' ? 'badge-inactive' : 'badge-active'" class="text-xs">
              {{ record.condition ? t('profile.epi.conditions.' + record.condition) : '—' }}
            </span>
          </div>
        </section>

        <section v-if="record.observations">
          <div class="text-xs uppercase tracking-wide text-gray-400 mb-1">{{ t('profile.epi.observations') }}</div>
          <p class="text-sm text-gray-600">{{ record.observations }}</p>
        </section>

        <section v-if="record.image_url">
          <div class="text-xs uppercase tracking-wide text-gray-400 mb-2">{{ t('profile.attachment') }}</div>
          <a :href="record.image_url" target="_blank" rel="noopener" class="btn-secondary text-sm inline-flex items-center gap-1.5">
            <DocumentArrowDownIcon class="w-4 h-4" /> {{ t('reportFile.download') }}
          </a>
        </section>
      </div>

      <div class="px-6 py-3 border-t flex justify-end flex-shrink-0">
        <button @click="$emit('close')" class="btn-secondary">{{ t('common.back') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { XMarkIcon, ShieldCheckIcon, DocumentArrowDownIcon } from '@heroicons/vue/24/outline'

defineProps<{ record: any }>()
defineEmits<{ close: [] }>()
const { t } = useI18n()
</script>
