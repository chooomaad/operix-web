<template>
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh]">
      <div class="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
        <div>
          <h3 class="font-semibold text-gray-900">{{ risk ? t('risks.edit') : t('risks.newAssessment') }}</h3>
          <p class="text-xs text-gray-400">{{ t('risks.assessment.' + form.assessment_type) }}</p>
        </div>
        <button @click="$emit('close')" type="button"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
      </div>

      <form @submit.prevent="submit" class="px-6 py-4 space-y-5 overflow-y-auto">
        <!-- ── Registre ── -->
        <div>
          <div class="sectlabel">{{ t('risks.sections.register') }}</div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">{{ t('risks.dateIdentification') }} *</label><input v-model="form.date_identification" type="date" class="input" required /></div>
            <div>
              <label class="label">{{ t('risks.assessmentType') }}</label>
              <select v-model="form.assessment_type" class="input">
                <option v-for="a in ASSESSMENT_TYPES" :key="a" :value="a">{{ t('risks.assessment.' + a) }}</option>
              </select>
            </div>
            <div><label class="label">{{ t('risks.location') }} *</label><input v-model="form.location" class="input" required :placeholder="t('risks.locationHint')" /></div>
            <div>
              <label class="label">{{ t('risks.department') }}</label>
              <select v-model="form.department_id" class="input">
                <option :value="null">{{ t('common.none') }}</option>
                <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
              </select>
            </div>
            <div><label class="label">{{ t('risks.activity') }}</label><input v-model="form.activity" class="input" :placeholder="t('risks.activityHint')" /></div>
            <div>
              <label class="label">{{ t('risks.category') }} *</label>
              <select v-model="form.category" class="input" required>
                <option value="" disabled>{{ t('common.select') }}</option>
                <option v-for="c in RISK_CATEGORIES" :key="c" :value="c">{{ t('risks.categories.' + c) }}</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 mt-3">
            <div><label class="label">{{ t('risks.danger') }} *</label><textarea v-model="form.danger" class="input" rows="2" required /></div>
            <div><label class="label">{{ t('risks.riskDescription') }} *</label><textarea v-model="form.risk_description" class="input" rows="2" required /></div>
            <div><label class="label">{{ t('risks.causes') }}</label><textarea v-model="form.causes" class="input" rows="2" /></div>
            <div><label class="label">{{ t('risks.consequences') }}</label><textarea v-model="form.consequences" class="input" rows="2" /></div>
            <div><label class="label">{{ t('risks.exposedPersons') }}</label><input v-model="form.exposed_persons" class="input" :placeholder="t('risks.exposedHint')" /></div>
            <div>
              <label class="label">{{ t('risks.owner') }}</label>
              <select v-model="form.owner_id" class="input">
                <option :value="null">{{ t('common.none') }}</option>
                <option v-for="u in assignees" :key="u.id" :value="u.id">{{ u.name }}</option>
              </select>
            </div>
          </div>
          <div class="mt-3"><label class="label">{{ t('risks.existingControls') }}</label><textarea v-model="form.existing_controls" class="input" rows="2" /></div>
        </div>

        <!-- ── Évaluation initiale (matrice) ── -->
        <div>
          <div class="sectlabel">{{ t('risks.sections.assessment') }}</div>
          <div class="flex flex-wrap items-center gap-6">
            <RiskMatrix v-model:probability="form.probability" v-model:severity="form.severity" />
            <div class="space-y-2">
              <div class="text-sm text-gray-600">{{ t('risks.probability') }} : <strong>{{ form.probability }}</strong></div>
              <div class="text-sm text-gray-600">{{ t('risks.severity') }} : <strong>{{ form.severity }}</strong></div>
              <div class="flex items-center gap-2 pt-1">
                <span class="text-sm text-gray-500">{{ t('risks.score') }}</span>
                <span class="text-2xl font-black tabular-nums" :class="ltext(initialLevel)">{{ initialScore }}</span>
                <span class="text-xs px-2 py-0.5 rounded-full font-semibold" :class="lc(initialLevel)">{{ t('risks.levels.' + initialLevel) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Mesures de contrôle (hiérarchie) ── -->
        <div>
          <div class="sectlabel flex items-center justify-between">
            <span>{{ t('risks.sections.controls') }}</span>
            <button type="button" @click="addControl" class="btn-secondary text-xs py-1 px-2"><PlusIcon class="w-3.5 h-3.5" /> {{ t('risks.addControl') }}</button>
          </div>
          <div v-if="!form.controls.length" class="text-xs text-gray-400 py-2">{{ t('risks.noControls') }}</div>
          <div v-for="(c, i) in form.controls" :key="i" class="flex gap-2 mb-2">
            <select v-model="c.hierarchy" class="input w-44">
              <option v-for="h in CONTROL_HIERARCHY" :key="h" :value="h">{{ t('risks.hierarchy.' + h) }}</option>
            </select>
            <input v-model="c.description" class="input flex-1" :placeholder="t('risks.controlDescription')" />
            <button type="button" @click="form.controls.splice(i,1)" class="btn-secondary text-xs px-2 !text-red-600"><XMarkIcon class="w-4 h-4" /></button>
          </div>
        </div>

        <!-- ── Risque résiduel ── -->
        <div>
          <div class="sectlabel">{{ t('risks.sections.residual') }}</div>
          <div class="flex flex-wrap items-end gap-4">
            <div><label class="label">{{ t('risks.residualProbability') }}</label>
              <select v-model.number="form.residual_probability" class="input w-28"><option :value="null">—</option><option v-for="n in 5" :key="n" :value="n">{{ n }}</option></select>
            </div>
            <div><label class="label">{{ t('risks.residualSeverity') }}</label>
              <select v-model.number="form.residual_severity" class="input w-28"><option :value="null">—</option><option v-for="n in 5" :key="n" :value="n">{{ n }}</option></select>
            </div>
            <div v-if="residualScore" class="flex items-center gap-2 pb-1">
              <span class="text-sm text-gray-500">{{ t('risks.residualScore') }}</span>
              <span class="text-xl font-black tabular-nums">{{ residualScore }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full font-semibold" :class="lc(residualLevel)">{{ t('risks.levels.' + residualLevel) }}</span>
            </div>
          </div>
          <p class="text-xs text-gray-400 mt-1">{{ t('risks.residualHint') }}</p>
        </div>

        <!-- ── Suivi ── -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">{{ t('risks.status') }}</label>
            <select v-model="form.status" class="input">
              <option v-for="s in RISK_STATUSES" :key="s" :value="s">{{ t('risks.statuses.' + s) }}</option>
            </select>
          </div>
          <div><label class="label">{{ t('risks.reviewDate') }}</label><input v-model="form.review_date" type="date" class="input" /></div>
        </div>

        <div class="flex justify-end gap-3 pt-1">
          <button type="button" @click="$emit('close')" class="btn-secondary">{{ t('common.cancel') }}</button>
          <button type="submit" :disabled="saving" class="btn-primary">{{ saving ? t('common.saving') : t('common.save') }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { risksApi, departmentsApi } from '@/api'
import RiskMatrix from '@/components/risk/RiskMatrix.vue'
import { RISK_CATEGORIES, ASSESSMENT_TYPES, CONTROL_HIERARCHY, RISK_STATUSES, levelForScore, levelClasses } from '@/constants/risk'
import { XMarkIcon, PlusIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{ risk?: any; assessmentType?: string }>()
const emit  = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()
const toast = useToast()

const departments = ref<any[]>([])
const assignees   = ref<any[]>([])
const saving      = ref(false)

const form = reactive<any>({
  date_identification: props.risk?.date_identification ?? new Date().toISOString().slice(0, 10),
  location: props.risk?.location ?? '',
  department_id: props.risk?.department_id ?? null,
  activity: props.risk?.activity ?? '',
  category: props.risk?.category ?? '',
  assessment_type: props.risk?.assessment_type ?? props.assessmentType ?? 'risk_assessment',
  danger: props.risk?.danger ?? '',
  risk_description: props.risk?.risk_description ?? '',
  causes: props.risk?.causes ?? '',
  consequences: props.risk?.consequences ?? '',
  exposed_persons: props.risk?.exposed_persons ?? '',
  existing_controls: props.risk?.existing_controls ?? '',
  owner_id: props.risk?.owner_id ?? null,
  probability: props.risk?.probability ?? 3,
  severity: props.risk?.severity ?? 3,
  controls: (props.risk?.controls ?? []).map((c: any) => ({ ...c })),
  residual_probability: props.risk?.residual_probability ?? null,
  residual_severity: props.risk?.residual_severity ?? null,
  status: props.risk?.status ?? 'open',
  review_date: props.risk?.review_date ?? '',
})

const lc = (level: string) => levelClasses(level).badge
const ltext = (level: string) => levelClasses(level).badge.split(' ').find(c => c.startsWith('text-')) ?? 'text-gray-700'
const initialScore  = computed(() => (form.probability || 0) * (form.severity || 0))
const initialLevel  = computed(() => levelForScore(initialScore.value))
const residualScore = computed(() => (form.residual_probability && form.residual_severity) ? form.residual_probability * form.residual_severity : 0)
const residualLevel = computed(() => residualScore.value ? levelForScore(residualScore.value) : 'low')

function addControl() { form.controls.push({ hierarchy: 'engineering', description: '' }) }

async function submit() {
  saving.value = true
  try {
    const payload = { ...form }
    payload.controls = form.controls.filter((c: any) => c.description?.trim())
    if (props.risk) await risksApi.update(props.risk.id, payload)
    else await risksApi.create(payload)
    toast.add({ severity: 'success', summary: props.risk ? t('risks.updated') : t('risks.created'), life: 3000 })
    emit('saved'); emit('close')
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? t('common.error'), life: 4000 })
  } finally { saving.value = false }
}

onMounted(async () => {
  try {
    const [d, a] = await Promise.all([departmentsApi.list(), risksApi.assignees()])
    departments.value = d.data?.data ?? d.data ?? []
    assignees.value = a.data ?? []
  } catch { /* listes optionnelles */ }
})
</script>

<style scoped>
.sectlabel{ font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#0e6e73; margin-bottom:8px; }
</style>
