<template>
  <div>
    <h1 class="text-lg font-semibold text-gray-900 mb-4">Commandes</h1>
    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="text-left text-gray-400 text-xs uppercase bg-gray-50">
          <tr><th class="p-3">Référence</th><th>Entreprise</th><th>Plan</th><th>Cycle</th><th>Montant</th><th>Statut</th></tr>
        </thead>
        <tbody>
          <tr v-for="o in rows" :key="o.id" class="border-t border-gray-50">
            <td class="p-3 font-mono text-xs">{{ o.reference }}</td>
            <td>{{ o.company_name }}</td>
            <td>{{ o.plan?.slug }}</td>
            <td>{{ o.billing_cycle }}</td>
            <td>{{ (o.amount / 100).toFixed(2) }} {{ o.currency }}</td>
            <td><span class="text-xs px-2 py-0.5 rounded-full bg-gray-100">{{ o.status }}</span></td>
          </tr>
          <tr v-if="!rows.length"><td colspan="6" class="p-4 text-center text-gray-400 text-sm">Aucune commande.</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { superAdminApi } from '@/api'
const rows = ref<any[]>([])
onMounted(async () => { const { data } = await superAdminApi.orders(); rows.value = data.data ?? data })
</script>
