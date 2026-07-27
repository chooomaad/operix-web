<template>
  <div class="p-6 space-y-6" v-if="permit">
    <div class="flex items-center gap-3">
      <button @click="$router.back()" class="text-gray-400 hover:text-gray-600"><ArrowLeftIcon class="w-5 h-5" /></button>
      <div class="flex-1">
        <h2 class="text-lg font-bold text-gray-900">{{ permit.reference }}</h2>
        <div class="flex items-center gap-2 mt-1">
          <span :class="`badge-${permit.status}`">{{ statusLabel[permit.status] ?? permit.status }}</span>
          <span class="text-sm text-gray-500">{{ typeLabel[permit.type] ?? permit.type }}</span>
        </div>
      </div>
      <div class="flex gap-2" v-if="auth.isAdmin">
        <button v-if="permit.status === 'pending'" @click="approve" class="btn-primary text-sm">Approuver</button>
        <button v-if="permit.status === 'approved'" @click="activate" class="btn-primary text-sm">Activer</button>
        <button v-if="['active','approved'].includes(permit.status)" @click="close" class="btn-secondary text-sm">Clôturer</button>
      </div>
    </div>

    <div class="card grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div><span class="text-gray-500 block">Lieu</span><strong>{{ permit.location }}</strong></div>
      <div><span class="text-gray-500 block">Date début</span><strong>{{ permit.start_date }}</strong></div>
      <div><span class="text-gray-500 block">Date fin</span><strong>{{ permit.end_date }}</strong></div>
      <div><span class="text-gray-500 block">Demandé par</span><strong>{{ permit.requested_by?.name ?? '—' }}</strong></div>
    </div>

    <div v-if="permit.contractor" class="card text-sm">
      <h4 class="font-semibold text-gray-700 mb-2">Contractant</h4>
      <div class="grid grid-cols-3 gap-3">
        <div><span class="text-gray-500 block">Société</span><strong>{{ permit.contractor.company_name }}</strong></div>
        <div><span class="text-gray-500 block">Contact</span><strong>{{ permit.contractor.contact_name }}</strong></div>
        <div><span class="text-gray-500 block">Téléphone</span><strong>{{ permit.contractor.phone ?? '—' }}</strong></div>
      </div>
    </div>

    <div class="card space-y-4 text-sm">
      <div><h4 class="font-semibold text-gray-700 mb-1">Description des travaux</h4><p class="text-gray-600 leading-relaxed">{{ permit.work_description }}</p></div>
      <div v-if="permit.risks"><h4 class="font-semibold text-gray-700 mb-1">Risques identifiés</h4><p class="text-gray-600">{{ permit.risks }}</p></div>
      <div v-if="permit.safety_measures"><h4 class="font-semibold text-gray-700 mb-1">Mesures de sécurité</h4><p class="text-gray-600">{{ permit.safety_measures }}</p></div>
    </div>

    <div v-if="permit.approved_by" class="card text-sm">
      <h4 class="font-semibold text-gray-700 mb-2">Approbation</h4>
      <div class="grid grid-cols-2 gap-3">
        <div><span class="text-gray-500 block">Approuvé par</span><strong>{{ permit.approved_by?.name }}</strong></div>
        <div><span class="text-gray-500 block">Date d'approbation</span><strong>{{ permit.approved_at }}</strong></div>
      </div>
    </div>
  </div>
  <div v-else class="p-6 text-center text-gray-500">Chargement...</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { permitsApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const route  = useRoute()
const auth   = useAuthStore()
const toast  = useToast()
const permit = ref<any>(null)

const typeLabel: Record<string, string>   = { hot_work:'Travail à chaud', confined_space:'Espace confiné', electrical:'Électrique', excavation:'Excavation', working_at_height:'Travail en hauteur', general:'Général' }
const statusLabel: Record<string, string> = { draft:'Brouillon', pending:'En attente', approved:'Approuvé', active:'Actif', expired:'Expiré', closed:'Clôturé' }

async function fetchPermit() {
  const { data } = await permitsApi.show(Number(route.params.id))
  permit.value = data
}

async function approve() {
  await permitsApi.approve(Number(route.params.id))
  toast.add({ severity: 'success', summary: 'Permis approuvé', life: 3000 })
  fetchPermit()
}

async function activate() {
  await permitsApi.update(Number(route.params.id), { status: 'active' })
  toast.add({ severity: 'success', summary: 'Permis activé', life: 3000 })
  fetchPermit()
}

async function close() {
  await permitsApi.update(Number(route.params.id), { status: 'closed' })
  toast.add({ severity: 'success', summary: 'Permis clôturé', life: 3000 })
  fetchPermit()
}

onMounted(fetchPermit)
</script>
