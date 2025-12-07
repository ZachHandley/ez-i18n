/**
 * Runtime exports for ez-i18n
 *
 * This module is imported by the ez-i18n:runtime virtual module
 * and can also be used directly in Vue components
 */
export {
  effectiveLocale,
  translations,
  localePreference,
  localeLoading,
  initLocale,
  setLocale,
  setTranslations,
  getLocale,
  getTranslations,
} from './store';

export type { TranslationLoader } from './store';
