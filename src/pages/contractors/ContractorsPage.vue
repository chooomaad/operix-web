<template>
  <div class="p-4 sm:p-6 space-y-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">{{ t('contractors.title') }}</h2>
        <p class="text-sm text-gray-500">{{ meta?.total ?? 0 }} prestataire(s)</p>
      </div>
      <div class="flex gap-2">
        <button @click="exportExcel" class="btn-secondary text-sm"><ArrowDownTrayIcon class="w-4 h-4" /> Excel</button>
        <button v-if="auth.isAdmin" @click="showForm = true" class="btn-primary text-sm">
          <PlusIcon class="w-4 h-4" /> {{ t('contractors.new') }}
        </button>
      </div>
    </div>

    <!-- Filtres -->
    <div class="card-sm flex flex-wrap gap-3">
      <input v-model="filters.search" @input="debouncedLoad" :placeholder="t('contractors.searchPlaceholder')" class="input flex-1 min-w-48" />
      <select v-model="filters.status" @change="load" class="input w-36">
        <option value="">{{ t('contractors.allStatuses') }}</option>
        <option value="active">{{ t('contractors.statusActive') }}</option>
        <option value="suspended">{{ t('contractors.statusSuspended') }}</option>
        <option value="expired">{{ t('contractors.statusExpired') }}</option>
      </select>
      <button @click="resetFilters" class="btn-secondary text-xs">{{ t('common.reset') }}</button>
    </div>

    <!-- Table -->
    <DataTable :columns="columns" :rows="records" :loading="loading" :meta="meta" :empty-text="t('contractors.noContractors')" @page="loadPage">

      <template #cell-company_name="{ row, value }">
        <div class="font-medium text-gray-900">{{ value }}</div>
        <div class="text-xs text-gray-400">{{ (row as any).activite }}</div>
      </template>

      <template #cell-contact_nom="{ row, value }">
        <div>{{ value ?? '—' }}</div>
        <div v-if="(row as any).contact_phone" class="text-xs text-gray-400">{{ (row as any).contact_phone }}</div>
      </template>

      <template #cell-employees_count="{ value }">
        <button
          @click="openEmployees(records.find(r => r.employees_count === value))"
          class="text-sm font-medium text-brand-600 hover:underline"
        >
          {{ value ?? 0 }} {{ t('contractors.staff') }}
        </button>
      </template>

      <template #cell-contract_end="{ row, value }">
        <span :class="isExpired(value) ? 'text-red-500 font-semibold' : isExpiringSoon(value) ? 'text-amber-600 font-semibold' : 'text-gray-600'">
          {{ value ?? '—' }}
        </span>
      </template>

      <template #cell-status="{ row }">
        <span :class="{
          'badge-active':   effectiveStatus(row as any) === 'active',
          'badge-inactive': effectiveStatus(row as any) === 'suspended',
          'badge-expired':  effectiveStatus(row as any) === 'expired',
        }">
          {{ statusLabel[effectiveStatus(row as any)] ?? effectiveStatus(row as any) }}
        </span>
      </template>

      <template #actions="{ row }">
        <div class="flex justify-end gap-2">
          <button @click="viewEmployees(row as any)" class="btn-secondary text-xs py-1 px-2">
            <UsersIcon class="w-3.5 h-3.5 inline mr-1" />{{ t('contractors.viewStaff') }}
          </button>
          <button @click="editRow = row as any" class="btn-secondary text-xs py-1 px-2">{{ t('contractors.editBtn') }}</button>
          <button v-if="auth.isAdmin" @click="deleteRow(row as any)" class="text-red-500 hover:text-red-700 text-xs py-1 px-2">{{ t('contractors.deleteBtn') }}</button>
        </div>
      </template>
    </DataTable>

    <!-- Modals -->
    <ContractorFormModal
      v-if="showForm || editRow"
      :contractor="editRow"
      @close="showForm = false; editRow = null"
      @saved="load"
    />

    <ContractorEmployeesModal
      v-if="selectedContractor"
      :contractor="selectedContractor"
      @close="selectedContractor = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { contractorsApi, exportsApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useDownload } from '@/composables/useDownload'
import DataTable from '@/components/ui/DataTable.vue'
import ContractorFormModal from './ContractorFormModal.vue'
import ContractorEmployeesModal from './ContractorEmployeesModal.vue'
import { PlusIcon, ArrowDownTrayIcon, UsersIcon } from '@heroicons/vue/24/outline'

const { t }  = useI18n()
const auth   = useAuthStore()
const toast  = useToast()
const { downloadExcel } = useDownload()

const records            = ref<any[]>([])
const loading            = ref(false)
const meta               = ref<any>(null)
const showForm           = ref(false)
const editRow            = ref<any>(null)
const selectedContractor = ref<any>(null)
const filters            = reactive({ search: '', status: '', page: 1 })

const statusLabel = computed<Record<string, string>>(() => ({
  active:    t('contractors.statusActive'),
  suspended: t('contractors.statusSuspended'),
  expired:   t('contractors.statusExpired'),
}))

const columns = computed(() => [
  { key: 'company_name',    label: t('contractors.company') },
  { key: 'contact_nom',     label: t('contractors.contact') },
  { key: 'employees_count', label: t('contractors.staff') },
  { key: 'contract_end',    label: t('contractors.contractEnd') },
  { key: 'status',          label: t('contractors.status') },
])

let timer: ReturnType<typeof setTimeout>
function debouncedLoad() { clearTimeout(timer); timer = setTimeout(load, 300) }

function isExpired(date: string): boolean {
  if (!date) return false
  return new Date(date) < new Date(new Date().toDateString())
}

function isExpiringSoon(date: string): boolean {
  if (!date) return false
  const diff = (new Date(date).getTime() - Date.now()) / 86400000
  return diff >= 0 && diff <= 30
}

function effectiveStatus(row: any): string {
  if (row.status !== 'suspended' && row.contract_end && isExpired(row.contract_end)) {
    return 'expired'
  }
  return row.status ?? 'active'
}

async function load() {
  loading.value = true
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    const { data } = await contractorsApi.list(params)
    records.value = data.data
    meta.value    = data.meta
  } finally {
    loading.value = false
  }
}

function loadPage(page: number) { filters.page = page; load() }
function resetFilters() { Object.assign(filters, { search: '', status: '', page: 1 }); load() }

function viewEmployees(row: any) {
  selectedContractor.value = row
}

function openEmployees(row: any) {
  if (row) selectedContractor.value = row
}

async function deleteRow(row: any) {
  if (!confirm(`Supprimer "${row.company_name}" ?`)) return
  try {
    await contractorsApi.destroy(row.id)
    toast.add({ severity: 'success', summary: t('contractors.deleted'), life: 3000 })
    load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? 'Erreur', life: 4000 })
  }
}

async function exportExcel() { await downloadExcel(() => exportsApi.contractors(filters), 'prestataires.xlsx') }

onMounted(load)
</script>
