<template>
  <div>
    <h1 class="text-lg font-semibold text-gray-900 mb-4">Plans</h1>
    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="text-left text-gray-400 text-xs uppercase bg-gray-50">
          <tr><th class="p-3">Plan</th><th>Mensuel (€)</th><th>Annuel (€)</th><th>Contact sales</th><th>Actif</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="p in plans" :key="p.id" class="border-t border-gray-50">
            <td class="p-3">{{ p.name }} <span class="text-xs text-gray-400">({{ p.slug }})</span></td>
            <td><input v-model.number="p._m" type="number" min="0" class="w-24 border rounded px-2 py-1 text-sm" /></td>
            <td><input v-model.number="p._y" type="number" min="0" class="w-24 border rounded px-2 py-1 text-sm" /></td>
            <td>{{ p.contact_sales ? 'oui' : 'non' }}</td>
            <td>{{ p.active ? 'oui' : 'non' }}</td>
            <td class="text-right pr-3">
              <button @click="save(p)" class="text-xs bg-blue-600 text-white rounded-lg px-2 py-1 hover:bg-blue-700">Enregistrer</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="text-xs text-gray-400 mt-2">Prix en euros (EUR). Stockés en centimes côté serveur.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { superAdminApi } from '@/api'

const plans = ref<any[]>([])

async function load() {
  const { data } = await superAdminApi.plans()
  plans.value = (data as any[]).map(p => ({
    ...p,
    _m: p.price_monthly != null ? p.price_monthly / 100 : null,
    _y: p.price_yearly != null ? p.price_yearly / 100 : null,
  }))
}

async function save(p: any) {
  await superAdminApi.updatePlan(p.id, {
    price_monthly: p._m != null ? Math.round(p._m * 100) : null,
    price_yearly:  p._y != null ? Math.round(p._y * 100) : null,
  })
  await load()
}

onMounted(load)
</script>
