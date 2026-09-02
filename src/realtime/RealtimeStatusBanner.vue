<template>
  <!--
    Bandeau discret d'etat du temps reel. Invisible tant que tout va bien : on ne
    signale que la degradation, et jamais sous une forme technique. L'application
    reste pleinement utilisable — ce bandeau informe, il ne bloque pas.
  -->
  <Transition name="rt-slide">
    <div
      v-if="message"
      class="flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium"
      :class="tone"
      role="status"
      aria-live="polite"
    >
      <span class="inline-block w-1.5 h-1.5 rounded-full" :class="dot" />
      {{ message }}
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { realtimeState } from './echo'

const { t } = useI18n()

/**
 * Message par etat, aligne sur la machine d'etats de echo.ts :
 *
 *   connected / initializing / disconnected → aucun message (rien a signaler,
 *                                              ou fermeture volontaire).
 *   connecting                              → phase initiale de connexion.
 *   reconnecting                            → connexion ETABLIE puis perdue.
 *   unavailable / failed                    → temps reel indisponible.
 *
 * Point corrige : `unavailable` ne doit PAS afficher « reconnexion ». Sans transport
 * configure (dev sans Ably), l'etat est `unavailable` d'emblee — afficher
 * « reconnexion en cours » y serait faux et permanent.
 */
const message = computed(() => {
  switch (realtimeState.value) {
    case 'connecting':
      return t('realtime.connecting')
    case 'reconnecting':
      return t('realtime.reconnecting')
    // unavailable / failed : on n'affiche PLUS d'annonce (temps réel optionnel).
    // connected, initializing, disconnected : rien.
    default:
      return ''
  }
})

/** Transitoire (connexion/reconnexion en cours) = ambre ; degrade stable = gris neutre. */
const isTransient = computed(
  () => realtimeState.value === 'connecting' || realtimeState.value === 'reconnecting',
)

const tone = computed(() =>
  isTransient.value ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500',
)

const dot = computed(() =>
  isTransient.value ? 'bg-amber-400 animate-pulse' : 'bg-gray-400',
)
</script>

<style scoped>
.rt-slide-enter-active,
.rt-slide-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.rt-slide-enter-from,
.rt-slide-leave-to { opacity: 0; transform: translateY(-100%); }
</style>
