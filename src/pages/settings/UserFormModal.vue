<template>
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl">

      <div class="flex items-center justify-between p-6 border-b">
        <h3 class="font-semibold text-gray-900">
          {{ user ? t('users.editUser') : t('users.newUser') }}
        </h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600"><XMarkIcon class="w-5 h-5" /></button>
      </div>

      <form @submit.prevent="submit" class="p-6 space-y-4">
        <!-- Infos de base -->
        <div><label class="label">{{ t('users.fullName') }} *</label><input v-model="form.name" class="input" required /></div>
        <div><label class="label">{{ t('users.email') }} *</label><input v-model="form.email" type="email" class="input" required :disabled="!!user" /></div>

        <div class="grid grid-cols-2 gap-4">
          <div><label class="label">{{ t('users.employeeId') }}</label><input v-model="form.matricule" class="input" /></div>
          <div>
            <label class="label">{{ t('users.role') }} *</label>
            <select v-model="form.role" class="input" required>
              <!-- Les seuls roles que l'API accepte pour un compte d'entreprise.
                   `super_admin` en est exclu : il ne s'attribue pas depuis ici. -->
              <option value="agent">{{ t('users.roleAgent') }}</option>
              <option value="supervisor">{{ t('users.roleSupervisor') }}</option>
              <option value="hsse_manager">{{ t('users.roleHsseManager') }}</option>
              <option value="company_admin">{{ t('users.roleCompanyAdmin') }}</option>
            </select>
          </div>
        </div>

        <!-- PIN pour création -->
        <div v-if="!user">
          <label class="label">{{ t('users.pinCode') }} * <span class="text-gray-400 font-normal text-xs">{{ t('users.pinMinChars') }}</span></label>
          <div class="relative">
            <input v-model="form.password" :type="showPin ? 'text' : 'password'" class="input pr-10" required minlength="4" :placeholder="t('users.newPin')" />
            <button type="button" @click="showPin = !showPin" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <EyeIcon v-if="!showPin" class="w-4 h-4" />
              <EyeSlashIcon v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Reset PIN pour modification -->
        <div v-if="user" class="border border-amber-200 bg-amber-50 rounded-xl p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-amber-800">{{ t('users.resetPin') }}</span>
            <button type="button" @click="showResetPin = !showResetPin" class="text-xs text-amber-700 underline">
              {{ showResetPin ? t('users.cancelChangePin') : t('users.changePin') }}
            </button>
          </div>
          <div v-if="showResetPin" class="space-y-2">
            <div class="relative">
              <input v-model="form.password" :type="showPin ? 'text' : 'password'" class="input pr-10" minlength="4" :placeholder="t('users.newPin')" />
              <button type="button" @click="showPin = !showPin" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <EyeIcon v-if="!showPin" class="w-4 h-4" />
                <EyeSlashIcon v-else class="w-4 h-4" />
              </button>
            </div>
            <p class="text-xs text-amber-700">{{ t('users.pinNote') }}</p>
          </div>
          <p v-else class="text-xs text-amber-600">{{ t('users.pinKeep') }}</p>
        </div>

        <!-- Statut -->
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div class="relative inline-flex items-center cursor-pointer" @click="form.is_active = !form.is_active">
            <div :class="['w-10 h-5 rounded-full transition-colors', form.is_active ? 'bg-green-500' : 'bg-gray-300']"></div>
            <div :class="['absolute w-4 h-4 bg-white rounded-full shadow transition-transform', form.is_active ? 'translate-x-5' : 'translate-x-0.5']"></div>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-700">{{ form.is_active ? t('users.accountActive') : t('users.accountInactive') }}</span>
            <p class="text-xs text-gray-400">{{ form.is_active ? t('users.canLogin') : t('users.isBlocked') }}</p>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="$emit('close')" class="btn-secondary">{{ t('common.cancel') }}</button>
          <button type="submit" :disabled="loading" class="btn-primary">
            <span v-if="loading" class="flex items-center gap-1.5">
              <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              {{ t('users.saving') }}
            </span>
            <span v-else>{{ user ? t('common.save') : t('users.createAccount') }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { usersApi } from '@/api'
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{ user?: any }>()
const emit  = defineEmits<{ close: []; saved: [] }>()

const { t }        = useI18n()
const toast        = useToast()
const loading      = ref(false)
const showPin      = ref(false)
const showResetPin = ref(false)
const form = reactive({ name:'', email:'', matricule:'', role:'agent', password:'', is_active:true })

watch(() => props.user, (u) => {
  if (u) Object.assign(form, { name: u.name, email: u.email, matricule: u.matricule ?? '', role: u.role, is_active: u.is_active, password: '' })
}, { immediate: true })

async function submit() {
  loading.value = true
  try {
    const payload: Record<string, unknown> = {
      name:      form.name,
      matricule: form.matricule || null,
      role:      form.role,
      is_active: form.is_active,
    }

    if (!props.user) {
      payload.email    = form.email
      payload.password = form.password
    } else if (form.password.trim()) {
      payload.password = form.password
    }

    if (props.user?.id) {
      await usersApi.update(props.user.id, payload)
      toast.add({ severity: 'success', summary: t('users.updated'), life: 3000 })
    } else {
      await usersApi.create(payload)
      toast.add({ severity: 'success', summary: t('users.created'), detail: `PIN: ${form.password}`, life: 8000 })
    }

    emit('saved')
    emit('close')
  } catch (e: any) {
    const errors = e.response?.data?.errors
    const msg    = errors ? Object.values(errors).flat().join(' | ') : (e.response?.data?.message ?? t('common.error'))
    toast.add({ severity: 'error', summary: msg, life: 5000 })
  } finally {
    loading.value = false
  }
}
</script>
