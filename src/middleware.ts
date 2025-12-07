import { defineMiddleware } from 'astro:middleware';

/**
 * Locale detection middleware for ez-i18n
 *
 * Detection priority:
 * 1. ?lang query parameter (allows explicit switching)
 * 2. Cookie value
 * 3. Accept-Language header
 * 4. Default locale
 */
export const onRequest = defineMiddleware(async ({ cookies, request, locals }, next) => {
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

  // Update cookie if changed via query param
  if (langParam && langParam !== cookieValue && locales.includes(langParam)) {
    cookies.set(cookieName, locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    });
  }

  return next();
});
