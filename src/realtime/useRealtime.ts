import { onBeforeUnmount, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { useRealtimeFeedStore, type HseEventPayload } from '@/stores/realtimeFeed'
import { connectRealtime, disconnectRealtime, realtime } from './echo'

/**
 * Charge utile d'une notification diffusée sur le canal privé de l'utilisateur.
 */
interface NotificationPayload {
  id: string
  type: string
  title: string
  body: string
  sent_by: string | null
  created_at: string
  read_at: string | null
}

/**
 * Branche l'application sur le flux temps réel.
 *
 * À monter UNE fois, dans la mise en page authentifiée. Deux canaux :
 *
 *  - `tenant.{id}` — les évènements HSE de l'entreprise (nouveaux signalements) ;
 *  - `user.{id}`   — les notifications personnelles.
 *
 * Le cloisonnement est assuré par le serveur : l'abonnement à un canal d'une
 * autre entreprise est refusé par `/broadcasting/auth`. Le client ne filtre rien
 * — il ne le pourrait pas de façon fiable.
 */
export function useRealtime() {
  const auth = useAuthStore()
  const notifications = useNotificationsStore()
  const feed = useRealtimeFeedStore()
  const toast = useToast()

  // Empeche un double abonnement : si la session change sans se fermer (jeton
  // rafraichi), on ne rebranche pas .listen() par-dessus les ecouteurs existants,
  // ce qui ferait recevoir chaque evenement deux fois. La reconnexion reseau, elle,
  // est geree par le transport qui reabonne seul ses canaux — sans repasser ici.
  let subscribed = false

  function subscribe(): void {
    const token = auth.token
    const user = auth.user
    const tenantId = auth.tenant?.id

    if (!token || !user || subscribed) return

    const echo = connectRealtime(token)
    subscribed = true

    // ── Évènements HSE de l'entreprise ────────────────────────────────────────
    if (tenantId) {
      echo
        .private(`tenant.${tenantId}`)
        .listen('.hse.event.created', (payload: HseEventPayload) => {
          feed.prepend(payload)

          toast.add({
            severity: severityOf(payload),
            summary: summaryOf(payload),
            detail: payload.location ?? '',
            life: 6000,
          })
        })
    }

    // ── Notifications personnelles ────────────────────────────────────────────
    echo
      .private(`user.${user.id}`)
      .listen('.notification.sent', (payload: NotificationPayload) => {
        notifications.prependRealtime({
          id: payload.id,
          type: payload.type,
          data: {
            title: payload.title,
            body: payload.body,
            type: payload.type,
          },
          read_at: null,
          created_at: payload.created_at,
        })

        toast.add({
          severity: payload.type === 'alert' ? 'error' : 'info',
          summary: payload.title,
          detail: payload.body,
          life: 6000,
        })
      })
  }

  // La connexion suit l'état d'authentification : on se (re)connecte à
  // l'ouverture d'une session, et on coupe tout à la fermeture. Sans cette
  // coupure, le socket resterait abonné aux canaux du compte precedent.
  watch(
    () => auth.token,
    (token) => {
      if (token) {
        subscribe()
      } else {
        disconnectRealtime()
        // La session est fermee : on autorise un nouvel abonnement au prochain login.
        subscribed = false
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    realtime()
      ?.leave(`tenant.${auth.tenant?.id}`)
  })
}

/** Un évènement critique doit se distinguer au premier coup d'œil. */
function severityOf(payload: HseEventPayload): 'error' | 'warn' | 'info' {
  if (payload.severity === 'critical' || payload.severity === 'high') return 'error'
  if (payload.severity === 'medium') return 'warn'
  return 'info'
}

function summaryOf(payload: HseEventPayload): string {
  const label =
    payload.kind === 'incident'
      ? 'Nouvel incident'
      : payload.kind === 'near_miss'
        ? 'Nouveau presqu\'accident'
        : 'Nouvelle observation environnementale'

  return payload.subtype ? `${label} — ${payload.subtype}` : label
}
