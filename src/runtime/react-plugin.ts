import { useStore } from '@nanostores/react';
import { effectiveLocale, translations, setLocale } from './store';
import type { TranslateFunction } from '../types';

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let value: unknown = obj;

  for (const key of keys) {
    if (value == null || typeof value !== 'object') {
      return undefined;
    }
    value = (value as Record<string, unknown>)[key];
  }

  return value;
}

/**
 * Interpolate params into string
 */
function interpolate(
  str: string,
  params?: Record<string, string | number>
): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (match, key) => {
    return key in params ? String(params[key]) : match;
  });
}

/**
 * React hook for i18n
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
    const value = getNestedValue(trans, key);

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
