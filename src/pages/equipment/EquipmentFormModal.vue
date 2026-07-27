<template>
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
      <div class="flex items-center justify-between p-6 border-b">
        <h3 class="font-semibold">{{ equipment ? 'Modifier l\'équipement' : 'Nouvel équipement' }}</h3>
        <button @click="$emit('close')"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
      </div>
      <form @submit.prevent="submit" class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="label">Nom *</label><input v-model="form.name" class="input" required /></div>
          <div><label class="label">Matricule</label><input v-model="form.matricule" class="input" /></div>
        </div>
        <div><label class="label">Type</label><input v-model="form.type" class="input" /></div>
        <div>
          <label class="label">Statut</label>
          <select v-model="form.status" class="input">
            <option value="operational">Opérationnel</option>
            <option value="maintenance">En maintenance</option>
            <option value="out_of_service">Hors service</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="label">Dernière inspection</label><input v-model="form.last_inspection_date" type="date" class="input" /></div>
          <div><label class="label">Prochaine inspection</label><input v-model="form.next_inspection_date" type="date" class="input" /></div>
        </div>
        <div><label class="label">Observations</label><textarea v-model="form.observations" class="input" rows="2" /></div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="$emit('close')" class="btn-secondary">Annuler</button>
          <button type="submit" :disabled="loading" class="btn-primary">{{ loading ? 'Enregistrement...' : 'Enregistrer' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { equipmentApi } from '@/api'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{ equipment?: any }>()
const emit  = defineEmits<{ close: []; saved: [] }>()
const toast = useToast(); const loading = ref(false)
const form  = reactive({ name:'', matricule:'', type:'', status:'operational', last_inspection_date:'', next_inspection_date:'', observations:'' })

watch(() => props.equipment, (eq) => { if (eq) Object.assign(form, eq) }, { immediate: true })

async function submit() {
  loading.value = true
  try {
    if (props.equipment?.id) await equipmentApi.update(props.equipment.id, { ...form })
    else await equipmentApi.create({ ...form })
    toast.add({ severity:'success', summary: props.equipment ? 'Modifié' : 'Créé', life:3000 })
    emit('saved'); emit('close')
  } catch (e: any) { toast.add({ severity:'error', summary: e.response?.data?.message ?? 'Erreur', life:4000 }) }
  finally { loading.value = false }
}
</script>
