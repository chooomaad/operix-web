<template>
  <!--
    Filet de securite : si un composant enfant (une vue routee) leve une exception
    pendant son rendu ou son cycle de vie, on affiche un ecran de recuperation au
    lieu de laisser toute l'application devenir une page blanche.

    Volontairement SANS dependance (pas de i18n, pas de classes utilitaires
    externes) : ce composant doit pouvoir s'afficher meme si le reste casse.
  -->
  <div v-if="failed" class="eb-wrap">
    <div class="eb-card">
      <div class="eb-emoji">⚠️</div>
      <h1 class="eb-title">{{ txt.title }}</h1>
      <p class="eb-sub">{{ txt.sub }}</p>
      <div class="eb-actions">
        <button class="eb-btn eb-btn-ghost" @click="retry">{{ txt.retry }}</button>
        <button class="eb-btn eb-btn-primary" @click="reload">{{ txt.reload }}</button>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, watch } from 'vue'
import { useRoute } from 'vue-router'

const failed = ref(false)
const route = useRoute()

// Textes cohérents dans une seule langue, lus directement depuis localStorage : ce
// filet de sécurité reste volontairement SANS dépendance i18n (il doit s'afficher
// même si le store/i18n est ce qui a cassé).
const MESSAGES = {
  fr: { title: 'Une erreur est survenue', sub: 'Vous pouvez réessayer ou recharger la page.', retry: 'Réessayer', reload: 'Recharger' },
  en: { title: 'Something went wrong',    sub: 'You can try again or reload the page.',       retry: 'Try again', reload: 'Reload' },
}
let _lang: 'fr' | 'en' = 'en'
try { if (localStorage.getItem('operix_locale') === 'fr') _lang = 'fr' } catch {}
const txt = MESSAGES[_lang]

// Capture toute erreur remontant des composants enfants. `return false` stoppe la
// propagation : l'app ne se demonte pas, on bascule sur l'ecran de recuperation.
onErrorCaptured((err) => {
  failed.value = true
  // eslint-disable-next-line no-console
  console.error('[ErrorBoundary]', err)
  return false
})

// Quitter la page cassee restaure automatiquement l'application : changer de route
// remet le filet a zero, l'utilisateur n'est jamais coince.
watch(() => route.fullPath, () => { failed.value = false })

function retry() { failed.value = false }
function reload() { window.location.reload() }
</script>

<style scoped>
.eb-wrap {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  padding: 24px; background: #f9fafb;
}
.eb-card {
  max-width: 420px; width: 100%; text-align: center; background: #fff;
  border: 1px solid #eef0f3; border-radius: 18px; padding: 32px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06); font-family: system-ui, sans-serif;
}
.eb-emoji { font-size: 40px; margin-bottom: 10px; }
.eb-title { font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 6px; }
.eb-sub { font-size: 14px; color: #6b7280; margin: 0 0 24px; }
.eb-actions { display: flex; gap: 8px; justify-content: center; }
.eb-btn {
  cursor: pointer; border-radius: 10px; padding: 10px 18px; font-size: 14px;
  font-weight: 600; border: 1px solid transparent; transition: all .15s;
}
.eb-btn-ghost { background: #fff; border-color: #e5e7eb; color: #374151; }
.eb-btn-ghost:hover { background: #f3f4f6; }
.eb-btn-primary { background: #0f2847; color: #fff; }
.eb-btn-primary:hover { background: #1a3a6b; }
</style>
