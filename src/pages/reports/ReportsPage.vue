<template>
  <div class="p-6 space-y-6">
    <div>
      <h2 class="text-lg font-semibold text-gray-900">{{ t('reports.title') }}</h2>
      <p class="text-sm text-gray-500">{{ t('reports.subtitle') }}</p>
    </div>

    <!-- Reports grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

      <!-- Dashboard report -->
      <div class="card space-y-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
            <ChartBarIcon class="w-5 h-5 text-brand-600" />
          </div>
          <div><h3 class="font-semibold text-gray-900">{{ t('reports.dashboard') }}</h3><p class="text-xs text-gray-500">{{ t('reports.dashboardDesc') }}</p></div>
        </div>
        <div class="pt-1">
          <label class="text-xs text-gray-500 mb-1 block">{{ t('reports.year') }}</label>
          <select v-model="dashFilters.year" class="input text-xs py-1">
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
        <button @click="download('dashboard', dashFilters)" :disabled="busy.dashboard" class="btn-primary w-full text-sm">
          <DocumentArrowDownIcon class="w-4 h-4" /> {{ busy.dashboard ? t('reports.generating') : t('reports.pdfDashboard') }}
        </button>
      </div>

      <!-- Incidents -->
      <div class="card space-y-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <ExclamationTriangleIcon class="w-5 h-5 text-red-600" />
          </div>
          <div><h3 class="font-semibold text-gray-900">{{ t('reports.incidents') }}</h3><p class="text-xs text-gray-500">{{ t('reports.incidentsDesc') }}</p></div>
        </div>
        <div class="grid grid-cols-2 gap-2 pt-1">
          <div><label class="text-xs text-gray-500 mb-1 block">{{ t('reports.from') }}</label><input v-model="incFilters.from" type="date" class="input text-xs py-1" /></div>
          <div><label class="text-xs text-gray-500 mb-1 block">{{ t('reports.to') }}</label><input v-model="incFilters.to" type="date" class="input text-xs py-1" /></div>
        </div>
        <div class="flex gap-2">
          <button @click="download('incidents', incFilters)" :disabled="busy.incidents" class="btn-primary flex-1 text-sm">
            <DocumentArrowDownIcon class="w-4 h-4" /> {{ busy.incidents ? t('reports.generating') : t('reports.pdf') }}
          </button>
          <button @click="exportXlsx('incidents', incFilters)" :disabled="busy.incidents_xlsx" class="btn-secondary flex-1 text-sm">
            <ArrowDownTrayIcon class="w-4 h-4" /> {{ busy.incidents_xlsx ? t('reports.generating') : t('reports.excel') }}
          </button>
        </div>
      </div>

      <!-- Near Miss -->
      <div class="card space-y-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <BellAlertIcon class="w-5 h-5 text-amber-600" />
          </div>
          <div><h3 class="font-semibold text-gray-900">{{ t('reports.nearMiss') }}</h3><p class="text-xs text-gray-500">{{ t('reports.nearMissDesc') }}</p></div>
        </div>
        <div class="grid grid-cols-2 gap-2 pt-1">
          <div><label class="text-xs text-gray-500 mb-1 block">{{ t('reports.from') }}</label><input v-model="nmFilters.from" type="date" class="input text-xs py-1" /></div>
          <div><label class="text-xs text-gray-500 mb-1 block">{{ t('reports.to') }}</label><input v-model="nmFilters.to" type="date" class="input text-xs py-1" /></div>
        </div>
        <div class="flex gap-2">
          <button @click="download('nearMiss', nmFilters)" :disabled="busy.nearMiss" class="btn-primary flex-1 text-sm"><DocumentArrowDownIcon class="w-4 h-4" /> {{ t('reports.pdf') }}</button>
          <button @click="exportXlsx('nearMiss', nmFilters)" :disabled="busy.nearMiss_xlsx" class="btn-secondary flex-1 text-sm"><ArrowDownTrayIcon class="w-4 h-4" /> {{ t('reports.excel') }}</button>
        </div>
      </div>

      <!-- Breaches -->
      <div class="card space-y-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <ShieldExclamationIcon class="w-5 h-5 text-orange-600" />
          </div>
          <div><h3 class="font-semibold text-gray-900">{{ t('reports.breaches') }}</h3><p class="text-xs text-gray-500">{{ t('reports.breachesDesc') }}</p></div>
        </div>
        <div class="grid grid-cols-2 gap-2 pt-1">
          <div><label class="text-xs text-gray-500 mb-1 block">{{ t('reports.from') }}</label><input v-model="brFilters.from" type="date" class="input text-xs py-1" /></div>
          <div><label class="text-xs text-gray-500 mb-1 block">{{ t('reports.to') }}</label><input v-model="brFilters.to" type="date" class="input text-xs py-1" /></div>
        </div>
        <div class="flex gap-2">
          <button @click="download('breaches', brFilters)" :disabled="busy.breaches" class="btn-primary flex-1 text-sm"><DocumentArrowDownIcon class="w-4 h-4" /> {{ t('reports.pdf') }}</button>
          <button @click="exportXlsx('breaches', brFilters)" :disabled="busy.breaches_xlsx" class="btn-secondary flex-1 text-sm"><ArrowDownTrayIcon class="w-4 h-4" /> {{ t('reports.excel') }}</button>
        </div>
      </div>

      <!-- Environment -->
      <div class="card space-y-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <GlobeAltIcon class="w-5 h-5 text-green-600" />
          </div>
          <div><h3 class="font-semibold text-gray-900">{{ t('reports.environment') }}</h3><p class="text-xs text-gray-500">{{ t('reports.environmentDesc') }}</p></div>
        </div>
        <div class="grid grid-cols-2 gap-2 pt-1">
          <div><label class="text-xs text-gray-500 mb-1 block">{{ t('reports.from') }}</label><input v-model="envFilters.from" type="date" class="input text-xs py-1" /></div>
          <div><label class="text-xs text-gray-500 mb-1 block">{{ t('reports.to') }}</label><input v-model="envFilters.to" type="date" class="input text-xs py-1" /></div>
        </div>
        <div class="flex gap-2">
          <button @click="download('environment', envFilters)" :disabled="busy.environment" class="btn-primary flex-1 text-sm"><DocumentArrowDownIcon class="w-4 h-4" /> {{ t('reports.pdf') }}</button>
          <button @click="exportXlsx('environment', envFilters)" :disabled="busy.environment_xlsx" class="btn-secondary flex-1 text-sm"><ArrowDownTrayIcon class="w-4 h-4" /> {{ t('reports.excel') }}</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { reportsApi, exportsApi } from '@/api'
import { useDownload } from '@/composables/useDownload'
import { availableYears } from '@/utils/years'
import {
  ChartBarIcon, ExclamationTriangleIcon, BellAlertIcon, ShieldExclamationIcon,
  GlobeAltIcon, DocumentArrowDownIcon, ArrowDownTrayIcon
} from '@heroicons/vue/24/outline'

const { t } = useI18n()
const { downloadPdf, downloadExcel } = useDownload()

const busy: Record<string, boolean> = reactive({})

const currentYear = new Date().getFullYear()
const years = availableYears()

const dashFilters = reactive({ year: currentYear })
const incFilters  = reactive({ from: '', to: '' })
const nmFilters   = reactive({ from: '', to: '' })
const brFilters   = reactive({ from: '', to: '' })
const envFilters  = reactive({ from: '', to: '' })

type ReportKey = 'dashboard' | 'incidents' | 'nearMiss' | 'breaches' | 'environment' | 'employees'
type ExportKey = 'incidents' | 'nearMiss' | 'breaches' | 'environment' | 'employees' | 'certifications' | 'medicalVisits'

const reportFns: Record<ReportKey, (p: any) => Promise<any>> = {
  dashboard:   (p) => reportsApi.dashboard(p),
  incidents:   (p) => reportsApi.incidents(p),
  nearMiss:    (p) => reportsApi.nearMiss(p),
  breaches:    (p) => reportsApi.breaches(p),
  environment: (p) => reportsApi.environment(p),
  employees:   (p) => reportsApi.employees(p),
}

const exportFns: Record<ExportKey, (p: any) => Promise<any>> = {
  incidents:     (p) => exportsApi.incidents(p),
  nearMiss:      (p) => exportsApi.nearMiss(p),
  breaches:      (p) => exportsApi.breaches(p),
  environment:   (p) => exportsApi.environment(p),
  employees:     (p) => exportsApi.employees(p),
  certifications:(p) => exportsApi.certifications(p),
  medicalVisits: (p) => exportsApi.medicalVisits(p),
}

async function download(key: ReportKey, params: any) {
  busy[key] = true
  try { await downloadPdf(() => reportFns[key](params), `${key}.pdf`) }
  finally { busy[key] = false }
}

async function exportXlsx(key: ExportKey, params: any) {
  const bKey = `${key}_xlsx`
  busy[bKey] = true
  try { await downloadExcel(() => exportFns[key](params), `${key}.xlsx`) }
  finally { busy[bKey] = false }
}
</script>
