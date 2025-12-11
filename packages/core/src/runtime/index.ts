/**
 * Runtime exports for ez-i18n
 *
 * This module is imported by the ez-i18n:runtime virtual module
 * and can also be used directly in Vue components
 */
export {
  // Stores (nanostores atoms)
  effectiveLocale,
  translations,
  localePreference,
  localeLoading,

  // Store manipulation
  initLocale,
  setLocale,
  setTranslations,
  getLocale,
  getTranslations,

  // Translation functions
  t,
  tc,

  // Utilities (for framework packages to reuse)
  getNestedValue,
  interpolate,
} from './store';

export type { TranslationLoader } from './store';
