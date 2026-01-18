import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ru from './locales/ru.json';
import en from './locales/en.json';

const LANGUAGE_KEY = 'app_language';

const getSavedLanguage = (): string => {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  return saved && ['ru', 'en'].includes(saved) ? saved : 'ru';
};

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    en: { translation: en },
  },
  lng: getSavedLanguage(),
  fallbackLng: 'ru',
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(LANGUAGE_KEY, lng);
});

export default i18n;
