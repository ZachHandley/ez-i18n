/**
 * Type declarations for ez-i18n virtual modules
 *
 * Note: These are also injected via injectTypes() for consumer projects.
 * This file provides types during package development.
 */

declare module 'ez-i18n:config' {
  /** List of all supported locale codes */
  export const locales: readonly string[];
  /** Default locale when no preference is detected */
  export const defaultLocale: string;
  /** Cookie name used to store locale preference */
  export const cookieName: string;
  /** Display names for each locale (in native language) */
  export const localeNames: Record<string, string>;
  /** BCP47 language tags for each locale */
  export const localeToBCP47: Record<string, string>;
  /** Text direction for each locale ('ltr' or 'rtl') */
  export const localeDirections: Record<string, 'ltr' | 'rtl'>;
}

declare module 'ez-i18n:runtime' {
  import type { ReadableAtom } from 'nanostores';

  /** Reactive store containing the current locale */
  export const locale: ReadableAtom<string>;

  /**
   * Translate a key to the current locale
   * @param key - Dot-notation key (e.g., 'common.welcome')
   * @param params - Optional interpolation params for {placeholder} syntax
   */
  export function t(key: string, params?: Record<string, string | number>): string;

  /**
   * Set the current locale and persist to cookie/localStorage
   * @param locale - Locale code to switch to
   * @param options - Cookie name string or options object
   */
  export function setLocale(
    locale: string,
    options?: string | {
      cookieName?: string;
      loadTranslations?: () => Promise<{ default?: Record<string, unknown> } | Record<string, unknown>>;
    }
  ): Promise<void>;

  /**
   * Initialize the locale store with translations
   * @param locale - Initial locale code
   * @param translations - Optional initial translations object
   */
  export function initLocale(locale: string, translations?: Record<string, unknown>): void;
}

declare module 'ez-i18n:translations' {
  /** Map of locale codes to their translation loaders */
  export const translationLoaders: Record<
    string,
    () => Promise<{ default?: Record<string, unknown> } | Record<string, unknown>>
  >;

  /**
   * Load translations for a specific locale
   * @param locale - Locale code to load translations for
   * @returns Translations object or empty object if not found
   */
  export function loadTranslations(locale: string): Promise<Record<string, unknown>>;
}
