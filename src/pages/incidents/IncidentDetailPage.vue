<template>
  <div class="p-6 space-y-6" v-if="incident">
    <div class="flex items-center gap-3">
      <button @click="$router.back()" class="text-gray-400 hover:text-gray-600"><ArrowLeftIcon class="w-5 h-5" /></button>
      <div class="flex-1">
        <h2 class="text-lg font-bold text-gray-900">{{ incident.reference }}</h2>
        <div class="flex items-center gap-2 mt-1">
          <span :class="`badge-${incident.severity}`">{{ incident.severity }}</span>
          <span :class="`badge-${incident.status}`">{{ incident.status }}</span>
          <span class="text-sm text-gray-500">{{ incident.date }}</span>
        </div>
      </div>
      <button @click="exportPdf" class="btn-secondary text-sm"><DocumentArrowDownIcon class="w-4 h-4" /> PDF</button>
    </div>

    <div class="card grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div><span class="text-gray-500 block">{{ t('incidents.detail.location') }}</span><strong>{{ incident.location }}</strong></div>
      <div><span class="text-gray-500 block">{{ t('incidents.detail.time') }}</span><strong>{{ incident.time ?? '—' }}</strong></div>
      <div><span class="text-gray-500 block">{{ t('incidents.detail.type') }}</span><strong>{{ incident.type }}</strong></div>
      <div><span class="text-gray-500 block">{{ t('incidents.detail.reportedBy') }}</span><strong>{{ incident.reported_by?.name ?? '—' }}</strong></div>
    </div>

    <div class="card space-y-4 text-sm">
      <div><h4 class="font-semibold text-gray-700 mb-1">{{ t('incidents.detail.description') }}</h4><p class="text-gray-600 leading-relaxed">{{ incident.description }}</p></div>
      <div v-if="incident.immediate_cause"><h4 class="font-semibold text-gray-700 mb-1">{{ t('incidents.detail.immediateCause') }}</h4><p class="text-gray-600">{{ incident.immediate_cause }}</p></div>
      <div v-if="incident.root_cause"><h4 class="font-semibold text-gray-700 mb-1">{{ t('incidents.detail.rootCause') }}</h4><p class="text-gray-600">{{ incident.root_cause }}</p></div>
      <div v-if="incident.corrective_action"><h4 class="font-semibold text-gray-700 mb-1">{{ t('incidents.detail.correctiveAction') }}</h4><p class="text-gray-600">{{ incident.corrective_action }}</p><p v-if="incident.corrective_action_due" class="text-xs text-gray-400 mt-1">{{ t('incidents.detail.deadline') }} : {{ incident.corrective_action_due }}</p></div>
      <div v-if="incident.closure_report_url">
        <a :href="incident.closure_report_url" target="_blank" rel="noopener" class="btn-secondary text-sm inline-flex items-center gap-1.5"><DocumentArrowDownIcon class="w-4 h-4" /> {{ t('incidents.detail.closureReport') }}</a>
      </div>
    </div>

    <!-- Close action -->
    <div v-if="auth.isAdmin && incident.status === 'open'" class="card border-amber-200 bg-amber-50">
      <h4 class="font-semibold text-amber-800 mb-3">{{ t('incidents.detail.closeTitle') }}</h4>
      <div class="space-y-3">
        <div><label class="label">{{ t('incidents.detail.rootCause') }} *</label><textarea v-model="closeForm.root_cause" class="input" rows="2" /></div>
        <div><label class="label">{{ t('incidents.detail.correctiveAction') }} *</label><textarea v-model="closeForm.corrective_action" class="input" rows="2" /></div>
        <div>
          <label class="label">{{ t('incidents.detail.closureReport') }} * <span class="text-xs font-normal text-gray-400">({{ t('reportFile.hint') }})</span></label>
          <input type="file" accept="application/pdf" @change="closeFile = ($event.target as HTMLInputElement).files?.[0] ?? null" class="input text-sm" />
        </div>
        <button @click="closeIncident" :disabled="!closeForm.root_cause || !closeForm.corrective_action || !closeFile || closing" class="btn-primary">{{ closing ? t('common.saving') : t('incidents.detail.closeBtn') }}</button>
      </div>
    </div>
  </div>
  <div v-else class="p-6 text-center text-gray-500">{{ t('common.loading') }}</div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { incidentsApi, reportsApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useDownload } from '@/composables/useDownload'
import { ArrowLeftIcon, DocumentArrowDownIcon } from '@heroicons/vue/24/outline'

const { t }  = useI18n()
const route  = useRoute()
const auth   = useAuthStore()
const toast  = useToast()
const { downloadPdf } = useDownload()
const incident  = ref<any>(null)
const closeForm = reactive({ root_cause: '', corrective_action: '' })
const closeFile = ref<File | null>(null)
const closing   = ref(false)

async function exportPdf() {
  await downloadPdf(() => reportsApi.incidentDetail(Number(route.params.id)), `${incident.value?.reference}.pdf`)
}

async function closeIncident() {
  if (!closeForm.root_cause || !closeForm.corrective_action || !closeFile.value) return
  closing.value = true
  try {
    const fd = new FormData()
    fd.append('root_cause', closeForm.root_cause)
    fd.append('corrective_action', closeForm.corrective_action)
    fd.append('report_file', closeFile.value)
    const { data } = await incidentsApi.close(Number(route.params.id), fd)
    incident.value = data
    toast.add({ severity: 'success', summary: t('incidents.closed_msg'), life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? t('common.error'), life: 4000 })
  } finally { closing.value = false }
}

onMounted(async () => {
  const { data } = await incidentsApi.show(Number(route.params.id))
  incident.value = data
})
</script>
