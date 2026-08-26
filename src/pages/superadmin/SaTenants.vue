<template>
  <section>
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
      <div>
        <h1 class="text-lg font-semibold text-gray-900">Entreprises</h1>
        <p class="text-sm text-gray-500">Liste des entreprises clientes et de leurs tenants.</p>
      </div>
      <button
        class="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
        :disabled="loading"
        @click="loadTenants"
      >
        Actualiser
      </button>
    </div>

    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div v-if="loading" class="p-6 text-sm text-gray-500">Chargement des entreprises...</div>
      <div v-else-if="error" class="p-6 text-sm text-red-600">{{ error }}</div>
      <div v-else-if="tenants.length === 0" class="p-6 text-sm text-gray-500">Aucune entreprise enregistrée.</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="text-left text-xs uppercase text-gray-400 bg-gray-50">
            <tr>
              <th class="px-4 py-3">Entreprise</th>
              <th class="px-4 py-3">Slug</th>
              <th class="px-4 py-3">Statut</th>
              <th class="px-4 py-3">Plan</th>
              <th class="px-4 py-3 text-right">Utilisateurs</th>
              <th class="px-4 py-3 text-right">Employés</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tenant in tenants" :key="tenant.id" class="border-t border-gray-100">
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900">{{ tenant.name }}</div>
                <div class="text-xs text-gray-500">{{ tenant.short_name || '—' }}</div>
              </td>
              <td class="px-4 py-3 font-mono text-xs text-gray-600">{{ tenant.slug }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 rounded-full text-xs" :class="statusClass(tenant.status)">
                  {{ tenant.status }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-700">{{ tenant.plan || '—' }}</td>
              <td class="px-4 py-3 text-right text-gray-700">{{ tenant.users_count ?? 0 }}</td>
              <td class="px-4 py-3 text-right text-gray-700">{{ tenant.employees_count ?? 0 }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p v-if="meta" class="mt-3 text-xs text-gray-500">{{ meta.total }} entreprise(s)</p>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { superAdminApi } from '@/api'

interface Tenant {
  id: number
  name: string
  short_name?: string | null
  slug: string
  status: string
  plan?: string | null
  users_count?: number
  employees_count?: number
}

interface TenantMeta {
  total: number
}

const tenants = ref<Tenant[]>([])
const meta = ref<TenantMeta | null>(null)
const loading = ref(false)
const error = ref('')

function statusClass(status: string): string {
  if (status === 'active') return 'bg-green-100 text-green-700'
  if (status === 'suspended') return 'bg-red-100 text-red-700'
  return 'bg-yellow-100 text-yellow-700'
}

async function loadTenants() {
  loading.value = true
  error.value = ''

  try {
    const { data } = await superAdminApi.tenants({ per_page: 100 })
    tenants.value = data.data ?? []
    meta.value = data.meta ?? null
  } catch {
    error.value = 'Impossible de charger la liste des entreprises.'
  } finally {
    loading.value = false
  }
}

onMounted(loadTenants)
</script>
