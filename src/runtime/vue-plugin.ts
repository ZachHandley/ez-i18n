import type { App, Plugin, ComputedRef } from 'vue';
import { computed } from 'vue';
import { useStore } from '@nanostores/vue';
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
 * Create a translation function bound to a translations object
 */
function createTranslateFunction(
  translationsRef: ComputedRef<Record<string, unknown>>
): TranslateFunction {
  return (key: string, params?: Record<string, string | number>): string => {
    const trans = translationsRef.value;
    const value = getNestedValue(trans, key);

    if (typeof value !== 'string') {
      if (import.meta.env?.DEV) {
        console.warn('[ez-i18n] Missing translation:', key);
      }
      return key;
    }

    return interpolate(value, params);
  };
}

/**
 * Vue plugin that provides global $t(), $locale, and $setLocale
 *
 * @example
 * // In _vueEntrypoint.ts or main.ts
 * import { ezI18nVue } from 'ez-i18n/vue';
 *
 * export default (app) => {
 *   app.use(ezI18nVue);
 * };
 *
 * @example
 * // In Vue components
 * <template>
 *   <h1>{{ $t('welcome.title') }}</h1>
 *   <p>{{ $t('welcome.message', { name: userName }) }}</p>
 *   <button @click="$setLocale('es')">Español</button>
 * </template>
 */
export const ezI18nVue: Plugin = {
  install(app: App) {
    // Get reactive store values
    const locale = useStore(effectiveLocale);
    const trans = useStore(translations);

    // Create reactive computed for translations
    const transComputed = computed(() => trans.value);

    // Create translate function
    const t = createTranslateFunction(transComputed);

    // Add global properties
    app.config.globalProperties.$t = t;
    app.config.globalProperties.$locale = locale;
    app.config.globalProperties.$setLocale = setLocale;

    // Also provide for composition API usage
    app.provide('ez-i18n', {
      t,
      locale,
      setLocale,
    });
  },
};

/**
 * Composable for using i18n in Vue components with Composition API
 *
 * @example
 * <script setup>
 * import { useI18n } from 'ez-i18n/vue';
 *
 * const { t, locale, setLocale } = useI18n();
 * const greeting = t('welcome.greeting');
 * </script>
 */
export function useI18n() {
  const locale = useStore(effectiveLocale);
  const trans = useStore(translations);
  const transComputed = computed(() => trans.value);
  const t = createTranslateFunction(transComputed);

  return {
    t,
    locale,
    setLocale,
  };
}

// Type augmentation for Vue global properties
declare module 'vue' {
  interface ComponentCustomProperties {
    $t: TranslateFunction;
    /** Current locale (reactive ref from nanostore) */
    $locale: Readonly<import('vue').Ref<string>>;
    $setLocale: typeof setLocale;
  }
}

export default ezI18nVue;
