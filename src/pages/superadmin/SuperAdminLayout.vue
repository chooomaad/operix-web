<template>
  <div class="min-h-screen flex bg-gray-50">
    <aside class="w-60 bg-[#0f2847] text-white flex flex-col">
      <div class="px-5 py-4 border-b border-white/10">
        <div class="font-semibold">Operix</div>
        <div class="text-xs text-white/60">Super Admin plateforme</div>
      </div>
      <nav class="flex-1 p-3 space-y-1 text-sm">
        <router-link v-for="l in links" :key="l.to" :to="l.to"
                     class="block px-3 py-2 rounded-lg hover:bg-white/10"
                     :class="{ 'bg-white/15 font-medium': isActive(l.to) }">
          {{ l.label }}
        </router-link>
      </nav>
      <button @click="logout" class="m-3 px-3 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20">
        Déconnexion
      </button>
    </aside>

    <main class="flex-1 overflow-auto">
      <div class="max-w-6xl mx-auto p-6">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const links = [
  { to: '/superadmin', label: 'Tableau de bord' },
  { to: '/superadmin/demo-requests', label: 'Demandes de démo' },
  { to: '/superadmin/plans', label: 'Plans' },
  { to: '/superadmin/orders', label: 'Commandes' },
  { to: '/superadmin/payments', label: 'Paiements' },
  { to: '/superadmin/subscriptions', label: 'Abonnements' },
]

function isActive(to: string): boolean {
  return to === '/superadmin' ? route.path === to : route.path.startsWith(to)
}

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>
