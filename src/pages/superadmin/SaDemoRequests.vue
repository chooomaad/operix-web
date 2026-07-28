<template>
  <div>
    <h1 class="text-lg font-semibold text-gray-900 mb-4">Demandes de démo</h1>
    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="text-left text-gray-400 text-xs uppercase bg-gray-50">
          <tr><th class="p-3">Référence</th><th>Entreprise</th><th>Contact</th><th>Statut</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.id" class="border-t border-gray-50">
            <td class="p-3 font-mono text-xs">{{ r.reference }}</td>
            <td>{{ r.company_name }}</td>
            <td>{{ r.contact_name }}<div class="text-xs text-gray-400">{{ r.email }}</div></td>
            <td><span class="text-xs px-2 py-0.5 rounded-full bg-gray-100">{{ r.status }}</span></td>
            <td class="text-right pr-3">
              <button v-if="r.status !== 'converted'" @click="convert(r)"
                      class="text-xs bg-blue-600 text-white rounded-lg px-2 py-1 hover:bg-blue-700">
                Convertir en trial
              </button>
            </td>
          </tr>
          <tr v-if="!rows.length"><td colspan="5" class="p-4 text-center text-gray-400 text-sm">Aucune demande.</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { superAdminApi } from '@/api'

const rows = ref<any[]>([])

async function load() {
  const { data } = await superAdminApi.demoRequests()
  rows.value = data.data ?? data
}

async function convert(r: any) {
  const slug = window.prompt('Slug du plan pour le trial (ex. starter) :', 'starter')
  if (!slug) return
  try {
    await superAdminApi.demoConvert(r.id, { plan_slug: slug, trial_days: 14 })
    await load()
  } catch (e: any) {
    window.alert(e?.response?.data?.message ?? 'Conversion impossible.')
  }
}

onMounted(load)
</script>
