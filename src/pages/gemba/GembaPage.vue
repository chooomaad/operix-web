<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">{{ t('gemba.title') }}</h2>
        <p class="text-sm text-gray-500">{{ meta?.total ?? 0 }} {{ t('gemba.pageSubtitle') }}</p>
      </div>
      <button v-if="auth.isAdmin" @click="showForm = true" class="btn-primary text-sm">
        <PlusIcon class="w-4 h-4" /> {{ t('gemba.new') }}
      </button>
    </div>

    <!-- Alertes deadlines -->
    <template v-if="overdueItems.length || dueSoonItems.length">
      <div v-if="overdueItems.length" class="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <ExclamationTriangleIcon class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-red-700">{{ overdueItems.length }} {{ t('gemba.overdueAlert') }}</p>
          <div class="mt-1 space-y-0.5">
            <p v-for="w in overdueItems" :key="w.id" class="text-xs text-red-600 truncate">
              <strong>{{ w.zone }}</strong> — {{ w.observation }} · {{ t('gemba.ownerLabel') }} : {{ w.responsible || '—' }} · {{ t('gemba.deadlineLabel') }} : {{ w.due_date }}
            </p>
          </div>
        </div>
      </div>
      <div v-if="dueSoonItems.length" class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <ClockIcon class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-amber-700">{{ dueSoonItems.length }} {{ t('gemba.dueSoonAlert') }}</p>
          <div class="mt-1 space-y-0.5">
            <p v-for="w in dueSoonItems" :key="w.id" class="text-xs text-amber-600 truncate">
              <strong>{{ w.zone }}</strong> — {{ w.observation }} · {{ t('gemba.deadlineLabel') }} : {{ w.due_date }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-3">
      <div class="card-sm text-center">
        <div class="text-xl font-bold text-gray-900">{{ stats.total ?? 0 }}</div>
        <div class="text-xs text-gray-500">{{ t('gemba.total') }}</div>
      </div>
      <div class="card-sm text-center">
        <div class="text-xl font-bold text-amber-600">{{ (stats.open ?? 0) + (stats.in_progress ?? 0) }}</div>
        <div class="text-xs text-gray-500">{{ t('gemba.openInProgress') }}</div>
      </div>
      <div class="card-sm text-center">
        <div class="text-xl font-bold text-green-600">{{ stats.resolved ?? 0 }}</div>
        <div class="text-xs text-gray-500">{{ t('gemba.resolvedCount') }}</div>
      </div>
    </div>

    <!-- Filtres -->
    <div class="card-sm flex flex-wrap gap-3">
      <input v-model="filters.search" @input="debouncedLoad" :placeholder="t('gemba.searchPlaceholder')" class="input flex-1 min-w-48" />
      <select v-model="filters.status" @change="load" class="input w-36">
        <option value="">{{ t('gemba.allStatuses') }}</option>
        <option value="open">{{ t('status.open') }}</option>
        <option value="in_progress">{{ t('status.inProgress') }}</option>
        <option value="resolved">{{ t('status.resolved') }}</option>
      </select>
      <input v-model="filters.from" type="date" @change="load" class="input w-36" />
      <input v-model="filters.to"   type="date" @change="load" class="input w-36" />
      <button @click="resetFilters" class="btn-secondary text-xs">{{ t('common.reset') }}</button>
    </div>

    <!-- Table -->
    <DataTable :columns="columns" :rows="records" :loading="loading" :meta="meta" :empty-text="t('gemba.noRecords')" @page="loadPage">

      <template #cell-date="{ value }">
        <span class="text-sm font-medium">{{ value }}</span>
      </template>

      <template #cell-observation="{ value }">
        <p class="text-sm text-gray-700 line-clamp-2 max-w-xs">{{ value }}</p>
      </template>

      <template #cell-due_date="{ row, value }">
        <template v-if="value">
          <span v-if="(row as any).is_overdue && (row as any).status !== 'resolved'"
            class="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
            <ExclamationTriangleIcon class="w-3.5 h-3.5" /> {{ value }}
          </span>
          <span v-else-if="isDueSoon(value) && (row as any).status !== 'resolved'"
            class="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
            <ClockIcon class="w-3.5 h-3.5" /> {{ value }}
          </span>
          <span v-else class="text-sm text-gray-600">{{ value }}</span>
        </template>
        <span v-else class="text-gray-300 text-xs">—</span>
      </template>

      <template #cell-status="{ value }">
        <span :class="{
          'badge-open':     value === 'open',
          'badge-progress': value === 'in_progress',
          'badge-active':   value === 'resolved',
        }">{{ statusLabel[value] ?? value }}</span>
      </template>

      <template #cell-priority="{ value }">
        <span :class="{
          'text-red-600 font-semibold':   value === 'high',
          'text-amber-600 font-medium':   value === 'medium',
          'text-gray-400':                value === 'low',
        }">{{ priorityLabel[value] ?? value }}</span>
      </template>

      <template #cell-image="{ value }">
        <img v-if="value" :src="`/storage/${value}`"
          class="w-14 h-10 object-cover rounded-lg cursor-pointer hover:opacity-80"
          @click.stop="lightbox = `/storage/${value}`" />
        <span v-else class="text-gray-300 text-xs">—</span>
      </template>

      <template #actions="{ row }">
        <div class="flex gap-2 justify-end">
          <button @click="viewRow = row as any" class="btn-secondary text-xs py-1 px-2">{{ t('gemba.viewBtn') }}</button>
          <button v-if="auth.isAdmin" @click="editRow = row as any" class="btn-secondary text-xs py-1 px-2">{{ t('gemba.editBtn') }}</button>
          <button v-if="auth.isAdmin" @click="deleteRow(row as any)" class="text-red-500 hover:text-red-700 text-xs py-1 px-2">{{ t('gemba.deleteBtn') }}</button>
        </div>
      </template>
    </DataTable>

    <!-- Modal création / édition -->
    <GembaFormModal
      v-if="showForm || editRow"
      :gemba="editRow"
      @close="showForm = false; editRow = null"
      @saved="load"
    />

    <!-- Lightbox photo -->
    <div v-if="lightbox" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" @click="lightbox = null">
      <img :src="lightbox" class="max-w-full max-h-full rounded-xl shadow-2xl" />
    </div>

    <!-- Panneau détail -->
    <div v-if="viewRow" class="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div class="bg-white w-full max-w-lg h-full overflow-y-auto">

        <!-- Header panneau -->
        <div class="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <div>
            <h3 class="font-semibold text-gray-900">{{ t('gemba.detailTitle') }}</h3>
            <p class="text-xs text-gray-400">{{ viewRow.date }}</p>
          </div>
          <button @click="viewRow = null"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
        </div>

        <div class="p-6 space-y-5">

          <!-- En-tête session -->
          <div class="bg-slate-700 text-white rounded-xl p-4 space-y-2">
            <p class="text-xs font-bold uppercase tracking-wider text-slate-300">{{ t('gemba.sectionHeader') }}</p>
            <div class="grid grid-cols-2 gap-3 text-sm mt-2">
              <div>
                <span class="text-slate-400 text-xs">{{ t('gemba.columnDate') }}</span>
                <p class="font-medium">{{ viewRow.date }}</p>
              </div>
              <div>
                <span class="text-slate-400 text-xs">{{ t('gemba.zone') }}</span>
                <p class="font-medium">{{ viewRow.zone }}</p>
              </div>
              <div class="col-span-2">
                <span class="text-slate-400 text-xs">{{ t('gemba.auditor') }}</span>
                <p class="font-medium">{{ viewRow.auditor }}</p>
              </div>
            </div>
            <div v-if="viewRow.objective" class="pt-1 border-t border-slate-600">
              <span class="text-slate-400 text-xs">{{ t('gemba.objective') }}</span>
              <p class="text-sm mt-0.5 text-slate-200">{{ viewRow.objective }}</p>
            </div>
          </div>

          <!-- Action -->
          <div class="space-y-3">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t('gemba.sectionAction') }}</p>
            <p class="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{{ viewRow.observation }}</p>

            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-gray-400 text-xs block">{{ t('gemba.ownerLabel') }}</span>
                <span class="font-medium">{{ viewRow.responsible || '—' }}</span>
              </div>
              <div>
                <span class="text-gray-400 text-xs block">{{ t('gemba.deadlineLabel') }}</span>
                <span :class="viewRow.is_overdue ? 'text-red-600 font-semibold' : 'font-medium'">
                  {{ viewRow.due_date || '—' }}
                </span>
              </div>
              <div>
                <span class="text-gray-400 text-xs block">{{ t('gemba.statusLabel') }}</span>
                <span :class="{
                  'badge-open':     viewRow.status === 'open',
                  'badge-progress': viewRow.status === 'in_progress',
                  'badge-active':   viewRow.status === 'resolved',
                }">{{ statusLabel[viewRow.status] ?? viewRow.status }}</span>
              </div>
              <div>
                <span class="text-gray-400 text-xs block">{{ t('gemba.priorityLabel') }}</span>
                <span :class="{
                  'text-red-600 font-semibold':  viewRow.priority === 'high',
                  'text-amber-600 font-medium':  viewRow.priority === 'medium',
                  'text-gray-400':               viewRow.priority === 'low',
                }">{{ priorityLabel[viewRow.priority] ?? viewRow.priority }}</span>
              </div>
            </div>

            <div v-if="viewRow.action_required">
              <span class="text-gray-400 text-xs block mb-1">{{ t('gemba.actionRequired') }}</span>
              <p class="text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-lg p-3">{{ viewRow.action_required }}</p>
            </div>
          </div>

          <!-- Photo -->
          <div v-if="viewRow.image">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{{ t('gemba.photoLabel') }}</p>
            <img
              :src="`/storage/${viewRow.image}`"
              class="w-full rounded-xl object-cover max-h-64 cursor-pointer hover:opacity-90 transition-opacity"
              @click="lightbox = `/storage/${viewRow.image}`"
            />
          </div>

          <!-- Actions -->
          <div v-if="auth.isAdmin" class="flex gap-2 pt-2 border-t">
            <button @click="editRow = viewRow; viewRow = null" class="btn-secondary text-sm flex-1">{{ t('gemba.editBtn') }}</button>
            <button v-if="viewRow.status !== 'resolved'" @click="resolveRow(viewRow)" class="btn-primary text-sm flex-1">{{ t('gemba.resolveBtn') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { gembaApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import DataTable from '@/components/ui/DataTable.vue'
import GembaFormModal from './GembaFormModal.vue'
import { PlusIcon, XMarkIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/vue/24/outline'

const { t }   = useI18n()
const auth    = useAuthStore()
const toast   = useToast()
const records = ref<any[]>([])
const stats   = ref<any>({})
const loading = ref(false)
const meta    = ref<any>(null)
const showForm = ref(false)
const editRow  = ref<any>(null)
const viewRow  = ref<any>(null)
const lightbox = ref<string | null>(null)
const filters  = reactive({ search: '', status: '', from: '', to: '', page: 1 })

const statusLabel = computed<Record<string, string>>(() => ({
  open:        t('gemba.statusOpen'),
  in_progress: t('gemba.statusInProgress'),
  resolved:    t('gemba.statusResolved'),
}))
const priorityLabel = computed<Record<string, string>>(() => ({
  low:    t('gemba.priorityLow'),
  medium: t('gemba.priorityMedium'),
  high:   t('gemba.priorityHigh'),
}))

const today = new Date(new Date().toDateString())

function isDueSoon(date: string): boolean {
  if (!date) return false
  const d    = new Date(date)
  const diff = (d.getTime() - today.getTime()) / 86400000
  return diff >= 0 && diff <= 3
}

const overdueItems = computed(() =>
  records.value.filter(r => r.is_overdue && r.status !== 'resolved')
)
const dueSoonItems = computed(() =>
  records.value.filter(r => !r.is_overdue && r.status !== 'resolved' && r.due_date && isDueSoon(r.due_date))
)

const columns = computed(() => [
  { key: 'date',        label: t('gemba.columnDate') },
  { key: 'zone',        label: t('gemba.columnZone') },
  { key: 'auditor',     label: t('gemba.columnAuditor') },
  { key: 'observation', label: t('gemba.columnAction') },
  { key: 'responsible', label: t('gemba.columnOwner') },
  { key: 'due_date',    label: t('gemba.columnDeadline') },
  { key: 'status',      label: t('gemba.columnStatus') },
  { key: 'priority',    label: t('gemba.columnPriority') },
  { key: 'image',       label: t('gemba.columnPhoto') },
])

let timer: ReturnType<typeof setTimeout>
function debouncedLoad() { clearTimeout(timer); timer = setTimeout(load, 300) }

async function load() {
  loading.value = true
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    const [list, st] = await Promise.all([gembaApi.list(params), gembaApi.stats()])
    records.value = list.data.data
    meta.value    = list.data.meta
    stats.value   = st.data
  } finally {
    loading.value = false
  }
}

function loadPage(page: number) { filters.page = page; load() }
function resetFilters() { Object.assign(filters, { search: '', status: '', from: '', to: '', page: 1 }); load() }

async function resolveRow(row: any) {
  try {
    await gembaApi.resolve(row.id)
    toast.add({ severity: 'success', summary: t('gemba.markResolved'), life: 3000 })
    viewRow.value = null
    load()
  } catch {
    toast.add({ severity: 'error', summary: t('common.error'), life: 3000 })
  }
}

async function deleteRow(row: any) {
  if (!confirm(t('gemba.confirmDelete'))) return
  try {
    await gembaApi.destroy(row.id)
    toast.add({ severity: 'success', summary: t('gemba.recordDeleted'), life: 3000 })
    load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? t('common.error'), life: 4000 })
  }
}

onMounted(load)
</script>

<style scoped>
.badge-open     { @apply inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700; }
.badge-progress { @apply inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700; }
.badge-active   { @apply inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700; }
</style>
