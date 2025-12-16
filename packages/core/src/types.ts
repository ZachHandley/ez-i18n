/**
 * Translation path for a single locale:
 * - Single file: `./src/i18n/en.json`
 * - Folder: `./src/i18n/en/` (auto-discover all JSONs inside)
 * - Glob: `./src/i18n/en/**.json` (recursive)
 * - Array: `['./common.json', './auth.json']`
 */
export type LocaleTranslationPath = string | string[];

/**
 * Translation config can be:
 * - A base directory string (auto-discovers locale folders): './public/i18n/'
 * - Per-locale mapping: { en: './src/i18n/en/', es: './src/i18n/es.json' }
 */
export type TranslationsConfig = string | Record<string, LocaleTranslationPath>;

/**
 * Configuration for ez-i18n Astro integration
 */
export interface EzI18nConfig {
  /**
   * List of supported locale codes (e.g., ['en', 'es', 'fr'])
   * Optional if using directory-based auto-discovery - locales will be
   * detected from folder names in the translations directory.
   */
  locales?: string[];

  /**
   * Default locale to use when no preference is detected.
   * Required - this tells us what to fall back to.
   */
  defaultLocale: string;

  /**
   * Cookie name for storing locale preference
   * @default 'ez-locale'
   */
  cookieName?: string;

  /**
   * Translation file paths configuration.
   * Paths are relative to your project root.
   *
   * Can be:
   * - A base directory (auto-discovers locale folders):
   *   translations: './public/i18n/'
   *   → Scans for en/, es/, fr/ folders and their JSON files
   *   → Auto-populates `locales` from discovered folders
   *
   * - Per-locale mapping with flexible path types:
   *   translations: {
   *     en: './src/i18n/en.json',           // single file
   *     es: './src/i18n/es/',               // folder (all JSONs)
   *     fr: './src/i18n/fr/**.json',          // glob pattern
   *     de: ['./common.json', './auth.json'] // array of files
   *   }
   *
   * If not specified, auto-discovers from ./public/i18n/
   */
  translations?: TranslationsConfig;

  /**
   * Derive namespace from file path relative to locale folder.
   *
   * When enabled:
   * - `en/auth/login.json` with `{ "title": "..." }` → `$t('auth.login.title')`
   * - `en/common.json` with `{ "actions": {...} }` → `$t('common.actions.save')`
   *
   * The file path (minus locale folder and .json extension) becomes the key prefix.
   *
   * @default true when using folder-based translations config
   */
  pathBasedNamespacing?: boolean;
}

/**
 * Resolved config with defaults applied.
 * After resolution:
 * - locales is always populated (from config or auto-discovered)
 * - translations is normalized to arrays of absolute file paths
 */
export interface ResolvedEzI18nConfig {
  locales: string[];
  defaultLocale: string;
  cookieName: string;
  /** Normalized: locale → array of resolved absolute file paths */
  translations: Record<string, string[]>;
  /** Whether to derive namespace from file path */
  pathBasedNamespacing: boolean;
  /** Base directory for each locale (used for namespace calculation) */
  localeBaseDirs: Record<string, string>;
}

/**
 * Cache file structure (.ez-i18n.json)
 * Used to speed up subsequent builds by caching discovered translations
 */
export interface TranslationCache {
  version: number;
  /** Discovered locale → file paths mapping */
  discovered: Record<string, string[]>;
  /** ISO timestamp of last scan */
  lastScan: string;
}

/**
 * Translation function type
 */
export type TranslateFunction = (key: string, params?: Record<string, string | number>) => string;

/**
 * Augment Astro's locals type
 */
// Global context for cross-bundle i18n data sharing
export interface EzI18nContext {
  locale: string;
  translations: Record<string, unknown>;
}

declare global {
  namespace App {
    interface Locals {
      /** Current locale code */
      locale: string;
      /** Loaded translations for the current locale */
      translations: Record<string, unknown>;
      /** Server-side translation function */
      t: TranslateFunction;
    }
  }

  // eslint-disable-next-line no-var
  var __EZ_I18N__: EzI18nContext | undefined;
  // eslint-disable-next-line no-var
  var __EZ_I18N_ASSETS__: { fetch: (req: Request | URL | string) => Promise<Response> } | undefined;
}
