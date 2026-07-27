<template>
  <div class="min-h-full flex flex-col">

    <!-- Search bar zone -->
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
            :placeholder="t('agent.search.placeholder')"
            class="w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-gray-200 focus:border-brand-500 focus:outline-none text-base shadow-sm transition-colors"
            autocomplete="off"
            spellcheck="false"
          />
          <!-- Spinner (inside input, right side) -->
          <div v-if="loading" class="absolute right-4 top-1/2 -translate-y-1/2">
            <div class="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <button
            v-else-if="query"
            @click="clearSearch"
            class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Cached hint -->
        <p v-if="fromCache && total > 0" class="text-center text-xs text-gray-300 mt-2">
          {{ t('agent.search.cached') }}
        </p>
      </div>
    </div>

    <!-- Results -->
    <div class="flex-1 px-4 sm:px-8 py-6 max-w-4xl mx-auto w-full">

      <!-- Idle state -->
      <div v-if="!query" class="flex flex-col items-center justify-center py-24 text-gray-300">
        <MagnifyingGlassIcon class="w-16 h-16 mb-4" />
        <p class="text-lg font-medium text-gray-400">{{ t('agent.search.idle') }}</p>
        <p class="text-sm text-gray-300 mt-1">{{ t('agent.search.minChars') }}</p>
      </div>

      <!-- No results -->
      <div v-else-if="!loading && total === 0 && query.length >= 2" class="flex flex-col items-center justify-center py-24 text-gray-300">
        <FaceFrownIcon class="w-14 h-14 mb-3" />
        <p class="text-base font-medium text-gray-400">{{ t('agent.search.noResults') }} "{{ query }}"</p>
        <p class="text-sm text-gray-300 mt-1">{{ t('agent.search.tryOther') }}</p>
      </div>

      <!-- Results -->
      <div v-else-if="total > 0" class="space-y-6">
        <p class="text-xs text-gray-400 font-medium uppercase tracking-wider">{{ total }} {{ t('agent.search.results') }} "{{ query }}"</p>

        <!-- Employees -->
        <section v-if="results.employees.length">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
              <UsersIcon class="w-4 h-4 text-blue-600" />
            </div>
            <h3 class="text-sm font-semibold text-gray-700">{{ t('agent.sections.employees') }} <span class="text-gray-400 font-normal">({{ results.employees.length }})</span></h3>
          </div>
          <div class="grid gap-3">
            <div
              v-for="emp in results.employees"
              :key="`emp-${emp.id}`"
              class="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 sm:gap-4 shadow-sm"
            >
              <!-- Avatar -->
              <div class="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden bg-blue-100 flex items-center justify-center">
                <img v-if="emp.photo" :src="`/storage/${emp.photo}`" class="w-full h-full object-cover" @error="(e) => (e.target as HTMLImageElement).style.display='none'" loading="lazy" />
                <span class="text-blue-600 font-bold text-sm">{{ initials(emp.prenom, emp.nom) }}</span>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-semibold text-gray-900">{{ emp.prenom }} {{ emp.nom }}</span>
                  <span class="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{{ emp.matricule }}</span>
                  <span :class="emp.induction_status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'" class="text-xs px-2 py-0.5 rounded-full font-medium">
                    {{ t('agent.induction') }} : {{ emp.induction_status ? t('common.yes') : t('common.no') }}
                  </span>
                </div>
                <div class="text-sm text-gray-500 mt-0.5 truncate">{{ emp.poste }} <span v-if="emp.department" class="text-gray-400">· {{ emp.department.name }}</span></div>
                <div class="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span v-if="emp.phone"><PhoneIcon class="w-3 h-3 inline mr-0.5" />{{ emp.phone }}</span>
                  <span v-if="emp.nni">NNI: {{ emp.nni }}</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        <!-- Visitors -->
        <section v-if="results.visitors.length">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
              <UserIcon class="w-4 h-4 text-orange-600" />
            </div>
            <h3 class="text-sm font-semibold text-gray-700">{{ t('agent.sections.visitors') }} <span class="text-gray-400 font-normal">({{ results.visitors.length }})</span></h3>
          </div>
          <div class="grid gap-3">
            <div
              v-for="vis in results.visitors"
              :key="`vis-${vis.id}`"
              class="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 sm:gap-4 shadow-sm"
            >
              <div class="w-12 h-12 rounded-full flex-shrink-0 bg-orange-100 flex items-center justify-center">
                <span class="text-orange-600 font-bold text-sm">{{ initials(vis.prenom, vis.nom) }}</span>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-semibold text-gray-900">{{ vis.prenom }} {{ vis.nom }}</span>
                  <span v-if="vis.badge_number" class="text-xs font-mono bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-100">Badge {{ vis.badge_number }}</span>
                  <span :class="vis.status === 'checked_in' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'" class="text-xs px-2 py-0.5 rounded-full font-medium">
                    {{ vis.status === 'checked_in' ? t('agent.checkedIn') : vis.status === 'checked_out' ? t('agent.checkedOut') : t('agent.planned') }}
                  </span>
                </div>
                <div class="text-sm text-gray-500 mt-0.5 truncate">
                  {{ vis.entreprise || t('agent.individual') }}
                  <span v-if="vis.motif" class="text-gray-400"> · {{ vis.motif }}</span>
                </div>
                <div class="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span v-if="vis.phone"><PhoneIcon class="w-3 h-3 inline mr-0.5" />{{ vis.phone }}</span>
                  <span v-if="vis.checked_in_at">{{ t('agent.entry') }}: {{ formatTime(vis.checked_in_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Contractors -->
        <section v-if="results.contractors.length">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
              <BuildingOfficeIcon class="w-4 h-4 text-purple-600" />
            </div>
            <h3 class="text-sm font-semibold text-gray-700">{{ t('agent.sections.contractors') }} <span class="text-gray-400 font-normal">({{ results.contractors.length }})</span></h3>
          </div>
          <div class="grid gap-3">
            <div
              v-for="ctr in results.contractors"
              :key="`ctr-${ctr.id}`"
              class="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 sm:gap-4 shadow-sm"
            >
              <div class="w-12 h-12 rounded-full flex-shrink-0 bg-purple-100 flex items-center justify-center">
                <span class="text-purple-600 font-bold text-sm">{{ (ctr.company_name ?? '?')[0].toUpperCase() }}</span>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-semibold text-gray-900">{{ ctr.company_name }}</span>
                  <span :class="ctr.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'" class="text-xs px-2 py-0.5 rounded-full font-medium capitalize">
                    {{ ctr.status }}
                  </span>
                </div>
                <div class="text-sm text-gray-500 mt-0.5">{{ ctr.activite }}</div>
                <div class="text-xs text-gray-400 mt-1">
                  {{ t('agent.contact') }}: {{ ctr.contact_nom }}
                  <span v-if="ctr.contact_phone"><PhoneIcon class="w-3 h-3 inline mx-1" />{{ ctr.contact_phone }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Contractor employees -->
        <section v-if="results.contractor_employees.length">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
              <UserGroupIcon class="w-4 h-4 text-emerald-600" />
            </div>
            <h3 class="text-sm font-semibold text-gray-700">{{ t('agent.sections.contractorEmps') }} <span class="text-gray-400 font-normal">({{ results.contractor_employees.length }})</span></h3>
          </div>
          <div class="grid gap-3">
            <div
              v-for="ce in results.contractor_employees"
              :key="`ce-${ce.id}`"
              class="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 sm:gap-4 shadow-sm"
            >
              <div class="w-12 h-12 rounded-full flex-shrink-0 bg-emerald-100 flex items-center justify-center">
                <span class="text-emerald-600 font-bold text-sm">{{ initials(ce.prenom, ce.nom) }}</span>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-semibold text-gray-900">{{ ce.prenom }} {{ ce.nom }}</span>
                  <span v-if="ce.badge_number" class="text-xs font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">Badge {{ ce.badge_number }}</span>
                  <span :class="ce.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'" class="text-xs px-2 py-0.5 rounded-full font-medium">
                    {{ ce.is_active ? t('common.active') : t('common.inactive') }}
                  </span>
                </div>
                <div class="text-sm text-gray-500 mt-0.5">{{ ce.poste }}</div>
                <div class="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span v-if="ce.contractor" class="font-medium text-purple-600">{{ ce.contractor.company_name }}</span>
                  <span v-if="ce.cin">CIN: {{ ce.cin }}</span>
                  <span v-if="ce.phone"><PhoneIcon class="w-3 h-3 inline mr-0.5" />{{ ce.phone }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { searchApi } from '@/api'
import {
  MagnifyingGlassIcon, XMarkIcon, UsersIcon, UserIcon,
  BuildingOfficeIcon, UserGroupIcon, PhoneIcon,
} from '@heroicons/vue/24/outline'
import { FaceFrownIcon } from '@heroicons/vue/24/solid'

const { t }    = useI18n()
const inputRef = ref<HTMLInputElement | null>(null)
const query    = ref('')
const loading  = ref(false)
const fromCache = ref(false)

type SearchResults = {
  employees: any[]
  visitors: any[]
  contractors: any[]
  contractor_employees: any[]
}

const EMPTY: SearchResults = { employees: [], visitors: [], contractors: [], contractor_employees: [] }
const results  = ref<SearchResults>({ ...EMPTY })

const total = computed(() =>
  results.value.employees.length +
  results.value.visitors.length +
  results.value.contractors.length +
  results.value.contractor_employees.length
)

// ── Session cache ─────────────────────────────────────────────────────────────
const CACHE_NS  = 'operix_search_'
const CACHE_TTL = 5 * 60 * 1000 // 5 min

function readCache(q: string): SearchResults | null {
  try {
    const raw = sessionStorage.getItem(CACHE_NS + q.toLowerCase())
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data
  } catch { return null }
}

function writeCache(q: string, data: SearchResults) {
  try {
    sessionStorage.setItem(CACHE_NS + q.toLowerCase(), JSON.stringify({ ts: Date.now(), data }))
  } catch {}
}

// ── AbortController ───────────────────────────────────────────────────────────
let ctrl: AbortController | null = null

let debounceTimer: ReturnType<typeof setTimeout>
function onInput() {
  clearTimeout(debounceTimer)
  fromCache.value = false

  if (query.value.length < 2) {
    ctrl?.abort()
    results.value = { ...EMPTY }
    loading.value = false
    return
  }

  // Show cached result instantly while possibly re-fetching
  const cached = readCache(query.value)
  if (cached) {
    results.value = cached
    fromCache.value = true
    loading.value = false
    return
  }

  loading.value = true
  debounceTimer = setTimeout(doSearch, 280)
}

async function doSearch() {
  // Cancel any in-flight request
  ctrl?.abort()
  ctrl = new AbortController()

  try {
    const { data } = await searchApi.search(query.value, ctrl.signal)
    results.value  = data
    fromCache.value = false
    writeCache(query.value, data)
  } catch (err: any) {
    // Ignore cancellations (user typed another char)
    if (err?.code !== 'ERR_CANCELED' && err?.name !== 'AbortError') {
      results.value = { ...EMPTY }
    }
  } finally {
    loading.value = false
  }
}

function clearSearch() {
  ctrl?.abort()
  query.value     = ''
  results.value   = { ...EMPTY }
  fromCache.value = false
  loading.value   = false
  inputRef.value?.focus()
}

function initials(prenom?: string, nom?: string) {
  return ((prenom?.[0] ?? '') + (nom?.[0] ?? '')).toUpperCase() || '?'
}

function formatTime(dt: string) {
  return new Date(dt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => nextTick(() => inputRef.value?.focus()))
onUnmounted(() => ctrl?.abort())
</script>
