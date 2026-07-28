<template>
  <div>
    <h1 class="text-lg font-semibold text-gray-900 mb-4">Tableau de bord plateforme</h1>

    <div v-if="d" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div v-for="k in kpis" :key="k.label" class="bg-white rounded-xl border border-gray-100 p-4">
        <div class="text-2xl font-semibold text-gray-900">{{ k.value }}</div>
        <div class="text-xs text-gray-500">{{ k.label }}</div>
      </div>
    </div>

    <div v-if="d" class="bg-white rounded-xl border border-gray-100 p-4">
      <h2 class="text-sm font-semibold text-gray-700 mb-3">Commandes récentes</h2>
      <table class="w-full text-sm">
        <thead class="text-left text-gray-400 text-xs uppercase">
          <tr><th class="py-1">Référence</th><th>Entreprise</th><th>Montant</th><th>Statut</th></tr>
        </thead>
        <tbody>
          <tr v-for="o in d.commercial.recent_orders" :key="o.id" class="border-t border-gray-50">
            <td class="py-1 font-mono text-xs">{{ o.reference }}</td>
            <td>{{ o.company_name }}</td>
            <td>{{ (o.amount / 100).toFixed(2) }} {{ o.currency }}</td>
            <td><span class="text-xs px-2 py-0.5 rounded-full bg-gray-100">{{ o.status }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { superAdminApi } from '@/api'

const d = ref<any>(null)

const kpis = computed(() => d.value ? [
  { label: 'Entreprises', value: d.value.platform.total_tenants },
  { label: 'Actives', value: d.value.platform.active_tenants },
  { label: 'Trials', value: d.value.platform.trial_tenants },
  { label: 'Suspendues', value: d.value.platform.suspended },
  { label: 'Commandes payées', value: d.value.commercial.paid_orders },
  { label: 'Paiements', value: d.value.commercial.succeeded_payments },
  { label: 'Abonnements actifs', value: d.value.commercial.active_subscriptions },
  { label: 'Demandes de démo', value: d.value.commercial.new_demo_requests },
] : [])

onMounted(async () => {
  const { data } = await superAdminApi.dashboard()
  d.value = data
})
</script>
