<template>
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">

      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b flex-shrink-0">
        <div>
          <h3 class="font-semibold text-gray-900">Personnel prestataire</h3>
          <p class="text-sm text-gray-500">{{ contractor.company_name }} · {{ employees.length }} personne(s)</p>
        </div>
        <button @click="$emit('close')"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
      </div>

      <!-- Actions bar -->
      <div class="flex items-center gap-3 px-6 py-3 border-b bg-gray-50 flex-shrink-0">
        <input
          v-model="search"
          @input="debouncedLoad"
          placeholder="Rechercher par nom, poste, CIN..."
          class="input flex-1 text-sm"
        />
        <button @click="showAddForm = true" class="btn-primary text-sm flex-shrink-0">
          <PlusIcon class="w-4 h-4" /> Ajouter
        </button>
      </div>

      <!-- Liste -->
      <div class="flex-1 overflow-y-auto p-6">

        <div v-if="loading" class="flex items-center justify-center py-16 text-gray-400">
          <div class="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          Chargement...
        </div>

        <div v-else-if="!employees.length" class="text-center py-16 text-gray-400">
          <UsersIcon class="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Aucun personnel enregistré</p>
          <button @click="showAddForm = true" class="btn-primary text-sm mt-4">Ajouter le premier</button>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="emp in employees"
            :key="emp.id"
            class="border border-gray-100 rounded-xl p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
          >
            <!-- Avatar -->
            <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <span class="text-purple-700 font-bold text-sm">{{ initials(emp.prenom, emp.nom) }}</span>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-medium text-gray-900">{{ emp.prenom }} {{ emp.nom }}</span>
                <span v-if="emp.badge_number" class="text-xs font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100">
                  Badge {{ emp.badge_number }}
                </span>
                <span :class="emp.is_active ? 'badge-active' : 'badge-inactive'">
                  {{ emp.is_active ? 'Actif' : 'Inactif' }}
                </span>
                <span v-if="emp.habilitation_hsse" class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  ✓ Habilitation HSSE
                </span>
              </div>
              <div class="text-sm text-gray-500 mt-0.5">{{ emp.poste || '—' }}</div>
              <div class="flex items-center gap-3 mt-1 text-xs text-gray-400">
                <span v-if="emp.phone"><PhoneIcon class="w-3 h-3 inline mr-0.5" />{{ emp.phone }}</span>
                <span v-if="emp.cin">CIN: {{ emp.cin }}</span>
                <span v-if="emp.date_debut">Depuis: {{ emp.date_debut }}</span>
                <span v-if="emp.date_fin" :class="isExpiring(emp.date_fin) ? 'text-amber-600 font-medium' : ''">
                  Fin: {{ emp.date_fin }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <button @click="startEdit(emp)" class="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500">
                <PencilIcon class="w-4 h-4" />
              </button>
              <button @click="deleteEmp(emp)" class="p-1.5 rounded-lg hover:bg-red-100 text-red-400">
                <TrashIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add / Edit Form -->
    <div v-if="showAddForm || editEmp" class="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div class="flex items-center justify-between p-5 border-b">
          <h4 class="font-semibold">{{ editEmp ? 'Modifier le personnel' : 'Nouveau personnel' }}</h4>
          <button @click="closeForm"><XMarkIcon class="w-5 h-5 text-gray-400" /></button>
        </div>
        <form @submit.prevent="submitForm" class="p-5 space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Prénom *</label>
              <input v-model="form.prenom" class="input" required />
            </div>
            <div>
              <label class="label">Nom *</label>
              <input v-model="form.nom" class="input" required />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Poste</label>
              <input v-model="form.poste" class="input" placeholder="Soudeur, électricien..." />
            </div>
            <div>
              <label class="label">Téléphone</label>
              <input v-model="form.phone" class="input" type="tel" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">CIN</label>
              <input v-model="form.cin" class="input" placeholder="Pièce d'identité" />
            </div>
            <div>
              <label class="label">N° Badge</label>
              <input v-model="form.badge_number" class="input" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Date début</label>
              <input v-model="form.date_debut" class="input" type="date" />
            </div>
            <div>
              <label class="label">Date fin</label>
              <input v-model="form.date_fin" class="input" type="date" />
            </div>
          </div>
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="form.habilitation_hsse" class="rounded text-brand-600" />
              <span class="text-sm text-gray-700">Habilitation HSSE</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="form.is_active" class="rounded text-brand-600" />
              <span class="text-sm text-gray-700">Actif</span>
            </label>
          </div>
          <div v-if="form.habilitation_hsse">
            <label class="label">Date habilitation HSSE</label>
            <input v-model="form.habilitation_date" class="input" type="date" />
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="closeForm" class="btn-secondary">Annuler</button>
            <button type="submit" :disabled="formLoading" class="btn-primary">
              {{ formLoading ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { contractorsApi } from '@/api'
import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon, PhoneIcon, UsersIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{ contractor: any }>()
const emit  = defineEmits<{ close: [] }>()
const toast = useToast()

const employees  = ref<any[]>([])
const loading    = ref(false)
const search     = ref('')
const showAddForm = ref(false)
const editEmp    = ref<any>(null)
const formLoading = ref(false)

const form = reactive({
  nom: '', prenom: '', poste: '', phone: '',
  cin: '', badge_number: '',
  date_debut: '', date_fin: '',
  habilitation_hsse: false, habilitation_date: '',
  is_active: true,
})

function initials(prenom?: string, nom?: string) {
  return ((prenom?.[0] ?? '') + (nom?.[0] ?? '')).toUpperCase() || '?'
}

function isExpiring(date: string): boolean {
  if (!date) return false
  const diff = (new Date(date).getTime() - Date.now()) / 86400000
  return diff >= 0 && diff <= 30
}

let timer: ReturnType<typeof setTimeout>
function debouncedLoad() { clearTimeout(timer); timer = setTimeout(load, 300) }

async function load() {
  loading.value = true
  try {
    const params = search.value ? { search: search.value } : {}
    const { data } = await contractorsApi.employees(props.contractor.id, params)
    employees.value = data.employees
  } catch {
    employees.value = []
  } finally {
    loading.value = false
  }
}

function startEdit(emp: any) {
  editEmp.value = emp
  Object.assign(form, {
    nom:               emp.nom               ?? '',
    prenom:            emp.prenom            ?? '',
    poste:             emp.poste             ?? '',
    phone:             emp.phone             ?? '',
    cin:               emp.cin               ?? '',
    badge_number:      emp.badge_number      ?? '',
    date_debut:        emp.date_debut        ?? '',
    date_fin:          emp.date_fin          ?? '',
    habilitation_hsse: emp.habilitation_hsse ?? false,
    habilitation_date: emp.habilitation_date ?? '',
    is_active:         emp.is_active         ?? true,
  })
}

function closeForm() {
  showAddForm.value = false
  editEmp.value = null
  Object.assign(form, { nom:'', prenom:'', poste:'', phone:'', cin:'', badge_number:'', date_debut:'', date_fin:'', habilitation_hsse:false, habilitation_date:'', is_active:true })
}

async function submitForm() {
  formLoading.value = true
  try {
    const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''))
    if (editEmp.value) {
      await contractorsApi.updateEmployee(props.contractor.id, editEmp.value.id, payload)
      toast.add({ severity: 'success', summary: 'Personnel mis à jour', life: 3000 })
    } else {
      await contractorsApi.addEmployee(props.contractor.id, payload)
      toast.add({ severity: 'success', summary: 'Personnel ajouté', life: 3000 })
    }
    closeForm()
    load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? 'Erreur', life: 4000 })
  } finally {
    formLoading.value = false
  }
}

async function deleteEmp(emp: any) {
  if (!confirm(`Supprimer ${emp.prenom} ${emp.nom} ?`)) return
  try {
    await contractorsApi.deleteEmployee(props.contractor.id, emp.id)
    toast.add({ severity: 'success', summary: 'Supprimé', life: 3000 })
    load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? 'Erreur', life: 4000 })
  }
}

onMounted(load)
</script>
