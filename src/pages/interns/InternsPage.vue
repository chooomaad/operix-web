<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">{{ t('interns.title') }}</h2>
        <p class="text-sm text-gray-500">{{ meta?.total ?? 0 }} · {{ t('interns.subtitle') }}</p>
      </div>
      <button v-if="auth.can('employees.manage')" @click="openCreate" class="btn-primary text-sm">
        <PlusIcon class="w-4 h-4" /> {{ t('interns.add') }}
      </button>
    </div>

    <div class="card-sm">
      <input v-model="search" @input="debouncedLoad" :placeholder="t('interns.searchPlaceholder')" class="input" />
    </div>

    <LoadErrorBanner v-if="loadError" :loading="loading" @retry="load" />

    <DataTable :columns="columns" :rows="rows" :loading="loading" :meta="meta" :empty-text="t('interns.empty')" @page="loadPage">
      <template #cell-status="{ value }">
        <span :class="value === 'ended' ? 'badge-inactive' : 'badge-active'" class="text-xs">
          {{ value === 'ended' ? t('interns.status.ended') : t('interns.status.active') }}
        </span>
      </template>
      <template #actions="{ row }">
        <div class="flex justify-end gap-2" v-if="auth.can('employees.manage')">
          <button @click="openEdit(row as any)" class="btn-secondary text-xs py-1 px-2">{{ t('common.edit') }}</button>
          <button @click="remove(row as any)" class="btn-secondary text-xs py-1 px-2 !text-red-600">{{ t('common.delete') }}</button>
        </div>
      </template>
    </DataTable>

    <!-- Modal create/edit -->
    <div v-if="showForm" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div class="flex items-center justify-between px-6 py-4 border-b">
          <h3 class="font-semibold text-gray-900">{{ editing ? t('common.edit') : t('interns.add') }}</h3>
          <button @click="showForm = false"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
        </div>
        <form @submit.prevent="save" class="px-6 py-4 space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">{{ t('interns.form.firstName') }} *</label><input v-model="form.prenom" class="input" required /></div>
            <div><label class="label">{{ t('interns.form.lastName') }} *</label><input v-model="form.nom" class="input" required /></div>
          </div>
          <div><label class="label">{{ t('interns.form.school') }}</label><input v-model="form.etablissement" class="input" /></div>
          <div><label class="label">{{ t('interns.form.supervisor') }}</label><input v-model="form.encadrant" class="input" /></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">{{ t('interns.form.phone') }}</label><input v-model="form.phone" class="input" /></div>
            <div><label class="label">{{ t('interns.form.email') }}</label><input v-model="form.email" type="email" class="input" /></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">{{ t('interns.form.start') }}</label><input v-model="form.date_debut" type="date" class="input" /></div>
            <div><label class="label">{{ t('interns.form.end') }}</label><input v-model="form.date_fin" type="date" class="input" /></div>
          </div>
          <div>
            <label class="label">{{ t('interns.form.status') }}</label>
            <select v-model="form.status" class="input">
              <option value="active">{{ t('interns.status.active') }}</option>
              <option value="ended">{{ t('interns.status.ended') }}</option>
            </select>
          </div>
          <div class="flex justify-end gap-3 pt-1">
            <button type="button" @click="showForm = false" class="btn-secondary">{{ t('common.cancel') }}</button>
            <button type="submit" :disabled="saving" class="btn-primary">{{ saving ? t('common.saving') : t('common.save') }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { internsApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import DataTable from '@/components/ui/DataTable.vue'
import LoadErrorBanner from '@/components/ui/LoadErrorBanner.vue'
import { PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const auth = useAuthStore()
const toast = useToast()

const rows = ref<any[]>([])
const meta = ref<any>(null)
const loading = ref(false)
const loadError = ref(false)
const search = ref('')
const page = ref(1)

const showForm = ref(false)
const saving = ref(false)
const editing = ref<number | null>(null)
const form = reactive<any>({ nom: '', prenom: '', etablissement: '', encadrant: '', phone: '', email: '', date_debut: '', date_fin: '', status: 'active' })

const columns = computed(() => [
  { key: 'reference', label: t('interns.cols.reference') },
  { key: 'full_name', label: t('interns.cols.name') },
  { key: 'etablissement', label: t('interns.cols.school') },
  { key: 'status', label: t('interns.cols.status') },
])

let timer: ReturnType<typeof setTimeout>
function debouncedLoad() { clearTimeout(timer); timer = setTimeout(() => { page.value = 1; load() }, 300) }
function loadPage(p: number) { page.value = p; load() }

async function load() {
  loading.value = true; loadError.value = false
  try {
    const { data } = await internsApi.list({ search: search.value || undefined, page: page.value })
    rows.value = data.data ?? []; meta.value = data.meta ?? null
  } catch { loadError.value = true } finally { loading.value = false }
}

function openCreate() {
  editing.value = null
  Object.assign(form, { nom: '', prenom: '', etablissement: '', encadrant: '', phone: '', email: '', date_debut: '', date_fin: '', status: 'active' })
  showForm.value = true
}
function openEdit(row: any) {
  editing.value = row.id
  Object.assign(form, { nom: row.nom, prenom: row.prenom, etablissement: row.etablissement ?? '', encadrant: row.encadrant ?? '', phone: row.phone ?? '', email: row.email ?? '', date_debut: row.date_debut ?? '', date_fin: row.date_fin ?? '', status: row.status ?? 'active' })
  showForm.value = true
}

async function save() {
  saving.value = true
  try {
    const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''))
    if (editing.value) await internsApi.update(editing.value, payload)
    else await internsApi.create(payload)
    toast.add({ severity: 'success', summary: editing.value ? t('interns.updated') : t('interns.added'), life: 3000 })
    showForm.value = false
    await load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? t('common.error'), life: 4000 })
  } finally { saving.value = false }
}

async function remove(row: any) {
  if (!confirm(t('interns.confirmDelete'))) return
  try {
    await internsApi.destroy(row.id)
    toast.add({ severity: 'success', summary: t('interns.deleted'), life: 3000 })
    await load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? t('common.error'), life: 4000 })
  }
}

onMounted(load)
</script>
