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
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'selectedLanguage',
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false // React safely handles XSS
    },
    react: {
      useSuspense: false // Prevents the page from blanking out during switches
    }
  });

export default i18n;
