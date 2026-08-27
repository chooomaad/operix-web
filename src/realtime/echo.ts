import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

/**
 * Client temps réel (Laravel Echo sur Reverb).
 *
 * Une seule instance pour toute l'application : ouvrir plusieurs connexions
 * WebSocket pour un même utilisateur multiplierait les abonnements et ferait
 * recevoir chaque évènement en double.
 *
 * La connexion n'est PAS établie au chargement de la page. Elle l'est après
 * authentification, car l'abonnement aux canaux privés exige un jeton : se
 * connecter avant reviendrait à échouer, puis à réessayer.
 */

// laravel-echo attend Pusher sur l'objet global.
;(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher

type EchoClient = InstanceType<typeof Echo>

let echo: EchoClient | null = null

/** Base de l'API, pour joindre le point d'authentification des canaux. */
function apiBase(): string {
  return import.meta.env.VITE_API_URL ?? '/api/v1'
}

/**
 * Le point d'authentification des canaux vit à la racine du serveur, PAS sous
 * `/api/v1` : `/broadcasting/auth`. On retire donc le suffixe de version de la
 * base de l'API pour le construire.
 */
function broadcastAuthEndpoint(): string {
  return apiBase().replace(/\/api\/v1\/?$/, '') + '/broadcasting/auth'
}

/**
 * Ouvre la connexion temps réel pour l'utilisateur authentifié.
 *
 * Idempotent : rappeler la fonction alors qu'une connexion existe retourne
 * l'instance courante plutôt que d'en empiler une seconde.
 */
export function connectRealtime(token: string): EchoClient {
  if (echo) return echo

  echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
    // Uniquement WebSocket : les replis en long-polling masqueraient une
    // configuration défaillante en la faisant « presque » fonctionner, avec une
    // latence qui ne se diagnostique qu'en production.
    enabledTransports: ['ws', 'wss'],
    authEndpoint: broadcastAuthEndpoint(),
    auth: {
      headers: {
        // Le serveur authentifie /broadcasting/auth avec le garde sanctum : le
        // jeton Bearer est donc requis, l'application n'utilisant pas de session
        // par cookie.
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  })

  return echo
}

/**
 * Ferme la connexion et libère tous les abonnements.
 *
 * Appelé à la déconnexion : sans cela, le socket reste ouvert avec les
 * abonnements du compte précédent, et le compte suivant recevrait les évènements
 * du premier — y compris ceux d'une autre entreprise.
 */
export function disconnectRealtime(): void {
  echo?.disconnect()
  echo = null
}

export function realtime(): EchoClient | null {
  return echo
}
