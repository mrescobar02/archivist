import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './locales/es.json'
import en from './locales/en.json'

const saved = localStorage.getItem('lang') as 'es' | 'en' | null
const browser = navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en'
const defaultLng: 'es' | 'en' = saved ?? browser

i18n
  .use(initReactI18next)
  .init({
    resources: { es: { translation: es }, en: { translation: en } },
    lng: defaultLng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

i18n.on('languageChanged', (lng) => localStorage.setItem('lang', lng))

export default i18n
