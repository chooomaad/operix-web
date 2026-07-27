<template>
  <div class="p-6 space-y-6" v-if="employee">

    <!-- Header -->
    <div class="flex items-center gap-4 flex-wrap">
      <button @click="$router.back()" class="text-gray-400 hover:text-gray-600 p-1">
        <ArrowLeftIcon class="w-5 h-5" />
      </button>
      <div class="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center overflow-hidden flex-shrink-0">
        <img v-if="employee.photo" :src="`/storage/${employee.photo}`" class="w-full h-full object-cover" />
        <span v-else class="text-brand-600 text-xl font-bold">{{ employee.prenom?.[0] }}{{ employee.nom?.[0] }}</span>
      </div>
      <div class="flex-1 min-w-0">
        <h2 class="text-xl font-bold text-gray-900">{{ employee.prenom }} {{ employee.nom }}</h2>
        <p class="text-gray-500 text-sm">{{ employee.poste }} · {{ employee.matricule }}</p>
        <div class="flex items-center gap-2 mt-1 flex-wrap">
          <span :class="employee.is_active ? 'badge-active' : 'badge-inactive'">
            {{ employee.is_active ? t('profile.statusActive') : t('profile.statusInactive') }}
          </span>
          <span class="badge-gray">{{ employee.type_contrat }}</span>
          <span v-if="employee.department?.name" class="badge-gray">{{ employee.department.name }}</span>
        </div>
      </div>
      <div class="flex gap-2 flex-shrink-0" v-if="auth.isAdmin">
        <button @click="exportPdf" class="btn-secondary text-sm flex items-center gap-1.5">
          <DocumentArrowDownIcon class="w-4 h-4" /> PDF
        </button>
        <button @click="showEdit = true" class="btn-primary text-sm flex items-center gap-1.5">
          <PencilIcon class="w-4 h-4" /> {{ t('profile.edit') }}
        </button>
      </div>
    </div>

    <!-- KPI safety bar -->
    <div class="grid grid-cols-3 sm:grid-cols-6 gap-3">
      <div class="card-sm text-center">
        <div class="text-2xl font-black text-red-600">{{ stats.incidents_count }}</div>
        <div class="text-xs text-gray-500 mt-0.5">{{ t('profile.kpi.incidents') }}</div>
      </div>
      <div class="card-sm text-center">
        <div class="text-2xl font-black text-orange-500">{{ stats.near_miss_count }}</div>
        <div class="text-xs text-gray-500 mt-0.5">{{ t('profile.kpi.nearMiss') }}</div>
      </div>
      <div class="card-sm text-center">
        <div class="text-2xl font-black text-amber-500">{{ stats.breaches_count }}</div>
        <div class="text-xs text-gray-500 mt-0.5">{{ t('profile.kpi.breaches') }}</div>
      </div>
      <div class="card-sm text-center">
        <div class="text-2xl font-black text-teal-600">{{ stats.environment_count }}</div>
        <div class="text-xs text-gray-500 mt-0.5">{{ t('profile.kpi.environment') }}</div>
      </div>
      <div class="card-sm text-center">
        <div class="text-2xl font-black text-blue-600">{{ stats.formations_count }}</div>
        <div class="text-xs text-gray-500 mt-0.5">{{ t('profile.kpi.formations') }}</div>
      </div>
      <div class="card-sm text-center">
        <div class="text-2xl font-black text-green-600">{{ stats.certifications_count }}</div>
        <div class="text-xs text-gray-500 mt-0.5">{{ t('profile.kpi.certifications') }}</div>
      </div>
    </div>

    <!-- Info grid -->
    <div class="card grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div><span class="text-gray-400 text-xs block mb-0.5">{{ t('profile.info.email') }}</span><strong class="truncate block">{{ employee.email ?? '—' }}</strong></div>
      <div><span class="text-gray-400 text-xs block mb-0.5">{{ t('profile.info.phone') }}</span><strong>{{ employee.phone ?? '—' }}</strong></div>
      <div><span class="text-gray-400 text-xs block mb-0.5">{{ t('profile.info.hireDate') }}</span><strong>{{ employee.date_embauche ?? '—' }}</strong></div>
      <div><span class="text-gray-400 text-xs block mb-0.5">{{ t('profile.info.nni') }}</span><strong>{{ employee.nni ?? '—' }}</strong></div>
      <div><span class="text-gray-400 text-xs block mb-0.5">{{ t('profile.info.nationality') }}</span><strong>{{ employee.nationalite ?? '—' }}</strong></div>
      <div><span class="text-gray-400 text-xs block mb-0.5">{{ t('profile.info.gender') }}</span><strong>{{ employee.gender ?? '—' }}</strong></div>
      <div><span class="text-gray-400 text-xs block mb-0.5">{{ t('profile.info.section') }}</span><strong>{{ employee.section ?? '—' }}</strong></div>
    </div>

    <!-- Tabs + bouton Ajouter -->
    <div class="border-b border-gray-200 flex items-end justify-between gap-2">
      <nav class="flex gap-1 overflow-x-auto">
        <button
          v-for="tab in tabs" :key="tab.key"
          @click="activeTab = tab.key"
          :class="['px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5',
            activeTab === tab.key
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-gray-500 hover:text-gray-700']"
        >
          <span>{{ tab.label }}</span>
          <span :class="['text-xs rounded-full px-1.5 py-0.5 font-semibold',
            tab.alert && tab.count > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500']">
            {{ tab.count }}
          </span>
        </button>
      </nav>
      <button
        v-if="auth.isAdmin"
        @click="openAddModal"
        class="btn-primary text-sm flex items-center gap-1.5 mb-1 flex-shrink-0"
      >
        <PlusIcon class="w-4 h-4" /> {{ t('profile.add') }}
      </button>
    </div>

    <!-- ── Incidents ────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'incidents'">
      <div v-if="history.incidents?.length" class="space-y-2">
        <RouterLink
          v-for="inc in history.incidents" :key="inc.id"
          :to="`/incidents/${inc.id}`"
          class="card-sm flex items-center gap-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex-shrink-0">
            <span :class="severityClass(inc.severity)" class="text-xs font-bold px-2 py-0.5 rounded-full">
              {{ inc.severity?.toUpperCase() }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 text-sm">{{ inc.reference }} — {{ inc.location }}</div>
            <div class="text-xs text-gray-500 truncate">{{ inc.description }}</div>
          </div>
          <div class="text-right flex-shrink-0">
            <div class="text-xs text-gray-500">{{ inc.date }}</div>
            <span :class="statusClass(inc.status)" class="text-xs">{{ inc.status }}</span>
          </div>
        </RouterLink>
      </div>
      <div v-else class="card text-center py-10 text-gray-400 text-sm">{{ t('profile.noIncidents') }}</div>
    </div>

    <!-- ── Near Miss ───────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'near_miss'">
      <div v-if="history.near_miss?.length" class="space-y-2">
        <div v-for="nm in history.near_miss" :key="nm.id" class="card-sm flex items-center gap-4">
          <span :class="severityClass(nm.severity)" class="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
            {{ nm.severity?.toUpperCase() }}
          </span>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 text-sm">{{ nm.reference }} — {{ nm.location }}</div>
            <div class="text-xs text-gray-500 truncate">{{ nm.description }}</div>
          </div>
          <div class="text-right flex-shrink-0">
            <div class="text-xs text-gray-500">{{ nm.date }}</div>
            <span :class="statusClass(nm.status)" class="text-xs">{{ nm.status }}</span>
          </div>
        </div>
      </div>
      <div v-else class="card text-center py-10 text-gray-400 text-sm">{{ t('profile.noNearMiss') }}</div>
    </div>

    <!-- ── Infractions ─────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'breaches'">
      <div v-if="history.breaches?.length" class="space-y-2">
        <div v-for="b in history.breaches" :key="b.id" class="card-sm flex items-center gap-4">
          <span :class="severityClass(b.severity)" class="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
            {{ b.severity?.toUpperCase() }}
          </span>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 text-sm">{{ b.reference }} · {{ b.type }}</div>
            <div class="text-xs text-gray-500 truncate">{{ b.description }}</div>
          </div>
          <div class="text-right flex-shrink-0">
            <div class="text-xs text-gray-500">{{ b.date }}</div>
            <span :class="statusClass(b.status)" class="text-xs">{{ b.status }}</span>
          </div>
        </div>
      </div>
      <div v-else class="card text-center py-10 text-gray-400 text-sm">{{ t('profile.noBreaches') }}</div>
    </div>

    <!-- ── Environnement ─────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'environment'">
      <div v-if="history.environment?.length" class="space-y-2">
        <div v-for="e in history.environment" :key="e.id" class="card-sm flex items-center gap-4">
          <span :class="severityClass(e.severity)" class="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
            {{ e.severity?.toUpperCase() }}
          </span>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 text-sm">{{ e.reference }} · {{ e.type }}</div>
            <div class="text-xs text-gray-500 truncate">{{ e.description }}</div>
          </div>
          <div class="text-right flex-shrink-0">
            <div class="text-xs text-gray-500">{{ e.date }}</div>
            <span :class="statusClass(e.status)" class="text-xs">{{ e.status }}</span>
          </div>
        </div>
      </div>
      <div v-else class="card text-center py-10 text-gray-400 text-sm">{{ t('profile.noEnvironment') }}</div>
    </div>

    <!-- ── Formations ──────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'formations'">
      <DataTable :columns="[
        { key:'titre',      label: t('profile.formations.columns.title') },
        { key:'organisme',  label: t('profile.formations.columns.organism') },
        { key:'date_debut', label: t('profile.formations.columns.start') },
        { key:'date_fin',   label: t('profile.formations.columns.end') },
        { key:'statut',     label: t('profile.formations.columns.status') },
      ]" :rows="history.formations ?? []" :empty-text="t('profile.formations.noData')" />
    </div>

    <!-- ── Certifications ─────────────────────────────────────────────── -->
    <div v-if="activeTab === 'certifications'">
      <DataTable :columns="[
        { key:'titre',          label: t('profile.certifications.columns.title') },
        { key:'organisme',      label: t('profile.certifications.columns.organism') },
        { key:'date_obtention', label: t('profile.certifications.columns.issued') },
        { key:'date_expiration',label: t('profile.certifications.columns.expiry') },
        { key:'statut',         label: t('profile.certifications.columns.status') },
      ]" :rows="history.certifications ?? []" :empty-text="t('profile.certifications.noData')">
        <template #cell-statut="{ value }">
          <span :class="value === 'expired' ? 'badge-inactive' : 'badge-active'" class="text-xs">
            {{ value === 'expired' ? t('profile.certifications.expired') : t('profile.certifications.valid') }}
          </span>
        </template>
      </DataTable>
    </div>

    <!-- ── Visites médicales ───────────────────────────────────────────── -->
    <div v-if="activeTab === 'medical'">
      <DataTable :columns="[
        { key:'date',             label: t('profile.medical.columns.date') },
        { key:'type',             label: t('profile.medical.columns.type') },
        { key:'medecin',          label: t('profile.medical.columns.doctor') },
        { key:'resultat',         label: t('profile.medical.columns.result') },
        { key:'prochaine_visite', label: t('profile.medical.columns.nextVisit') },
      ]" :rows="history.medical_visits ?? []" :empty-text="t('profile.medical.noData')" />
    </div>
  </div>

  <!-- ══ Modals sécurité (pré-remplis avec cet employé) ══════════════════ -->
  <IncidentFormModal
    v-if="showAddIncident"
    :preloadEmployee="employee"
    @close="showAddIncident = false"
    @created="onSafetyCreated"
  />
  <NearMissFormModal
    v-if="showAddNearMiss"
    :preloadEmployee="employee"
    @close="showAddNearMiss = false"
    @created="onSafetyCreated"
  />
  <BreachFormModal
    v-if="showAddBreach"
    :preloadEmployee="employee"
    @close="showAddBreach = false"
    @created="onSafetyCreated"
  />
  <EnvironmentFormModal
    v-if="showAddEnvironment"
    :preloadEmployee="employee"
    @close="showAddEnvironment = false"
    @created="onSafetyCreated"
  />

  <!-- ══ Mini-modal : Formation ══════════════════════════════════════════ -->
  <div v-if="showAddFormation" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl">
      <div class="flex items-center justify-between px-6 py-4 border-b">
        <h3 class="font-semibold text-gray-900">{{ t('profile.formations.addTitle') }}</h3>
        <button @click="showAddFormation = false"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
      </div>
      <form @submit.prevent="saveFormation" class="px-6 py-4 space-y-3">
        <div>
          <label class="label">{{ t('profile.formations.title') }} *</label>
          <input v-model="formFormation.titre" class="input" required placeholder="Ex: Secourisme SST" />
        </div>
        <div>
          <label class="label">{{ t('profile.formations.organism') }}</label>
          <input v-model="formFormation.organisme" class="input" placeholder="Organisme de formation" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">{{ t('profile.formations.startDate') }}</label><input v-model="formFormation.date_debut" type="date" class="input" /></div>
          <div><label class="label">{{ t('profile.formations.endDate') }}</label><input v-model="formFormation.date_fin" type="date" class="input" /></div>
        </div>
        <div>
          <label class="label">{{ t('profile.formations.status') }}</label>
          <select v-model="formFormation.statut" class="input">
            <option value="completed">{{ t('profile.formations.completed') }}</option>
            <option value="in_progress">{{ t('profile.formations.inProgress') }}</option>
            <option value="planned">{{ t('profile.formations.planned') }}</option>
          </select>
        </div>
        <div class="flex justify-end gap-3 pt-1">
          <button type="button" @click="showAddFormation = false" class="btn-secondary">{{ t('common.cancel') }}</button>
          <button type="submit" :disabled="subLoading" class="btn-primary">{{ subLoading ? t('common.saving') : t('common.save') }}</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ══ Mini-modal : Certification ════════════════════════════════════ -->
  <div v-if="showAddCert" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl">
      <div class="flex items-center justify-between px-6 py-4 border-b">
        <h3 class="font-semibold text-gray-900">{{ t('profile.certifications.addTitle') }}</h3>
        <button @click="showAddCert = false"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
      </div>
      <form @submit.prevent="saveCert" class="px-6 py-4 space-y-3">
        <div>
          <label class="label">{{ t('profile.certifications.title') }} *</label>
          <input v-model="formCert.titre" class="input" required placeholder="Ex: ATEX, Travail en hauteur..." />
        </div>
        <div>
          <label class="label">{{ t('profile.certifications.organism') }}</label>
          <input v-model="formCert.organisme" class="input" placeholder="Organisme certificateur" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">{{ t('profile.certifications.issueDate') }}</label><input v-model="formCert.date_obtention" type="date" class="input" /></div>
          <div><label class="label">{{ t('profile.certifications.expiryDate') }}</label><input v-model="formCert.date_expiration" type="date" class="input" /></div>
        </div>
        <div class="flex justify-end gap-3 pt-1">
          <button type="button" @click="showAddCert = false" class="btn-secondary">{{ t('common.cancel') }}</button>
          <button type="submit" :disabled="subLoading" class="btn-primary">{{ subLoading ? t('common.saving') : t('common.save') }}</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ══ Mini-modal : Visite médicale ══════════════════════════════════ -->
  <div v-if="showAddMedical" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl">
      <div class="flex items-center justify-between px-6 py-4 border-b">
        <h3 class="font-semibold text-gray-900">{{ t('profile.medical.addTitle') }}</h3>
        <button @click="showAddMedical = false"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
      </div>
      <form @submit.prevent="saveMedical" class="px-6 py-4 space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">{{ t('profile.medical.date') }} *</label><input v-model="formMedical.date" type="date" class="input" required /></div>
          <div>
            <label class="label">{{ t('profile.medical.type') }}</label>
            <select v-model="formMedical.type" class="input">
              <option value="embauche">{{ t('profile.medical.types.embauche') }}</option>
              <option value="periodique">{{ t('profile.medical.types.periodique') }}</option>
              <option value="reprise">{{ t('profile.medical.types.reprise') }}</option>
              <option value="autre">{{ t('profile.medical.types.autre') }}</option>
            </select>
          </div>
        </div>
        <div>
          <label class="label">{{ t('profile.medical.doctor') }}</label>
          <input v-model="formMedical.medecin" class="input" placeholder="Nom du médecin" />
        </div>
        <div>
          <label class="label">{{ t('profile.medical.result') }}</label>
          <select v-model="formMedical.resultat" class="input">
            <option value="apte">{{ t('profile.medical.results.apte') }}</option>
            <option value="apte_restriction">{{ t('profile.medical.results.apte_restriction') }}</option>
            <option value="inapte">{{ t('profile.medical.results.inapte') }}</option>
          </select>
        </div>
        <div>
          <label class="label">{{ t('profile.medical.nextVisit') }}</label>
          <input v-model="formMedical.prochaine_visite" type="date" class="input" />
        </div>
        <div class="flex justify-end gap-3 pt-1">
          <button type="button" @click="showAddMedical = false" class="btn-secondary">{{ t('common.cancel') }}</button>
          <button type="submit" :disabled="subLoading" class="btn-primary">{{ subLoading ? t('common.saving') : t('common.save') }}</button>
        </div>
      </form>
    </div>
  </div>

  <div v-else class="flex items-center justify-center h-64">
    <div class="text-center">
      <div class="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-gray-500 text-sm">{{ t('profile.loading') }}</p>
    </div>
  </div>

  <EmployeeFormModal
    v-if="showEdit"
    :employee="employee"
    @close="showEdit = false"
    @saved="onSaved"
  />
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { employeesApi, reportsApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useDownload } from '@/composables/useDownload'
import DataTable from '@/components/ui/DataTable.vue'
import EmployeeFormModal from './EmployeeFormModal.vue'
import IncidentFormModal from '@/pages/incidents/IncidentFormModal.vue'
import NearMissFormModal from '@/pages/nearmiss/NearMissFormModal.vue'
import BreachFormModal from '@/pages/breaches/BreachFormModal.vue'
import EnvironmentFormModal from '@/pages/environment/EnvironmentFormModal.vue'
import { ArrowLeftIcon, PencilIcon, DocumentArrowDownIcon, PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()

const route   = useRoute()
const router  = useRouter()
const auth    = useAuthStore()
const toast   = useToast()
const { downloadPdf } = useDownload()

const employee  = ref<any>(null)
const history   = ref<any>({})
const stats     = ref({ incidents_count:0, near_miss_count:0, breaches_count:0, environment_count:0, formations_count:0, certifications_count:0 })
const showEdit  = ref(false)
const activeTab = ref('incidents')

// Modals sécurité
const showAddIncident    = ref(false)
const showAddNearMiss    = ref(false)
const showAddBreach      = ref(false)
const showAddEnvironment = ref(false)

// Mini-modals sous-ressources
const showAddFormation = ref(false)
const showAddCert      = ref(false)
const showAddMedical   = ref(false)
const subLoading       = ref(false)

const formFormation = reactive({ titre: '', organisme: '', date_debut: '', date_fin: '', statut: 'completed' })
const formCert      = reactive({ titre: '', organisme: '', date_obtention: '', date_expiration: '' })
const formMedical   = reactive({ date: '', type: 'periodique', medecin: '', resultat: 'apte', prochaine_visite: '' })

const tabs = computed(() => [
  { key:'incidents',      label: t('profile.incidents'),        count: stats.value.incidents_count,     alert: true },
  { key:'near_miss',      label: t('profile.nearMiss'),         count: stats.value.near_miss_count,     alert: true },
  { key:'breaches',       label: t('profile.breaches'),         count: stats.value.breaches_count,      alert: true },
  { key:'environment',    label: t('profile.environment'),      count: stats.value.environment_count,   alert: true },
  { key:'formations',     label: t('profile.formations'),       count: stats.value.formations_count,    alert: false },
  { key:'certifications', label: t('profile.certifications'),   count: stats.value.certifications_count,alert: false },
  { key:'medical',        label: t('profile.medical'),          count: history.value.medical_visits?.length ?? 0, alert: false },
])

function severityClass(s: string) {
  return ({ low:'bg-green-100 text-green-700', medium:'bg-amber-100 text-amber-700',
            high:'bg-orange-100 text-orange-700', critical:'bg-red-100 text-red-700' } as Record<string,string>)[s] ?? 'bg-gray-100 text-gray-600'
}

function statusClass(s: string) {
  return ({ open:'text-red-500', closed:'text-green-600', in_progress:'text-amber-500' } as Record<string,string>)[s] ?? 'text-gray-400'
}

async function exportPdf() {
  await downloadPdf(() => reportsApi.employeeProfile(Number(route.params.id)), `profil-${employee.value?.matricule}.pdf`)
}

function onSaved(updated: any) {
  employee.value = updated
  showEdit.value = false
}

function openAddModal() {
  const map: Record<string, () => void> = {
    incidents:    () => { showAddIncident.value    = true },
    near_miss:    () => { showAddNearMiss.value     = true },
    breaches:     () => { showAddBreach.value       = true },
    environment:  () => { showAddEnvironment.value  = true },
    formations:   () => { Object.assign(formFormation, { titre:'', organisme:'', date_debut:'', date_fin:'', statut:'completed' }); showAddFormation.value = true },
    certifications:() => { Object.assign(formCert, { titre:'', organisme:'', date_obtention:'', date_expiration:'' }); showAddCert.value = true },
    medical:      () => { Object.assign(formMedical, { date:'', type:'periodique', medecin:'', resultat:'apte', prochaine_visite:'' }); showAddMedical.value = true },
  }
  map[activeTab.value]?.()
}

async function onSafetyCreated() {
  await loadHistory()
}

async function loadHistory() {
  const id = Number(route.params.id)
  const { data } = await employeesApi.history(id)
  history.value = data
  if (data.stats) stats.value = data.stats
}

async function saveFormation() {
  subLoading.value = true
  try {
    await employeesApi.addFormation(Number(route.params.id), { ...formFormation })
    toast.add({ severity: 'success', summary: t('profile.formations.added'), life: 3000 })
    showAddFormation.value = false
    await loadHistory()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? 'Erreur', life: 4000 })
  } finally { subLoading.value = false }
}

async function saveCert() {
  subLoading.value = true
  try {
    await employeesApi.addCert(Number(route.params.id), { ...formCert })
    toast.add({ severity: 'success', summary: t('profile.certifications.added'), life: 3000 })
    showAddCert.value = false
    await loadHistory()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? 'Erreur', life: 4000 })
  } finally { subLoading.value = false }
}

async function saveMedical() {
  subLoading.value = true
  try {
    await employeesApi.addMedical(Number(route.params.id), { ...formMedical })
    toast.add({ severity: 'success', summary: t('profile.medical.added'), life: 3000 })
    showAddMedical.value = false
    await loadHistory()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? 'Erreur', life: 4000 })
  } finally { subLoading.value = false }
}

onMounted(async () => {
  const id = Number(route.params.id)
  if (!id || isNaN(id)) { router.replace('/employees'); return }
  const [emp, hist] = await Promise.all([
    employeesApi.show(id),
    employeesApi.history(id),
  ])
  employee.value = emp.data
  history.value  = hist.data
  if (hist.data.stats) stats.value = hist.data.stats
})
</script>
