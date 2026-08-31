<template>
  <div class="p-6 space-y-4">
    <div>
      <h2 class="text-lg font-semibold text-gray-900">{{ t('audit.title') }}</h2>
      <p class="text-sm text-gray-500">{{ meta?.total ?? 0 }} {{ t('audit.entries') }}</p>
    </div>

    <div class="card-sm flex flex-wrap gap-3">
      <input v-model="filters.search" @input="debouncedLoad" :placeholder="t('audit.searchPlaceholder')" class="input flex-1 min-w-48" />
      <select v-model="filters.verb" @change="load" class="input w-40">
        <option value="">{{ t('audit.allActions') }}</option>
        <option value="created">{{ t('audit.verb.created') }}</option>
        <option value="updated">{{ t('audit.verb.updated') }}</option>
        <option value="deleted">{{ t('audit.verb.deleted') }}</option>
        <option value="closed">{{ t('audit.verb.closed') }}</option>
        <option value="approved">{{ t('audit.verb.approved') }}</option>
      </select>
      <input v-model="filters.from" type="date" @change="load" class="input w-36" />
      <input v-model="filters.to"   type="date" @change="load" class="input w-36" />
      <button @click="resetFilters" class="btn-secondary text-xs">{{ t('common.reset') }}</button>
    </div>

    <DataTable :columns="columns" :rows="records" :loading="loading" :meta="meta" :empty-text="t('audit.empty')" @page="loadPage">
      <template #cell-action="{ value }">
        <span :class="actionClass(value)" class="badge text-xs">{{ actionLabel(value) }}</span>
      </template>
      <template #cell-model_type="{ value }">
        <span class="text-xs text-gray-600">{{ modelLabel(value) }}</span>
      </template>
      <template #cell-user="{ row }">
        <span class="text-xs">{{ (row as any).user?.name ?? '—' }}</span>
      </template>
      <template #actions="{ row }">
        <button @click="viewRow = row as any" class="btn-secondary text-xs py-1 px-2">{{ t('audit.detail') }}</button>
      </template>
    </DataTable>

    <!-- Detail panel -->
    <div v-if="viewRow" class="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div class="bg-white w-full max-w-lg h-full overflow-y-auto p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">{{ t('audit.detailTitle') }}</h3>
          <button @click="viewRow = null"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><span class="text-gray-500 block">{{ t('audit.colAction') }}</span><span :class="actionClass(viewRow.action)" class="badge text-xs">{{ actionLabel(viewRow.action) }}</span></div>
          <div><span class="text-gray-500 block">{{ t('audit.colModel') }}</span><strong>{{ modelLabel(viewRow.model_type) }} #{{ viewRow.model_id }}</strong></div>
          <div><span class="text-gray-500 block">{{ t('audit.colUser') }}</span><strong>{{ viewRow.user?.name ?? '—' }}</strong></div>
          <div><span class="text-gray-500 block">{{ t('audit.colIp') }}</span><strong class="font-mono">{{ viewRow.ip_address ?? '—' }}</strong></div>
          <div class="col-span-2"><span class="text-gray-500 block">{{ t('audit.colDate') }}</span><strong>{{ formatDate(viewRow.created_at) }}</strong></div>
        </div>
        <div v-if="viewRow.old_values" class="space-y-1">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">{{ t('audit.oldValues') }}</p>
          <pre class="text-xs bg-gray-50 rounded p-3 overflow-x-auto">{{ JSON.stringify(viewRow.old_values, null, 2) }}</pre>
        </div>
        <div v-if="viewRow.new_values" class="space-y-1">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">{{ t('audit.newValues') }}</p>
          <pre class="text-xs bg-gray-50 rounded p-3 overflow-x-auto">{{ JSON.stringify(viewRow.new_values, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getLocale } from '@/i18n'
import { auditApi } from '@/api'
import DataTable from '@/components/ui/DataTable.vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const { t, te } = useI18n()

const records  = ref<any[]>([])
const loading  = ref(false)
const meta     = ref<any>(null)
const viewRow  = ref<any>(null)
const filters  = reactive({ search: '', verb: '', from: '', to: '', page: 1 })

const columns = computed(() => [
  { key: 'created_at', label: t('audit.colDate') },
  { key: 'action',     label: t('audit.colAction') },
  { key: 'model_type', label: t('audit.colModel') },
  { key: 'model_id',   label: t('audit.colId') },
  { key: 'user',       label: t('audit.colUser') },
  { key: 'ip_address', label: t('audit.colIp') },
])

// Verbes connus, ranges du plus long au plus court pour un decoupage sans ambiguite.
const VERBS = ['created', 'updated', 'deleted', 'uploaded', 'approved', 'closed', 'excel', 'pdf', 'run']

/**
 * Transforme « incident_created » en « Incident créé » (ou « Incident created »).
 * On isole le verbe en suffixe, le reste est le modele — chacun est traduit ; une
 * cle absente retombe sur le texte brut plutot que de disparaitre.
 */
function actionLabel(action: string): string {
  if (!action) return '—'
  for (const v of VERBS) {
    if (action.endsWith('_' + v)) {
      const model = action.slice(0, -(v.length + 1))
      const mLabel = te(`audit.model.${model}`) ? t(`audit.model.${model}`) : model
      const vLabel = te(`audit.verb.${v}`) ? t(`audit.verb.${v}`) : v
      return `${mLabel} ${vLabel}`
    }
  }
  // Actions simples (login, logout…) ou inconnues.
  return te(`audit.action.${action}`) ? t(`audit.action.${action}`) : action
}

function actionClass(action: string): string {
  const verb = VERBS.find((v) => action?.endsWith('_' + v)) ?? action
  const map: Record<string, string> = {
    created: 'bg-green-100 text-green-800', updated: 'bg-blue-100 text-blue-800',
    deleted: 'bg-red-100 text-red-800', closed: 'bg-orange-100 text-orange-800',
    approved: 'bg-teal-100 text-teal-800', login: 'bg-purple-100 text-purple-800',
    logout: 'bg-gray-100 text-gray-700', pdf: 'bg-amber-100 text-amber-800',
    excel: 'bg-amber-100 text-amber-800',
  }
  return `px-2 py-0.5 rounded-full font-medium ${map[verb] ?? 'bg-gray-100 text-gray-700'}`
}

function modelLabel(type: string): string {
  const base = (type ?? '').split('\\').pop() ?? type
  const key = `audit.modelType.${base}`
  return te(key) ? t(key) : base
}

function formatDate(d: string): string {
  return d ? new Date(d).toLocaleString(getLocale() === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '—'
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
function resetFilters() { Object.assign(filters, { search: '', verb: '', from: '', to: '', page: 1 }); load() }
onMounted(load)
</script>
