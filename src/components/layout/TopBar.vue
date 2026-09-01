<template>
  <header class="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
    <div class="flex items-center gap-3">
      <!-- Hamburger — mobile only -->
      <button @click="$emit('toggle-sidebar')" class="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 flex-shrink-0">
        <Bars3Icon class="w-5 h-5" />
      </button>
      <h1 class="text-sm md:text-base font-semibold text-gray-900 truncate">{{ pageTitle }}</h1>
    </div>

    <div class="flex items-center gap-1 md:gap-2">
      <!-- Language switcher -->
      <div class="flex items-center bg-gray-100 rounded-lg p-0.5 text-xs font-semibold">
        <button
          @click="switchLang('fr')"
          :class="['px-2.5 py-1 rounded-md transition-all', currentLang === 'fr' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700']"
        >FR</button>
        <button
          @click="switchLang('en')"
          :class="['px-2.5 py-1 rounded-md transition-all', currentLang === 'en' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700']"
        >EN</button>
      </div>

      <!-- Centre de notifications (cloche deroulante) -->
      <NotificationBell />

      <!-- User avatar -->
      <RouterLink to="/settings" class="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors">
        <div class="w-7 h-7 rounded-full bg-[#0f2847] flex items-center justify-center text-white text-xs font-bold">
          {{ initials }}
        </div>
        <span class="text-xs text-gray-700 font-medium hidden sm:block max-w-[120px] truncate">{{ auth.user?.name }}</span>
      </RouterLink>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Bars3Icon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import NotificationBell from '@/components/notifications/NotificationBell.vue'
import { setLocale, getLocale } from '@/i18n'
import { useI18n } from 'vue-i18n'

defineEmits<{ 'toggle-sidebar': [] }>()

const auth       = useAuthStore()
const notifStore = useNotificationsStore()
const route      = useRoute()
const { t }      = useI18n()
const currentLang = ref<'fr' | 'en'>(getLocale())

function switchLang(lang: 'fr' | 'en') {
  setLocale(lang)
  currentLang.value = lang
}

const initials = computed(() => {
  const name = auth.user?.name ?? ''
  return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
})

const pageTitleMap = computed((): Record<string, string> => ({
  dashboard:       t('nav.dashboard'),
  'safety-tracker':t('nav.safetyTracker'),
  employees:       t('nav.employees'),
  interns:         t('nav.interns'),
  'employee-detail': t('employees.profile'),
  incidents:       t('nav.incidents'),
  'incident-detail': t('nav.incidents'),
  'near-miss':     t('nav.nearMiss'),
  'near-miss-detail': t('nav.nearMiss'),
  breaches:        t('nav.breaches'),
  environment:     t('nav.environment'),
  permits:         t('nav.permits'),
  'permit-detail': t('nav.permits'),
  equipment:       t('nav.equipment'),
  contractors:     t('nav.contractors'),
  visitors:        t('nav.visitors'),
  reports:         t('nav.reports'),
  notifications:   t('nav.notifications'),
  audit:           t('nav.audit'),
  settings:        t('nav.settings'),
  users:           t('nav.users'),
  departments:     t('nav.departments'),
}))

const pageTitle = computed(() => pageTitleMap.value[String(route.name)] ?? 'Operix HSSE')

onMounted(() => notifStore.fetchUnreadCount())
</script>
