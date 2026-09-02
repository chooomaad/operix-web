<template>
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">

      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h3 class="font-semibold text-gray-900">{{ t('import.title') }} — {{ moduleLabel }}</h3>
          <p class="text-xs text-gray-400 mt-0.5">XLSX, XLS, CSV</p>
        </div>
        <div class="flex items-center gap-2">
          <!-- Download template (employees only) -->
          <button
            v-if="props.module === 'employees'"
            @click="downloadTemplate"
            :disabled="templateLoading"
            class="btn-secondary text-xs flex items-center gap-1.5"
            :title="t('import.downloadTemplate')"
          >
            <ArrowDownTrayIcon class="w-3.5 h-3.5" />
            {{ templateLoading ? '...' : t('import.downloadTemplate') }}
          </button>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 p-1">
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>
      </div>

      <div class="p-6 space-y-4 overflow-y-auto flex-1">
        <!-- Drop zone -->
        <div
          class="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer"
          :class="isDragging ? 'border-brand-400 bg-brand-50' : 'border-gray-300 hover:border-brand-400'"
          @click="fileInput?.click()"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="onDrop"
        >
          <CloudArrowUpIcon class="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p class="text-sm text-gray-600">
            {{ t('import.dragDrop') }} <span class="text-brand-600 font-medium">{{ t('import.browse') }}</span>
          </p>
          <p class="text-xs text-gray-400 mt-1">{{ t('import.formats') }}</p>
          <input ref="fileInput" type="file" class="hidden" accept=".xlsx,.xls,.csv" @change="onFileSelect" />
        </div>

        <!-- Selected file -->
        <div v-if="selectedFile" class="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
          <DocumentIcon class="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span class="flex-1 truncate">{{ selectedFile.name }}</span>
          <span class="text-gray-400 text-xs">{{ (selectedFile.size / 1024).toFixed(0) }} KB</span>
          <button @click="clearFile" class="text-gray-400 hover:text-red-500 transition-colors ml-2">
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>

        <!-- Preview -->
        <template v-if="preview">
          <div class="flex items-center gap-4 text-sm py-1">
            <span class="text-green-600 font-semibold flex items-center gap-1">
              <CheckCircleIcon class="w-4 h-4" /> {{ preview.valid }} {{ t('import.valid') }}
            </span>
            <span v-if="preview.invalid > 0" class="text-red-600 font-semibold flex items-center gap-1">
              <ExclamationCircleIcon class="w-4 h-4" /> {{ preview.invalid }} {{ t('import.errors') }}
            </span>
            <span class="text-gray-400 text-xs ml-auto">{{ t('import.totalLines', { n: preview.total }) }}</span>
          </div>

          <!-- Error list -->
          <div v-if="preview.errors?.length" class="bg-red-50 border border-red-200 rounded-lg p-3 max-h-28 overflow-y-auto">
            <p v-for="err in preview.errors.slice(0, 20)" :key="err" class="text-xs text-red-700 py-0.5">{{ err }}</p>
            <p v-if="preview.errors.length > 20" class="text-xs text-red-500 font-medium mt-1">
              {{ t('import.moreErrors', { n: preview.errors.length - 20 }) }}
            </p>
          </div>

          <!-- Data preview table -->
          <div class="overflow-auto rounded-lg border border-gray-200 max-h-52">
            <table class="w-full text-xs">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                  <th class="px-3 py-2 text-left text-gray-500 w-8">#</th>
                  <th v-for="(val, key) in preview.preview?.[0]?.data" :key="key" class="px-3 py-2 text-left text-gray-500 whitespace-nowrap">{{ key }}</th>
                  <th class="px-3 py-2 text-left text-gray-500 w-28">{{ t('import.statusLabel') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in preview.preview?.slice(0, 30)"
                  :key="row.row"
                  :class="row.valid ? 'bg-white hover:bg-gray-50' : 'bg-red-50'"
                >
                  <td class="px-3 py-1.5 text-gray-400 border-b border-gray-100">{{ row.row }}</td>
                  <td v-for="(val, key) in row.data" :key="key" class="px-3 py-1.5 border-b border-gray-100 max-w-[160px] truncate">{{ val }}</td>
                  <td class="px-3 py-1.5 border-b border-gray-100">
                    <span v-if="row.valid" class="text-green-600 font-medium">✓</span>
                    <span v-else class="text-red-600 text-[11px]">{{ row.errors?.join('; ') }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>

      <!-- Footer always visible at bottom -->
      <div class="flex justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
        <button @click="$emit('close')" class="btn-secondary">{{ t('common.cancel') }}</button>

        <button
          v-if="!preview"
          @click="doPreview"
          :disabled="!selectedFile || loading"
          class="btn-secondary"
        >
          <span v-if="loading" class="flex items-center gap-1.5">
            <span class="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
            {{ t('import.analyzing') }}
          </span>
          <span v-else>{{ t('import.preview') }}</span>
        </button>

        <button
          v-if="preview"
          @click="resetPreview"
          class="btn-secondary"
        >{{ t('import.changeFile') }}</button>

        <button
          v-if="preview && preview.valid > 0"
          @click="doImport"
          :disabled="loading"
          class="btn-primary"
        >
          <span v-if="loading" class="flex items-center gap-1.5">
            <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            {{ t('import.importing') }}
          </span>
          <span v-else>{{ t('import.importLines', { n: preview.valid }) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { importsApi, exportsApi } from '@/api'
import { useDownload } from '@/composables/useDownload'
import {
  XMarkIcon, CloudArrowUpIcon, DocumentIcon,
  ArrowDownTrayIcon, CheckCircleIcon, ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps<{ module: string }>()
const emit  = defineEmits<{ close: []; imported: [] }>()

const { t }  = useI18n()
const toast  = useToast()
const { downloadExcel } = useDownload()

const moduleLabel = computed(() => t(`import.modules.${props.module}`, props.module))

const fileInput      = ref<HTMLInputElement>()
const selectedFile   = ref<File | null>(null)
const preview        = ref<any>(null)
const loading        = ref(false)
const templateLoading = ref(false)
const isDragging     = ref(false)

function onFileSelect(e: Event) {
  selectedFile.value = (e.target as HTMLInputElement).files?.[0] ?? null
  preview.value = null
}

function onDrop(e: DragEvent) {
  isDragging.value   = false
  selectedFile.value = e.dataTransfer?.files?.[0] ?? null
  preview.value      = null
}

function clearFile() {
  selectedFile.value = null
  preview.value      = null
  if (fileInput.value) fileInput.value.value = ''
}

function resetPreview() {
  preview.value      = null
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

async function downloadTemplate() {
  templateLoading.value = true
  try {
    await downloadExcel(() => exportsApi.template(), 'modele-import-employes.xlsx')
  } catch {
    toast.add({ severity: 'error', summary: 'Erreur téléchargement modèle', life: 3000 })
  } finally {
    templateLoading.value = false
  }
}

async function doPreview() {
  if (!selectedFile.value) return
  loading.value = true
  try {
    const previewFns: Record<string, (f: File) => Promise<any>> = {
      employees: importsApi.previewEmployees, interns: importsApi.previewInterns,
      visitors: importsApi.previewVisitors, contractors: importsApi.previewContractors,
      incidents: importsApi.previewIncidents,
    }
    const fn = previewFns[props.module] ?? importsApi.previewIncidents
    const { data } = await fn(selectedFile.value)
    preview.value = data
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? 'Erreur lecture fichier', life: 4000 })
  } finally {
    loading.value = false
  }
}

async function doImport() {
  if (!selectedFile.value) return
  loading.value = true
  try {
    const importFns: Record<string, (f: File) => Promise<any>> = {
      employees: importsApi.importEmployees, interns: importsApi.importInterns,
      visitors: importsApi.importVisitors, contractors: importsApi.importContractors,
      incidents: importsApi.importIncidents,
    }
    const fn = importFns[props.module] ?? importsApi.importIncidents
    const { data } = await fn(selectedFile.value)
    toast.add({ severity: 'success', summary: data.message, detail: data.errors?.length ? `${data.errors.length} ligne(s) ignorée(s)` : undefined, life: 5000 })
    emit('imported')
    emit('close')
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? 'Erreur import', life: 4000 })
  } finally {
    loading.value = false
  }
}
</script>
