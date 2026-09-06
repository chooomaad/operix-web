// Référentiel EPI partagé entre le formulaire, la vue et les tableaux.
// Les libellés sont fournis par l'i18n : profile.epi.itemsList.<key>,
// profile.epi.categories.<key>, profile.epi.conditions.<key>.

export const PPE_ITEMS = [
  'helmet', 'safety_glasses', 'face_shield', 'ear_plugs', 'ear_muffs',
  'respirator', 'dust_mask', 'gloves', 'safety_boots', 'hi_vis_vest',
  'coverall', 'harness', 'rain_gear', 'knee_pads',
] as const

export const PPE_CATEGORIES = [
  'head', 'eyes', 'hearing', 'respiratory', 'hands', 'feet', 'body', 'fall', 'other',
] as const

export const PPE_CONDITIONS = ['neuf', 'bon', 'use', 'a_remplacer'] as const
