<template>
  <div class="p-6 space-y-6" v-if="person">
    <!-- Header -->
    <div class="flex items-center gap-4 flex-wrap">
      <button @click="$router.back()" class="text-gray-400 hover:text-gray-600 p-1"><ArrowLeftIcon class="w-5 h-5" /></button>
      <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0" :class="avatarClass">{{ initials }}</div>
      <div class="flex-1 min-w-0">
        <h2 class="text-xl font-bold text-gray-900">{{ person.full_name }}</h2>
        <div class="flex items-center gap-2 mt-1 flex-wrap text-sm">
          <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" :class="typeClass">
            <span class="w-1.5 h-1.5 rounded-full" :class="dotClass"></span>{{ t('people.types.' + type) }}
          </span>
          <span class="font-mono text-gray-500">{{ person.identifier }}</span>
          <span v-if="person.company" class="text-gray-400">· {{ person.company }}</span>
          <span :class="person.status === 'active' ? 'badge-active' : 'badge-inactive'">
            {{ person.status === 'active' ? t('interns.status.active') : t('interns.status.ended') }}
          </span>
        </div>
      </div>
      <button @click="exportPdf" :disabled="downloading" class="btn-secondary text-sm flex items-center gap-1.5">
        <DocumentArrowDownIcon class="w-4 h-4" /> {{ downloading ? t('common.saving') : 'PDF' }}
      </button>
    </div>

    <!-- KPI -->
    <div class="grid grid-cols-3 sm:grid-cols-6 gap-3">
      <div class="card-sm text-center"><div class="text-2xl font-black text-red-600">{{ counts.incidents }}</div><div class="text-xs text-gray-500 mt-0.5">{{ t('nav.incidents') }}</div></div>
      <div class="card-sm text-center"><div class="text-2xl font-black text-orange-500">{{ counts.near_miss }}</div><div class="text-xs text-gray-500 mt-0.5">{{ t('nav.nearMiss') }}</div></div>
      <div class="card-sm text-center"><div class="text-2xl font-black text-amber-500">{{ counts.breaches }}</div><div class="text-xs text-gray-500 mt-0.5">{{ t('nav.breaches') }}</div></div>
      <div class="card-sm text-center"><div class="text-2xl font-black text-teal-600">{{ counts.environment }}</div><div class="text-xs text-gray-500 mt-0.5">{{ t('nav.environment') }}</div></div>
      <div class="card-sm text-center"><div class="text-2xl font-black text-blue-600">{{ formations.length }}</div><div class="text-xs text-gray-500 mt-0.5">{{ t('profile.kpi.formations') }}</div></div>
      <div class="card-sm text-center"><div class="text-2xl font-black text-green-600">{{ certifications.length }}</div><div class="text-xs text-gray-500 mt-0.5">{{ t('profile.kpi.certifications') }}</div></div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200 flex items-end justify-between gap-2">
      <nav class="flex gap-1 overflow-x-auto">
        <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
          :class="['px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap flex items-center gap-1.5',
            activeTab === tab.key ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700']">
          <span>{{ tab.label }}</span>
          <span :class="['text-xs rounded-full px-1.5 py-0.5 font-semibold', (tab.alert && tab.count>0) ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500']">{{ tab.count }}</span>
        </button>
      </nav>
      <button v-if="activeRecord && auth.can('employees.manage')" @click="openAdd" class="btn-primary text-sm flex items-center gap-1.5 mb-1 flex-shrink-0">
        <PlusIcon class="w-4 h-4" /> {{ t('profile.add') }}
      </button>
    </div>

    <!-- HSSE event lists -->
    <div v-for="tab in hsseTabs" :key="tab.key + '-l'">
      <div v-if="activeTab === tab.key">
        <div v-if="tab.rows.length" class="space-y-2">
          <RouterLink v-for="ev in tab.rows" :key="ev.id" :to="tab.link + ev.id" class="card-sm flex items-center gap-4 hover:bg-gray-50">
            <span :class="severityClass(ev.severity)" class="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">{{ (ev.severity||'').toUpperCase() || '—' }}</span>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 text-sm">{{ ev.reference }}<span v-if="ev.location"> — {{ ev.location }}</span></div>
              <div class="text-xs text-gray-500 truncate">{{ ev.description }}</div>
            </div>
            <div class="text-right flex-shrink-0"><div class="text-xs text-gray-500">{{ ev.date }}</div><span class="text-xs" :class="ev.status==='closed'?'text-green-600':'text-amber-600'">{{ ev.status }}</span></div>
          </RouterLink>
        </div>
        <div v-else class="card text-center py-10 text-gray-400 text-sm">{{ t('common.noData') }}</div>
      </div>
    </div>

    <!-- HR record lists -->
    <div v-if="activeRecord">
      <div v-if="records.length" class="space-y-2">
        <div v-for="r in records" :key="r.id" class="card-sm flex items-center gap-4">
          <a v-if="r.image_url && activeTab !== 'epi'" :href="r.image_url" target="_blank" rel="noopener"><img :src="r.image_url" class="w-10 h-10 object-cover rounded border" /></a>
          <div class="flex-1 min-w-0">
            <template v-if="activeTab==='epi'">
              <div class="font-medium text-gray-900 text-sm truncate">{{ ppeLabels(r.items, 'itemsList') }}</div>
              <div class="text-xs text-gray-500 truncate">
                {{ ppeLabels(r.categories, 'categories') }} · ×{{ r.quantity }}
                <span v-if="r.condition">· {{ t('profile.epi.conditions.' + r.condition) }}</span>
                <span v-if="r.issued_at">· {{ r.issued_at }}</span>
              </div>
            </template>
            <template v-else>
              <div class="font-medium text-gray-900 text-sm">{{ r.titre || r.type || r.date }}</div>
              <div class="text-xs text-gray-500">{{ r.organisme || r.medecin || r.etablissement || '' }}<span v-if="r.date_debut"> · {{ r.date_debut }}</span><span v-if="r.date_obtention"> · {{ r.date_obtention }}</span><span v-if="r.date"> · {{ r.date }}</span></div>
            </template>
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <button v-if="activeTab==='epi'" @click="viewPpe = r" class="btn-secondary text-xs py-1 px-2">{{ t('common.view') }}</button>
            <button v-if="auth.can('employees.manage')" @click="removeRecord(r)" class="btn-secondary text-xs py-1 px-2 !text-red-600">{{ t('common.delete') }}</button>
          </div>
        </div>
      </div>
      <div v-else class="card text-center py-10 text-gray-400 text-sm">{{ t('common.noData') }}</div>
    </div>

    <!-- Add record modal -->
    <div v-if="showAdd" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div class="flex items-center justify-between px-6 py-4 border-b">
          <h3 class="font-semibold text-gray-900">{{ t('profile.add') }}</h3>
          <button @click="showAdd=false"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
        </div>
        <form @submit.prevent="saveRecord" class="px-6 py-4 space-y-3">
          <!-- Formation -->
          <template v-if="activeTab==='formations'">
            <div><label class="label">{{ t('profile.formations.title') }} *</label><input v-model="form.titre" class="input" required /></div>
            <div><label class="label">{{ t('profile.formations.organism') }}</label><input v-model="form.organisme" class="input" /></div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="label">{{ t('profile.formations.startDate') }} *</label><input v-model="form.date_debut" type="date" class="input" required /></div>
              <div><label class="label">{{ t('profile.formations.endDate') }}</label><input v-model="form.date_fin" type="date" class="input" /></div>
            </div>
          </template>
          <!-- Certification -->
          <template v-else-if="activeTab==='certifications'">
            <div><label class="label">{{ t('profile.certifications.title') }} *</label><input v-model="form.titre" class="input" required /></div>
            <div><label class="label">{{ t('profile.certifications.organism') }}</label><input v-model="form.organisme" class="input" /></div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="label">{{ t('profile.certifications.issueDate') }} *</label><input v-model="form.date_obtention" type="date" class="input" required /></div>
              <div><label class="label">{{ t('profile.certifications.expiryDate') }}</label><input v-model="form.date_expiration" type="date" class="input" /></div>
            </div>
          </template>
          <!-- Medical -->
          <template v-else-if="activeTab==='medical-visits'">
            <div><label class="label">{{ t('profile.medical.date') }} *</label><input v-model="form.date" type="date" class="input" required /></div>
            <div><label class="label">{{ t('profile.medical.doctor') }}</label><input v-model="form.medecin" class="input" /></div>
            <div>
              <label class="label">{{ t('profile.medical.result') }}</label>
              <select v-model="form.resultat" class="input">
                <option value="apte">{{ t('profile.medical.results.apte') }}</option>
                <option value="apte_restrictions">{{ t('profile.medical.results.apte_restriction') }}</option>
                <option value="inapte">{{ t('profile.medical.results.inapte') }}</option>
              </select>
            </div>
          </template>
          <div>
            <label class="label">{{ t('profile.attachment') }}</label>
            <input type="file" accept="image/*" @change="imageFile = ($event.target as HTMLInputElement).files?.[0] ?? null" class="input text-sm" />
          </div>
          <div class="flex justify-end gap-3 pt-1">
            <button type="button" @click="showAdd=false" class="btn-secondary">{{ t('common.cancel') }}</button>
            <button type="submit" :disabled="saving" class="btn-primary">{{ saving ? t('common.saving') : t('common.save') }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modals EPI (employés uniquement) -->
    <PpeFormModal v-if="showPpeForm" :person-type="type" :person-id="idParam" @close="showPpeForm=false" @saved="loadRecords" />
    <PpeViewModal v-if="viewPpe" :record="viewPpe" @close="viewPpe=null" />
  </div>

  <div v-else class="flex items-center justify-center h-64"><div class="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div></div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { peopleApi, reportsApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useDownload } from '@/composables/useDownload'
import PpeFormModal from '@/components/ppe/PpeFormModal.vue'
import PpeViewModal from '@/components/ppe/PpeViewModal.vue'
import { ArrowLeftIcon, DocumentArrowDownIcon, PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const { t } = useI18n()
const auth = useAuthStore()
const toast = useToast()
const { downloadPdf } = useDownload()

const type = computed(() => String(route.params.type))
const idParam = computed(() => Number(route.params.id))

const person = ref<any>(null)
const counts = reactive({ incidents: 0, near_miss: 0, breaches: 0, environment: 0 })
const incidents = ref<any[]>([]); const nearMiss = ref<any[]>([]); const breaches = ref<any[]>([]); const environment = ref<any[]>([])
const formations = ref<any[]>([]); const certifications = ref<any[]>([]); const medical = ref<any[]>([]); const epi = ref<any[]>([])
const activeTab = ref('incidents')
const downloading = ref(false)

const hsseTabs = computed(() => [
  { key: 'incidents', label: t('nav.incidents'), count: incidents.value.length, rows: incidents.value, link: '/incidents/', alert: true },
  { key: 'near_miss', label: t('nav.nearMiss'), count: nearMiss.value.length, rows: nearMiss.value, link: '/near-miss/', alert: true },
  { key: 'breaches', label: t('nav.breaches'), count: breaches.value.length, rows: breaches.value, link: '/breaches/', alert: true },
  { key: 'environment', label: t('nav.environment'), count: environment.value.length, rows: environment.value, link: '/environment/', alert: true },
])
const recordTabs = computed(() => {
  const base = [
    { key: 'formations', label: t('profile.kpi.formations'), count: formations.value.length, alert: false },
    { key: 'certifications', label: t('profile.kpi.certifications'), count: certifications.value.length, alert: false },
    { key: 'medical-visits', label: t('profile.kpi.medical'), count: medical.value.length, alert: false },
  ]
  // La dotation EPI est réservée aux employés.
  if (type.value === 'employee') {
    base.push({ key: 'epi', label: t('profile.kpi.epi'), count: epi.value.length, alert: false })
  }
  return base
})
const tabs = computed(() => [...hsseTabs.value, ...recordTabs.value])
const activeRecord = computed(() => ['formations', 'certifications', 'medical-visits', 'epi'].includes(activeTab.value) ? activeTab.value : null)
const records = computed(() => ({ formations: formations.value, certifications: certifications.value, 'medical-visits': medical.value, epi: epi.value }[activeTab.value] ?? []))

const initials = computed(() => (person.value?.full_name || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase())
const avatarClass = computed(() => ({ employee: 'bg-blue-100 text-blue-600', contractor: 'bg-amber-100 text-amber-600', visitor: 'bg-sky-100 text-sky-600', intern: 'bg-violet-100 text-violet-600' }[type.value] ?? 'bg-brand-100 text-brand-600'))
const typeClass = computed(() => ({ employee: 'bg-blue-50 text-blue-700', contractor: 'bg-amber-50 text-amber-700', visitor: 'bg-sky-50 text-sky-700', intern: 'bg-violet-50 text-violet-700' }[type.value] ?? 'bg-gray-100 text-gray-600'))
const dotClass = computed(() => ({ employee: 'bg-blue-500', contractor: 'bg-amber-500', visitor: 'bg-sky-500', intern: 'bg-violet-500' }[type.value] ?? 'bg-gray-400'))
function severityClass(s: string) { return ({ low: 'bg-green-100 text-green-700', medium: 'bg-amber-100 text-amber-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' } as Record<string, string>)[s] ?? 'bg-gray-100 text-gray-600' }

async function loadHistory() {
  const { data } = await peopleApi.history(type.value, idParam.value)
  person.value = data.person
  Object.assign(counts, { incidents: data.stats?.incidents_count ?? 0, near_miss: data.stats?.near_miss_count ?? 0, breaches: data.stats?.breaches_count ?? 0, environment: data.stats?.environment_count ?? 0 })
  incidents.value = data.incidents ?? []; nearMiss.value = data.near_miss ?? []; breaches.value = data.breaches ?? []; environment.value = data.environment ?? []
}
async function loadRecords() {
  const [f, c, m] = await Promise.all([
    peopleApi.records(type.value, idParam.value, 'formations'),
    peopleApi.records(type.value, idParam.value, 'certifications'),
    peopleApi.records(type.value, idParam.value, 'medical-visits'),
  ])
  formations.value = f.data ?? []; certifications.value = c.data ?? []; medical.value = m.data ?? []
  // EPI : employés uniquement (l'API renvoie 404 pour les autres types).
  epi.value = type.value === 'employee'
    ? ((await peopleApi.records(type.value, idParam.value, 'epi')).data ?? [])
    : []
}
async function load() { person.value = null; await loadHistory(); await loadRecords() }

// ── Add record ────────────────────────────────────────────────────────────────
const showAdd = ref(false); const saving = ref(false)
const form = reactive<any>({}); const imageFile = ref<File | null>(null)
// EPI : formulaire dédié (multi-sélection) + vue plein écran.
const showPpeForm = ref(false); const viewPpe = ref<any>(null)

/** Joint les clés EPI (articles / catégories) en libellés lisibles. */
function ppeLabels(arr: any, group: 'itemsList' | 'categories'): string {
  return (Array.isArray(arr) ? arr : []).map((k: string) => t(`profile.epi.${group}.${k}`)).join(', ') || '—'
}

function openAdd() {
  // La dotation EPI utilise un formulaire multi-sélection dédié.
  if (activeTab.value === 'epi') { showPpeForm.value = true; return }
  Object.keys(form).forEach(k => delete form[k])
  if (activeTab.value === 'medical-visits') form.resultat = 'apte'
  imageFile.value = null; showAdd.value = true
}
async function saveRecord() {
  saving.value = true
  try {
    let payload: any
    if (imageFile.value) {
      payload = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v != null) payload.append(k, String(v)) })
      payload.append('image', imageFile.value)
    } else payload = { ...form }
    await peopleApi.addRecord(type.value, idParam.value, activeTab.value, payload)
    toast.add({ severity: 'success', summary: t('common.save'), life: 2500 })
    showAdd.value = false
    await loadRecords()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? t('common.error'), life: 4000 })
  } finally { saving.value = false }
}
async function removeRecord(r: any) {
  if (!confirm(t('common.delete') + ' ?')) return
  try { await peopleApi.delRecord(type.value, idParam.value, activeTab.value, r.id); await loadRecords() }
  catch (e: any) { toast.add({ severity: 'error', summary: e.response?.data?.message ?? t('common.error'), life: 4000 }) }
}

async function exportPdf() {
  downloading.value = true
  try { await downloadPdf(() => reportsApi.personProfile(type.value, idParam.value), `profil-${type.value}-${person.value?.identifier ?? idParam.value}.pdf`) }
  finally { downloading.value = false }
}

watch(() => route.fullPath, load)
onMounted(load)
</script>
