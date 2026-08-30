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
 * On ne montre un message QUE pour un etat degrade. « connecting » initial et
 * « connected » restent muets : l'utilisateur n'a pas a suivre la mecanique.
 */
const message = computed(() => {
  switch (realtimeState.value) {
    case 'reconnecting':
    case 'unavailable':
      return t('realtime.reconnecting')
    case 'failed':
    case 'disconnected':
      return t('realtime.offline')
    default:
      return ''
  }
})

const isTransient = computed(
  () => realtimeState.value === 'reconnecting' || realtimeState.value === 'unavailable',
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
