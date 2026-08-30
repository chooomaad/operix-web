<template>
  <div class="min-h-full flex flex-col">
    <!-- Zone de recherche -->
    <div class="bg-white border-b border-gray-100 px-4 sm:px-8 py-6 sm:py-8">
      <div class="max-w-2xl mx-auto">
        <h1 class="text-center text-2xl font-bold text-gray-900 mb-1">{{ t('agent.search.title') }}</h1>
        <p class="text-center text-sm text-gray-400 mb-6">{{ t('agent.search.subtitle') }}</p>

        <div class="relative">
          <MagnifyingGlassIcon class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref="inputRef"
            v-model="query"
            @input="onInput"
            type="text"
            inputmode="search"
            :placeholder="t('agent.search.placeholder')"
            class="w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-gray-200 focus:border-brand-500 focus:outline-none text-base shadow-sm transition-colors"
            autocomplete="off"
            spellcheck="false"
          />
          <div v-if="loading" class="absolute right-4 top-1/2 -translate-y-1/2">
            <div class="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <button
            v-else-if="query"
            @click="clearSearch"
            class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            :aria-label="t('agent.search.clear')"
          >
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Résultats -->
    <div class="flex-1 px-4 sm:px-8 py-6 max-w-3xl mx-auto w-full">
      <!-- Idle -->
      <div v-if="query.length < MIN_CHARS" class="flex flex-col items-center justify-center py-24 text-center">
        <MagnifyingGlassIcon class="w-16 h-16 mb-4 text-gray-200" />
        <p class="text-lg font-medium text-gray-400">{{ t('agent.search.idle') }}</p>
        <p class="text-sm text-gray-300 mt-1">{{ t('agent.search.minChars') }}</p>
      </div>

      <!-- Chargement -->
      <div v-else-if="loading && results.length === 0" class="flex flex-col items-center justify-center py-24 text-center">
        <div class="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-sm text-gray-400">{{ t('agent.search.searching') }}</p>
      </div>

      <!-- Aucun résultat -->
      <div v-else-if="!loading && results.length === 0" class="flex flex-col items-center justify-center py-24 text-center">
        <FaceFrownIcon class="w-14 h-14 mb-3 text-gray-200" />
        <p class="text-base font-medium text-gray-400">{{ t('agent.search.noResults') }}</p>
      </div>

      <!-- Liste -->
      <div v-else class="space-y-3">
        <p class="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
          {{ results.length }} {{ t('agent.search.results') }}
        </p>
        <div
          v-for="emp in results"
          :key="emp.matricule"
          class="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm"
        >
          <div class="w-11 h-11 rounded-full flex-shrink-0 bg-brand-50 flex items-center justify-center">
            <span class="text-brand-600 font-bold text-sm">{{ initials(emp.name) }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-gray-900 truncate">{{ emp.name }}</div>
            <div class="text-xs font-mono text-gray-500 mt-0.5">{{ emp.matricule }}</div>
          </div>
          <span
            class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
            :class="statusClass(emp.status)"
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="dotClass(emp.status)"></span>
            {{ t('agent.status.' + emp.status) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { agentApi } from '@/api'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { FaceFrownIcon } from '@heroicons/vue/24/solid'

interface AgentEmployee {
  matricule: string
  name: string
  status: 'active' | 'inactive'
}

const { t } = useI18n()
const MIN_CHARS = 2
const DEBOUNCE_MS = 350

const inputRef = ref<HTMLInputElement | null>(null)
const query = ref('')
const results = ref<AgentEmployee[]>([])
const loading = ref(false)

let debounceTimer: ReturnType<typeof setTimeout>
let ctrl: AbortController | null = null

function onInput() {
  clearTimeout(debounceTimer)

  // Sous le minimum : aucune requête, on ne révèle rien.
  if (query.value.trim().length < MIN_CHARS) {
    ctrl?.abort()
    results.value = []
    loading.value = false
    return
  }

  // Debounce : on n'interroge PAS le serveur à chaque frappe.
  loading.value = true
  debounceTimer = setTimeout(doSearch, DEBOUNCE_MS)
}

async function doSearch() {
  ctrl?.abort()
  ctrl = new AbortController()
  try {
    const { data } = await agentApi.searchEmployees(query.value.trim(), ctrl.signal)
    results.value = data.data ?? []
  } catch (err: any) {
    // On ignore les annulations (frappe suivante) ; sinon liste vide, sans détail.
    if (err?.code !== 'ERR_CANCELED' && err?.name !== 'AbortError') {
      results.value = []
    }
  } finally {
    loading.value = false
  }
}

function clearSearch() {
  ctrl?.abort()
  query.value = ''
  results.value = []
  loading.value = false
  inputRef.value?.focus()
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}

function statusClass(status: string): string {
  return status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
}
function dotClass(status: string): string {
  return status === 'active' ? 'bg-green-500' : 'bg-gray-400'
}

onMounted(() => nextTick(() => inputRef.value?.focus()))
onUnmounted(() => ctrl?.abort())
</script>
