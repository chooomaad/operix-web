import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import { i18n } from './i18n'

import App from './App.vue'
import router from './router'
import './assets/main.css'

/**
 * Une erreur de chargement de module (chunk) est LA cause classique de page
 * blanche : apres un redeploiement (ou un HMR), le navigateur demande un ancien
 * fichier .js qui n'existe plus (404) et la vue ne se monte jamais. On recharge
 * alors la page UNE fois pour recuperer les fichiers a jour — jamais en boucle.
 */
function isChunkLoadError(message: string): boolean {
  return /dynamically imported module|Importing a module script failed|Failed to fetch|ChunkLoadError|error loading dynamically/i.test(message)
}
function reloadOnceForChunk(): void {
  const KEY = 'operix_chunk_reload_at'
  const last = Number(sessionStorage.getItem(KEY) || 0)
  // Garde-fou anti-boucle : au plus un rechargement automatique par 10 s.
  if (Date.now() - last > 10_000) {
    sessionStorage.setItem(KEY, String(Date.now()))
    window.location.reload()
  }
}

const app = createApp(App)

// Dernier recours : on JOURNALISE toute erreur non geree par un composant, sans
// laisser l'application planter silencieusement. L'ErrorBoundary affiche l'ecran
// de recuperation ; ici on trace pour le diagnostic.
app.config.errorHandler = (err, _instance, info) => {
  // eslint-disable-next-line no-console
  console.error('[vue:errorHandler]', info, err)
  const message = err instanceof Error ? err.message : String(err)
  if (isChunkLoadError(message)) reloadOnceForChunk()
}

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(PrimeVue, {
  theme: { preset: Aura, options: { prefix: 'p', darkModeSelector: '.dark', cssLayer: false } },
})
app.use(ToastService)
app.use(ConfirmationService)

// Echec de resolution d'une route (souvent un chunk manquant) : on recupere.
router.onError((err) => {
  // eslint-disable-next-line no-console
  console.error('[router:onError]', err)
  if (isChunkLoadError(err?.message ?? '')) reloadOnceForChunk()
})

// Filets de securite au niveau fenetre : import dynamique rejete, ou erreur de
// chargement de ressource — on recharge une fois plutot que de rester bloque.
window.addEventListener('unhandledrejection', (e) => {
  const message = e?.reason instanceof Error ? e.reason.message : String(e?.reason ?? '')
  if (isChunkLoadError(message)) reloadOnceForChunk()
})
window.addEventListener('error', (e) => {
  if (isChunkLoadError(e?.message ?? '')) reloadOnceForChunk()
})

// Montage protege : meme si le boot echoue, on n'affiche jamais une page blanche
// muette — on injecte un ecran de recuperation minimal directement dans le DOM.
try {
  app.mount('#app')
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('[mount:failed]', err)
  const el = document.getElementById('app')
  if (el) {
    el.innerHTML =
      '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;background:#f9fafb">' +
      '<div style="text-align:center;background:#fff;border:1px solid #eef0f3;border-radius:18px;padding:32px;max-width:420px">' +
      '<div style="font-size:40px">⚠️</div>' +
      '<h1 style="font-size:18px;color:#111827;margin:8px 0 4px">Une erreur est survenue</h1>' +
      '<p style="font-size:14px;color:#6b7280;margin:0 0 20px">Impossible de démarrer l\'application. Rechargez la page.</p>' +
      '<button onclick="location.reload()" style="cursor:pointer;background:#0f2847;color:#fff;border:none;border-radius:10px;padding:10px 18px;font-weight:600">Recharger</button>' +
      '</div></div>'
  }
}
