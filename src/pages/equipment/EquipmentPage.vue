<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Équipements</h2>
        <p class="text-sm text-gray-500">{{ meta?.total ?? 0 }} équipements</p>
      </div>
      <div class="flex gap-2" v-if="auth.isAdmin">
        <button @click="showForm = true" class="btn-primary text-sm"><PlusIcon class="w-4 h-4" /> Nouveau</button>
      </div>
    </div>

    <div class="card-sm flex flex-wrap gap-3">
      <input v-model="filters.search" @input="debouncedLoad" placeholder="Nom, matricule, type..." class="input flex-1 min-w-48" />
      <select v-model="filters.status" @change="load" class="input w-36">
        <option value="">Tous statuts</option>
        <option value="operational">Opérationnel</option>
        <option value="maintenance">En maintenance</option>
        <option value="out_of_service">Hors service</option>
      </select>
      <button @click="resetFilters" class="btn-secondary text-xs">Réinitialiser</button>
    </div>

    <DataTable :columns="columns" :rows="records" :loading="loading" :meta="meta" empty-text="Aucun équipement" @page="loadPage">
      <template #cell-status="{ value }">
        <span :class="{ 'badge-active': value === 'operational', 'badge-pending': value === 'maintenance', 'badge-expired': value === 'out_of_service' }">
          {{ statusLabel[value] ?? value }}
        </span>
      </template>
      <template #cell-last_inspection_date="{ value }">
        <span :class="isExpiringSoon(value) ? 'text-amber-600 font-medium' : ''">{{ value ?? '—' }}</span>
      </template>
      <template #actions="{ row }">
        <div class="flex justify-end gap-2">
          <button @click="editRow = row as any" class="btn-secondary text-xs py-1 px-2">Modifier</button>
          <button v-if="auth.isAdmin" @click="deleteRow(row as any)" class="text-red-500 hover:text-red-700 text-xs py-1 px-2">Supprimer</button>
        </div>
      </template>
    </DataTable>

    <EquipmentFormModal v-if="showForm || editRow" :equipment="editRow" @close="showForm = false; editRow = null" @saved="load" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { equipmentApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import DataTable from '@/components/ui/DataTable.vue'
import EquipmentFormModal from './EquipmentFormModal.vue'
import { PlusIcon } from '@heroicons/vue/24/outline'

const auth   = useAuthStore()
const toast  = useToast()

const records  = ref<any[]>([])
const loading  = ref(false)
const meta     = ref<any>(null)
const showForm = ref(false)
const editRow  = ref<any>(null)
const filters  = reactive({ search: '', status: '', page: 1 })

const statusLabel: Record<string, string> = { operational:'Opérationnel', maintenance:'En maintenance', out_of_service:'Hors service' }

const columns = [
  { key: 'name',                  label: 'Nom' },
  { key: 'matricule',             label: 'Matricule' },
  { key: 'type',                  label: 'Type' },
  { key: 'status',                label: 'Statut' },
  { key: 'last_inspection_date',  label: 'Dernière inspection' },
  { key: 'next_inspection_date',  label: 'Prochaine inspection' },
]

let timer: ReturnType<typeof setTimeout>
function debouncedLoad() { clearTimeout(timer); timer = setTimeout(load, 300) }
function isExpiringSoon(date: string): boolean {
  if (!date) return false
  return (new Date(date).getTime() - Date.now()) / 86400000 <= 30
}

async function load() {
  loading.value = true
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    const { data } = await equipmentApi.list(params)
    records.value = data.data; meta.value = data.meta
  } finally { loading.value = false }
}

function loadPage(page: number) { filters.page = page; load() }
function resetFilters() { Object.assign(filters, { search:'', status:'', page:1 }); load() }

async function deleteRow(row: any) {
  if (!confirm(`Supprimer "${row.name}" ?`)) return
  try {
    await equipmentApi.delete(row.id)
    toast.add({ severity: 'success', summary: 'Supprimé', life: 3000 })
    load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? 'Erreur', life: 4000 })
  }
}

onMounted(load)
</script>
