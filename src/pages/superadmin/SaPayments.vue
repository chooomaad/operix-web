<template>
  <div>
    <h1 class="text-lg font-semibold text-gray-900 mb-4">Paiements</h1>
    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="text-left text-gray-400 text-xs uppercase bg-gray-50">
          <tr><th class="p-3">Commande</th><th>Provider</th><th>Transaction</th><th>Montant</th><th>Statut</th><th>Date</th></tr>
        </thead>
        <tbody>
          <tr v-for="p in rows" :key="p.id" class="border-t border-gray-50">
            <td class="p-3 font-mono text-xs">{{ p.order?.reference }}</td>
            <td>{{ p.provider }}</td>
            <td class="font-mono text-xs">{{ p.provider_transaction_id }}</td>
            <td>{{ (p.amount / 100).toFixed(2) }} {{ p.currency }}</td>
            <td><span class="text-xs px-2 py-0.5 rounded-full bg-gray-100">{{ p.status }}</span></td>
            <td class="text-xs text-gray-400">{{ p.created_at }}</td>
          </tr>
          <tr v-if="!rows.length"><td colspan="6" class="p-4 text-center text-gray-400 text-sm">Aucun paiement.</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { superAdminApi } from '@/api'
const rows = ref<any[]>([])
onMounted(async () => { const { data } = await superAdminApi.payments(); rows.value = data.data ?? data })
</script>
