/**
 * Configuration for ez-i18n Astro integration
 */
export interface EzI18nConfig {
  /**
   * List of supported locale codes (e.g., ['en', 'es', 'fr'])
   */
  locales: string[];

  /**
   * Default locale to use when no preference is detected
   */
  defaultLocale: string;

  /**
   * Cookie name for storing locale preference
   * @default 'ez-locale'
   */
  cookieName?: string;

  /**
   * Translation file paths for each locale.
   * Paths are relative to your project root.
   * Dynamic imports will be generated for code splitting.
   * @example
   * translations: {
   *   en: './src/i18n/en.json',
   *   es: './src/i18n/es.json',
   * }
   */
  translations?: Record<string, string>;
}

/**
 * Resolved config with defaults applied
 */
export interface ResolvedEzI18nConfig {
  locales: string[];
  defaultLocale: string;
  cookieName: string;
  translations: Record<string, string>;
}

/**
 * Translation function type
 */
export type TranslateFunction = (key: string, params?: Record<string, string | number>) => string;

/**
 * Augment Astro's locals type
 */
declare global {
  namespace App {
    interface Locals {
      /** Current locale code */
      locale: string;
      /** Loaded translations for the current locale */
      translations: Record<string, unknown>;
    }
  }
}
