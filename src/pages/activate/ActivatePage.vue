<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h1 class="text-xl font-semibold text-gray-900 mb-1">Activer votre compte Operix</h1>
      <p class="text-sm text-gray-500 mb-6">Définissez votre mot de passe pour accéder à votre espace.</p>

      <div v-if="done" class="text-center py-6">
        <p class="text-green-600 font-medium mb-4">✓ Compte activé.</p>
        <router-link to="/login" class="text-blue-600 hover:underline text-sm">Aller à la connexion</router-link>
      </div>

      <form v-else @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
          <input v-model="password" type="password" minlength="8" required
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
          <input v-model="passwordConfirmation" type="password" minlength="8" required
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <button type="submit" :disabled="loading || !token"
                class="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {{ loading ? 'Activation…' : 'Activer mon compte' }}
        </button>

        <p v-if="!token" class="text-xs text-red-500 text-center">Lien d'activation invalide (token manquant).</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { authApi } from '@/api'

const route = useRoute()
const token = ref<string>(String(route.query.token ?? ''))
const password = ref('')
const passwordConfirmation = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const done = ref(false)

async function submit() {
  error.value = null
  if (password.value !== passwordConfirmation.value) {
    error.value = 'Les mots de passe ne correspondent pas.'
    return
  }
  loading.value = true
  try {
    await authApi.activate(token.value, password.value, passwordConfirmation.value)
    done.value = true
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Activation impossible. Le lien est peut-être expiré.'
  } finally {
    loading.value = false
  }
}
</script>
