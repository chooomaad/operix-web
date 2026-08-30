<template>
  <div ref="root" class="relative">
    <!-- Cloche + compteur de non-lues -->
    <button
      class="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      :aria-label="t('notifications.title')"
      @click="toggle"
    >
      <BellIcon class="w-5 h-5 text-gray-600" />
      <span
        v-if="store.unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
      >{{ store.unreadCount > 9 ? '9+' : store.unreadCount }}</span>
    </button>

    <!-- Panneau deroulant -->
    <Transition name="nc-fade">
      <div
        v-if="open"
        class="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"
      >
        <!-- En-tete -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span class="font-semibold text-sm text-gray-900">{{ t('notifications.title') }}</span>
          <button
            v-if="store.unreadCount > 0"
            class="text-xs text-brand-600 hover:text-brand-700 font-medium"
            @click="onMarkAll"
          >{{ t('notifications.markAllRead') }}</button>
        </div>

        <!-- Liste -->
        <div class="max-h-96 overflow-y-auto">
          <div v-if="store.loading" class="px-4 py-6 text-center text-sm text-gray-400">
            {{ t('notifications.loading') }}
          </div>

          <div v-else-if="store.items.length === 0" class="px-4 py-8 text-center text-sm text-gray-400">
            {{ t('notif.empty') }}
          </div>

          <button
            v-for="n in store.items.slice(0, 8)"
            :key="n.id"
            class="w-full text-left flex gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
            :class="{ 'bg-blue-50/40': !n.read_at }"
            @click="onOpen(n)"
          >
            <span class="mt-1 w-2 h-2 rounded-full flex-shrink-0" :class="dotClass(n.data.type)" />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-900 truncate">{{ n.data.title }}</span>
                <span v-if="!n.read_at" class="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
              </div>
              <p class="text-xs text-gray-500 truncate">{{ n.data.body }}</p>
              <span class="text-[11px] text-gray-400">{{ relativeTime(n.created_at) }}</span>
            </div>
          </button>
        </div>

        <!-- Pied : acces a la page complete -->
        <RouterLink
          to="/notifications"
          class="block px-4 py-2.5 text-center text-xs font-medium text-brand-600 hover:bg-gray-50 border-t border-gray-100"
          @click="open = false"
        >{{ t('notif.viewAll') }}</RouterLink>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { BellIcon } from '@heroicons/vue/24/outline'
import { useNotificationsStore, type Notification } from '@/stores/notifications'

const { t } = useI18n()
const store = useNotificationsStore()
const router = useRouter()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function toggle() {
  open.value = !open.value
  // On charge la liste a l'ouverture, jamais avant : une cloche fermee n'a besoin
  // que du compteur, deja recupere par le TopBar.
  if (open.value) store.fetchAll()
}

async function onMarkAll() {
  await store.markAllRead()
}

async function onOpen(n: Notification) {
  if (!n.read_at) await store.markRead(n.id)
  open.value = false
  // Lien vers la ressource concernee (recharge ensuite via l'API, avec les
  // permissions normales). Absent pour une notification sans cible : on reste.
  if (n.data.link) router.push(n.data.link)
}

/** Pastille coloree par gravite/type, pour distinguer une alerte au premier coup d'oeil. */
function dotClass(type: string): string {
  switch (type) {
    case 'alert':   return 'bg-red-500'
    case 'warning': return 'bg-amber-500'
    case 'success': return 'bg-green-500'
    default:        return 'bg-blue-500'
  }
}

/** Horodatage relatif, localise, sans dependance externe. */
function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return t('notif.justNow')
  if (min < 60) return t('notif.minutesAgo', { n: min })
  const hours = Math.floor(min / 60)
  if (hours < 24) return t('notif.hoursAgo', { n: hours })
  return t('notif.daysAgo', { n: Math.floor(hours / 24) })
}

function onClickOutside(e: MouseEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) {
    open.value = false
  }
}
function onEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onEscape)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onEscape)
})
</script>

<style scoped>
.nc-fade-enter-active,
.nc-fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.nc-fade-enter-from,
.nc-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
