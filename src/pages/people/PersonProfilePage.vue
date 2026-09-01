<template>
  <div class="p-6 space-y-6" v-if="person">
    <!-- Header -->
    <div class="flex items-center gap-4 flex-wrap">
      <button @click="$router.back()" class="text-gray-400 hover:text-gray-600 p-1"><ArrowLeftIcon class="w-5 h-5" /></button>
      <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0" :class="avatarClass">
        {{ initials }}
      </div>
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

    <!-- KPI HSSE -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="card-sm text-center"><div class="text-2xl font-black text-red-600">{{ stats.incidents_count ?? 0 }}</div><div class="text-xs text-gray-500 mt-0.5">{{ t('nav.incidents') }}</div></div>
      <div class="card-sm text-center"><div class="text-2xl font-black text-orange-500">{{ stats.near_miss_count ?? 0 }}</div><div class="text-xs text-gray-500 mt-0.5">{{ t('nav.nearMiss') }}</div></div>
      <div class="card-sm text-center"><div class="text-2xl font-black text-amber-500">{{ stats.breaches_count ?? 0 }}</div><div class="text-xs text-gray-500 mt-0.5">{{ t('nav.breaches') }}</div></div>
      <div class="card-sm text-center"><div class="text-2xl font-black text-teal-600">{{ stats.environment_count ?? 0 }}</div><div class="text-xs text-gray-500 mt-0.5">{{ t('nav.environment') }}</div></div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200 flex gap-1 overflow-x-auto">
      <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
        :class="['px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap flex items-center gap-1.5',
          activeTab === tab.key ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700']">
        <span>{{ tab.label }}</span>
        <span :class="['text-xs rounded-full px-1.5 py-0.5 font-semibold', tab.count > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500']">{{ tab.count }}</span>
      </button>
    </div>

    <!-- Listes -->
    <div v-for="tab in tabs" :key="tab.key + '-list'">
      <div v-if="activeTab === tab.key">
        <div v-if="tab.rows.length" class="space-y-2">
          <RouterLink v-for="ev in tab.rows" :key="ev.id" :to="tab.link + ev.id" class="card-sm flex items-center gap-4 hover:bg-gray-50 transition-colors">
            <span :class="severityClass(ev.severity)" class="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">{{ (ev.severity || '').toUpperCase() || '—' }}</span>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 text-sm">{{ ev.reference }}<span v-if="ev.location"> — {{ ev.location }}</span><span v-else-if="ev.type"> · {{ ev.type }}</span></div>
              <div class="text-xs text-gray-500 truncate">{{ ev.description }}</div>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="text-xs text-gray-500">{{ ev.date }}</div>
              <span class="text-xs" :class="ev.status === 'closed' ? 'text-green-600' : 'text-amber-600'">{{ ev.status }}</span>
            </div>
          </RouterLink>
        </div>
        <div v-else class="card text-center py-10 text-gray-400 text-sm">{{ t('common.noData') }}</div>
      </div>
    </div>
  </div>

  <div v-else class="flex items-center justify-center h-64">
    <div class="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { peopleApi, reportsApi } from '@/api'
import { useDownload } from '@/composables/useDownload'
import { ArrowLeftIcon, DocumentArrowDownIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const { t } = useI18n()
const { downloadPdf } = useDownload()

const type = computed(() => String(route.params.type))
const idParam = computed(() => Number(route.params.id))

const person = ref<any>(null)
const stats = ref<any>({})
const incidents = ref<any[]>([])
const nearMiss = ref<any[]>([])
const breaches = ref<any[]>([])
const environment = ref<any[]>([])
const activeTab = ref('incidents')
const downloading = ref(false)

const tabs = computed(() => [
  { key: 'incidents',   label: t('nav.incidents'),   count: incidents.value.length,   rows: incidents.value,   link: '/incidents/' },
  { key: 'near_miss',   label: t('nav.nearMiss'),    count: nearMiss.value.length,    rows: nearMiss.value,    link: '/near-miss/' },
  { key: 'breaches',    label: t('nav.breaches'),    count: breaches.value.length,    rows: breaches.value,    link: '/breaches/' },
  { key: 'environment', label: t('nav.environment'), count: environment.value.length, rows: environment.value, link: '/environment/' },
])

const initials = computed(() => (person.value?.full_name || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase())
const avatarClass = computed(() => ({ employee: 'bg-blue-100 text-blue-600', contractor: 'bg-amber-100 text-amber-600', visitor: 'bg-sky-100 text-sky-600', intern: 'bg-violet-100 text-violet-600' }[type.value] ?? 'bg-brand-100 text-brand-600'))
const typeClass = computed(() => ({ employee: 'bg-blue-50 text-blue-700', contractor: 'bg-amber-50 text-amber-700', visitor: 'bg-sky-50 text-sky-700', intern: 'bg-violet-50 text-violet-700' }[type.value] ?? 'bg-gray-100 text-gray-600'))
const dotClass = computed(() => ({ employee: 'bg-blue-500', contractor: 'bg-amber-500', visitor: 'bg-sky-500', intern: 'bg-violet-500' }[type.value] ?? 'bg-gray-400'))

function severityClass(s: string) {
  return ({ low: 'bg-green-100 text-green-700', medium: 'bg-amber-100 text-amber-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' } as Record<string, string>)[s] ?? 'bg-gray-100 text-gray-600'
}

async function load() {
  person.value = null
  const { data } = await peopleApi.history(type.value, idParam.value)
  person.value = data.person
  stats.value = data.stats ?? {}
  incidents.value = data.incidents ?? []
  nearMiss.value = data.near_miss ?? []
  breaches.value = data.breaches ?? []
  environment.value = data.environment ?? []
}

async function exportPdf() {
  downloading.value = true
  try {
    await downloadPdf(() => reportsApi.personProfile(type.value, idParam.value), `profil-${type.value}-${person.value?.identifier ?? idParam.value}.pdf`)
  } finally { downloading.value = false }
}

watch(() => route.fullPath, load)
onMounted(load)
</script>
