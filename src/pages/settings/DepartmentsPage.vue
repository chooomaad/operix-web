<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">{{ t('departments.title') }}</h2>
        <p class="text-sm text-gray-500">{{ departments.length }} {{ t('departments.count') }}</p>
      </div>
      <button v-if="auth.isAdmin" @click="showForm = true" class="btn-primary text-sm"><PlusIcon class="w-4 h-4" /> {{ t('departments.newBtn') }}</button>
    </div>

    <div v-if="loading" class="text-center py-10 text-gray-400">{{ t('departments.loading') }}</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="dept in departments" :key="dept.id" class="card flex items-center justify-between">
        <div>
          <p class="font-medium text-gray-900">{{ dept.name }}</p>
          <p class="text-sm text-gray-500">{{ dept.employees_count ?? 0 }} {{ t('departments.employeesCount') }}</p>
        </div>
        <div class="flex gap-1" v-if="auth.isAdmin">
          <button @click="editRow = dept" class="text-gray-400 hover:text-gray-600 p-1"><PencilIcon class="w-4 h-4" /></button>
          <button @click="deleteRow(dept)" class="text-gray-400 hover:text-red-600 p-1"><TrashIcon class="w-4 h-4" /></button>
        </div>
      </div>
    </div>

    <!-- Form modal inline -->
    <div v-if="showForm || editRow" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div class="flex items-center justify-between p-5 border-b">
          <h3 class="font-semibold">{{ editRow ? t('departments.editTitle') : t('departments.newTitle') }}</h3>
          <button @click="showForm=false; editRow=null"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
        </div>
        <form @submit.prevent="submit" class="p-5 space-y-4">
          <div><label class="label">{{ t('departments.name') }} *</label><input v-model="formName" class="input" required /></div>
          <div><label class="label">{{ t('departments.description') }}</label><input v-model="formDesc" class="input" /></div>
          <div class="flex justify-end gap-3">
            <button type="button" @click="showForm=false; editRow=null" class="btn-secondary">{{ t('common.cancel') }}</button>
            <button type="submit" :disabled="saving" class="btn-primary">{{ saving ? t('common.saving') : t('common.save') }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { departmentsApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const { t }       = useI18n()
const auth        = useAuthStore()
const toast       = useToast()
const departments = ref<any[]>([])
const loading     = ref(false)
const saving      = ref(false)
const showForm    = ref(false)
const editRow     = ref<any>(null)
const formName    = ref('')
const formDesc    = ref('')

async function load() {
  loading.value = true
  try { const { data } = await departmentsApi.list(); departments.value = data }
  finally { loading.value = false }
}

async function submit() {
  saving.value = true
  try {
    if (editRow.value) await departmentsApi.update(editRow.value.id, { name: formName.value, description: formDesc.value })
    else await departmentsApi.create({ name: formName.value, description: formDesc.value })
    toast.add({ severity: 'success', summary: editRow.value ? t('departments.updated') : t('departments.created'), life: 3000 })
    showForm.value = false; editRow.value = null; formName.value = ''; formDesc.value = ''
    load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? t('common.error'), life: 4000 })
  } finally { saving.value = false }
}

async function deleteRow(dept: any) {
  if (!confirm(t('departments.confirmDelete', { name: dept.name }))) return
  try { await departmentsApi.delete(dept.id); load() }
  catch (e: any) { toast.add({ severity: 'error', summary: e.response?.data?.message ?? t('common.error'), life: 4000 }) }
}

onMounted(load)
</script>
