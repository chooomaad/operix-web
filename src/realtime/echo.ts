import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { ref, readonly } from 'vue'

/**
 * Client temps réel (Laravel Echo).
 *
 * TRANSPORT : Ably en production, atteint par son adaptateur PROTOCOLE PUSHER.
 * Le projet embarque déjà `pusher-js` ; Ably parlant nativement ce protocole, on
 * réutilise cette dépendance plutôt que d'ajouter le SDK Ably — une librairie de
 * plus pour le même rôle. En développement, à défaut de clé Ably, on retombe sur
 * un serveur Reverb local. Le choix se fait sur la seule présence de la clé
 * publique Ably : la bascule est donc une affaire de configuration, pas de code.
 *
 * Une seule instance pour toute l'application : ouvrir plusieurs connexions pour
 * un même utilisateur multiplierait les abonnements et ferait recevoir chaque
 * évènement en double. La connexion n'est PAS établie au chargement mais après
 * authentification — l'abonnement aux canaux privés exige un jeton.
 */

// laravel-echo attend Pusher sur l'objet global.
;(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher

type EchoClient = InstanceType<typeof Echo>

let echo: EchoClient | null = null

/**
 * État de la connexion temps réel, exposé à l'IHM.
 *
 *  - connecting   : première tentative en cours
 *  - connected    : opérationnel
 *  - reconnecting : coupure transitoire, reprise automatique en cours
 *  - unavailable  : serveur injoignable pour l'instant (reprise tentée)
 *  - failed       : transport non supporté / échec définitif
 *  - disconnected : fermé volontairement (déconnexion)
 *
 * L'utilisateur ne doit jamais voir d'erreur technique : l'IHM traduit ces états
 * en un message compréhensible, et l'application reste utilisable sans temps réel.
 */
export type RealtimeState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'unavailable'
  | 'failed'
  | 'disconnected'

const state = ref<RealtimeState>('idle')

/** État réactif en lecture seule, pour les composants (bannière, indicateur). */
export const realtimeState = readonly(state)

function apiBase(): string {
  return import.meta.env.VITE_API_URL ?? '/api/v1'
}

/**
 * Le point d'authentification des canaux vit à la racine du serveur, PAS sous
 * `/api/v1` : `/broadcasting/auth`. On retire donc le suffixe de version.
 */
function broadcastAuthEndpoint(): string {
  return apiBase().replace(/\/api\/v1\/?$/, '') + '/broadcasting/auth'
}

/** Options du transport Ably (protocole Pusher). Aucun secret : clé publique seule. */
function ablyOptions(token: string) {
  return {
    broadcaster: 'pusher' as const,
    key: import.meta.env.VITE_ABLY_PUBLIC_KEY,
    wsHost: 'realtime-pusher.ably.io',
    wsPort: 443,
    wssPort: 443,
    forceTLS: true,
    // Ably n'expose pas l'endpoint de statistiques de Pusher : le désactiver évite
    // des requêtes vouées à l'échec.
    disableStats: true,
    // Uniquement WebSocket : un repli en long-polling masquerait une configuration
    // défaillante en la faisant « presque » marcher.
    enabledTransports: ['ws', 'wss'] as string[],
    authEndpoint: broadcastAuthEndpoint(),
    auth: { headers: authHeaders(token) },
  }
}

/** Options du transport Reverb (développement local). */
function reverbOptions(token: string) {
  return {
    broadcaster: 'reverb' as const,
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
    enabledTransports: ['ws', 'wss'] as string[],
    authEndpoint: broadcastAuthEndpoint(),
    auth: { headers: authHeaders(token) },
  }
}

function authHeaders(token: string) {
  // /broadcasting/auth est protégé par le garde sanctum : le jeton Bearer est
  // requis, l'application n'utilisant pas de session par cookie.
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  }
}

/** Ably si une clé publique est fournie, sinon Reverb (dev). */
function useAbly(): boolean {
  return Boolean(import.meta.env.VITE_ABLY_PUBLIC_KEY)
}

/**
 * Suit le cycle de vie de la connexion sous-jacente (pusher-js) et le reporte
 * dans `state`. pusher-js émet `connecting`, `connected`, `unavailable`,
 * `failed`, `disconnected` ; « unavailable » après un « connected » se lit comme
 * une reconnexion en cours.
 */
function trackConnection(client: EchoClient): void {
  const connection = (client.connector as { pusher?: { connection?: any } })?.pusher?.connection
  if (!connection) return

  let hasConnectedOnce = false

  connection.bind('state_change', (change: { current: string }) => {
    switch (change.current) {
      case 'connecting':
        state.value = hasConnectedOnce ? 'reconnecting' : 'connecting'
        break
      case 'connected':
        hasConnectedOnce = true
        state.value = 'connected'
        break
      case 'unavailable':
        state.value = hasConnectedOnce ? 'reconnecting' : 'unavailable'
        break
      case 'failed':
        state.value = 'failed'
        break
      case 'disconnected':
        state.value = 'disconnected'
        break
    }
  })
}

/**
 * Ouvre la connexion temps réel pour l'utilisateur authentifié.
 *
 * Idempotent : rappelée alors qu'une connexion existe, elle retourne l'instance
 * courante plutôt que d'en empiler une seconde.
 */
export function connectRealtime(token: string): EchoClient {
  if (echo) return echo

  state.value = 'connecting'
  echo = new Echo((useAbly() ? ablyOptions(token) : reverbOptions(token)) as any)
  trackConnection(echo)

  return echo
}

/**
 * Ferme la connexion et libère tous les abonnements.
 *
 * Appelée à la déconnexion : sans cela, le socket resterait abonné aux canaux du
 * compte précédent, et le compte suivant recevrait ses évènements — y compris
 * ceux d'une autre entreprise.
 */
export function disconnectRealtime(): void {
  echo?.disconnect()
  echo = null
  state.value = 'disconnected'
}

export function realtime(): EchoClient | null {
  return echo
}
