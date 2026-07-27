<template>
  <div class="flex h-screen bg-gray-50 overflow-hidden">

    <!-- Mobile overlay -->
    <Transition name="overlay">
      <div v-if="sidebarOpen" class="fixed inset-0 bg-black/50 z-40 lg:hidden" @click="sidebarOpen = false" />
    </Transition>

    <!-- Sidebar -->
    <aside :class="[
      'w-64 bg-gray-900 flex flex-col flex-shrink-0 transition-transform duration-200',
      'fixed inset-y-0 left-0 z-50 lg:static lg:z-auto lg:translate-x-0',
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'
    ]">
      <!-- Logo -->
      <div class="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
        <div class="w-9 h-9 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center p-1 flex-shrink-0">
          <img :src="auth.orgLogo ?? '/storage/logos/logo-tcn.png'" class="w-full h-full object-contain" alt="Logo" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-white font-bold text-sm leading-tight">Operix HSSE</div>
          <div class="text-gray-400 text-xs truncate">{{ auth.orgShortLabel }}</div>
        </div>
        <button @click="sidebarOpen = false" class="lg:hidden text-gray-400 hover:text-white p-1 flex-shrink-0">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Spacer -->
      <div class="flex-1 flex flex-col justify-center px-6 py-8 gap-4">
        <div class="flex items-center justify-center">
          <span class="inline-flex items-center gap-1.5 bg-brand-600/20 text-brand-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-brand-600/30">
            <ShieldCheckIcon class="w-3.5 h-3.5" />
            {{ t('agent.role') }}
          </span>
        </div>
        <p class="text-gray-500 text-xs text-center leading-relaxed">{{ t('agent.hint') }}</p>
      </div>

      <!-- Language switcher -->
      <div class="px-4 pb-3">
        <div class="flex items-center bg-gray-800 rounded-lg p-0.5 text-xs font-semibold w-full">
          <button
            @click="switchLang('fr')"
            :class="['flex-1 py-1.5 rounded-md transition-all text-center', currentLang === 'fr' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200']"
          >FR</button>
          <button
            @click="switchLang('en')"
            :class="['flex-1 py-1.5 rounded-md transition-all text-center', currentLang === 'en' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200']"
          >EN</button>
        </div>
      </div>

      <!-- User footer -->
      <div class="border-t border-gray-800 px-4 py-4">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {{ initials }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-white text-sm font-medium truncate">{{ auth.user?.name }}</div>
            <div class="text-gray-400 text-xs">{{ t('agent.role') }}</div>
          </div>
        </div>
        <button @click="handleLogout" class="w-full flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-colors rounded-lg px-3 py-2">
          <ArrowRightOnRectangleIcon class="w-4 h-4" />
          {{ t('agent.logout') }}
        </button>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col overflow-hidden min-w-0">
      <!-- Mobile topbar -->
      <div class="h-14 bg-white border-b border-gray-200 flex items-center gap-3 px-4 lg:hidden flex-shrink-0">
        <button @click="sidebarOpen = true" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">
          <Bars3Icon class="w-5 h-5" />
        </button>
        <span class="text-sm font-semibold text-gray-900 flex-1">{{ t('agent.role') }}</span>
        <!-- Lang switcher mobile -->
        <div class="flex items-center bg-gray-100 rounded-lg p-0.5 text-xs font-semibold">
          <button @click="switchLang('fr')" :class="['px-2.5 py-1 rounded-md transition-all', currentLang === 'fr' ? 'bg-white shadow text-gray-900' : 'text-gray-500']">FR</button>
          <button @click="switchLang('en')" :class="['px-2.5 py-1 rounded-md transition-all', currentLang === 'en' ? 'bg-white shadow text-gray-900' : 'text-gray-500']">EN</button>
        </div>
      </div>

      <main class="flex-1 overflow-y-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { setLocale, getLocale } from '@/i18n'
import { ShieldCheckIcon, ArrowRightOnRectangleIcon, XMarkIcon, Bars3Icon } from '@heroicons/vue/24/outline'

const { t }   = useI18n()
const auth    = useAuthStore()
const router  = useRouter()
const sidebarOpen = ref(false)
const currentLang = ref<'fr' | 'en'>(getLocale())

function switchLang(lang: 'fr' | 'en') {
  setLocale(lang)
  currentLang.value = lang
}

const initials = computed(() => {
  const name = auth.user?.name ?? ''
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
})

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.2s ease; }
.overlay-enter-from,  .overlay-leave-to      { opacity: 0; }
</style>
