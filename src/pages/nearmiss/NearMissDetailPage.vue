<template>
  <div class="p-6 space-y-6" v-if="record">
    <div class="flex items-center gap-3">
      <button @click="$router.back()" class="text-gray-400 hover:text-gray-600"><ArrowLeftIcon class="w-5 h-5" /></button>
      <div class="flex-1">
        <h2 class="text-lg font-bold text-gray-900">{{ record.reference }}</h2>
        <div class="flex items-center gap-2 mt-1">
          <span :class="`badge-${record.severity}`">{{ t(`severity.${record.severity}`) }}</span>
          <span :class="`badge-${record.status}`">{{ t(`status.${record.status}`) }}</span>
          <span class="text-sm text-gray-500">{{ record.date }}</span>
        </div>
      </div>
    </div>

    <div class="card grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
      <div><span class="text-gray-500 block">{{ t('nearMiss.detail.location') }}</span><strong>{{ record.location }}</strong></div>
      <div><span class="text-gray-500 block">{{ t('nearMiss.detail.time') }}</span><strong>{{ record.time ?? '—' }}</strong></div>
      <div><span class="text-gray-500 block">{{ t('nearMiss.detail.reportedBy') }}</span><strong>{{ record.reporter?.name ?? '—' }}</strong></div>
    </div>

    <div class="card space-y-4 text-sm">
      <div>
        <h4 class="font-semibold text-gray-700 mb-1">{{ t('nearMiss.detail.description') }}</h4>
        <p class="text-gray-600 leading-relaxed">{{ record.description }}</p>
      </div>
      <div v-if="record.potential_consequence">
        <h4 class="font-semibold text-gray-700 mb-1">{{ t('nearMiss.detail.potentialConsequence') }}</h4>
        <p class="text-gray-600">{{ record.potential_consequence }}</p>
      </div>
      <div v-if="record.corrective_action">
        <h4 class="font-semibold text-gray-700 mb-1">{{ t('nearMiss.detail.correctiveAction') }}</h4>
        <p class="text-gray-600">{{ record.corrective_action }}</p>
      </div>
    </div>

    <div v-if="auth.isAdmin && record.status === 'open'" class="card border-amber-200 bg-amber-50">
      <h4 class="font-semibold text-amber-800 mb-3">{{ t('nearMiss.detail.closeTitle') }}</h4>
      <div class="space-y-3">
        <div><label class="label">{{ t('nearMiss.detail.correctiveAction') }} *</label><textarea v-model="closeForm.corrective_action" class="input" rows="2" /></div>
        <button @click="close" :disabled="!closeForm.corrective_action || closing" class="btn-primary">
          {{ closing ? t('nearMiss.detail.processing') : t('nearMiss.detail.closeBtn') }}
        </button>
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
import { nearMissApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const { t }  = useI18n()
const route  = useRoute()
const auth   = useAuthStore()
const toast  = useToast()
const record = ref<any>(null)
const closing = ref(false)
const closeForm = reactive({ corrective_action: '' })

async function close() {
  closing.value = true
  try {
    await nearMissApi.close(Number(route.params.id), closeForm)
    toast.add({ severity: 'success', summary: t('nearMiss.detail.closeTitle'), life: 3000 })
    record.value.status = 'closed'
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? t('common.error'), life: 4000 })
  } finally { closing.value = false }
}

onMounted(async () => {
  const { data } = await nearMissApi.show(Number(route.params.id))
  record.value = data
})
</script>
