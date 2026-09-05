<template>
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
      <div class="flex items-center justify-between p-6 border-b flex-shrink-0">
        <h3 class="font-semibold text-gray-900">{{ t('propertyDamage.new') }}</h3>
        <button @click="$emit('close')" type="button"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
      </div>

      <form @submit.prevent="submit" class="p-6 space-y-4 overflow-y-auto">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="label">{{ t('propertyDamage.date') }} *</label><input v-model="form.date" type="date" class="input" required /></div>
          <div><label class="label">{{ t('propertyDamage.time') }}</label><input v-model="form.time" type="time" class="input" /></div>
        </div>
        <div><label class="label">{{ t('propertyDamage.location') }} *</label><input v-model="form.location" class="input" required /></div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">{{ t('propertyDamage.type') }} *</label>
            <select v-model="form.type" class="input" required>
              <option value="vehicle">{{ t('propertyDamage.types.vehicle') }}</option>
              <option value="equipment">{{ t('propertyDamage.types.equipment') }}</option>
              <option value="infrastructure">{{ t('propertyDamage.types.infrastructure') }}</option>
              <option value="cargo">{{ t('propertyDamage.types.cargo') }}</option>
              <option value="container">{{ t('propertyDamage.types.container') }}</option>
              <option value="other">{{ t('propertyDamage.types.other') }}</option>
            </select>
          </div>
          <div>
            <label class="label">{{ t('propertyDamage.severity') }}</label>
            <select v-model="form.severity" class="input">
              <option value="low">{{ t('severity.low') }}</option>
              <option value="medium">{{ t('severity.medium') }}</option>
              <option value="high">{{ t('severity.high') }}</option>
              <option value="critical">{{ t('severity.critical') }}</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="label">{{ t('propertyDamage.estimatedCost') }}</label><input v-model="form.estimated_cost" type="number" min="0" step="0.01" class="input" :placeholder="t('propertyDamage.costHint')" /></div>
          <div><label class="label">{{ t('propertyDamage.correctiveDue') }}</label><input v-model="form.corrective_action_due" type="date" class="input" /></div>
        </div>
        <div><label class="label">{{ t('propertyDamage.description') }} *</label><textarea v-model="form.description" class="input" rows="3" required /></div>
        <div><label class="label">{{ t('propertyDamage.immediateCause') }}</label><textarea v-model="form.immediate_cause" class="input" rows="2" /></div>
        <div><label class="label">{{ t('propertyDamage.correctiveAction') }}</label><textarea v-model="form.corrective_action" class="input" rows="2" /></div>

        <!-- Persons Involved -->
        <div>
          <label class="label flex items-center gap-2">
            <UserGroupIcon class="w-4 h-4 text-gray-400" />
            {{ t('propertyDamage.personsInvolved') }}
          </label>
          <PeoplePicker v-model="form.involved_people" :placeholder="t('people.searchPlaceholder')" />
        </div>

        <!-- Pièces jointes : photo + rapport PDF -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">{{ t('common.photo') }}</label>
            <input type="file" accept="image/*" @change="imageFile = ($event.target as HTMLInputElement).files?.[0] ?? null" class="input text-sm" />
          </div>
          <div>
            <label class="label">{{ t('reportFile.label') }}</label>
            <input type="file" accept="application/pdf" @change="reportFile = ($event.target as HTMLInputElement).files?.[0] ?? null" class="input text-sm" />
            <p class="text-xs text-gray-400 mt-1">{{ t('reportFile.hint') }}</p>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="$emit('close')" class="btn-secondary">{{ t('common.cancel') }}</button>
          <button type="submit" :disabled="loading" class="btn-primary">
            {{ loading ? t('common.saving') : t('common.save') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { propertyDamageApi } from '@/api'
import { useDashboardStore } from '@/stores/dashboard'
import { XMarkIcon, UserGroupIcon } from '@heroicons/vue/24/outline'
import PeoplePicker from '@/components/ui/PeoplePicker.vue'
import { objectToFormData } from '@/utils/eventForm'

const props   = defineProps<{ preloadEmployee?: { id: number; nom: string; prenom: string; matricule: string } }>()
const { t }   = useI18n()
const emit    = defineEmits<{ close: []; created: [] }>()
const toast   = useToast()
const dbStore = useDashboardStore()

const loading = ref(false)
const imageFile  = ref<File | null>(null)
const reportFile = ref<File | null>(null)
const form = reactive({
  date: '', time: '', location: '', type: 'equipment', severity: 'medium',
  description: '', estimated_cost: '', immediate_cause: '', corrective_action: '',
  corrective_action_due: '', involved_people: props.preloadEmployee
    ? [{ type: 'employee', id: props.preloadEmployee.id, full_name: `${props.preloadEmployee.prenom} ${props.preloadEmployee.nom}`, identifier: props.preloadEmployee.matricule }]
    : [] as any[],
})

async function submit() {
  loading.value = true
  try {
    const base: Record<string, unknown> = {
      ...form,
      involved_people: form.involved_people.map((p: any) => ({ type: p.type, id: p.id })),
    }
    if (imageFile.value)  base.image = imageFile.value
    if (reportFile.value) base.report_file = reportFile.value

    const payload = (imageFile.value || reportFile.value) ? objectToFormData(base) : base
    await propertyDamageApi.create(payload)

    toast.add({ severity: 'success', summary: t('propertyDamage.created'), life: 3000 })
    dbStore.refresh()
    emit('created')
    emit('close')
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? t('common.error'), life: 4000 })
  } finally {
    loading.value = false
  }
}
</script>
