<template>
  <div class="inline-block">
    <div class="flex">
      <!-- Axe Gravité (vertical) -->
      <div class="flex flex-col items-center justify-center pr-1">
        <span class="text-[10px] font-semibold text-gray-500 uppercase tracking-wide" style="writing-mode:vertical-rl; transform:rotate(180deg)">{{ t('risks.severity') }}</span>
      </div>
      <div>
        <div class="flex">
          <!-- Colonne des libellés gravité -->
          <div class="flex flex-col justify-between mr-1">
            <div v-for="s in [5,4,3,2,1]" :key="s" class="h-9 flex items-center justify-end pr-1 text-[11px] font-semibold text-gray-500 tabular-nums" style="width:14px">{{ s }}</div>
          </div>
          <!-- Grille -->
          <div>
            <div v-for="s in [5,4,3,2,1]" :key="s" class="flex">
              <button
                v-for="p in [1,2,3,4,5]" :key="p"
                type="button"
                :disabled="readonly"
                @click="select(p, s)"
                class="w-9 h-9 m-[1px] rounded-md flex items-center justify-center text-xs font-bold transition-transform"
                :class="[ readonly ? 'cursor-default' : 'cursor-pointer hover:scale-105',
                          isSelected(p,s) ? 'ring-2 ring-offset-1 ring-gray-900 scale-105 text-white' : 'text-white/95' ]"
                :style="cellStyle(p, s)"
                :title="`P${p} × G${s} = ${p*s}`"
              >
                {{ readonly ? (counts?.[`${p}_${s}`] || '') : p * s }}
              </button>
            </div>
            <!-- Axe Probabilité (horizontal) -->
            <div class="flex">
              <div v-for="p in [1,2,3,4,5]" :key="p" class="w-9 m-[1px] text-center text-[11px] font-semibold text-gray-500 tabular-nums">{{ p }}</div>
            </div>
            <div class="text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wide mt-0.5">{{ t('risks.probability') }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { cellColor } from '@/constants/risk'

const props = defineProps<{
  probability?: number | null
  severity?: number | null
  readonly?: boolean
  counts?: Record<string, number>
}>()
const emit = defineEmits<{ 'update:probability': [number]; 'update:severity': [number] }>()
const { t } = useI18n()

function isSelected(p: number, s: number): boolean {
  // Surligne la cellule choisie — en saisie comme en lecture seule (fiche détail).
  return props.probability === p && props.severity === s
}

function cellStyle(p: number, s: number): Record<string, string> {
  const base = cellColor(p * s)
  // En heatmap, on atténue les cellules vides (sauf la cellule surlignée d'une fiche).
  if (props.readonly && !isSelected(p, s) && !(props.counts?.[`${p}_${s}`])) {
    return { backgroundColor: base, opacity: '0.28' }
  }
  return { backgroundColor: base }
}

function select(p: number, s: number): void {
  if (props.readonly) return
  emit('update:probability', p)
  emit('update:severity', s)
}
</script>
