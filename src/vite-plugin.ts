import type { Plugin } from 'vite';
import type { EzI18nConfig, ResolvedEzI18nConfig } from './types';

const VIRTUAL_CONFIG = 'ez-i18n:config';
const VIRTUAL_RUNTIME = 'ez-i18n:runtime';
const VIRTUAL_TRANSLATIONS = 'ez-i18n:translations';
const RESOLVED_PREFIX = '\0';

/**
 * Resolve config with defaults
 */
export function resolveConfig(config: EzI18nConfig): ResolvedEzI18nConfig {
  return {
    locales: config.locales,
    defaultLocale: config.defaultLocale,
    cookieName: config.cookieName ?? 'ez-locale',
    translations: config.translations ?? {},
  };
}

/**
 * Vite plugin that provides virtual modules for ez-i18n
 */
export function vitePlugin(config: EzI18nConfig): Plugin {
  const resolved = resolveConfig(config);

  return {
    name: 'ez-i18n-vite',
    enforce: 'pre',

    resolveId(id) {
      if (id === VIRTUAL_CONFIG || id === VIRTUAL_RUNTIME || id === VIRTUAL_TRANSLATIONS) {
        return RESOLVED_PREFIX + id;
      }
      return null;
    },

    load(id) {
      // ez-i18n:config - Static config values
      if (id === RESOLVED_PREFIX + VIRTUAL_CONFIG) {
        return `
export const locales = ${JSON.stringify(resolved.locales)};
export const defaultLocale = ${JSON.stringify(resolved.defaultLocale)};
export const cookieName = ${JSON.stringify(resolved.cookieName)};
`;
      }

      // ez-i18n:runtime - Runtime exports for Astro files
      if (id === RESOLVED_PREFIX + VIRTUAL_RUNTIME) {
        return `
import { effectiveLocale, translations, setLocale, initLocale } from 'ez-i18n/runtime';

export { setLocale, initLocale };
export { effectiveLocale as locale };

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value == null || typeof value !== 'object') return undefined;
    value = value[key];
  }
  return value;
}

/**
 * Interpolate params into string
 */
function interpolate(str, params) {
  if (!params) return str;
  return str.replace(/\\{(\\w+)\\}/g, (match, key) => {
    return key in params ? String(params[key]) : match;
  });
}

/**
 * Translate a key to the current locale
 * @param key - Dot-notation key (e.g., 'common.welcome')
 * @param params - Optional interpolation params
 */
export function t(key, params) {
  const trans = translations.get();
  const value = getNestedValue(trans, key);

  if (typeof value !== 'string') {
    if (import.meta.env.DEV) {
      console.warn('[ez-i18n] Missing translation:', key);
    }
    return key;
  }

  return interpolate(value, params);
}
`;
      }

      // ez-i18n:translations - Translation loaders
      if (id === RESOLVED_PREFIX + VIRTUAL_TRANSLATIONS) {
        // Generate dynamic import statements for each locale
        const loaderEntries = Object.entries(resolved.translations)
          .map(([locale, path]) => `  ${JSON.stringify(locale)}: () => import(${JSON.stringify(path)})`)
          .join(',\n');

        return `
/**
 * Translation loaders for ez-i18n
 * Auto-generated from config
 */
export const translationLoaders = {
${loaderEntries}
};

/**
 * Load translations for a specific locale
 * @param locale - Locale code to load translations for
 * @returns Translations object or empty object if not found
 */
export async function loadTranslations(locale) {
  const loader = translationLoaders[locale];
  if (!loader) {
    if (import.meta.env.DEV) {
      console.warn('[ez-i18n] No translations configured for locale:', locale);
    }
    return {};
  }

  try {
    const mod = await loader();
    return mod.default ?? mod;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[ez-i18n] Failed to load translations for locale:', locale, error);
    }
    return {};
  }
}
`;
      }

      return null;
    },
  };
}
