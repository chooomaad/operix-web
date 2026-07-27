import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'

const USER_CACHE_KEY = 'operix_user_v1'

interface Organisation {
  name: string
  short_name: string
  primary_color: string
  locale: string
  logo_url?: string | null
  country?: string
  timezone?: string
}

interface User {
  id: number
  name: string
  email: string
  role: string
  matricule?: string
  avatar?: string
  is_active?: boolean
  organisation: Organisation | null
}

function buildUser(apiUser: Omit<User, 'organisation'>, apiOrg: Organisation | null): User {
  return { ...apiUser, organisation: apiOrg ?? null }
}

function saveUserCache(u: User) {
  try { localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u)) } catch {}
}

function loadUserCache(): User | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export const useAuthStore = defineStore('auth', () => {
  // Restore user from localStorage cache immediately (avoids white flash on reload)
  const _cached = loadUserCache()
  const user    = ref<User | null>(_cached)
  const token   = ref<string | null>(localStorage.getItem('operix_token'))
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin         = computed(() => ['admin', 'super_admin'].includes(user.value?.role ?? ''))
  const isSuperAdmin    = computed(() => user.value?.role === 'super_admin')
  const orgColor        = computed(() => user.value?.organisation?.primary_color ?? '#0f2847')
  const orgName         = computed(() => user.value?.organisation?.name ?? 'TCN')
  const orgLogo         = computed(() => user.value?.organisation?.logo_url ?? null)
  const orgShortLabel   = computed(() => {
    const country = user.value?.organisation?.country
    const short   = user.value?.organisation?.short_name ?? 'TCN'
    return country === 'MR' ? `${short} - Mauritanie` : short
  })

  async function fetchMe() {
    if (!token.value) return
    try {
      // API returns { user: {...}, organisation: {...} }
      const { data } = await authApi.me()
      const u = buildUser(data.user, data.organisation)
      user.value = u
      saveUserCache(u)
    } catch {
      logout()
    }
  }

  async function loginOtp(email: string, code: string) {
    const { data } = await authApi.verifyOtp(email, code)
    token.value = data.token
    const u = buildUser(data.user, data.organisation)
    user.value = u
    saveUserCache(u)
    localStorage.setItem('operix_token', data.token)
  }

  async function loginMatricule(matricule: string, pin: string) {
    const { data } = await authApi.loginWithMatricule(matricule, pin)
    token.value = data.token
    const u = buildUser(data.user, data.organisation)
    user.value = u
    saveUserCache(u)
    localStorage.setItem('operix_token', data.token)
  }

  async function logout() {
    if (token.value) {
      try { await authApi.logout() } catch { /* ignore */ }
    }
    token.value = null
    user.value  = null
    localStorage.removeItem('operix_token')
    localStorage.removeItem(USER_CACHE_KEY)
  }

  return { user, token, loading, isAuthenticated, isAdmin, isSuperAdmin, orgColor, orgName, orgLogo, orgShortLabel, fetchMe, loginOtp, loginMatricule, logout }
})
