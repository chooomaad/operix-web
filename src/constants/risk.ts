// Référentiel du module « management des risques », partagé entre les écrans.
// Les libellés viennent de l'i18n : risks.categories.<k>, risks.assessment.<k>,
// risks.hierarchy.<k>, risks.levels.<k>, risks.priorities.<k>, risks.actionStatus.<k>.

export const RISK_CATEGORIES = [
  'hse', 'industrial_safety', 'fire', 'work_at_height', 'traffic', 'handling',
  'equipment', 'chemicals', 'environment', 'ergonomics', 'electricity',
  'confined_space', 'hot_work', 'ship', 'security', 'unauthorized_access',
  'intrusion', 'theft', 'cctv', 'visitor_management', 'contractor',
] as const

export const ASSESSMENT_TYPES = ['jsa', 'hira', 'risk_assessment'] as const
export const CONTROL_HIERARCHY = ['elimination', 'substitution', 'engineering', 'administrative', 'ppe'] as const
export const RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const
export const RISK_STATUSES = ['open', 'monitoring', 'closed'] as const
export const ACTION_PRIORITIES = ['low', 'medium', 'high'] as const
export const ACTION_STATUSES = ['todo', 'in_progress', 'done'] as const

/** Barème officiel : 1–4 faible, 5–9 moyen, 10–16 élevé, 17–25 critique. */
export function levelForScore(score: number): string {
  if (score >= 17) return 'critical'
  if (score >= 10) return 'high'
  if (score >= 5) return 'medium'
  return 'low'
}

/** Classes Tailwind d'un niveau (badge / pastille). */
export function levelClasses(level: string): { badge: string; dot: string } {
  return ({
    low:      { badge: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
    medium:   { badge: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500' },
    high:     { badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
    critical: { badge: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
  } as Record<string, { badge: string; dot: string }>)[level] ?? { badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' }
}

/** Couleur de fond d'une cellule de matrice selon son score. */
export function cellColor(score: number): string {
  return ({ low: '#16a34a', medium: '#f59e0b', high: '#ea580c', critical: '#dc2626' } as Record<string, string>)[levelForScore(score)]
}
