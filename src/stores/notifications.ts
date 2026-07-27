import { defineStore } from 'pinia'
import { ref } from 'vue'
import { notificationsApi } from '@/api'

interface Notification {
  id: string
  type: string
  data: { title: string; body: string; type: string }
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

  return { items, unreadCount, loading, fetchUnreadCount, fetchAll, markRead, markAllRead }
})
