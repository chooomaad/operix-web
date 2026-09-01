<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

      <div class="flex items-center gap-3 mb-8">
        <img :src="operixLogoUrl" class="w-9 h-9 object-contain"
             alt="Operix" @error="(e) => { (e.target as HTMLImageElement).style.display='none' }" />
        <span class="font-bold text-gray-800 text-sm tracking-tight">Operix HSSE</span>
      </div>

      <!-- Lien absent ou deja utilise : on ne propose meme pas le formulaire. -->
      <div v-if="!token">
        <h2 class="text-xl font-bold text-gray-900 mb-2">{{ t('auth.resetLinkInvalidTitle') }}</h2>
        <p class="text-gray-500 text-sm mb-6">{{ t('auth.resetLinkInvalidBody') }}</p>
        <router-link to="/login" class="block w-full py-3 text-center bg-[#0f2847] hover:bg-[#1a3a6b] text-white font-semibold rounded-xl transition-colors">
          {{ t('auth.backToLogin') }}
        </router-link>
      </div>

      <!-- Succes : redirection vers la connexion. -->
      <div v-else-if="done">
        <h2 class="text-xl font-bold text-gray-900 mb-2">{{ t('auth.resetDoneTitle') }}</h2>
        <div class="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-6">
          {{ t('auth.resetDoneBody') }}
        </div>
        <router-link to="/login" class="block w-full py-3 text-center bg-[#0f2847] hover:bg-[#1a3a6b] text-white font-semibold rounded-xl transition-colors">
          {{ t('auth.signInNow') }}
        </router-link>
      </div>

      <!-- Formulaire : nouveau PIN + confirmation. -->
      <div v-else>
        <h2 class="text-xl font-bold text-gray-900 mb-1">{{ t('auth.newPinTitle') }}</h2>
        <p class="text-gray-500 text-sm mb-6">{{ t('auth.newPinSubtitle') }}</p>

        <div class="space-y-3">
          <div>
            <label class="label">{{ t('auth.newPin') }}</label>
            <input v-model="newPin" type="password" class="input" placeholder="••••••" maxlength="50"
                   autocomplete="new-password" />
          </div>
          <div>
            <label class="label">{{ t('auth.confirmNewPin') }}</label>
            <input v-model="confirm" type="password" class="input" placeholder="••••••" maxlength="50"
                   autocomplete="new-password" @keyup.enter="submit" />
          </div>
        </div>

        <div v-if="error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{{ error }}</div>

        <button @click="submit" :disabled="loading"
                class="mt-5 w-full py-3 bg-[#0f2847] hover:bg-[#1a3a6b] text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
          <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ loading ? t('auth.resetting') : t('auth.resetPinBtn') }}
        </button>

        <router-link to="/login" class="block w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-4">
          {{ t('auth.backToLogin') }}
        </router-link>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { authApi } from '@/api'

const { t }  = useI18n()
const operixLogoUrl = '/logos/logo-operix.png'
const route  = useRoute()
const router = useRouter()

// Le token arrive dans l'URL du lien email. Absent = lien invalide.
const token = ref(String(route.query.token ?? ''))

const newPin  = ref('')
const confirm = ref('')
const loading = ref(false)
const error   = ref('')
const done    = ref(false)

async function submit() {
  if (loading.value) return
  if (!newPin.value || !confirm.value) { error.value = t('auth.errors.fillAllFields'); return }
  if (newPin.value !== confirm.value)  { error.value = t('auth.errors.pinMismatch'); return }

  loading.value = true; error.value = ''
  try {
    await authApi.resetPin({
      token: token.value,
      new_pin: newPin.value,
      new_pin_confirmation: confirm.value,
    })
    done.value = true
    // Retour a la connexion apres un court delai lisible.
    setTimeout(() => router.push({ name: 'login' }), 2500)
  } catch (e: any) {
    // Le serveur renvoie un message generique (lien invalide/expire) ou les
    // erreurs de validation du PIN.
    const errors = (e.response?.data?.errors ?? {}) as Record<string, string[]>
    const firstFieldError = Object.values(errors)[0]?.[0]
    error.value = e.response?.data?.message ?? firstFieldError ?? t('common.error')
  } finally { loading.value = false }
}
</script>
