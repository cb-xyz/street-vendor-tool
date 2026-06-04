/**
 * i18n scaffold. Per Local Law 30 (2017) + Wolof, the tool must support 10 citywide languages
 * plus Wolof. We register all language slots from day one (per CLAUDE.md — don't retrofit) and
 * fall back to English for any not-yet-translated string. DSNY already publishes 12-language
 * vendor guides incl. Wolof — those translations should be reused as they're delivered.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import es from './locales/es';
import zh from './locales/zh';
import ru from './locales/ru';
import bn from './locales/bn';
import ht from './locales/ht';
import ko from './locales/ko';
import ar from './locales/ar';
import ur from './locales/ur';
import fr from './locales/fr';
import pl from './locales/pl';
import wo from './locales/wo';

const RTL = new Set(['ar', 'ur']);

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
  resources: {
    en: { translation: en },
    es: { translation: es },
    zh: { translation: zh },
    ru: { translation: ru },
    bn: { translation: bn },
    ht: { translation: ht },
    ko: { translation: ko },
    ar: { translation: ar },
    ur: { translation: ur },
    fr: { translation: fr },
    pl: { translation: pl },
    wo: { translation: wo },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  // Non-English translations are DRAFT and fall back to English for any missing key.
});

// Keep <html lang> + text direction in sync with the active language (accessibility / RTL).
i18n.on('languageChanged', (lng) => {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lng;
  document.documentElement.dir = RTL.has(lng) ? 'rtl' : 'ltr';
});

export default i18n;
