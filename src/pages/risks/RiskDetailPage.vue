<template>
  <div class="p-6 space-y-6" v-if="risk">
    <!-- Header -->
    <div class="flex items-start gap-4 flex-wrap">
      <button @click="$router.back()" class="text-gray-400 hover:text-gray-600 p-1 mt-1"><ArrowLeftIcon class="w-5 h-5" /></button>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-mono text-xs text-gray-500">{{ risk.reference }}</span>
          <span class="text-xs px-2 py-0.5 rounded-full font-semibold" :class="levelClasses(risk.level).badge">{{ risk.score }} · {{ t('risks.levels.' + risk.level) }}</span>
          <span :class="`badge-${risk.status === 'closed' ? 'closed' : 'open'}`">{{ t('risks.statuses.' + risk.status) }}</span>
          <span class="badge-gray text-xs">{{ t('risks.assessment.' + risk.assessment_type) }}</span>
        </div>
        <h2 class="text-xl font-bold text-gray-900 mt-1">{{ risk.risk_description }}</h2>
        <p class="text-sm text-gray-500">{{ t('risks.categories.' + risk.category) }} · {{ risk.location }}<span v-if="risk.department"> · {{ risk.department.name }}</span></p>
      </div>
      <div class="flex gap-2 flex-shrink-0">
        <button v-if="auth.can('risks.update')" @click="showEdit = true" class="btn-secondary text-sm"><PencilIcon class="w-4 h-4" /> {{ t('common.edit') }}</button>
        <button v-if="auth.can('risks.delete')" @click="remove" class="btn-secondary text-sm !text-red-600">{{ t('common.delete') }}</button>
      </div>
    </div>

    <!-- Évaluation : matrice + résiduel -->
    <div class="grid md:grid-cols-2 gap-4">
      <div class="card">
        <div class="sectlabel">{{ t('risks.sections.assessment') }}</div>
        <div class="flex items-center gap-6 flex-wrap">
          <RiskMatrix :probability="risk.probability" :severity="risk.severity" readonly />
          <div class="space-y-2 text-sm">
            <div>{{ t('risks.initialRisk') }} : <strong class="text-lg" :class="ltext(risk.level)">{{ risk.score }}</strong> <span class="text-xs px-2 py-0.5 rounded-full" :class="levelClasses(risk.level).badge">{{ t('risks.levels.' + risk.level) }}</span></div>
            <div v-if="risk.residual_score">{{ t('risks.residualRisk') }} : <strong class="text-lg" :class="ltext(risk.residual_level)">{{ risk.residual_score }}</strong> <span class="text-xs px-2 py-0.5 rounded-full" :class="levelClasses(risk.residual_level).badge">{{ t('risks.levels.' + risk.residual_level) }}</span></div>
            <div v-if="risk.review_date" class="text-gray-500">{{ t('risks.reviewDate') }} : {{ risk.review_date }}</div>
            <div v-if="risk.owner" class="text-gray-500">{{ t('risks.owner') }} : {{ risk.owner.name }}</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="sectlabel">{{ t('risks.sections.controls') }}</div>
        <div v-if="risk.controls?.length" class="space-y-1.5">
          <div v-for="(c, i) in risk.controls" :key="i" class="flex items-start gap-2 text-sm">
            <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 whitespace-nowrap mt-0.5">{{ t('risks.hierarchy.' + c.hierarchy) }}</span>
            <span class="text-gray-700">{{ c.description }}</span>
          </div>
        </div>
        <div v-else class="text-sm text-gray-400">{{ t('risks.noControls') }}</div>
        <div v-if="risk.existing_controls" class="mt-3 pt-3 border-t">
          <div class="text-xs text-gray-400 mb-1">{{ t('risks.existingControls') }}</div>
          <p class="text-sm text-gray-600">{{ risk.existing_controls }}</p>
        </div>
      </div>
    </div>

    <!-- Détails -->
    <div class="card grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
      <div><div class="text-gray-400 text-xs mb-0.5">{{ t('risks.danger') }}</div><div>{{ risk.danger }}</div></div>
      <div><div class="text-gray-400 text-xs mb-0.5">{{ t('risks.causes') }}</div><div>{{ risk.causes ?? '—' }}</div></div>
      <div><div class="text-gray-400 text-xs mb-0.5">{{ t('risks.consequences') }}</div><div>{{ risk.consequences ?? '—' }}</div></div>
      <div><div class="text-gray-400 text-xs mb-0.5">{{ t('risks.activity') }}</div><div>{{ risk.activity ?? '—' }}</div></div>
      <div><div class="text-gray-400 text-xs mb-0.5">{{ t('risks.exposedPersons') }}</div><div>{{ risk.exposed_persons ?? '—' }}</div></div>
      <div><div class="text-gray-400 text-xs mb-0.5">{{ t('risks.dateIdentification') }}</div><div>{{ risk.date_identification }}</div></div>
    </div>

    <!-- Plan d'action -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-semibold text-gray-900">{{ t('risks.actionPlan') }} <span class="text-sm text-gray-400">({{ actions.length }})</span></h3>
        <button v-if="auth.can('risks.update')" @click="openAction()" class="btn-primary text-sm"><PlusIcon class="w-4 h-4" /> {{ t('risks.addAction') }}</button>
      </div>
      <div v-if="actions.length" class="space-y-2">
        <div v-for="a in actions" :key="a.id" class="card-sm flex items-start gap-3">
          <span class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" :class="a.status==='done' ? 'bg-green-500' : a.is_overdue ? 'bg-red-500' : 'bg-amber-400'"></span>
          <div class="flex-1 min-w-0">
            <div class="text-sm text-gray-900">{{ a.description }}</div>
            <div class="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
              <span>{{ t('risks.actionStatus.' + a.status) }}</span>
              <span class="font-medium" :class="`text-${a.priority==='high'?'red':a.priority==='medium'?'amber':'gray'}-600`">{{ t('risks.priorities.' + a.priority) }}</span>
              <span v-if="a.due_date" :class="a.is_overdue ? 'text-red-600 font-semibold' : ''">{{ t('risks.dueDate') }}: {{ a.due_date }}<span v-if="a.is_overdue"> · {{ t('risks.overdue') }}</span></span>
              <span v-if="a.responsible">{{ a.responsible.name }}</span>
              <span v-if="a.budget">{{ a.budget }} MRU</span>
              <a v-if="a.proof_url" :href="a.proof_url" target="_blank" rel="noopener" class="text-brand-600 underline">{{ t('risks.proof') }}</a>
              <span v-if="a.validator" class="text-green-600">✓ {{ t('risks.validatedBy') }} {{ a.validator.name }}</span>
            </div>
          </div>
          <div class="flex gap-1.5 flex-shrink-0">
            <button v-if="auth.can('risks.validate') && !a.validated_at" @click="validate(a)" class="btn-secondary text-xs py-1 px-2 !text-green-700">{{ t('risks.validate') }}</button>
            <button v-if="auth.can('risks.update')" @click="openAction(a)" class="btn-secondary text-xs py-1 px-2">{{ t('common.edit') }}</button>
            <button v-if="auth.can('risks.update')" @click="removeAction(a)" class="btn-secondary text-xs py-1 px-2 !text-red-600">{{ t('common.delete') }}</button>
          </div>
        </div>
      </div>
      <div v-else class="card text-center py-8 text-gray-400 text-sm">{{ t('risks.noActions') }}</div>
    </div>

    <RiskFormModal v-if="showEdit" :risk="risk" @close="showEdit = false" @saved="reload" />

    <!-- Modal action -->
    <div v-if="showActionForm" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div class="flex items-center justify-between px-6 py-4 border-b">
          <h3 class="font-semibold text-gray-900">{{ editingAction ? t('common.edit') : t('risks.addAction') }}</h3>
          <button @click="showActionForm = false"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
        </div>
        <form @submit.prevent="saveAction" class="px-6 py-4 space-y-3 overflow-y-auto">
          <div><label class="label">{{ t('risks.actionDescription') }} *</label><textarea v-model="actionForm.description" class="input" rows="2" required /></div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">{{ t('risks.actionType') }}</label>
              <select v-model="actionForm.type" class="input"><option :value="null">—</option><option value="corrective">{{ t('risks.corrective') }}</option><option value="preventive">{{ t('risks.preventive') }}</option></select>
            </div>
            <div>
              <label class="label">{{ t('risks.responsible') }}</label>
              <select v-model="actionForm.responsible_id" class="input"><option :value="null">{{ t('common.none') }}</option><option v-for="u in assignees" :key="u.id" :value="u.id">{{ u.name }}</option></select>
            </div>
            <div><label class="label">{{ t('risks.dueDate') }}</label><input v-model="actionForm.due_date" type="date" class="input" /></div>
            <div>
              <label class="label">{{ t('risks.priority') }}</label>
              <select v-model="actionForm.priority" class="input"><option v-for="p in ACTION_PRIORITIES" :key="p" :value="p">{{ t('risks.priorities.' + p) }}</option></select>
            </div>
            <div>
              <label class="label">{{ t('risks.status') }}</label>
              <select v-model="actionForm.status" class="input"><option v-for="s in ACTION_STATUSES" :key="s" :value="s">{{ t('risks.actionStatus.' + s) }}</option></select>
            </div>
            <div><label class="label">{{ t('risks.budget') }}</label><input v-model="actionForm.budget" type="number" min="0" step="0.01" class="input" /></div>
          </div>
          <div><label class="label">{{ t('risks.proof') }}</label><input type="file" accept="image/*,application/pdf" @change="actionFile = ($event.target as HTMLInputElement).files?.[0] ?? null" class="input text-sm" /></div>
          <div class="flex justify-end gap-3 pt-1">
            <button type="button" @click="showActionForm = false" class="btn-secondary">{{ t('common.cancel') }}</button>
            <button type="submit" :disabled="savingAction" class="btn-primary">{{ savingAction ? t('common.saving') : t('common.save') }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
  <div v-else class="flex items-center justify-center h-64"><div class="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div></div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { risksApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import RiskMatrix from '@/components/risk/RiskMatrix.vue'
import RiskFormModal from './RiskFormModal.vue'
import { objectToFormData } from '@/utils/eventForm'
import { levelClasses, ACTION_PRIORITIES, ACTION_STATUSES } from '@/constants/risk'
import { ArrowLeftIcon, PencilIcon, PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const route = useRoute(); const router = useRouter()
const { t } = useI18n(); const auth = useAuthStore(); const toast = useToast()

const id = Number(route.params.id)
const risk = ref<any>(null)
const actions = ref<any[]>([])
const assignees = ref<any[]>([])
const showEdit = ref(false)

const ltext = (lv: string) => levelClasses(lv).badge.split(' ').find(c => c.startsWith('text-')) ?? 'text-gray-700'

// Action plan
const showActionForm = ref(false); const savingAction = ref(false)
const editingAction = ref<any>(null); const actionFile = ref<File | null>(null)
const actionForm = reactive<any>({ description: '', type: null, responsible_id: null, due_date: '', priority: 'medium', status: 'todo', budget: '' })

function openAction(a?: any) {
  editingAction.value = a ?? null
  actionFile.value = null
  Object.assign(actionForm, a
    ? { description: a.description, type: a.type, responsible_id: a.responsible_id, due_date: a.due_date ?? '', priority: a.priority, status: a.status, budget: a.budget ?? '' }
    : { description: '', type: null, responsible_id: null, due_date: '', priority: 'medium', status: 'todo', budget: '' })
  showActionForm.value = true
}

async function saveAction() {
  savingAction.value = true
  try {
    const base: Record<string, unknown> = { ...actionForm }
    if (actionFile.value) base.proof = actionFile.value
    const payload = actionFile.value ? objectToFormData(base) : base
    if (editingAction.value) await risksApi.updateAction(id, editingAction.value.id, payload)
    else await risksApi.addAction(id, payload)
    toast.add({ severity: 'success', summary: t('common.save'), life: 2500 })
    showActionForm.value = false
    await loadActions()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? t('common.error'), life: 4000 })
  } finally { savingAction.value = false }
}

async function validate(a: any) {
  try { await risksApi.validateAction(id, a.id); await loadActions() }
  catch (e: any) { toast.add({ severity: 'error', summary: e.response?.data?.message ?? t('common.error'), life: 4000 }) }
}
async function removeAction(a: any) {
  if (!confirm(t('common.delete') + ' ?')) return
  try { await risksApi.deleteAction(id, a.id); await loadActions() }
  catch (e: any) { toast.add({ severity: 'error', summary: e.response?.data?.message ?? t('common.error'), life: 4000 }) }
}
async function remove() {
  if (!confirm(t('risks.confirmDelete'))) return
  try { await risksApi.destroy(id); router.push('/risks') }
  catch (e: any) { toast.add({ severity: 'error', summary: e.response?.data?.message ?? t('common.error'), life: 4000 }) }
}

async function loadActions() {
  const { data } = await risksApi.actions(id)
  actions.value = data ?? []
}
async function reload() { const { data } = await risksApi.show(id); risk.value = data; actions.value = data.actions ?? actions.value }

onMounted(async () => {
  try {
    const [r, a] = await Promise.all([risksApi.show(id), risksApi.assignees()])
    risk.value = r.data; actions.value = r.data.actions ?? []
    assignees.value = a.data ?? []
  } catch { router.push('/risks') }
})
</script>

<style scoped>
.sectlabel{ font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#0e6e73; margin-bottom:10px; }
</style>
