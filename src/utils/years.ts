/**
 * Operix HSSE démarre son utilisation réelle en 2026. Les années antérieures
 * (2022–2025) ne contiennent aucune donnée légitime et ne doivent donc pas être
 * proposées dans les sélecteurs d'année.
 *
 * La borne haute suit l'année courante : 2027, 2028… apparaissent
 * automatiquement le moment venu. Rien n'est codé en dur qui empêcherait
 * l'utilisation des années futures.
 */
export const OPERIX_START_YEAR = 2026

/** Années sélectionnables, de l'année courante (incluse) jusqu'à 2026. */
export function availableYears(): number[] {
  const current = new Date().getFullYear()
  const top = Math.max(current, OPERIX_START_YEAR)
  const years: number[] = []
  for (let y = top; y >= OPERIX_START_YEAR; y--) years.push(y)
  return years
}
