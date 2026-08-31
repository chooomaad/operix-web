<template>
  <ErrorBoundary>
    <RouterView />
  </ErrorBoundary>
  <Toast />
  <ConfirmDialog />
</template>

<script setup lang="ts">
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
</script>
