<template>
  <div class="flex h-screen bg-gray-50 overflow-hidden">
    <!-- Mobile overlay -->
    <Transition name="overlay">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 bg-black/50 z-40 lg:hidden"
        @click="sidebarOpen = false"
      />
    </Transition>

    <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="flex-1 flex flex-col overflow-hidden min-w-0">
      <TopBar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <RealtimeStatusBanner />
      <main class="flex-1 overflow-y-auto">
        <!-- Pas de <Transition mode="out-in"> autour du <KeepAlive> : la combinaison
             laisse l'écran blanc au retour vers une page mise en cache (bug connu
             Vue). Le KeepAlive suffit pour éviter les rechargements. -->
        <RouterView v-slot="{ Component, route }">
          <KeepAlive :max="8" :include="cachedPages">
            <component :is="Component" :key="route.fullPath" />
          </KeepAlive>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from './Sidebar.vue'
import TopBar from './TopBar.vue'
import RealtimeStatusBanner from '@/realtime/RealtimeStatusBanner.vue'
import { useRealtime } from '@/realtime/useRealtime'

// Branche le flux temps reel UNE seule fois, ici : cette mise en page enveloppe
// toutes les vues authentifiees. L'appeler depuis chaque page ouvrirait autant de
// connexions WebSocket, et chaque evenement serait recu en double.
useRealtime()

const sidebarOpen = ref(false)

// Pages cached in memory to avoid re-fetching on navigation
const cachedPages = [
  'DashboardPage',
  'EmployeesPage',
  'IncidentsPage',
  'NearMissPage',
  'BreachesPage',
  'PropertyDamagePage',

  'ContractorsPage',
  'VisitorsPage',
]
</script>

<style>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.12s ease; }
.fade-enter-from,
.fade-leave-to    { opacity: 0; }
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.2s ease; }
.overlay-enter-from,  .overlay-leave-to      { opacity: 0; }
</style>
