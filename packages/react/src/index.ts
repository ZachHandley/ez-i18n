import { useStore } from '@nanostores/react';
// Import from package path (not relative) to ensure shared store instance
import {
  effectiveLocale,
  translations,
  setLocale,
  initLocale,
  setTranslations,
  getNestedValue,
  interpolate,
  tc as tcCore,
} from '@zachhandley/ez-i18n/runtime';
import type { TranslateFunction } from '@zachhandley/ez-i18n';

// Initialize stores from global data if available (handles separate Vite bundles)
if (globalThis.__EZ_I18N__) {
  initLocale(globalThis.__EZ_I18N__.locale, globalThis.__EZ_I18N__.translations);
  setTranslations(globalThis.__EZ_I18N__.translations);
}

/**
 * React hook for i18n
 *
 * Note: In React, t() is already reactive because useI18n() subscribes to
 * the translations store via useStore(). When translations change, the
 * component re-renders and t() returns updated values.
 *
 * @example
 * import { useI18n } from '@zachhandley/ez-i18n/react';
 *
 * function MyComponent() {
 *   const { t, locale, setLocale } = useI18n();
 *
 *   return (
 *     <div>
 *       <h1>{t('common.welcome')}</h1>
 *       <p>{t('greeting', { name: 'World' })}</p>
 *       <button onClick={() => setLocale('es')}>Español</button>
 *     </div>
 *   );
 * }
 */
export function useI18n() {
  const locale = useStore(effectiveLocale);
  const trans = useStore(translations);

  const t: TranslateFunction = (
    key: string,
    params?: Record<string, string | number>
  ): string => {
    // Fallback: if store is empty, check global context set by middleware/EzI18nHead
    let effectiveTrans = trans;
    if (Object.keys(trans).length === 0) {
      const ssrTrans = globalThis.__EZ_I18N__?.translations;
      if (ssrTrans) {
        effectiveTrans = ssrTrans;
      }
    }

    const value = getNestedValue(effectiveTrans, key);

    if (typeof value !== 'string') {
      if (import.meta.env?.DEV) {
        console.warn('[ez-i18n] Missing translation:', key);
      }
      return key;
    }

    return interpolate(value, params);
  };

  return {
    t,
    locale,
    setLocale,
  };
}

/**
 * Hook to get a single reactive translation.
 * Use this when you need to subscribe to a specific translation key.
 *
 * @example
 * const title = useTranslation('welcome.title');
 */
export function useTranslation(
  key: string,
  params?: Record<string, string | number>
): string {
  return useStore(tcCore(key, params));
}

// Re-export core tc for advanced usage with useStore
export { tc as tcAtom } from '@zachhandley/ez-i18n/runtime';
