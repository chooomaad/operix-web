<template>
  <div class="p-6 space-y-4">
    <div>
      <h2 class="text-lg font-semibold text-gray-900">Journal d'audit</h2>
      <p class="text-sm text-gray-500">{{ meta?.total ?? 0 }} entrées</p>
    </div>

    <div class="card-sm flex flex-wrap gap-3">
      <input v-model="filters.search" @input="debouncedLoad" placeholder="Action, modèle, utilisateur..." class="input flex-1 min-w-48" />
      <select v-model="filters.action" @change="load" class="input w-40">
        <option value="">Toutes actions</option>
        <option value="create">Créer</option>
        <option value="update">Modifier</option>
        <option value="delete">Supprimer</option>
        <option value="login">Connexion</option>
        <option value="logout">Déconnexion</option>
        <option value="export">Export</option>
        <option value="import">Import</option>
        <option value="close">Clôturer</option>
      </select>
      <input v-model="filters.from" type="date" @change="load" class="input w-36" />
      <input v-model="filters.to"   type="date" @change="load" class="input w-36" />
      <button @click="resetFilters" class="btn-secondary text-xs">Réinitialiser</button>
    </div>

    <DataTable :columns="columns" :rows="records" :loading="loading" :meta="meta" empty-text="Aucune entrée d'audit" @page="loadPage">
      <template #cell-action="{ value }">
        <span :class="actionClass(value)" class="badge text-xs">{{ value }}</span>
      </template>
      <template #cell-model_type="{ value }">
        <span class="text-xs font-mono text-gray-600">{{ formatModel(value) }}</span>
      </template>
      <template #cell-user="{ row }">
        <span class="text-xs">{{ (row as any).user?.name ?? '—' }}</span>
      </template>
      <template #actions="{ row }">
        <button @click="viewRow = row as any" class="btn-secondary text-xs py-1 px-2">Détail</button>
      </template>
    </DataTable>

    <!-- Detail panel -->
    <div v-if="viewRow" class="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div class="bg-white w-full max-w-lg h-full overflow-y-auto p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">Détail audit</h3>
          <button @click="viewRow = null"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><span class="text-gray-500 block">Action</span><span :class="actionClass(viewRow.action)" class="badge text-xs">{{ viewRow.action }}</span></div>
          <div><span class="text-gray-500 block">Modèle</span><strong>{{ formatModel(viewRow.model_type) }} #{{ viewRow.model_id }}</strong></div>
          <div><span class="text-gray-500 block">Utilisateur</span><strong>{{ viewRow.user?.name ?? '—' }}</strong></div>
          <div><span class="text-gray-500 block">IP</span><strong class="font-mono">{{ viewRow.ip_address ?? '—' }}</strong></div>
          <div class="col-span-2"><span class="text-gray-500 block">Date</span><strong>{{ formatDate(viewRow.created_at) }}</strong></div>
        </div>
        <div v-if="viewRow.old_values" class="space-y-1">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Valeurs avant</p>
          <pre class="text-xs bg-gray-50 rounded p-3 overflow-x-auto">{{ JSON.stringify(viewRow.old_values, null, 2) }}</pre>
        </div>
        <div v-if="viewRow.new_values" class="space-y-1">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Valeurs après</p>
          <pre class="text-xs bg-gray-50 rounded p-3 overflow-x-auto">{{ JSON.stringify(viewRow.new_values, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { auditApi } from '@/api'
import DataTable from '@/components/ui/DataTable.vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const records  = ref<any[]>([])
const loading  = ref(false)
const meta     = ref<any>(null)
const viewRow  = ref<any>(null)
const filters  = reactive({ search: '', action: '', from: '', to: '', page: 1 })

const columns = [
  { key: 'created_at', label: 'Date' },
  { key: 'action',     label: 'Action' },
  { key: 'model_type', label: 'Modèle' },
  { key: 'model_id',   label: 'ID' },
  { key: 'user',       label: 'Utilisateur' },
  { key: 'ip_address', label: 'IP' },
]

function actionClass(action: string): string {
  const map: Record<string, string> = {
    create: 'bg-green-100 text-green-800', update: 'bg-blue-100 text-blue-800',
    delete: 'bg-red-100 text-red-800', login: 'bg-purple-100 text-purple-800',
    logout: 'bg-gray-100 text-gray-700', export: 'bg-amber-100 text-amber-800',
    import: 'bg-teal-100 text-teal-800', close: 'bg-orange-100 text-orange-800',
  }
  return `px-2 py-0.5 rounded-full font-medium ${map[action] ?? 'bg-gray-100 text-gray-700'}`
}

function formatModel(type: string): string {
  return (type ?? '').split('\\').pop() ?? type
}

function formatDate(d: string): string {
  return d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' }) : '—'
}

let timer: ReturnType<typeof setTimeout>
function debouncedLoad() { clearTimeout(timer); timer = setTimeout(load, 300) }

async function load() {
  loading.value = true
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    const { data } = await auditApi.list(params)
    records.value = data.data; meta.value = data.meta
  } finally { loading.value = false }
}

function loadPage(page: number) { filters.page = page; load() }
function resetFilters() { Object.assign(filters, { search:'', action:'', from:'', to:'', page:1 }); load() }
onMounted(load)
</script>
