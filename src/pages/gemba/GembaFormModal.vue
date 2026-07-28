<template>
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">

      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
        <div>
          <h3 class="font-semibold text-gray-900">{{ isEdit ? t('gemba.editFormTitle') : t('gemba.newFormTitle') }}</h3>
          <p class="text-xs text-gray-400 mt-0.5">{{ t('gemba.sectionHeader') }}</p>
        </div>
        <button @click="$emit('close')"><XMarkIcon class="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
      </div>

      <form @submit.prevent="submit" class="overflow-y-auto flex-1 p-6 space-y-5">

        <!-- ── Section En-tête ───────────────────────────── -->
        <div class="bg-slate-50 rounded-xl p-4 space-y-3">
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('gemba.sectionGeneral') }}</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">{{ t('common.date') }} *</label>
              <input v-model="form.date" type="date" class="input" required />
            </div>
            <div>
              <label class="label">{{ t('gemba.zone') }} *</label>
              <input v-model="form.zone" class="input" placeholder="Ex: Terminal Container" required />
            </div>
          </div>
          <div>
            <label class="label">{{ t('gemba.auditor') }} *</label>
            <input v-model="form.auditor" class="input" placeholder="Nom et fonction (Ex: Mohamed Ely — OPS)" required />
          </div>
          <div>
            <label class="label">{{ t('gemba.objective') }}</label>
            <textarea v-model="form.objective" class="input" rows="2"
              placeholder="Ex: Reviewer, assigner et suivre les actions GEMBA pour garantir leur clôture en temps voulu" />
          </div>
        </div>

        <!-- ── Section Action observée ────────────────────── -->
        <div class="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('gemba.sectionAction') }}</p>

          <div>
            <label class="label">{{ t('gemba.observationLabel') }} *</label>
            <textarea v-model="form.observation" class="input" rows="3"
              placeholder="Décrivez l'observation ou l'action identifiée lors du Gemba Walk" required />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">{{ t('gemba.ownerLabel') }}</label>
              <input v-model="form.responsible" class="input" placeholder="Nom du responsable" />
            </div>
            <div>
              <label class="label">{{ t('gemba.deadlineLabel') }}</label>
              <input v-model="form.due_date" type="date" class="input" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">{{ t('gemba.statusLabel') }}</label>
              <select v-model="form.status" class="input">
                <option value="open">{{ t('status.open') }}</option>
                <option value="in_progress">{{ t('status.inProgress') }}</option>
                <option value="resolved">{{ t('status.resolved') }}</option>
              </select>
            </div>
            <div>
              <label class="label">{{ t('gemba.priorityLabel') }}</label>
              <select v-model="form.priority" class="input">
                <option value="low">{{ t('severity.low') }}</option>
                <option value="medium">{{ t('severity.medium') }}</option>
                <option value="high">{{ t('severity.high') }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="label">{{ t('gemba.actionRequired') }}</label>
            <textarea v-model="form.action_required" class="input" rows="2"
              placeholder="Action corrective ou commentaire additionnel" />
          </div>
        </div>

        <!-- ── Section Photo ──────────────────────────────── -->
        <div class="border border-dashed border-gray-200 rounded-xl p-4 space-y-3">
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('gemba.photoLabel') }}</p>

          <!-- Preview image existante (edit) -->
          <div v-if="existingImage && !photoPreview" class="relative w-full">
            <img :src="gemba?.image_url ?? ''" class="w-full max-h-48 object-cover rounded-lg" />
            <button type="button" @click="existingImage = null"
              class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600">
              <XMarkIcon class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Preview nouvelle photo -->
          <div v-if="photoPreview" class="relative w-full">
            <img :src="photoPreview" class="w-full max-h-48 object-cover rounded-lg" />
            <button type="button" @click="clearPhoto"
              class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600">
              <XMarkIcon class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Zone de drop/sélection -->
          <label v-if="!photoPreview && !existingImage"
            class="flex flex-col items-center justify-center gap-2 py-6 cursor-pointer text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
            <CameraIcon class="w-8 h-8" />
            <span class="text-sm font-medium">{{ t('gemba.addPhoto') }}</span>
            <span class="text-xs">{{ t('gemba.photoFormats') }}</span>
            <input type="file" accept="image/*" class="hidden" @change="onPhotoChange" />
          </label>

          <button v-else-if="photoPreview || existingImage" type="button"
            @click="triggerPhotoInput"
            class="text-xs text-brand-600 hover:underline">
            {{ t('gemba.changePhoto') }}
          </button>
          <input ref="photoInputRef" type="file" accept="image/*" class="hidden" @change="onPhotoChange" />
        </div>

      </form>

      <!-- Footer -->
      <div class="flex justify-end gap-3 px-6 py-4 border-t flex-shrink-0">
        <button type="button" @click="$emit('close')" class="btn-secondary">{{ t('common.cancel') }}</button>
        <button @click="submit" :disabled="loading" class="btn-primary">
          {{ loading ? t('gemba.saving') : (isEdit ? t('gemba.saving_btn') : t('gemba.creating')) }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { gembaApi } from '@/api'
import { XMarkIcon, CameraIcon } from '@heroicons/vue/24/outline'

const { t }  = useI18n()
const props = defineProps<{ gemba?: any | null }>()
const emit  = defineEmits<{ close: []; saved: [] }>()
const toast = useToast()
const loading = ref(false)

const isEdit = computed(() => !!props.gemba?.id)

const form = reactive({
  date:            '',
  zone:            '',
  auditor:         '',
  objective:       '',
  observation:     '',
  action_required: '',
  responsible:     '',
  due_date:        '',
  status:          'open',
  priority:        'medium',
})

const photoFile       = ref<File | null>(null)
const photoPreview    = ref<string | null>(null)
const existingImage   = ref<string | null>(null)
const photoInputRef   = ref<HTMLInputElement | null>(null)

function onPhotoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  photoFile.value    = file
  photoPreview.value = URL.createObjectURL(file)
}

function clearPhoto() {
  photoFile.value    = null
  photoPreview.value = null
  if (photoInputRef.value) photoInputRef.value.value = ''
}

function triggerPhotoInput() {
  photoInputRef.value?.click()
}

async function submit() {
  if (!form.date || !form.zone || !form.auditor || !form.observation) {
    toast.add({ severity: 'warn', summary: t('gemba.requiredFields'), detail: t('gemba.requiredFieldsDetail'), life: 3000 })
    return
  }

  loading.value = true
  try {
    const fd = new FormData()
    fd.append('date',            form.date)
    fd.append('zone',            form.zone)
    fd.append('auditor',         form.auditor)
    fd.append('observation',     form.observation)
    if (form.objective)       fd.append('objective',       form.objective)
    if (form.action_required) fd.append('action_required', form.action_required)
    if (form.responsible)     fd.append('responsible',     form.responsible)
    if (form.due_date)        fd.append('due_date',        form.due_date)
    fd.append('status',   form.status)
    fd.append('priority', form.priority)
    if (photoFile.value)  fd.append('image', photoFile.value)
    if (isEdit.value && existingImage.value === null && !photoFile.value) fd.append('remove_image', '1')

    if (isEdit.value) {
      await gembaApi.update(props.gemba!.id, fd)
      toast.add({ severity: 'success', summary: t('gemba.recordUpdated'), life: 3000 })
    } else {
      await gembaApi.create(fd)
      toast.add({ severity: 'success', summary: t('gemba.recordCreated'), life: 3000 })
    }

    emit('saved')
    emit('close')
  } catch (e: any) {
    const errors = e.response?.data?.errors
    if (errors) {
      const first = Object.values(errors).flat()[0] as string
      toast.add({ severity: 'error', summary: t('common.error'), detail: first, life: 4000 })
    } else {
      toast.add({ severity: 'error', summary: e.response?.data?.message ?? t('common.error'), life: 4000 })
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (props.gemba) {
    Object.assign(form, {
      date:            props.gemba.date            ?? '',
      zone:            props.gemba.zone            ?? '',
      auditor:         props.gemba.auditor         ?? '',
      objective:       props.gemba.objective       ?? '',
      observation:     props.gemba.observation     ?? '',
      action_required: props.gemba.action_required ?? '',
      responsible:     props.gemba.responsible     ?? '',
      due_date:        props.gemba.due_date        ?? '',
      status:          props.gemba.status          ?? 'open',
      priority:        props.gemba.priority        ?? 'medium',
    })
    existingImage.value = props.gemba.image ?? null
  }
})
</script>
