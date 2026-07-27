<template>
  <div class="px-3 pt-4 pb-1">
    <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ label }}</span>
  </div>
</template>
<script setup lang="ts">
defineProps<{ label: string }>()
</script>
