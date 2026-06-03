/**
 * i18n scaffold. Per Local Law 30 (2017) + Wolof, the tool must support 10 citywide languages
 * plus Wolof. We register all language slots from day one (per CLAUDE.md — don't retrofit) and
 * fall back to English for any not-yet-translated string. DSNY already publishes 12-language
 * vendor guides incl. Wolof — those translations should be reused as they're delivered.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';

/** Local Law 30 citywide languages + Wolof. label = endonym shown in the language switcher. */
export const SUPPORTED_LANGUAGES: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'zh', label: '中文' },
  { code: 'ru', label: 'Русский' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'ht', label: 'Kreyòl' },
  { code: 'ko', label: '한국어' },
  { code: 'ar', label: 'العربية' },
  { code: 'ur', label: 'اردو' },
  { code: 'fr', label: 'Français' },
  { code: 'pl', label: 'Polski' },
  { code: 'wo', label: 'Wolof' },
];

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  // Other languages intentionally unregistered until translations are delivered; i18next
  // falls back to English so no UI string is ever missing.
});

export default i18n;
