<template>
  <RouterLink
    :to="to"
    :class="[
      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
      isActive
        ? 'bg-brand-600 text-white'
        : 'text-gray-400 hover:bg-gray-800 hover:text-white',
    ]"
  >
    <component :is="icon" class="w-4 h-4 flex-shrink-0" />
    <span>{{ label }}</span>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{ to: string; icon: unknown; label: string; exact?: boolean }>()
const route = useRoute()
const isActive = computed(() =>
  props.exact ? route.path === props.to : route.path.startsWith(props.to)
)
</script>
