import { defineMiddleware } from 'astro:middleware';
import type { TranslateFunction } from './types';

/**
 * Get the cookie domain for proper subdomain support
 * - localhost/127.0.0.1: no domain (defaults to exact host)
 * - production domains: .domain.tld format for subdomain support
 */
function getCookieDomain(hostname: string): string | undefined {
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return undefined;
  }
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    return '.' + parts.slice(-2).join('.');
  }
  return undefined;
}

/**
 * Create a server-side translation function for the given translations object
 */
function createT(translations: Record<string, unknown>): TranslateFunction {
  return (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: unknown = translations;
    for (const k of keys) {
      if (value == null || typeof value !== 'object') return key;
      value = (value as Record<string, unknown>)[k];
    }
    if (typeof value !== 'string') return key;
    if (!params) return value;
    return value.replace(/\{(\w+)\}/g, (_, p) => String(params[p] ?? `{${p}}`));
  };
}

/**
 * Locale detection middleware for ez-i18n
 *
 * Detection priority:
 * 1. ?lang query parameter (allows explicit switching)
 * 2. Cookie value
 * 3. Accept-Language header
 * 4. Default locale
 */
export const onRequest = defineMiddleware(async ({ cookies, request, locals, redirect }, next) => {
  // Import config from virtual module (provided by vite-plugin)
  const { locales, defaultLocale, cookieName } = await import('ez-i18n:config');

  const url = new URL(request.url);

  // Priority 1: Query parameter
  const langParam = url.searchParams.get('lang');

  // Priority 2: Cookie
  const cookieValue = cookies.get(cookieName)?.value;

  // Priority 3: Accept-Language header
  const acceptLang = request.headers.get('accept-language');
  const browserLang = acceptLang?.split(',')[0]?.split('-')[0];

  // Determine locale with priority
  let locale = defaultLocale;

  if (langParam && locales.includes(langParam)) {
    locale = langParam;
  } else if (cookieValue && locales.includes(cookieValue)) {
    locale = cookieValue;
  } else if (browserLang && locales.includes(browserLang)) {
    locale = browserLang;
  }

  // Set locale on locals for use in pages
  locals.locale = locale;

  // Load translations for the current locale
  try {
    const { loadTranslations } = await import('ez-i18n:translations');
    locals.translations = await loadTranslations(locale);
  } catch {
    // Fallback to empty translations if loader not configured
    locals.translations = {};
  }

  // Create server-side translation function
  locals.t = createT(locals.translations);

  // Update cookie if changed via query param, then redirect to clean URL
  if (langParam && langParam !== cookieValue && locales.includes(langParam)) {
    const domain = getCookieDomain(url.hostname);

    cookies.set(cookieName, locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
      ...(domain && { domain }),
    });

    // Redirect to clean URL (remove ?lang param)
    const cleanUrl = new URL(url);
    cleanUrl.searchParams.delete('lang');
    return redirect(cleanUrl.toString());
  }

  return next();
});
