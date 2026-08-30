import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { ref, readonly } from 'vue'

/**
 * Client temps réel (Laravel Echo).
 *
 * TRANSPORT : Ably en production, atteint par son adaptateur PROTOCOLE PUSHER.
 * Le projet embarque déjà `pusher-js` ; Ably parlant nativement ce protocole, on
 * réutilise cette dépendance plutôt que d'ajouter le SDK Ably — une librairie de
 * plus pour le même rôle.
 *
 * Une seule instance pour toute l'application : ouvrir plusieurs connexions pour
 * un même utilisateur multiplierait les abonnements et ferait recevoir chaque
 * évènement en double. La connexion n'est PAS établie au chargement mais après
 * authentification — l'abonnement aux canaux privés exige un jeton.
 *
 * MACHINE D'ÉTATS (déterministe) :
 *
 *   initializing
 *      ├── configuration absente ─────────────► unavailable   (aucune connexion tentée)
 *      └── configuration présente ─► connecting ─► connected ─► reconnecting ⇄ connected
 *                                              └─► failed
 *
 * Le temps réel est une AMÉLIORATION : jamais une dépendance bloquante. Si aucun
 * transport n'est configuré (dev sans Ably ni Reverb), on n'ouvre AUCUN socket —
 * on se met en `unavailable`, l'application reste pleinement utilisable, et on
 * n'entre jamais dans une boucle de reconnexion sans fin.
 */

// laravel-echo attend Pusher sur l'objet global.
;(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher

type EchoClient = InstanceType<typeof Echo>

let echo: EchoClient | null = null

/**
 * État de la connexion temps réel, exposé à l'IHM.
 *
 *  - initializing : état initial, avant toute décision
 *  - connecting   : première tentative en cours (transport configuré)
 *  - connected    : opérationnel
 *  - reconnecting : une connexion ÉTABLIE a été perdue, reprise en cours
 *  - unavailable  : pas de transport configuré, ou serveur injoignable d'emblée
 *  - failed       : transport non supporté / échec définitif
 *  - disconnected : fermé volontairement (déconnexion)
 *
 * `reconnecting` n'est utilisé QU'APRÈS un `connected` réel : ce n'est jamais
 * l'état par défaut. L'IHM traduit ces états en messages compréhensibles.
 */
export type RealtimeState =
  | 'initializing'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'unavailable'
  | 'failed'
  | 'disconnected'

const state = ref<RealtimeState>('initializing')

/** État réactif en lecture seule, pour les composants (bandeau, indicateur). */
export const realtimeState = readonly(state)

function env(key: string): string {
  const value = (import.meta.env as Record<string, string | undefined>)[key]
  return (value ?? '').trim()
}

/**
 * Quel transport temps réel est réellement configuré ?
 *
 *  - Ably dès que la clé publique est fournie (chemin de production).
 *  - Reverb UNIQUEMENT si explicitement activé (`VITE_REALTIME_ENABLED=true`) et
 *    sa clé présente. Sans activation explicite, une clé Reverb laissée dans un
 *    `.env` de dev ne doit PAS déclencher des tentatives vers un serveur qui ne
 *    tourne pas — c'est précisément ce qui produisait un « Reconnecting… » sans fin.
 *  - Sinon : aucun transport. On ne se connecte pas.
 */
function configuredTransport(): 'ably' | 'reverb' | null {
  if (env('VITE_ABLY_PUBLIC_KEY') !== '') return 'ably'

  if (env('VITE_REALTIME_ENABLED') === 'true' && env('VITE_REVERB_APP_KEY') !== '') {
    return 'reverb'
  }

  return null
}

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

function authHeaders(token: string) {
  // /broadcasting/auth est protégé par le garde sanctum : le jeton Bearer est
  // requis, l'application n'utilisant pas de session par cookie.
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  }
}

/** Options du transport Ably (protocole Pusher). Aucun secret : clé publique seule. */
function ablyOptions(token: string) {
  return {
    broadcaster: 'pusher' as const,
    key: env('VITE_ABLY_PUBLIC_KEY'),
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

/** Options du transport Reverb (développement local, activation explicite). */
function reverbOptions(token: string) {
  return {
    broadcaster: 'reverb' as const,
    key: env('VITE_REVERB_APP_KEY'),
    wsHost: env('VITE_REVERB_HOST') || window.location.hostname,
    wsPort: Number(env('VITE_REVERB_PORT') || 8080),
    wssPort: Number(env('VITE_REVERB_PORT') || 443),
    forceTLS: (env('VITE_REVERB_SCHEME') || 'http') === 'https',
    enabledTransports: ['ws', 'wss'] as string[],
    authEndpoint: broadcastAuthEndpoint(),
    auth: { headers: authHeaders(token) },
  }
}

/**
 * Suit le cycle de vie de la connexion sous-jacente (pusher-js) et le reporte
 * dans `state`. pusher-js émet `connecting`, `connected`, `unavailable`,
 * `failed`, `disconnected`.
 *
 * Règle clé : `reconnecting` n'apparaît QUE si une connexion a déjà été établie
 * (`hasConnectedOnce`). Tant qu'on n'a jamais été `connected`, une indisponibilité
 * reste `connecting` (on tente) puis `unavailable` (serveur injoignable) — jamais
 * `reconnecting`, qui n'aurait aucun sens sans connexion antérieure.
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
        // Déjà connecté auparavant → vraie reconnexion en cours.
        // Jamais connecté → le serveur est injoignable d'emblée : indisponible.
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
 * courante plutôt que d'en empiler une seconde. Retourne `null` si aucun transport
 * n'est configuré — l'appelant n'a alors rien à abonner, et aucun socket n'est
 * ouvert.
 */
export function connectRealtime(token: string): EchoClient | null {
  if (echo) return echo

  const transport = configuredTransport()

  // Aucun transport configuré : on NE tente PAS de connexion. État terminal propre.
  if (transport === null) {
    state.value = 'unavailable'
    return null
  }

  state.value = 'connecting'
  const options = transport === 'ably' ? ablyOptions(token) : reverbOptions(token)
  echo = new Echo(options as any)
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

/** Un transport temps réel est-il configuré ? (exposé pour les tests / l'IHM) */
export function realtimeConfigured(): boolean {
  return configuredTransport() !== null
}
