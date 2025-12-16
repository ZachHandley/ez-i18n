import type { App, Plugin, ComputedRef, Ref } from 'vue';
import { computed } from 'vue';
import { useStore } from '@nanostores/vue';
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

/**
 * Create a translation function bound to a translations object
 */
function createTranslateFunction(
  translationsRef: ComputedRef<Record<string, unknown>>
): TranslateFunction {
  return (key: string, params?: Record<string, string | number>): string => {
    let trans = translationsRef.value;

    // Fallback: if store is empty, check global context set by middleware/EzI18nHead
    if (Object.keys(trans).length === 0) {
      const ssrTrans = globalThis.__EZ_I18N__?.translations;
      if (ssrTrans) {
        trans = ssrTrans;
      }
    }

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
 * import { ezI18nVue } from '@zachhandley/ez-i18n/vue';
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
    // Check if stores need initialization from global data
    // This handles cases where Vue bundles separately from EzI18nHead
    if (globalThis.__EZ_I18N__) {
      initLocale(globalThis.__EZ_I18N__.locale, globalThis.__EZ_I18N__.translations);
      setTranslations(globalThis.__EZ_I18N__.translations);
    }

    // Get reactive store values
    const locale = useStore(effectiveLocale);
    const trans = useStore(translations);

    // Create reactive computed for translations
    const transComputed = computed(() => trans.value);

    // Create translate function
    const t = createTranslateFunction(transComputed);

    // Create tc (translation computed) function for global properties
    const tc: TranslateComputedFunction = (
      key: string,
      params?: Record<string, string | number>
    ) => {
      return useStore(tcCore(key, params));
    };

    // Add global properties
    app.config.globalProperties.$t = t;
    app.config.globalProperties.$tc = tc;
    app.config.globalProperties.$locale = locale;
    app.config.globalProperties.$setLocale = setLocale;

    // Also provide for composition API usage
    app.provide('ez-i18n', {
      t,
      tc,
      locale,
      setLocale,
    });
  },
};

/**
 * Type for the tc (translation computed) function
 * Returns a Vue Ref<string> that updates when translations change
 */
export type TranslateComputedFunction = (
  key: string,
  params?: Record<string, string | number>
) => Readonly<Ref<string>>;

/**
 * Composable for using i18n in Vue components with Composition API
 *
 * @example
 * <script setup>
 * import { useI18n } from '@zachhandley/ez-i18n/vue';
 *
 * const { t, tc, locale, setLocale } = useI18n();
 *
 * // Non-reactive (use in callbacks, computed bodies)
 * const greeting = t('welcome.greeting');
 *
 * // Reactive (updates when translations load or locale changes)
 * const title = tc('welcome.title');
 * </script>
 *
 * @example
 * <!-- In template, both work the same way -->
 * <template>
 *   <h1>{{ title }}</h1>
 *   <p>{{ t('welcome.message') }}</p>
 * </template>
 */
export function useI18n() {
  const locale = useStore(effectiveLocale);
  const trans = useStore(translations);
  const transComputed = computed(() => trans.value);
  const t = createTranslateFunction(transComputed);

  /**
   * Translation computed - returns a reactive Vue Ref<string>
   * Use this when you need translations to update reactively:
   * - When translations may load after component mount
   * - When locale changes should trigger re-renders
   * - To avoid hydration mismatches in SSR
   */
  const tc: TranslateComputedFunction = (
    key: string,
    params?: Record<string, string | number>
  ) => {
    return useStore(tcCore(key, params));
  };

  return {
    t,
    tc,
    locale,
    setLocale,
  };
}

// Type augmentation for Vue global properties
declare module 'vue' {
  interface ComponentCustomProperties {
    /** Translate a key (non-reactive) */
    $t: TranslateFunction;
    /** Translate a key and return a reactive Ref<string> */
    $tc: TranslateComputedFunction;
    /** Current locale (reactive ref from nanostore) */
    $locale: Readonly<import('vue').Ref<string>>;
    $setLocale: typeof setLocale;
  }
}

export default ezI18nVue;

// Re-export core functions for convenience
export { tc as tcCore } from '@zachhandley/ez-i18n/runtime';
