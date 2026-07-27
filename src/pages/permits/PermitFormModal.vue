<template>
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
      <div class="flex items-center justify-between p-6 border-b">
        <h3 class="font-semibold">Nouveau permis de travail</h3>
        <button @click="$emit('close')"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
      </div>
      <form @submit.prevent="submit" class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Type *</label>
            <select v-model="form.type" class="input" required>
              <option value="hot_work">Travail à chaud</option>
              <option value="confined_space">Espace confiné</option>
              <option value="electrical">Électrique</option>
              <option value="excavation">Excavation</option>
              <option value="working_at_height">Travail en hauteur</option>
              <option value="general">Général</option>
            </select>
          </div>
          <div><label class="label">Lieu *</label><input v-model="form.location" class="input" required /></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="label">Date début *</label><input v-model="form.start_date" type="date" class="input" required /></div>
          <div><label class="label">Date fin *</label><input v-model="form.end_date" type="date" class="input" required /></div>
        </div>
        <div><label class="label">Description des travaux *</label><textarea v-model="form.work_description" class="input" rows="3" required /></div>
        <div><label class="label">Risques identifiés</label><textarea v-model="form.risks" class="input" rows="2" /></div>
        <div><label class="label">Mesures de sécurité</label><textarea v-model="form.safety_measures" class="input" rows="2" /></div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="$emit('close')" class="btn-secondary">Annuler</button>
          <button type="submit" :disabled="loading" class="btn-primary">{{ loading ? 'Enregistrement...' : 'Enregistrer' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { permitsApi } from '@/api'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const emit = defineEmits<{ close: []; created: [] }>()
const toast = useToast(); const loading = ref(false)
const form = reactive({ type:'general', location:'', start_date:'', end_date:'', work_description:'', risks:'', safety_measures:'' })

async function submit() {
  loading.value = true
  try { await permitsApi.create({ ...form }); toast.add({ severity:'success', summary:'Permis créé', life:3000 }); emit('created'); emit('close') }
  catch (e: any) { toast.add({ severity:'error', summary: e.response?.data?.message ?? 'Erreur', life:4000 }) }
  finally { loading.value = false }
}
</script>
