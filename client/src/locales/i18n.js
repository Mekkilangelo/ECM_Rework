import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import des fichiers de traduction
import translationEN from './en/translation.json';
import translationFR from './fr/translation.json';

const resources = {
  en: {
    translation: translationEN
  },
  fr: {
    translation: translationFR
  }
};

i18n
  // Détecte la langue du navigateur
  .use(LanguageDetector)
  // Passe l'instance i18n à react-i18next
  .use(initReactI18next)
  // Initialise i18next
  .init({
    resources,
    lng: 'en', // Langue initiale: anglais
    fallbackLng: 'en', // Langue par défaut: anglais
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // React escape déjà par défaut
    },
    react: {
      useSuspense: true
    }
  });

export default i18n;