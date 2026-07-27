<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Permis de travail</h2>
        <p class="text-sm text-gray-500">{{ meta?.total ?? 0 }} permis</p>
      </div>
      <div class="flex gap-2" v-if="auth.isAdmin">
        <button @click="exportExcel" class="btn-secondary text-sm"><ArrowDownTrayIcon class="w-4 h-4" /> Excel</button>
        <button @click="exportPdf"   class="btn-secondary text-sm"><DocumentArrowDownIcon class="w-4 h-4" /> PDF</button>
        <button @click="showForm = true" class="btn-primary text-sm"><PlusIcon class="w-4 h-4" /> Nouveau</button>
      </div>
    </div>

    <!-- KPI row -->
    <div class="grid grid-cols-4 gap-3">
      <div class="card-sm text-center"><div class="text-xl font-bold text-brand-600">{{ stats.active ?? 0 }}</div><div class="text-xs text-gray-500">Actifs</div></div>
      <div class="card-sm text-center"><div class="text-xl font-bold text-amber-600">{{ stats.pending ?? 0 }}</div><div class="text-xs text-gray-500">En attente</div></div>
      <div class="card-sm text-center"><div class="text-xl font-bold text-red-600">{{ stats.expired ?? 0 }}</div><div class="text-xs text-gray-500">Expirés</div></div>
      <div class="card-sm text-center"><div class="text-xl font-bold text-green-600">{{ stats.closed ?? 0 }}</div><div class="text-xs text-gray-500">Clôturés</div></div>
    </div>

    <div class="card-sm flex flex-wrap gap-3">
      <input v-model="filters.search" @input="debouncedLoad" placeholder="Référence, type, lieu..." class="input flex-1 min-w-48" />
      <select v-model="filters.type" @change="load" class="input w-40">
        <option value="">Tous types</option>
        <option value="hot_work">Travail à chaud</option>
        <option value="confined_space">Espace confiné</option>
        <option value="electrical">Électrique</option>
        <option value="excavation">Excavation</option>
        <option value="working_at_height">Travail en hauteur</option>
        <option value="general">Général</option>
      </select>
      <select v-model="filters.status" @change="load" class="input w-36">
        <option value="">Tous statuts</option>
        <option value="draft">Brouillon</option>
        <option value="pending">En attente</option>
        <option value="approved">Approuvé</option>
        <option value="active">Actif</option>
        <option value="expired">Expiré</option>
        <option value="closed">Clôturé</option>
      </select>
      <input v-model="filters.from" type="date" @change="load" class="input w-36" />
      <input v-model="filters.to"   type="date" @change="load" class="input w-36" />
      <button @click="resetFilters" class="btn-secondary text-xs">Réinitialiser</button>
    </div>

    <DataTable :columns="columns" :rows="records" :loading="loading" :meta="meta" empty-text="Aucun permis de travail" @page="loadPage">
      <template #cell-reference="{ value }"><span class="font-mono text-xs font-medium">{{ value }}</span></template>
      <template #cell-type="{ value }"><span class="text-xs">{{ typeLabel[value] ?? value }}</span></template>
      <template #cell-status="{ value }"><span :class="`badge-${value}`">{{ statusLabel[value] ?? value }}</span></template>
      <template #cell-is_expired="{ value }"><span v-if="value" class="badge-expired text-xs">Expiré</span></template>
      <template #actions="{ row }">
        <div class="flex justify-end gap-2">
          <RouterLink :to="`/permits/${(row as any).id}`" class="btn-secondary text-xs py-1 px-2">Voir</RouterLink>
          <button v-if="auth.isAdmin && (row as any).status === 'pending'" @click="approve(row as any)" class="btn-primary text-xs py-1 px-2">Approuver</button>
        </div>
      </template>
    </DataTable>

    <PermitFormModal v-if="showForm" @close="showForm = false" @created="load" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { permitsApi, exportsApi, reportsApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useDownload } from '@/composables/useDownload'
import DataTable from '@/components/ui/DataTable.vue'
import PermitFormModal from './PermitFormModal.vue'
import { PlusIcon, ArrowDownTrayIcon, DocumentArrowDownIcon } from '@heroicons/vue/24/outline'

const auth   = useAuthStore()
const toast  = useToast()
const { downloadExcel, downloadPdf } = useDownload()

const records  = ref<any[]>([])
const stats    = ref<any>({})
const loading  = ref(false)
const meta     = ref<any>(null)
const showForm = ref(false)
const filters  = reactive({ search: '', type: '', status: '', from: '', to: '', page: 1 })

const typeLabel: Record<string, string>   = { hot_work:'Travail à chaud', confined_space:'Espace confiné', electrical:'Électrique', excavation:'Excavation', working_at_height:'Travail en hauteur', general:'Général' }
const statusLabel: Record<string, string> = { draft:'Brouillon', pending:'En attente', approved:'Approuvé', active:'Actif', expired:'Expiré', closed:'Clôturé' }

const columns = [
  { key: 'reference', label: 'Référence' },
  { key: 'type',      label: 'Type' },
  { key: 'location',  label: 'Lieu' },
  { key: 'start_date',label: 'Début' },
  { key: 'end_date',  label: 'Fin' },
  { key: 'status',    label: 'Statut' },
]

let timer: ReturnType<typeof setTimeout>
function debouncedLoad() { clearTimeout(timer); timer = setTimeout(load, 300) }

async function load() {
  loading.value = true
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    const [list, st] = await Promise.all([permitsApi.list(params), permitsApi.stats()])
    records.value = list.data.data; meta.value = list.data.meta; stats.value = st.data
  } finally { loading.value = false }
}

function loadPage(page: number) { filters.page = page; load() }
function resetFilters() { Object.assign(filters, { search:'', type:'', status:'', from:'', to:'', page:1 }); load() }

async function approve(row: any) {
  try {
    await permitsApi.approve(row.id)
    toast.add({ severity: 'success', summary: 'Permis approuvé', life: 3000 })
    load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? 'Erreur', life: 4000 })
  }
}

async function exportExcel() { await downloadExcel(() => exportsApi.permits(filters), 'permis.xlsx') }
async function exportPdf()   { await downloadPdf(() => reportsApi.permits(filters), 'permis.pdf') }
onMounted(load)
</script>
