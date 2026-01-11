import i18next from 'i18next';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ru = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales/ru.json'), 'utf-8'));
const en = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales/en.json'), 'utf-8'));

i18next.init({
  lng: 'ru',
  fallbackLng: 'ru',
  supportedLngs: ['ru', 'en'],
  resources: {
    ru: { translation: ru },
    en: { translation: en },
  },
  interpolation: {
    escapeValue: false,
  },
});

export const i18n = i18next;

export function t(key: string, options?: Record<string, unknown>, lang = 'ru'): string {
  return i18next.t(key, { ...options, lng: lang });
}

export function getLanguage(code?: string): string {
  if (code === 'en' || code?.startsWith('en')) {
    return 'en';
  }
  return 'ru';
}
