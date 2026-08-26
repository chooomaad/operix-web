/**
 * Vocabulaire canonique du champ `type` d'un incident.
 *
 * Doit rester STRICTEMENT identique à `SafetyIncident::TYPES` côté API, qui reflète
 * lui-même la contrainte PostgreSQL `safety_incidents_type_check`. Envoyer une valeur
 * hors de cette liste produit un 422 (et produisait un 500 avant l'alignement des
 * vocabulaires — voir operix-api/docs/MOBILE_API_READINESS.md §B3).
 *
 * Les libellés affichés vivent dans les fichiers de traduction, sous `incidents.types.*`.
 */
export const INCIDENT_TYPES = [
  'LTI',
  'MTC',
  'RWC',
  'FAC',
  'HPI',
  'Fire',
  'Security',
  'Autre',
] as const

export type IncidentType = (typeof INCIDENT_TYPES)[number]
