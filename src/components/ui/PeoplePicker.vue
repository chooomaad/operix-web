<template>
  <div class="relative" ref="root">
    <!-- Personnes sélectionnées (chips : Nom · Type · ID) -->
    <div v-if="selected.length" class="flex flex-wrap gap-1.5 mb-2">
      <span
        v-for="p in selected" :key="`${p.type}-${p.id}`"
        class="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs"
        :class="chipClass(p.type)"
      >
        <span class="font-medium">{{ p.full_name }}</span>
        <span class="opacity-70">· {{ t(`people.types.${p.type}`) }}</span>
        <span class="font-mono opacity-70">· {{ p.identifier }}</span>
        <button type="button" @click="remove(p)" class="opacity-60 hover:opacity-100">
          <XMarkIcon class="w-3 h-3" />
        </button>
      </span>
    </div>

    <!-- Champ de recherche -->
    <div class="relative">
      <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        ref="inputRef" v-model="query" @input="onInput" @focus="open = true"
        @keydown.escape="open = false" @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="selectHighlighted"
        type="text" :placeholder="placeholder || t('people.searchPlaceholder')" class="input pl-9"
      />
      <div v-if="searching" class="absolute right-3 top-1/2 -translate-y-1/2">
        <div class="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>

    <!-- Résultats -->
    <div v-if="open && (results.length || noResults)"
      class="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 max-h-64 overflow-y-auto">
      <div v-if="noResults && !searching" class="px-4 py-3 text-sm text-gray-400 text-center">{{ t('common.noData') }}</div>
      <button
        v-for="(p, idx) in results" :key="`${p.type}-${p.id}`" type="button"
        @mousedown.prevent="select(p)"
        :class="['w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
          idx === highlighted ? 'bg-brand-50' : 'hover:bg-gray-50',
          isSelected(p) ? 'opacity-40 cursor-not-allowed' : '']"
        :disabled="isSelected(p)"
      >
        <span :class="['w-2 h-2 rounded-full flex-shrink-0', dotClass(p.type)]" />
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-gray-900 truncate">{{ p.full_name }}</div>
          <div class="text-xs text-gray-400 truncate">
            {{ t(`people.types.${p.type}`) }} · <span class="font-mono">{{ p.identifier }}</span>
            <span v-if="p.company"> · {{ p.company }}</span>
          </div>
        </div>
        <CheckIcon v-if="isSelected(p)" class="w-4 h-4 text-brand-500 flex-shrink-0" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { peopleApi } from '@/api'
import { XMarkIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/vue/24/outline'

interface Person { type: string; id: number; full_name: string; identifier: string; company?: string | null; first_name?: string; last_name?: string }

const props = defineProps<{ modelValue: Person[]; placeholder?: string }>()
const emit  = defineEmits<{ 'update:modelValue': [Person[]] }>()
const { t } = useI18n()

const query = ref('')
const results = ref<Person[]>([])
const selected = ref<Person[]>([...(props.modelValue ?? [])])
const open = ref(false)
const searching = ref(false)
const noResults = ref(false)
const highlighted = ref(-1)
const root = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()

let timer: ReturnType<typeof setTimeout>
let ctrl: AbortController | null = null

function onInput() {
  clearTimeout(timer)
  if (!query.value.trim()) { results.value = []; noResults.value = false; return }
  searching.value = true
  timer = setTimeout(search, 300)
}

async function search() {
  ctrl?.abort()
  ctrl = new AbortController()
  try {
    const { data } = await peopleApi.search(query.value, undefined, ctrl.signal)
    results.value = data.data ?? []
    noResults.value = results.value.length === 0
    highlighted.value = -1
  } catch { /* requête annulée / erreur : on ignore */ }
  finally { searching.value = false }
}

function key(p: Person) { return `${p.type}-${p.id}` }
function isSelected(p: Person) { return selected.value.some(s => key(s) === key(p)) }

function select(p: Person) {
  if (isSelected(p)) return
  selected.value.push(p)
  emit('update:modelValue', selected.value)
  query.value = ''; results.value = []; noResults.value = false; open.value = false
  inputRef.value?.focus()
}
function remove(p: Person) {
  selected.value = selected.value.filter(s => key(s) !== key(p))
  emit('update:modelValue', selected.value)
}
function move(d: number) { highlighted.value = Math.max(-1, Math.min(highlighted.value + d, results.value.length - 1)) }
function selectHighlighted() { if (highlighted.value >= 0 && results.value[highlighted.value]) select(results.value[highlighted.value]) }

function dotClass(type: string) {
  return { employee: 'bg-blue-500', contractor: 'bg-amber-500', visitor: 'bg-sky-500', intern: 'bg-violet-500' }[type] ?? 'bg-gray-400'
}
function chipClass(type: string) {
  return {
    employee:   'border-blue-200 bg-blue-50 text-blue-700',
    contractor: 'border-amber-200 bg-amber-50 text-amber-700',
    visitor:    'border-sky-200 bg-sky-50 text-sky-700',
    intern:     'border-violet-200 bg-violet-50 text-violet-700',
  }[type] ?? 'border-gray-200 bg-gray-50 text-gray-700'
}

function onClickOutside(e: MouseEvent) { if (root.value && !root.value.contains(e.target as Node)) open.value = false }

// Synchronise si le parent change la liste (mode édition pré-rempli)
watch(() => props.modelValue, (v) => {
  if ((v ?? []).map(key).join(',') !== selected.value.map(key).join(',')) selected.value = [...(v ?? [])]
})

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>
