import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Cible du proxy de developpement.
//
// Configurable plutot que figee : selon le montage local, l'API peut vivre
// ailleurs que sur le port 8000 — par exemple derriere une terminaison TLS qui
// occupe ce port et repousse le service en clair sur un autre.
//
//   VITE_API_PROXY_TARGET=http://127.0.0.1:8001 npm run dev
const apiProxyTarget =
  process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8000'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    proxy: {
      // Le point d'authentification des canaux vit a la RACINE du serveur, pas
      // sous /api : sans cette entree, l'abonnement temps reel tombe en 404 en
      // developpement alors qu'il fonctionne en production, ou tout est servi
      // depuis le meme hote.
      '/broadcasting': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
      '/storage': {
        target: apiProxyTarget,
        changeOrigin: true,
      }
    }
  }
})
