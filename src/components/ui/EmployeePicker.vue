<template>
  <div class="relative" ref="root">
    <!-- Selected chips -->
    <div v-if="selected.length" class="flex flex-wrap gap-1.5 mb-2">
      <span
        v-for="emp in selected" :key="emp.id"
        class="inline-flex items-center gap-1 bg-brand-50 border border-brand-200 text-brand-700 text-xs rounded-full px-2 py-0.5"
      >
        <span class="w-4 h-4 rounded-full bg-brand-600 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
          {{ emp.prenom?.[0] }}{{ emp.nom?.[0] }}
        </span>
        <span>{{ emp.prenom }} {{ emp.nom }}</span>
        <span class="text-brand-400 font-mono">· {{ emp.matricule }}</span>
        <button type="button" @click="remove(emp.id)" class="ml-0.5 text-brand-400 hover:text-brand-600">
          <XMarkIcon class="w-3 h-3" />
        </button>
      </span>
    </div>

    <!-- Search input -->
    <div class="relative">
      <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        ref="inputRef"
        v-model="query"
        @input="onInput"
        @focus="open = true"
        @keydown.escape="open = false"
        @keydown.down.prevent="moveDown"
        @keydown.up.prevent="moveUp"
        @keydown.enter.prevent="selectHighlighted"
        type="text"
        :placeholder="placeholder"
        class="input pl-9"
      />
      <div v-if="searching" class="absolute right-3 top-1/2 -translate-y-1/2">
        <div class="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>

    <!-- Dropdown -->
    <div
      v-if="open && (results.length || noResults)"
      class="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 max-h-56 overflow-y-auto"
    >
      <div v-if="noResults && !searching" class="px-4 py-3 text-sm text-gray-400 text-center">
        {{ t('common.noData') }}
      </div>
      <button
        v-for="(emp, idx) in results" :key="emp.id"
        type="button"
        @mousedown.prevent="select(emp)"
        :class="['w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
          idx === highlighted ? 'bg-brand-50' : 'hover:bg-gray-50',
          isSelected(emp.id) ? 'opacity-40 cursor-not-allowed' : '']"
        :disabled="isSelected(emp.id)"
      >
        <div class="w-8 h-8 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {{ emp.prenom?.[0] }}{{ emp.nom?.[0] }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-gray-900 truncate">{{ emp.prenom }} {{ emp.nom }}</div>
          <div class="text-xs text-gray-400">{{ emp.matricule }} · {{ emp.poste }}</div>
        </div>
        <CheckIcon v-if="isSelected(emp.id)" class="w-4 h-4 text-brand-500 flex-shrink-0" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { employeesApi } from '@/api'
import { XMarkIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/vue/24/outline'

interface Employee { id: number; nom: string; prenom: string; matricule: string; poste?: string }

const props = defineProps<{
  modelValue: number[]
  placeholder?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [number[]] }>()
const { t } = useI18n()

const query       = ref('')
const results     = ref<Employee[]>([])
const selected    = ref<Employee[]>([])
const open        = ref(false)
const searching   = ref(false)
const noResults   = ref(false)
const highlighted = ref(-1)
const root        = ref<HTMLElement>()
const inputRef    = ref<HTMLInputElement>()

let timer: ReturnType<typeof setTimeout>

function onInput() {
  clearTimeout(timer)
  if (!query.value.trim()) { results.value = []; noResults.value = false; return }
  searching.value = true
  timer = setTimeout(search, 300)
}

async function search() {
  try {
    const { data } = await employeesApi.list({ search: query.value, per_page: 10, is_active: true })
    results.value  = data.data ?? []
    noResults.value = results.value.length === 0
    highlighted.value = -1
  } finally {
    searching.value = false
  }
}

function select(emp: Employee) {
  if (isSelected(emp.id)) return
  selected.value.push(emp)
  emit('update:modelValue', selected.value.map(e => e.id))
  query.value = ''
  results.value = []
  noResults.value = false
  open.value = false
  inputRef.value?.focus()
}

function remove(id: number) {
  selected.value = selected.value.filter(e => e.id !== id)
  emit('update:modelValue', selected.value.map(e => e.id))
}

function isSelected(id: number) { return selected.value.some(e => e.id === id) }

function moveDown() { highlighted.value = Math.min(highlighted.value + 1, results.value.length - 1) }
function moveUp()   { highlighted.value = Math.max(highlighted.value - 1, -1) }
function selectHighlighted() {
  if (highlighted.value >= 0 && results.value[highlighted.value]) select(results.value[highlighted.value])
}

function onClickOutside(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}

// Sync from parent (e.g. edit mode pre-population)
watch(() => props.modelValue, async (ids) => {
  if (!ids.length) { selected.value = []; return }
  // Only fetch missing
  const missing = ids.filter(id => !selected.value.some(e => e.id === id))
  if (!missing.length) return
  // Fetch each missing employee
  const fetched = await Promise.all(missing.map(id => employeesApi.show(id).then(r => r.data)))
  selected.value = [...selected.value.filter(e => ids.includes(e.id)), ...fetched]
}, { immediate: true })

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>
