<template>
  <aside :class="[
    'w-64 bg-gray-900 flex flex-col h-full flex-shrink-0 transition-transform duration-200',
    'fixed inset-y-0 left-0 z-50 lg:static lg:z-auto lg:translate-x-0',
    open ? 'translate-x-0' : '-translate-x-full'
  ]">
    <!-- Logo / brand -->
    <div class="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
      <!-- Logo organisation -->
      <div class="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/10 flex items-center justify-center p-1">
        <img
          :src="auth.orgLogo ?? '/logos/logo-tcn.png'"
          class="w-full h-full object-contain"
          alt="Logo TCN"
          @error="(e) => { const el = e.target as HTMLImageElement; if (!el.dataset.fb) { el.dataset.fb='1'; el.src='/logos/logo-tcn.png' } }"
        />
      </div>
      <div class="min-w-0 flex-1">
        <div class="text-white font-semibold text-sm leading-tight truncate">Operix HSSE</div>
        <div class="text-gray-400 text-xs truncate">{{ auth.orgShortLabel }}</div>
      </div>
      <!-- Close button — mobile only -->
      <button @click="$emit('close')" class="lg:hidden text-gray-400 hover:text-white p-1 ml-1 flex-shrink-0">
        <XMarkIcon class="w-5 h-5" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
      <NavItem to="/" :icon="HomeIcon" :label="t('nav.dashboard')" exact />
      <NavItem to="/safety-tracker" :icon="ShieldCheckIcon" :label="t('nav.safetyTracker')" />

      <SidebarSection :label="t('nav.sectionPeople')" />
      <NavItem to="/employees"    :icon="UsersIcon"          :label="t('nav.employees')" />
      <NavItem to="/contractors"  :icon="BuildingOfficeIcon" :label="t('nav.contractors')" />
      <NavItem to="/visitors"     :icon="UserGroupIcon"      :label="t('nav.visitors')" />
      <NavItem to="/interns"      :icon="AcademicCapIcon"    :label="t('nav.interns')" />

      <SidebarSection :label="t('nav.sectionSafety')" />
      <NavItem to="/incidents"    :icon="ExclamationTriangleIcon" :label="t('nav.incidents')" />
      <NavItem to="/near-miss"    :icon="EyeIcon"        :label="t('nav.nearMiss')" />
      <NavItem to="/breaches"     :icon="XCircleIcon"    :label="t('nav.breaches')" />
      <NavItem to="/property-damage" :icon="WrenchScrewdriverIcon" :label="t('nav.propertyDamage')" />
      <NavItem to="/environment"  :icon="GlobeAltIcon"   :label="t('nav.environment')" />
      <NavItem to="/risks"        :icon="ShieldExclamationIcon" :label="t('nav.risks')" />

      <SidebarSection :label="t('nav.reports')" v-if="auth.isAdmin" />
      <NavItem to="/reports"      :icon="ChartBarIcon"   :label="t('nav.reports')"   v-if="auth.isAdmin" />
      <NavItem to="/audit"        :icon="ClockIcon"      :label="t('nav.audit')"      v-if="auth.isAdmin" />

      <SidebarSection :label="t('nav.sectionAdmin')" v-if="auth.can('users.manage')" />
      <NavItem to="/settings/users" :icon="UserCircleIcon" :label="t('nav.users')" v-if="auth.can('users.manage')" />

    </nav>

    <!-- User footer -->
    <div class="border-t border-gray-800 px-4 py-3">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
          {{ initials }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-white text-xs font-medium truncate">{{ auth.user?.name }}</div>
          <div class="text-gray-400 text-xs capitalize">{{ auth.user?.role }}</div>
        </div>
        <button @click="handleLogout" class="text-gray-400 hover:text-white transition-colors p-1 rounded">
          <ArrowRightOnRectangleIcon class="w-4 h-4" />
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import NavItem from './NavItem.vue'
import SidebarSection from './SidebarSection.vue'
import {
  HomeIcon, ShieldCheckIcon, UsersIcon, ExclamationTriangleIcon,
  EyeIcon, XCircleIcon, GlobeAltIcon, WrenchScrewdriverIcon, ShieldExclamationIcon,
  BuildingOfficeIcon, UserGroupIcon, ChartBarIcon, ClockIcon,
  UserCircleIcon, ArrowRightOnRectangleIcon, XMarkIcon, AcademicCapIcon,
} from '@heroicons/vue/24/outline'

defineProps<{ open: boolean }>()
defineEmits<{ close: [] }>()

const { t, locale } = useI18n()
const auth   = useAuthStore()
const router = useRouter()

const initials = computed(() => {
  const name = auth.user?.name ?? ''
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
})

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>
