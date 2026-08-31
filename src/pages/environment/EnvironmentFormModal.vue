<template>
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
      <div class="flex items-center justify-between p-6 border-b flex-shrink-0">
        <h3 class="font-semibold text-gray-900">{{ t('environment.new') }}</h3>
        <button @click="$emit('close')" type="button"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
      </div>

      <form @submit.prevent="submit" class="p-6 space-y-4 overflow-y-auto">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="label">{{ t('environment.date') }} *</label><input v-model="form.date" type="date" class="input" required /></div>
          <div><label class="label">{{ t('environment.time') }}</label><input v-model="form.time" type="time" class="input" /></div>
        </div>
        <div><label class="label">{{ t('environment.location') }} *</label><input v-model="form.location" class="input" required /></div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">{{ t('environment.type') }} *</label>
            <select v-model="form.type" class="input" required>
              <option value="waste">{{ t('environment.types.dechets') }}</option>
              <option value="spill">{{ t('environment.types.deversement') }}</option>
              <option value="emission">{{ t('environment.types.emissions') }}</option>
              <option value="noise">{{ t('environment.types.bruit') }}</option>
              <option value="other">{{ t('environment.types.autre') }}</option>
            </select>
          </div>
          <div>
            <label class="label">{{ t('environment.severity') }}</label>
            <select v-model="form.severity" class="input">
              <option value="low">{{ t('severity.low') }}</option>
              <option value="medium">{{ t('severity.medium') }}</option>
              <option value="high">{{ t('severity.high') }}</option>
              <option value="critical">{{ t('severity.critical') }}</option>
            </select>
          </div>
        </div>
        <div><label class="label">{{ t('environment.description') }} *</label><textarea v-model="form.description" class="input" rows="3" required /></div>
        <div><label class="label">{{ t('environment.impact') }}</label><textarea v-model="form.impact" class="input" rows="2" /></div>
        <div><label class="label">{{ t('environment.correctiveAction') }}</label><textarea v-model="form.corrective_action" class="input" rows="2" /></div>
        <div><label class="label">{{ t('environment.correctiveDue') }}</label><input v-model="form.corrective_action_due" type="date" class="input" /></div>

        <!-- Persons Involved -->
        <div>
          <label class="label flex items-center gap-2">
            <UserGroupIcon class="w-4 h-4 text-gray-400" />
            {{ t('environment.personsInvolved') }}
          </label>
          <EmployeePicker
            v-model="form.employees"
            :placeholder="t('environment.searchEmployee')"
          />
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
import { environmentApi } from '@/api'
import { useDashboardStore } from '@/stores/dashboard'
import { XMarkIcon, UserGroupIcon } from '@heroicons/vue/24/outline'
import EmployeePicker from '@/components/ui/EmployeePicker.vue'

const props   = defineProps<{ preloadEmployee?: { id: number; nom: string; prenom: string; matricule: string } }>()
const { t }   = useI18n()
const emit    = defineEmits<{ close: []; created: [] }>()
const toast   = useToast()
const dbStore = useDashboardStore()

const loading = ref(false)
const form = reactive({
  date: '', time: '', location: '', type: 'other', severity: 'medium',
  description: '', impact: '', corrective_action: '',
  corrective_action_due: '', employees: props.preloadEmployee ? [props.preloadEmployee.id] : [] as number[],
})

async function submit() {
  loading.value = true
  try {
    await environmentApi.create({ ...form })
    toast.add({ severity: 'success', summary: t('environment.created'), life: 3000 })
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
