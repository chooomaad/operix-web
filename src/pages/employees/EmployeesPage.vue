<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">{{ t('employees.title') }}</h2>
        <p class="text-sm text-gray-500">{{ meta?.total ?? 0 }} {{ t('employees.title').toLowerCase() }}</p>
      </div>
      <div class="flex items-center gap-2" v-if="auth.isAdmin">
        <button @click="showImport = true" class="btn-secondary text-sm">
          <ArrowUpTrayIcon class="w-4 h-4" /> {{ t('employees.import') }}
        </button>
        <button @click="exportExcel" class="btn-secondary text-sm">
          <ArrowDownTrayIcon class="w-4 h-4" /> Excel
        </button>
        <button @click="exportPdf" class="btn-secondary text-sm">
          <DocumentArrowDownIcon class="w-4 h-4" /> PDF
        </button>
        <button @click="showCreate = true" class="btn-primary text-sm">
          <PlusIcon class="w-4 h-4" /> {{ t('employees.add') }}
        </button>
      </div>
    </div>

    <div class="card-sm flex flex-wrap gap-3">
      <input v-model="filters.search" @input="debouncedLoad" :placeholder="t('employees.searchPlaceholder')" class="input flex-1 min-w-48" />
      <select v-model="filters.department_id" @change="load" class="input w-44">
        <option value="">{{ t('employees.allDepts') }}</option>
        <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
      </select>
      <select v-model="filters.type_contrat" @change="load" class="input w-36">
        <option value="">{{ t('employees.allContracts') }}</option>
        <option value="CDI">CDI</option>
        <option value="CDD">CDD</option>
        <option value="Stage">Stage</option>
        <option value="Prestataire">{{ t('nav.contractors') }}</option>
      </select>
      <select v-model="filters.is_active" @change="load" class="input w-32">
        <option value="">{{ t('status.allStatuses') }}</option>
        <option value="true">{{ t('common.active') }}</option>
        <option value="false">{{ t('common.inactive') }}</option>
      </select>
      <button @click="resetFilters" class="btn-secondary text-xs px-3">{{ t('common.reset') }}</button>
    </div>

    <DataTable :columns="columns" :rows="employees" :loading="loading" :meta="meta" :empty-text="t('employees.noEmployees')" @page="loadPage">
      <template #cell-photo="{ row }">
        <div class="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center overflow-hidden">
          <img v-if="(row as any).photo_url" :src="(row as any).photo_url" class="w-full h-full object-cover" :alt="(row as any).nom" />
          <span v-else class="text-brand-600 text-xs font-bold">
            {{ ((row as any).prenom?.[0] ?? '') + ((row as any).nom?.[0] ?? '') }}
          </span>
        </div>
      </template>
      <template #cell-full_name="{ row }">
        <div class="font-medium text-gray-900">{{ (row as any).prenom }} {{ (row as any).nom }}</div>
        <div class="text-xs text-gray-500">{{ (row as any).matricule }}</div>
      </template>
      <template #cell-department="{ row }">{{ (row as any).department?.name ?? '—' }}</template>
      <template #cell-is_active="{ row }">
        <span :class="(row as any).is_active ? 'badge-active' : 'badge-inactive'">
          {{ (row as any).is_active ? t('common.active') : t('common.inactive') }}
        </span>
      </template>
      <template #actions="{ row }">
        <div class="flex justify-end gap-2">
          <RouterLink :to="`/employees/${(row as any).id}`" class="btn-secondary text-xs py-1 px-2">{{ t('common.view') }}</RouterLink>
          <button v-if="auth.isAdmin" @click="editTarget = row; showEdit = true" class="btn-secondary text-xs py-1 px-2">{{ t('common.edit') }}</button>
          <button v-if="auth.isAdmin" @click="deleteEmployee(row as any)" class="btn-danger text-xs py-1 px-2">{{ t('common.delete') }}</button>
        </div>
      </template>
    </DataTable>

    <ImportModal v-if="showImport" module="employees" @close="showImport = false" @imported="load" />
    <EmployeeFormModal v-if="showCreate" @close="showCreate = false" @saved="onCreated" />
    <EmployeeFormModal v-if="showEdit && editTarget" :employee="editTarget" @close="showEdit = false; editTarget = null" @saved="onEdited" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { employeesApi, departmentsApi, exportsApi, reportsApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useDownload } from '@/composables/useDownload'
import DataTable from '@/components/ui/DataTable.vue'
import ImportModal from '@/components/ui/ImportModal.vue'
import EmployeeFormModal from './EmployeeFormModal.vue'
import { PlusIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, DocumentArrowDownIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const auth     = useAuthStore()
const toast    = useToast()
const { downloadExcel, downloadPdf } = useDownload()

const employees   = ref<any[]>([])
const departments = ref<any[]>([])
const loading     = ref(false)
const meta        = ref<any>(null)
const showImport  = ref(false)
const showCreate  = ref(false)
const showEdit    = ref(false)
const editTarget  = ref<any>(null)
const filters     = reactive({ search: '', department_id: '', type_contrat: '', is_active: '', page: 1 })

const columns = computed(() => [
  { key: 'photo',        label: '' },
  { key: 'full_name',    label: t('employees.name') },
  { key: 'poste',        label: t('employees.position') },
  { key: 'department',   label: t('employees.department') },
  { key: 'type_contrat', label: t('employees.contract') },
  { key: 'is_active',    label: t('employees.status') },
])

let debounceTimer: ReturnType<typeof setTimeout>
function debouncedLoad() { clearTimeout(debounceTimer); debounceTimer = setTimeout(load, 300) }

async function load() {
  loading.value = true
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    const { data } = await employeesApi.list(params)
    employees.value = data.data
    meta.value      = data.meta
  } finally { loading.value = false }
}

function loadPage(page: number) { filters.page = page; load() }
function resetFilters() { Object.assign(filters, { search:'', department_id:'', type_contrat:'', is_active:'', page:1 }); load() }

async function deleteEmployee(emp: any) {
  if (!confirm(`${t('employees.confirmDelete')} — ${emp.prenom} ${emp.nom}?`)) return
  await employeesApi.destroy(emp.id)
  toast.add({ severity: 'success', summary: t('employees.deleted'), life: 3000 })
  load()
}

async function exportExcel() { await downloadExcel(() => exportsApi.employees(filters), 'employees.xlsx') }
async function exportPdf()   { await downloadPdf(() => reportsApi.employees(filters), 'employees.pdf') }

function onCreated() { showCreate.value = false; load() }
function onEdited(updated: any) {
  showEdit.value = false
  const idx = employees.value.findIndex(e => e.id === updated.id)
  if (idx !== -1) employees.value[idx] = updated
  editTarget.value = null
}

onMounted(async () => {
  const [, deps] = await Promise.all([load(), departmentsApi.list()])
  departments.value = deps.data.data ?? deps.data
})
</script>
