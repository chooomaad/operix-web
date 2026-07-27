<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <h3 class="font-semibold text-gray-900">{{ isEdit ? t('employees.editProfile') : t('employees.newEmployee') }}</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Body -->
      <div class="overflow-y-auto flex-1 px-6 py-5 space-y-5">

        <!-- Photo -->
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img v-if="photoPreview" :src="photoPreview" class="w-full h-full object-cover" />
            <span v-else class="text-brand-600 text-xl font-bold">
              {{ (form.prenom?.[0] ?? '') + (form.nom?.[0] ?? '') }}
            </span>
          </div>
          <label class="cursor-pointer btn-secondary text-sm">
            <CameraIcon class="w-4 h-4 mr-1.5 inline" /> {{ t('employees.changePhoto') }}
            <input type="file" accept="image/*" class="hidden" @change="onPhoto" />
          </label>
          <button v-if="photoPreview || form.photo" @click="clearPhoto" class="text-xs text-red-500 hover:text-red-700">{{ t('employees.removePhoto') }}</button>
        </div>

        <!-- Identité -->
        <fieldset class="space-y-3">
          <legend class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{{ t('employees.identity') }}</legend>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">{{ t('employees.lastName') }} <span class="text-red-500">*</span></label>
              <input v-model="form.nom" class="input" placeholder="Ex: ELEMINE" />
            </div>
            <div>
              <label class="label">{{ t('employees.firstName') }} <span class="text-red-500">*</span></label>
              <input v-model="form.prenom" class="input" placeholder="Ex: Choumad" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">{{ t('employees.employeeId') }} <span class="text-red-500">*</span></label>
              <input v-model="form.matricule" class="input" placeholder="Ex: EMP001" :readonly="isEdit" :class="{ 'bg-gray-50': isEdit }" />
            </div>
            <div>
              <label class="label">{{ t('employees.gender') }}</label>
              <select v-model="form.gender" class="input">
                <option value="">{{ t('common.select') }}</option>
                <option value="M">{{ t('employees.male') }}</option>
                <option value="F">{{ t('employees.female') }}</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">{{ t('employees.dateOfBirth') }}</label>
              <input v-model="form.date_naissance" type="date" class="input" />
            </div>
            <div>
              <label class="label">{{ t('employees.nationality') }}</label>
              <input v-model="form.nationalite" class="input" placeholder="Ex: Mauritanien" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">{{ t('employees.nni') }}</label>
              <input v-model="form.nni" class="input" placeholder="Numéro national d'identité" />
            </div>
            <div>
              <label class="label">{{ t('employees.idNumber') }}</label>
              <input v-model="form.num_cni" class="input" placeholder="Numéro carte d'identité" />
            </div>
          </div>
        </fieldset>

        <!-- Contact -->
        <fieldset class="space-y-3">
          <legend class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contact</legend>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">{{ t('employees.email') }}</label>
              <input v-model="form.email" type="email" class="input" placeholder="email@tcn.mr" />
            </div>
            <div>
              <label class="label">{{ t('employees.phone') }}</label>
              <input v-model="form.phone" class="input" placeholder="+222 XX XX XX XX" />
            </div>
          </div>
          <div>
            <label class="label">{{ t('employees.address') }}</label>
            <input v-model="form.adresse" class="input" placeholder="Adresse complète" />
          </div>
        </fieldset>

        <!-- Poste -->
        <fieldset class="space-y-3">
          <legend class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{{ t('employees.positionAndContract') }}</legend>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">{{ t('employees.position') }} <span class="text-red-500">*</span></label>
              <input v-model="form.poste" class="input" placeholder="Ex: Ingénieur HSE" />
            </div>
            <div>
              <label class="label">{{ t('employees.department') }}</label>
              <select v-model="form.department_id" class="input">
                <option value="">{{ t('common.none') }}</option>
                <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">{{ t('employees.contract') }} <span class="text-red-500">*</span></label>
              <select v-model="form.type_contrat" class="input">
                <option value="">{{ t('common.select') }}</option>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Stage">{{ t('employees.contractTypes.Stage') }}</option>
                <option value="Prestataire">{{ t('employees.contractTypes.Prestataire') }}</option>
                <option value="Autre">{{ t('employees.contractTypes.Autre') }}</option>
              </select>
            </div>
            <div>
              <label class="label">{{ t('employees.placeOfBirth') }}</label>
              <input v-model="form.lieu_naissance" class="input" placeholder="Ville de naissance" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">{{ t('employees.hireDate') }}</label>
              <input v-model="form.date_embauche" type="date" class="input" />
            </div>
            <div>
              <label class="label">{{ t('employees.contractEndDate') }}</label>
              <input v-model="form.date_fin_contrat" type="date" class="input" />
            </div>
          </div>
          <div class="flex items-center gap-2 pt-1">
            <input id="is_active" type="checkbox" v-model="form.is_active" class="w-4 h-4 text-brand-600 rounded" />
            <label for="is_active" class="text-sm text-gray-700">{{ t('employees.activeEmployee') }}</label>
          </div>
        </fieldset>

        <!-- Contact urgence -->
        <fieldset class="space-y-3">
          <legend class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{{ t('employees.emergencyContact') }}</legend>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">{{ t('employees.contactName') }}</label>
              <input v-model="form.contact_urgence_nom" class="input" placeholder="Nom et prénom" />
            </div>
            <div>
              <label class="label">{{ t('employees.phone') }}</label>
              <input v-model="form.contact_urgence_tel" class="input" placeholder="+222 XX XX XX XX" />
            </div>
          </div>
        </fieldset>

        <!-- Erreur -->
        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{{ error }}</div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
        <button @click="$emit('close')" class="btn-secondary">{{ t('common.cancel') }}</button>
        <button @click="save" :disabled="saving" class="btn-primary min-w-[100px]">
          <span v-if="saving" class="flex items-center gap-2">
            <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
            {{ t('common.saving') }}
          </span>
          <span v-else>{{ isEdit ? t('common.save') : t('employees.createEmployee') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { employeesApi, departmentsApi } from '@/api'
import { XMarkIcon, CameraIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()

const props = defineProps<{ employee?: any | null }>()
const emit  = defineEmits<{ close: []; saved: [emp: any] }>()

const toast  = useToast()
const saving = ref(false)
const error  = ref('')
const photoFile   = ref<File | null>(null)
const photoPreview = ref<string | null>(null)
const photoClear  = ref(false)
const departments = ref<any[]>([])

const isEdit = computed(() => !!props.employee?.id)

const form = reactive({
  nom:                 props.employee?.nom                 ?? '',
  prenom:              props.employee?.prenom              ?? '',
  matricule:           props.employee?.matricule           ?? '',
  email:               props.employee?.email               ?? '',
  phone:               props.employee?.phone               ?? '',
  poste:               props.employee?.poste               ?? '',
  department_id:       props.employee?.department?.id      ?? '',
  type_contrat:        props.employee?.type_contrat        ?? '',
  date_embauche:       props.employee?.date_embauche       ?? '',
  date_fin_contrat:    props.employee?.date_fin_contrat    ?? '',
  gender:              props.employee?.gender              ?? '',
  date_naissance:      props.employee?.date_naissance      ?? '',
  nationalite:         props.employee?.nationalite         ?? '',
  lieu_naissance:      props.employee?.lieu_naissance      ?? '',
  adresse:             props.employee?.adresse             ?? '',
  num_cni:             props.employee?.num_cni             ?? '',
  nni:                 props.employee?.nni                 ?? '',
  contact_urgence_nom: props.employee?.contact_urgence_nom ?? '',
  contact_urgence_tel: props.employee?.contact_urgence_tel ?? '',
  is_active:           props.employee?.is_active           ?? true,
  photo:               props.employee?.photo               ?? null,
})

onMounted(async () => {
  try {
    const { data } = await departmentsApi.list()
    departments.value = Array.isArray(data) ? data : (data.data ?? [])
  } catch {}
})

function onPhoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  photoFile.value = file
  photoClear.value = false
  const reader = new FileReader()
  reader.onload = ev => { photoPreview.value = ev.target?.result as string }
  reader.readAsDataURL(file)
}

function clearPhoto() {
  photoFile.value = null
  photoPreview.value = null
  photoClear.value = true
}

async function save() {
  error.value = ''
  if (!form.nom.trim())        { error.value = t('employees.validation.lastNameRequired'); return }
  if (!form.prenom.trim())     { error.value = t('employees.validation.firstNameRequired'); return }
  if (!form.matricule.trim())  { error.value = t('employees.validation.employeeIdRequired'); return }
  if (!form.poste.trim())      { error.value = t('employees.validation.positionRequired'); return }
  if (!form.type_contrat)      { error.value = t('employees.validation.contractTypeRequired'); return }

  saving.value = true
  try {
    const fd = new FormData()
    const skip = new Set(['photo'])
    for (const [k, v] of Object.entries(form)) {
      if (skip.has(k)) continue
      if (v === '' || v === null || v === undefined) continue
      if (k === 'department_id' && !v) continue
      fd.append(k, k === 'is_active' ? (v ? '1' : '0') : String(v))
    }
    if (photoFile.value) fd.append('photo', photoFile.value)

    let res
    if (isEdit.value) {
      res = await employeesApi.update(props.employee.id, fd)
    } else {
      res = await employeesApi.create(fd)
    }

    toast.add({ severity: 'success', summary: isEdit.value ? t('employees.profileUpdated') : t('employees.employeeCreated'), life: 3000 })
    emit('saved', res.data)
  } catch (err: any) {
    const msgs = err?.response?.data?.errors
    if (msgs) {
      error.value = Object.values(msgs).flat().join(' • ')
    } else {
      error.value = err?.response?.data?.message ?? t('employees.validation.savingError')
    }
  } finally {
    saving.value = false
  }
}
</script>
