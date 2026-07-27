import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { dashboardApi, safetyTrackerApi } from '@/api'

const CACHE_KEY    = 'operix_dashboard_v1'
const REFRESH_MS   = 120_000 // 2 minutes

function saveCache(data: object) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data })) } catch {}
}

function loadCache(): Record<string, any> | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Cache valide 10 minutes max
    if (Date.now() - parsed.ts > 10 * 60 * 1000) return null
    return parsed.data
  } catch { return null }
}

export const useDashboardStore = defineStore('dashboard', () => {
  const loading      = ref(false)
  const lastFetch    = ref<Date | null>(null)
  const fromCache    = ref(false)
  const tracker      = ref<Record<string, any> | null>(null)
  const timelineData = ref<Record<string, any>>({})
  const empBreakdown = ref<Record<string, any>>({})
  const topZones     = ref<any[]>([])
  const employees    = reactive<Record<string, number>>({})
  const safety       = reactive<Record<string, number>>({})
  const environment  = reactive<Record<string, number>>({})
  const gemba        = reactive<Record<string, number>>({})
  const equipment    = reactive<Record<string, number>>({})
  const visitors     = reactive<Record<string, number>>({})
  const contractors  = reactive<Record<string, number>>({})

  let _timer: ReturnType<typeof setInterval> | null = null
  let _selectedYear = new Date().getFullYear()

  function _applySnapshot(snap: Record<string, any>) {
    Object.assign(employees,   snap.employees   ?? {})
    Object.assign(safety,      snap.safety      ?? {})
    Object.assign(environment, snap.environment ?? {})
    Object.assign(gemba,       snap.gemba       ?? {})
    Object.assign(equipment,   snap.equipment   ?? {})
    Object.assign(visitors,    snap.visitors    ?? {})
    Object.assign(contractors, snap.contractors ?? {})
    if (snap.tracker)      tracker.value      = snap.tracker
    if (snap.timeline)     timelineData.value = snap.timeline
    if (snap.empBreakdown) empBreakdown.value = snap.empBreakdown
    if (snap.topZones)     topZones.value     = snap.topZones
  }

  // Charge le cache localStorage instantanément (avant l'API)
  function loadFromCache() {
    const cached = loadCache()
    if (cached) {
      _applySnapshot(cached)
      fromCache.value = true
    }
  }

  async function refresh(year?: number) {
    if (year) _selectedYear = year
    loading.value = true
    fromCache.value = false
    try {
      const [dash, tl, emp, tr, zones] = await Promise.all([
        dashboardApi.index(),
        dashboardApi.safetyTimeline(_selectedYear),
        dashboardApi.employeeBreakdown(),
        safetyTrackerApi.index(_selectedYear),
        dashboardApi.topZones(),
      ])

      const snap = {
        employees:   dash.data.employees   ?? {},
        safety:      dash.data.safety      ?? {},
        environment: dash.data.environment ?? {},
        gemba:       dash.data.gemba       ?? {},
        equipment:   dash.data.equipment   ?? {},
        visitors:    dash.data.visitors    ?? {},
        contractors: dash.data.contractors ?? {},
        tracker:     tr.data,
        timeline:    tl.data.timeline  ?? {},
        empBreakdown:emp.data,
        topZones:    zones.data.zones  ?? [],
      }

      _applySnapshot(snap)
      saveCache(snap)
      lastFetch.value = new Date()
    } catch (e) {
      // Garde les données en cache en cas d'erreur réseau
      console.warn('[Dashboard] refresh error, keeping cached data', e)
    } finally {
      loading.value = false
    }
  }

  async function refreshTimeline(year: number) {
    _selectedYear = year
    try {
      const { data } = await dashboardApi.safetyTimeline(year)
      timelineData.value = data.timeline ?? {}
    } catch {}
  }

  function startAutoRefresh() {
    if (_timer) return
    _timer = setInterval(() => { refresh() }, REFRESH_MS)
    // Refresh quand l'onglet redevient visible
    document.addEventListener('visibilitychange', _onVisibilityChange)
  }

  function stopAutoRefresh() {
    if (_timer) { clearInterval(_timer); _timer = null }
    document.removeEventListener('visibilitychange', _onVisibilityChange)
  }

  function _onVisibilityChange() {
    if (document.visibilityState === 'visible') {
      const stale = !lastFetch.value || (Date.now() - lastFetch.value.getTime()) > REFRESH_MS
      if (stale) refresh()
    }
  }

  return {
    loading, lastFetch, fromCache, tracker, timelineData, empBreakdown, topZones,
    employees, safety, environment, gemba, equipment, visitors, contractors,
    loadFromCache, refresh, refreshTimeline, startAutoRefresh, stopAutoRefresh,
  }
})
