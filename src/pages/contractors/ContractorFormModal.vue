<template>
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
      <div class="flex items-center justify-between p-6 border-b flex-shrink-0">
        <h3 class="font-semibold text-gray-900">{{ contractor ? t('contractors.edit') : t('contractors.new') }}</h3>
        <button @click="$emit('close')"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
      </div>

      <form @submit.prevent="submit" class="p-6 space-y-4 overflow-y-auto">

        <!-- Identité société -->
        <div>
          <label class="label">{{ t('contractors.companyName') }} *</label>
          <input v-model="form.company_name" class="input" required placeholder="Nom de la société" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">{{ t('contractors.activity') }} *</label>
            <input v-model="form.activite" class="input" required placeholder="Ex: Électricité, BTP..." />
          </div>
          <div>
            <label class="label">{{ t('contractors.registrationNo') }}</label>
            <input v-model="form.num_registre" class="input" placeholder="RC..." />
          </div>
        </div>

        <!-- Contact -->
        <div class="border-t pt-4">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{{ t('contractors.primaryContact') }}</p>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">{{ t('contractors.contactName') }}</label>
              <input v-model="form.contact_nom" class="input" placeholder="Nom complet" />
            </div>
            <div>
              <label class="label">{{ t('contractors.phone') }}</label>
              <input v-model="form.contact_phone" class="input" type="tel" placeholder="+222 XX XX XX XX" />
            </div>
          </div>
          <div class="mt-3">
            <label class="label">{{ t('contractors.email') }}</label>
            <input v-model="form.contact_email" class="input" type="email" placeholder="contact@societe.mr" />
          </div>
        </div>

        <!-- Contrat -->
        <div class="border-t pt-4">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{{ t('contractors.contract') }}</p>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">{{ t('contractors.contractStart') }}</label>
              <input v-model="form.contract_start" class="input" type="date" />
            </div>
            <div>
              <label class="label">{{ t('contractors.contractEnd') }}</label>
              <input v-model="form.contract_end" class="input" type="date" />
            </div>
          </div>
          <div class="mt-3">
            <label class="label">{{ t('common.status') }}</label>
            <select v-model="form.status" class="input">
              <option value="active">{{ t('contractors.statusActive') }}</option>
              <option value="suspended">{{ t('contractors.statusSuspended') }}</option>
              <option value="expired">{{ t('contractors.statusExpired') }}</option>
            </select>
          </div>
        </div>

        <div>
          <label class="label">{{ t('contractors.notes') }}</label>
          <textarea v-model="form.notes" class="input" rows="2" placeholder="Informations complémentaires..." />
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
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { contractorsApi } from '@/api'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()

const props = defineProps<{ contractor?: any }>()
const emit  = defineEmits<{ close: []; saved: [] }>()
const toast = useToast()
const loading = ref(false)

const form = reactive({
  company_name:  '',
  activite:      '',
  num_registre:  '',
  contact_nom:   '',
  contact_phone: '',
  contact_email: '',
  contract_start: '',
  contract_end:  '',
  status:        'active' as 'active' | 'suspended' | 'expired',
  notes:         '',
})

watch(() => props.contractor, (c) => {
  if (c) {
    form.company_name  = c.company_name  ?? ''
    form.activite      = c.activite      ?? ''
    form.num_registre  = c.num_registre  ?? ''
    form.contact_nom   = c.contact_nom   ?? ''
    form.contact_phone = c.contact_phone ?? ''
    form.contact_email = c.contact_email ?? ''
    form.contract_start = c.contract_start ?? ''
    form.contract_end  = c.contract_end  ?? ''
    form.status        = c.status        ?? 'active'
    form.notes         = c.notes         ?? ''
  }
}, { immediate: true })

async function submit() {
  loading.value = true
  try {
    const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''))
    if (props.contractor?.id) {
      await contractorsApi.update(props.contractor.id, payload)
      toast.add({ severity: 'success', summary: t('contractors.updated'), life: 3000 })
    } else {
      await contractorsApi.create(payload)
      toast.add({ severity: 'success', summary: t('contractors.created'), life: 3000 })
    }
    emit('saved')
    emit('close')
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? 'Erreur', life: 4000 })
  } finally {
    loading.value = false
  }
}
</script>
