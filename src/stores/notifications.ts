import { defineStore } from 'pinia'
import { ref } from 'vue'
import { notificationsApi } from '@/api'

export interface Notification {
  id: string
  type: string
  data: {
    title: string
    body: string
    type: string
    // Renseignes pour les notifications d'evenement HSE : de quoi pointer vers la
    // ressource sans exposer de donnee sensible (le client recharge via l'API).
    link?: string
    resource_kind?: string
    resource_id?: number
    severity?: string | null
  }
  read_at: string | null
  created_at: string
}

export const useNotificationsStore = defineStore('notifications', () => {
  const items      = ref<Notification[]>([])
  const unreadCount= ref(0)
  const loading    = ref(false)

  async function fetchUnreadCount() {
    const { data } = await notificationsApi.unreadCount()
    unreadCount.value = data.count
  }

  async function fetchAll(page = 1) {
    loading.value = true
    try {
      const { data } = await notificationsApi.list({ page })
      items.value       = data.data
      unreadCount.value = data.meta.unread_count
    } finally {
      loading.value = false
    }
  }

  async function markRead(id: string) {
    await notificationsApi.markRead(id)
    const n = items.value.find(x => x.id === id)
    if (n) n.read_at = new Date().toISOString()
    if (unreadCount.value > 0) unreadCount.value--
  }

  async function markAllRead() {
    await notificationsApi.markAllRead()
    items.value.forEach(n => { n.read_at = new Date().toISOString() })
    unreadCount.value = 0
  }

  /**
   * Insere une notification recue en temps reel.
   *
   * Idempotent : une reconnexion WebSocket peut rejouer un message deja recu, et
   * une notification affichee deux fois ferait mentir le compteur de non-lues.
   */
  function prependRealtime(notification: Notification) {
    if (items.value.some(n => n.id === notification.id)) return

    items.value = [notification, ...items.value]
    if (!notification.read_at) unreadCount.value++
  }

  return { items, unreadCount, loading, fetchUnreadCount, fetchAll, markRead, markAllRead, prependRealtime }
})
