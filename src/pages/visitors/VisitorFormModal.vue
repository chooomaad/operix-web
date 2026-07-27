<template>
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
      <div class="flex items-center justify-between p-6 border-b flex-shrink-0">
        <h3 class="font-semibold text-gray-900">{{ t('visitors.registrationTitle') }}</h3>
        <button @click="$emit('close')"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
      </div>

      <form @submit.prevent="submit" class="p-6 space-y-4 overflow-y-auto">
        <!-- Identité -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">{{ t('visitors.firstName') }} *</label>
            <input v-model="form.prenom" class="input" required placeholder="Prénom" />
          </div>
          <div>
            <label class="label">{{ t('visitors.lastName') }} *</label>
            <input v-model="form.nom" class="input" required placeholder="NOM" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">{{ t('visitors.phone') }}</label>
            <input v-model="form.phone" class="input" type="tel" placeholder="+222 XX XX XX XX" />
          </div>
          <div>
            <label class="label">{{ t('visitors.idDocument') }}</label>
            <input v-model="form.cin" class="input" placeholder="Numéro de pièce" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">{{ t('visitors.company') }}</label>
            <input v-model="form.entreprise" class="input" placeholder="Nom de la société" />
          </div>
          <div>
            <label class="label">{{ t('visitors.badgeNo') }}</label>
            <input v-model="form.badge_number" class="input" placeholder="Badge attribué" />
          </div>
        </div>

        <div>
          <label class="label">{{ t('visitors.visitPurpose') }} *</label>
          <input v-model="form.motif" class="input" required placeholder="Objet de la visite" />
        </div>

        <div>
          <label class="label">{{ t('visitors.host') }}</label>
          <input v-model="form.personne_visitee" class="input" placeholder="Nom de l'hôte" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">{{ t('visitors.departmentZone') }}</label>
            <input v-model="form.department" class="input" placeholder="Département destination" />
          </div>
          <div>
            <label class="label">{{ t('visitors.vehiclePlate') }}</label>
            <input v-model="form.vehicle_plate" class="input" placeholder="AA 0000 AA" />
          </div>
        </div>

        <div>
          <label class="label">{{ t('visitors.notes') }}</label>
          <textarea v-model="form.notes" class="input" rows="2" placeholder="Informations complémentaires..." />
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="$emit('close')" class="btn-secondary">{{ t('common.cancel') }}</button>
          <button type="submit" :disabled="loading" class="btn-primary">
            {{ loading ? t('common.saving') : t('visitors.recordEntry') }}
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
import { visitorsApi } from '@/api'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()

const emit = defineEmits<{ close: []; created: [] }>()
const toast = useToast()
const loading = ref(false)

const form = reactive({
  prenom: '',
  nom: '',
  phone: '',
  cin: '',
  entreprise: '',
  badge_number: '',
  motif: '',
  personne_visitee: '',
  department: '',
  vehicle_plate: '',
  notes: '',
})

async function submit() {
  loading.value = true
  try {
    await visitorsApi.create({ ...form })
    toast.add({ severity: 'success', summary: t('visitors.entryRecorded'), detail: `${form.prenom} ${form.nom}`, life: 3000 })
    emit('created')
    emit('close')
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? 'Erreur', life: 4000 })
  } finally {
    loading.value = false
  }
}
</script>
