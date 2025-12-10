import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';

/**
 * Server-provided locale (set during SSR/hydration)
 * Takes precedence over client preference to prevent hydration mismatch
 */
const serverLocale = atom<string | null>(null);

/**
 * Client-side locale preference (persisted to localStorage)
 */
export const localePreference = persistentAtom<string>('ez-locale', 'en', {
  encode: (value) => value,
  decode: (value) => value,
});

/**
 * Effective locale - uses server locale if set, otherwise client preference
 */
export const effectiveLocale = computed(
  [serverLocale, localePreference],
  (server, client) => server ?? client
);

/**
 * Current translations object (reactive)
 */
export const translations = atom<Record<string, unknown>>({});

/**
 * Whether locale is currently being changed
 */
export const localeLoading = atom<boolean>(false);

/**
 * Initialize locale from server-provided value
 * Called during hydration to sync server and client state
 */
export function initLocale(locale: string, trans?: Record<string, unknown>): void {
  serverLocale.set(locale);
  localePreference.set(locale);
  if (trans) {
    translations.set(trans);
  }
}

/**
 * Set the translations object
 */
export function setTranslations(trans: Record<string, unknown>): void {
  translations.set(trans);
}

/** Type for translation loader function */
export type TranslationLoader = () => Promise<{ default?: Record<string, unknown> } | Record<string, unknown>>;

/**
 * Change locale and update cookie
 * Optionally loads new translations dynamically
 * @param locale - New locale code
 * @param options - Options object or cookie name for backwards compatibility
 */
export async function setLocale(
  locale: string,
  options: string | {
    cookieName?: string;
    loadTranslations?: TranslationLoader;
    redirect?: boolean;
  } = {}
): Promise<void> {
  // Handle backwards compatibility with string cookieName
  const opts = typeof options === 'string'
    ? { cookieName: options }
    : options;
  const { cookieName = 'ez-locale', loadTranslations, redirect } = opts;

  // If redirect mode, navigate with ?lang= param (middleware handles cookie + redirect)
  if (redirect && typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', locale);
    window.location.href = url.toString();
    return; // Page will reload, middleware sets cookie
  }

  localeLoading.set(true);

  try {
    // Load new translations if loader provided
    if (loadTranslations) {
      const mod = await loadTranslations();
      const trans = 'default' in mod ? mod.default : mod;
      translations.set(trans as Record<string, unknown>);
    }

    // Update stores
    localePreference.set(locale);
    serverLocale.set(locale);

    // Update cookie
    if (typeof document !== 'undefined') {
      document.cookie = `${cookieName}=${locale}; path=/; max-age=31536000; samesite=lax`;
    }

    // Dispatch event for components that need to react
    if (typeof document !== 'undefined') {
      document.dispatchEvent(
        new CustomEvent('ez-i18n:locale-changed', {
          detail: { locale },
          bubbles: true,
        })
      );
    }
  } finally {
    localeLoading.set(false);
  }
}

/**
 * Get current locale value (non-reactive)
 */
export function getLocale(): string {
  return effectiveLocale.get();
}

/**
 * Get current translations (non-reactive)
 */
export function getTranslations(): Record<string, unknown> {
  return translations.get();
}
