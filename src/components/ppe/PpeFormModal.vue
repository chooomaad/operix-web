<template>
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
      <div class="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
        <h3 class="font-semibold text-gray-900">{{ t('profile.epi.addTitle') }}</h3>
        <button @click="$emit('close')" type="button"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
      </div>

      <form @submit.prevent="submit" class="px-6 py-4 space-y-4 overflow-y-auto">
        <!-- Articles (multi) -->
        <div>
          <label class="label">{{ t('profile.epi.items') }} *</label>
          <p class="text-xs text-gray-400 mb-2">{{ t('profile.epi.selectItems') }}</p>
          <div class="grid grid-cols-2 gap-1.5">
            <label
              v-for="it in PPE_ITEMS" :key="it"
              class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-sm cursor-pointer select-none"
              :class="items.includes(it) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 hover:bg-gray-50'"
            >
              <input type="checkbox" :value="it" v-model="items" class="accent-brand-600" />
              {{ t('profile.epi.itemsList.' + it) }}
            </label>
          </div>
        </div>

        <!-- Catégories (multi) → quantité auto -->
        <div>
          <label class="label flex items-center justify-between">
            <span>{{ t('profile.epi.category') }} *</span>
            <span class="text-xs font-normal text-gray-500">{{ t('profile.epi.quantity') }} : <strong class="text-brand-700">{{ categories.length }}</strong></span>
          </label>
          <p class="text-xs text-gray-400 mb-2">{{ t('profile.epi.selectCategories') }}</p>
          <div class="flex flex-wrap gap-1.5">
            <label
              v-for="c in PPE_CATEGORIES" :key="c"
              class="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs cursor-pointer select-none"
              :class="categories.includes(c) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 hover:bg-gray-50'"
            >
              <input type="checkbox" :value="c" v-model="categories" class="accent-brand-600" />
              {{ t('profile.epi.categories.' + c) }}
            </label>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">{{ t('profile.epi.issuedAt') }} *</label><input v-model="form.issued_at" type="date" class="input" required /></div>
          <div><label class="label">{{ t('profile.epi.returnDue') }}</label><input v-model="form.return_due" type="date" class="input" /></div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">{{ t('profile.epi.condition') }}</label>
            <select v-model="form.condition" class="input">
              <option v-for="cond in PPE_CONDITIONS" :key="cond" :value="cond">{{ t('profile.epi.conditions.' + cond) }}</option>
            </select>
          </div>
          <div>
            <label class="label">{{ t('profile.attachment') }}</label>
            <input type="file" accept="image/*,application/pdf" @change="file = ($event.target as HTMLInputElement).files?.[0] ?? null" class="input text-sm" />
          </div>
        </div>

        <div><label class="label">{{ t('profile.epi.observations') }}</label><textarea v-model="form.observations" class="input" rows="2" /></div>

        <div class="flex justify-end gap-3 pt-1">
          <button type="button" @click="$emit('close')" class="btn-secondary">{{ t('common.cancel') }}</button>
          <button type="submit" :disabled="saving || !canSubmit" class="btn-primary">{{ saving ? t('common.saving') : t('common.save') }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { peopleApi } from '@/api'
import { objectToFormData } from '@/utils/eventForm'
import { PPE_ITEMS, PPE_CATEGORIES, PPE_CONDITIONS } from '@/constants/ppe'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{ personType: string; personId: number }>()
const emit  = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()
const toast = useToast()

const items      = ref<string[]>([])
const categories = ref<string[]>([])
const file       = ref<File | null>(null)
const saving     = ref(false)
const form = reactive({ issued_at: '', return_due: '', condition: 'neuf', observations: '' })

const canSubmit = computed(() => items.value.length > 0 && categories.value.length > 0 && !!form.issued_at)

async function submit() {
  if (!canSubmit.value) return
  saving.value = true
  try {
    const base: Record<string, unknown> = {
      items: items.value,
      categories: categories.value,
      issued_at: form.issued_at,
      return_due: form.return_due,
      condition: form.condition,
      observations: form.observations,
    }
    if (file.value) base.image = file.value
    const payload = file.value ? objectToFormData(base) : base
    await peopleApi.addRecord(props.personType, props.personId, 'epi', payload)
    toast.add({ severity: 'success', summary: t('profile.epi.added'), life: 3000 })
    emit('saved')
    emit('close')
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? t('common.error'), life: 4000 })
  } finally {
    saving.value = false
  }
}
</script>
