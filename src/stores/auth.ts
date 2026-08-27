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

/**
 * Entreprise cliente, telle que renvoyee par le backend.
 *
 * Distincte d'`Organisation`, qui ne porte que le branding : `Tenant` expose
 * l'identifiant, indispensable pour s'abonner au canal temps reel de
 * l'entreprise et pour cloisonner les caches locaux entre deux comptes.
 */
interface Tenant {
  id: number
  name: string
  short_name: string | null
  logo_url: string | null
  primary_color: string | null
  locale: string | null
  country: string | null
  timezone: string | null
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

  /** Entreprise de l'utilisateur connecte, telle que resolue par le serveur. */
  const tenant = ref<Tenant | null>(null)

  /**
   * Droits effectifs, CALCULES PAR LE BACKEND (`App\Support\Permissions`).
   *
   * Ils ne servent qu'a masquer ou desactiver des elements d'interface : chaque
   * route de l'API porte deja sa propre permission et refusera de toute facon un
   * appel non autorise. La matrice n'est volontairement pas recopiee ici — une
   * seconde table des droits finirait par diverger de celle du serveur.
   */
  const abilities = ref<string[]>([])

  function can(ability: string): boolean {
    return abilities.value.includes(ability)
  }

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  /**
   * Roles disposant des droits d'administration SUR LES DONNEES METIER.
   *
   * `admin` n'existe plus : il a ete renomme `company_admin` lors du passage au
   * multi-tenant, et cette liste n'avait pas suivi — un administrateur
   * d'entreprise ne voyait donc ni Rapports, ni Audit, ni les boutons d'action.
   *
   * `super_admin` en est volontairement EXCLU : il n'appartient a aucun tenant et
   * recoit un 403 sur toutes les routes metier. Lui afficher ces ecrans ne
   * produirait que des erreurs.
   */
  const isAdmin         = computed(() => ['company_admin', 'hsse_manager'].includes(user.value?.role ?? ''))
  const isSuperAdmin    = computed(() => user.value?.role === 'super_admin')
  const orgColor        = computed(() => user.value?.organisation?.primary_color ?? '#0f2847')
  // Aucun nom de client en dur : le meme build sert toutes les entreprises. En
  // l'absence de donnee serveur on affiche le produit, jamais un client.
  const orgName         = computed(() => tenant.value?.name ?? user.value?.organisation?.name ?? 'Operix HSE')
  const orgLogo         = computed(() => user.value?.organisation?.logo_url ?? null)
  const orgShortLabel   = computed(() => {
    const country = user.value?.organisation?.country
    const short   = tenant.value?.short_name ?? user.value?.organisation?.short_name ?? 'Operix'
    return country === 'MR' ? `${short} - Mauritanie` : short
  })

  /**
   * Applique la partie « session » d'une reponse d'authentification.
   *
   * `tenant` et `abilities` ne sont deliberement PAS mis en cache local : ce sont
   * des donnees d'autorisation. Les relire d'un cache apres expiration du jeton
   * afficherait une interface fondee sur des droits perimes. Ils sont rehydrates
   * par fetchMe a chaque demarrage.
   */
  function applySession(data: { tenant?: Tenant | null; abilities?: string[] }) {
    tenant.value    = data.tenant ?? null
    abilities.value = data.abilities ?? []
  }

  async function fetchMe() {
    if (!token.value) return
    try {
      // API returns { user: {...}, organisation: {...} }
      const { data } = await authApi.me()
      const u = buildUser(data.user, data.organisation)
      user.value = u
      applySession(data)
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
    applySession(data)
    saveUserCache(u)
    localStorage.setItem('operix_token', data.token)
  }

  async function loginMatricule(matricule: string, pin: string) {
    const { data } = await authApi.loginWithMatricule(matricule, pin)
    token.value = data.token
    const u = buildUser(data.user, data.organisation)
    user.value = u
    applySession(data)
    saveUserCache(u)
    localStorage.setItem('operix_token', data.token)
  }

  async function logout() {
    if (token.value) {
      try { await authApi.logout() } catch { /* ignore */ }
    }
    token.value     = null
    user.value      = null
    tenant.value    = null
    abilities.value = []
    localStorage.removeItem('operix_token')
    localStorage.removeItem(USER_CACHE_KEY)
  }

  return { user, token, tenant, abilities, can, loading, isAuthenticated, isAdmin, isSuperAdmin, orgColor, orgName, orgLogo, orgShortLabel, fetchMe, loginOtp, loginMatricule, logout }
})
