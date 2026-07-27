import { ref, reactive } from 'vue'

export function useFilters<T extends Record<string, unknown>>(defaults: T) {
  const filters = reactive<T>({ ...defaults })

  function reset() {
    Object.keys(defaults).forEach(k => {
      (filters as Record<string, unknown>)[k] = defaults[k]
    })
  }

  function toParams(): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    )
  }

  return { filters, reset, toParams }
}
