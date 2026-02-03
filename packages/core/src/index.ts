import type { AstroIntegration, HookParameters } from 'astro';
import type { EzI18nConfig } from './types';
import { vitePlugin, resolveConfig } from './vite-plugin';

export type { EzI18nConfig, TranslateFunction } from './types';
export { LOCALE_DATABASE, getLocaleInfo, buildLocaleNames, buildLocaleToBCP47, buildLocaleDirections } from './utils/locales';
export type { LocaleInfo } from './utils/locales';

/**
 * ez-i18n Astro integration
 *
 * Provides cookie-based i18n without URL prefixes.
 *
 * @example
 * // astro.config.ts
 * import ezI18n from '@zachhandley/ez-i18n';
 *
 * export default defineConfig({
 *   integrations: [
 *     ezI18n({
 *       locales: ['en', 'es', 'fr'],
 *       defaultLocale: 'en',
 *       translations: {
 *         en: './src/i18n/en.json',
 *         es: './src/i18n/es.json',
 *       },
 *     }),
 *   ],
 * });
 */
export default function ezI18n(config: EzI18nConfig): AstroIntegration {
  const resolved = resolveConfig(config);

  return {
    name: 'ez-i18n',
    hooks: {
      'astro:config:setup': ({
        updateConfig,
        addMiddleware,
        injectScript,
      }: HookParameters<'astro:config:setup'>) => {
        // Add Vite plugin for virtual modules
        updateConfig({
          vite: {
            plugins: [vitePlugin(config)],
          },
        });

        // Add locale detection middleware
        addMiddleware({
          entrypoint: '@zachhandley/ez-i18n/middleware',
          order: 'pre',
        });

        // Inject hydration script to sync localStorage with cookie
        // This prevents hydration mismatch when server and client disagree
        const hydrationScript = `
(function() {
  try {
    var cookieName = ${JSON.stringify(resolved.cookieName)};
    var stored = localStorage.getItem(cookieName);
    var cookieMatch = document.cookie.match(new RegExp(cookieName + '=([^;]+)'));
    var cookie = cookieMatch ? cookieMatch[1] : null;
    if (cookie && stored !== cookie) {
      localStorage.setItem(cookieName, cookie);
    }
  } catch (e) {}
})();
`;
        injectScript('head-inline', hydrationScript);

        // View Transitions support - re-initializes i18n after Astro page swaps
        const viewTransitionsScript = `
import { initLocale, setTranslations } from '@zachhandley/ez-i18n/runtime';

document.addEventListener('astro:after-swap', () => {
  const initData = globalThis.__EZ_I18N__;
  if (initData) {
    initLocale(initData.locale, initData.translations);
    setTranslations(initData.translations);
  }
});
`;
        injectScript('page', viewTransitionsScript);
      },

      'astro:config:done': ({
        injectTypes,
      }: HookParameters<'astro:config:done'>) => {
        // Inject type declarations for virtual modules
        injectTypes({
          filename: 'virtual.d.ts',
          content: `\
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
  /** Explicit cookie domain override (undefined = auto-detect from hostname) */
  export const cookieDomain: string | undefined;
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
   * @param cookieName - Optional custom cookie name
   */
  export function setLocale(locale: string, cookieName?: string): Promise<void>;
  /**
   * Initialize the locale store with translations
   * @param locale - Initial locale code
   * @param translations - Optional initial translations object
   */
  export function initLocale(locale: string, translations?: Record<string, unknown>): void;
}

declare module 'ez-i18n:translations' {
  /** Load translations for a specific locale */
  export function loadTranslations(locale: string): Promise<Record<string, unknown>>;
  /** Get the translation loader map from config */
  export const translationLoaders: Record<string, () => Promise<{ default: Record<string, unknown> }>>;
}
`,
        });
      },
    },
  };
}
