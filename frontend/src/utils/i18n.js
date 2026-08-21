// import i18n from 'i18next';
// import { initReactI18next } from 'react-i18next';
// import LanguageDetector from 'i18next-browser-languagedetector';
// import Backend from 'i18next-http-backend';

// i18n
//   .use(Backend)
//   .use(LanguageDetector)
//   .use(initReactI18next)
//   .init({
//     fallbackLng: 'en', // Default language
//     debug: false,      // Set to true to see translation logs in the console
//     preload: ['en', 'hi'], // Preloads English and Hindi for instant switching
//     interpolation: {
//       escapeValue: false, // React already escapes values securely
//     },
//     backend: {
//       // Path where your s3w JSON files will be stored
//       loadPath: '/locales/{{lng}}/translation.json', 
//     }
//   });

// export default i18n;
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../assets/translate/en/translation.json';
import hi from '../assets/translate/hi/translation.json';
import bn from '../assets/translate/bn/translation.json';
import te from '../assets/translate/te/translation.json';
import ta from '../assets/translate/ta/translation.json';
import mr from '../assets/translate/mr/translation.json';
import gu from '../assets/translate/gu/translation.json';
import kn from '../assets/translate/kn/translation.json';
import ml from '../assets/translate/ml/translation.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  bn: { translation: bn },
  te: { translation: te },
  ta: { translation: ta },
  mr: { translation: mr },
  gu: { translation: gu },
  kn: { translation: kn },
  ml: { translation: ml }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React safely handles XSS
    },
    react: {
      useSuspense: false // Prevents the page from blanking out during switches
    }
  });

export default i18n;
