import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en', // Default language
    debug: false,      // Set to true to see translation logs in the console
    preload: ['en', 'hi'], // Preloads English and Hindi for instant switching
    interpolation: {
      escapeValue: false, // React already escapes values securely
    },
    backend: {
      // Path where your translation JSON files will be stored
      loadPath: '/locales/{{lng}}/translation.json', 
    }
  });

export default i18n;