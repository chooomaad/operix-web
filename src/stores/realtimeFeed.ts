import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * Charge utile diffusée par le backend pour un évènement HSE.
 *
 * Miroir exact de `App\Support\HseEventPayload::toArray()`. Toute divergence se
 * verrait à l'exécution sous forme de champ `undefined` : garder les deux côtés
 * alignés fait partie du contrat.
 */
export interface HseEventPayload {
  id: number
  tenant_id: number
  kind: 'incident' | 'near_miss' | 'environment'
  subtype: string | null
  reference: string | null
  severity: string | null
  status: string | null
  location: string | null
  location_point: {
    latitude: number
    longitude: number
    accuracy: number | null
    captured_at: string | null
  } | null
  reporter: { id: number; name: string } | null
  created_at: string
}

/**
 * Flux d'activité temps réel du tableau de bord.
 *
 * Volontairement en mémoire seulement : ce flux montre ce qui arrive PENDANT que
 * la page est ouverte. L'historique complet reste du ressort des listes paginées,
 * qui interrogent l'API — dupliquer cet historique ici ferait diverger deux
 * sources pour la même donnée.
 */
export const useRealtimeFeedStore = defineStore('realtimeFeed', () => {
  /** Borne haute : un poste laissé ouvert des heures ne doit pas enfler sans fin. */
  const MAX_ITEMS = 50

  const events = ref<HseEventPayload[]>([])

  /** Évènements reçus depuis le dernier passage sur le tableau de bord. */
  const unseen = ref(0)

  function prepend(event: HseEventPayload): void {
    // Une reconnexion peut rejouer un évènement déjà reçu. Sans cette garde, le
    // flux afficherait deux fois le même signalement et le compteur mentirait.
    if (events.value.some((e) => e.kind === event.kind && e.id === event.id)) {
      return
    }

    events.value = [event, ...events.value].slice(0, MAX_ITEMS)
    unseen.value++
  }

  function markSeen(): void {
    unseen.value = 0
  }

  function clear(): void {
    events.value = []
    unseen.value = 0
  }

  const criticalCount = computed(
    () => events.value.filter((e) => e.severity === 'critical').length,
  )

  return { events, unseen, criticalCount, prepend, markSeen, clear }
})
