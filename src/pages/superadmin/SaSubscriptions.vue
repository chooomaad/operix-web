<template>
  <div>
    <h1 class="text-lg font-semibold text-gray-900 mb-4">Abonnements</h1>
    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="text-left text-gray-400 text-xs uppercase bg-gray-50">
          <tr><th class="p-3">Entreprise</th><th>Plan</th><th>Statut</th><th>Cycle</th><th>Début</th><th>Renouvellement</th></tr>
        </thead>
        <tbody>
          <tr v-for="s in rows" :key="s.id" class="border-t border-gray-50">
            <td class="p-3">{{ s.tenant?.name }}</td>
            <td>{{ s.plan?.slug }}</td>
            <td><span class="text-xs px-2 py-0.5 rounded-full bg-gray-100">{{ s.status }}</span></td>
            <td>{{ s.billing_cycle ?? '—' }}</td>
            <td class="text-xs text-gray-400">{{ s.starts_at }}</td>
            <td class="text-xs text-gray-400">{{ s.renews_at ?? '—' }}</td>
          </tr>
          <tr v-if="!rows.length"><td colspan="6" class="p-4 text-center text-gray-400 text-sm">Aucun abonnement.</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { superAdminApi } from '@/api'
const rows = ref<any[]>([])
onMounted(async () => { const { data } = await superAdminApi.subscriptions(); rows.value = data.data ?? data })
</script>
