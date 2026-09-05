/**
 * Construit un FormData multipart à partir d'un objet, en gérant les tableaux
 * d'objets (ex. involved_people = [{type,id}] → involved_people[0][type]…) que
 * Laravel sait re-parser en tableau imbriqué.
 *
 * Utilisé pour envoyer un évènement HSSE AVEC un fichier (photo, rapport PDF) :
 * dès qu'un File est présent, on passe en multipart au lieu du JSON.
 */
export function objectToFormData(obj: Record<string, unknown>): FormData {
  const fd = new FormData()

  const append = (key: string, val: unknown): void => {
    if (val === null || val === undefined || val === '') return

    if (val instanceof File) {
      fd.append(key, val)
      return
    }
    if (Array.isArray(val)) {
      val.forEach((item, i) => {
        if (item && typeof item === 'object') {
          Object.entries(item as Record<string, unknown>).forEach(([k, v]) => append(`${key}[${i}][${k}]`, v))
        } else {
          append(`${key}[${i}]`, item)
        }
      })
      return
    }
    if (typeof val === 'object') {
      Object.entries(val as Record<string, unknown>).forEach(([k, v]) => append(`${key}[${k}]`, v))
      return
    }
    fd.append(key, String(val))
  }

  Object.entries(obj).forEach(([k, v]) => append(k, v))
  return fd
}

/** Vrai si l'objet contient au moins un File (donc envoi multipart requis). */
export function hasFile(obj: Record<string, unknown>): boolean {
  return Object.values(obj).some((v) => v instanceof File)
}
