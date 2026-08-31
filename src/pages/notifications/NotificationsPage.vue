<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">{{ t('notifications.title') }}</h2>
        <p class="text-sm text-gray-500">{{ unreadCount }} {{ t('notifications.unread') }}</p>
      </div>
      <button v-if="unreadCount > 0" @click="markAllRead" class="btn-secondary text-sm">{{ t('notifications.markAllRead') }}</button>
    </div>

    <LoadErrorBanner v-if="loadError" :loading="loading" @retry="load" />

    <div v-if="loading" class="text-center py-10 text-gray-400">{{ t('notifications.loading') }}</div>

    <div v-else-if="!items.length" class="text-center py-16 text-gray-400">
      <BellIcon class="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p>{{ t('notifications.noNotifications') }}</p>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="n in items" :key="n.id"
        @click="markRead(n)"
        :class="['card cursor-pointer transition-colors', n.read_at ? 'opacity-60' : 'border-brand-200 bg-brand-50']"
      >
        <div class="flex items-start gap-3">
          <div :class="['w-2 h-2 rounded-full mt-2 flex-shrink-0', n.read_at ? 'bg-gray-300' : 'bg-brand-500']" />
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 text-sm">{{ n.title ?? n.type }}</p>
            <p class="text-sm text-gray-600 mt-0.5">{{ n.body ?? n.message }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ formatDate(n.created_at) }}</p>
          </div>
          <div v-if="!n.read_at" class="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 mt-1.5" />
        </div>
      </div>
    </div>

    <!-- Load more -->
    <div v-if="meta && meta.current_page < meta.last_page" class="text-center pt-2">
      <button @click="loadMore" :disabled="loadingMore" class="btn-secondary text-sm">
        {{ loadingMore ? t('notifications.loadingMore') : t('notifications.loadMore') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { notificationsApi } from '@/api'
import { useNotificationsStore } from '@/stores/notifications'
import LoadErrorBanner from '@/components/ui/LoadErrorBanner.vue'
import { BellIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()

const notifStore = useNotificationsStore()
const { unreadCount } = storeToRefs(notifStore)

const items      = ref<any[]>([])
const meta       = ref<any>(null)
const loadError = ref(false)
const loading    = ref(false)
const loadingMore = ref(false)

function formatDate(d: string) {
  return d ? new Date(d).toLocaleString('fr-FR', { dateStyle:'short', timeStyle:'short' }) : ''
}

async function load() {
  loading.value = true
  loadError.value = false
  try {
    const { data } = await notificationsApi.list({ page: 1 })
    items.value = data.data; meta.value = data.meta
  } catch (e) {
    // Un echec de chargement ne doit jamais faire tomber toute la page :
    // on affiche une banniere « Reessayer » plutot que l'ErrorBoundary global.
    loadError.value = true
  } finally { loading.value = false }
}

async function loadMore() {
  if (!meta.value || meta.value.current_page >= meta.value.last_page) return
  loadingMore.value = true
  try {
    const { data } = await notificationsApi.list({ page: meta.value.current_page + 1 })
    items.value.push(...data.data); meta.value = data.meta
  } finally { loadingMore.value = false }
}

async function markRead(n: any) {
  if (n.read_at) return
  await notificationsApi.markRead(n.id)
  n.read_at = new Date().toISOString()
  notifStore.fetchUnreadCount()
}

async function markAllRead() {
  await notificationsApi.markAllRead()
  items.value.forEach(n => n.read_at = new Date().toISOString())
  notifStore.fetchUnreadCount()
}

onMounted(load)
</script>
