import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// On simule l'API : le store ne doit dependre que des reponses serveur.
vi.mock('@/api', () => ({
  authApi: {
    me: vi.fn(),
    loginWithMatricule: vi.fn(),
    verifyOtp: vi.fn(),
    logout: vi.fn().mockResolvedValue({}),
  },
}))

import { authApi } from '@/api'
import { useAuthStore } from '@/stores/auth'

const CA_USER = { id: 1, name: 'Admin', email: 'a@tcn.mr', role: 'company_admin' }
const AGENT_USER = { id: 2, name: 'Agent', email: 'ag@tcn.mr', role: 'agent' }

// Droits renvoyes par le backend (company_admin possede users.manage).
const CA_ABILITIES = ['dashboard.view', 'users.manage', 'audit.view', 'incidents.view']
const AGENT_ABILITIES = ['dashboard.view', 'incidents.view', 'employees.agent_search']

const meResponse = (user: object, abilities: string[]) => ({
  data: { user, tenant: { id: 3, name: 'TCN' }, abilities, organisation: null },
})
const loginResponse = (user: object, abilities: string[]) => ({
  data: { token: 'tok-123', user, tenant: { id: 3, name: 'TCN' }, abilities, organisation: null },
})

describe('auth store — visibilite de la section Users (permissions)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('affiche Users immediatement apres un login autorise', async () => {
    ;(authApi.loginWithMatricule as any).mockResolvedValue(loginResponse(CA_USER, CA_ABILITIES))
    const auth = useAuthStore()

    await auth.loginMatricule('TCN-ADM-001', '1234')

    expect(auth.can('users.manage')).toBe(true)
    expect(auth.hydrated).toBe(true)
  })

  it('REPRODUIT LE BUG puis le CORRIGE : session restauree du cache', async () => {
    // 1) On simule un rechargement de page : le user + le token sont en cache,
    //    mais les droits ne le sont jamais.
    localStorage.setItem('operix_token', 'tok-123')
    localStorage.setItem('operix_user_v1', JSON.stringify({ ...CA_USER, organisation: null }))

    const auth = useAuthStore()

    // 2) Etat immediatement apres restauration : authentifie (token + user) MAIS
    //    droits vides et session non hydratee. C'est l'exacte condition du bug —
    //    la Sidebar se calculerait sans droits et Users disparaitrait.
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.hydrated).toBe(false)
    expect(auth.can('users.manage')).toBe(false)

    // 3) C'est precisement cette condition (authentifie && !hydrated) que le guard
    //    router utilise pour rehydrater : on rejoue fetchMe.
    ;(authApi.me as any).mockResolvedValue(meResponse(CA_USER, CA_ABILITIES))
    await auth.fetchMe()

    // 4) Les droits sont recharges frais : Users reapparait SANS logout/login.
    expect(auth.hydrated).toBe(true)
    expect(auth.can('users.manage')).toBe(true)
  })

  it('persiste apres navigation / modification / notification (aucun fetchMe)', async () => {
    ;(authApi.loginWithMatricule as any).mockResolvedValue(loginResponse(CA_USER, CA_ABILITIES))
    const auth = useAuthStore()
    await auth.loginMatricule('TCN-ADM-001', '1234')

    // Simule des evenements qui NE touchent pas aux droits : changement de route,
    // mise a jour du profil user, arrivee d'une notification. `fetchMe` n'est PAS
    // rappele (session deja hydratee) : les droits restent intacts.
    ;(auth as any).user = { ...CA_USER, name: 'Admin Modifie', organisation: null }

    expect(auth.can('users.manage')).toBe(true)
    // fetchMe n'a ete appele nulle part ici.
    expect(authApi.me).not.toHaveBeenCalled()
  })

  it('masque Users pour un compte SANS la permission (agent)', async () => {
    localStorage.setItem('operix_token', 'tok-123')
    localStorage.setItem('operix_user_v1', JSON.stringify({ ...AGENT_USER, organisation: null }))
    ;(authApi.me as any).mockResolvedValue(meResponse(AGENT_USER, AGENT_ABILITIES))

    const auth = useAuthStore()
    await auth.fetchMe()

    expect(auth.hydrated).toBe(true)
    expect(auth.can('users.manage')).toBe(false) // reste masque, permissions respectees
  })

  it('remet a zero les droits au logout', async () => {
    ;(authApi.loginWithMatricule as any).mockResolvedValue(loginResponse(CA_USER, CA_ABILITIES))
    const auth = useAuthStore()
    await auth.loginMatricule('TCN-ADM-001', '1234')
    expect(auth.can('users.manage')).toBe(true)

    await auth.logout()

    expect(auth.hydrated).toBe(false)
    expect(auth.can('users.manage')).toBe(false)
    expect(auth.isAuthenticated).toBe(false)
  })
})
