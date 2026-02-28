import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'

export const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
]

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
            lookupQuerystring: 'lang',
        },
    })

export default i18n
