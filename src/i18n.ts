import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import fr from './locales/fr.json'

const savedLocale = localStorage.getItem('operix_locale') ?? 'en'

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: { en, fr },
})

export function setLocale(lang: 'en' | 'fr') {
  i18n.global.locale.value = lang
  localStorage.setItem('operix_locale', lang)
  document.documentElement.lang = lang
}

export function getLocale(): 'en' | 'fr' {
  return (i18n.global.locale.value as 'en' | 'fr') ?? 'en'
}
