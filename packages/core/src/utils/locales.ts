/**
 * Comprehensive locale database for ez-i18n
 * Contains display names (in native language) and BCP47 codes
 */

export interface LocaleInfo {
  /** Display name in native language */
  name: string;
  /** Display name in English */
  englishName: string;
  /** BCP47 language tag */
  bcp47: string;
  /** Text direction */
  dir: 'ltr' | 'rtl';
}

/**
 * Comprehensive mapping of locale codes to their metadata
 * Covers all major languages and regional variants
 */
export const LOCALE_DATABASE: Record<string, LocaleInfo> = {
  // Major Western European Languages
  en: { name: 'English', englishName: 'English', bcp47: 'en-US', dir: 'ltr' },
  'en-US': { name: 'English (US)', englishName: 'English (US)', bcp47: 'en-US', dir: 'ltr' },
  'en-GB': { name: 'English (UK)', englishName: 'English (UK)', bcp47: 'en-GB', dir: 'ltr' },
  'en-AU': { name: 'English (Australia)', englishName: 'English (Australia)', bcp47: 'en-AU', dir: 'ltr' },
  'en-CA': { name: 'English (Canada)', englishName: 'English (Canada)', bcp47: 'en-CA', dir: 'ltr' },

  de: { name: 'Deutsch', englishName: 'German', bcp47: 'de-DE', dir: 'ltr' },
  'de-DE': { name: 'Deutsch (Deutschland)', englishName: 'German (Germany)', bcp47: 'de-DE', dir: 'ltr' },
  'de-AT': { name: 'Deutsch (Österreich)', englishName: 'German (Austria)', bcp47: 'de-AT', dir: 'ltr' },
  'de-CH': { name: 'Deutsch (Schweiz)', englishName: 'German (Switzerland)', bcp47: 'de-CH', dir: 'ltr' },

  fr: { name: 'Français', englishName: 'French', bcp47: 'fr-FR', dir: 'ltr' },
  'fr-FR': { name: 'Français (France)', englishName: 'French (France)', bcp47: 'fr-FR', dir: 'ltr' },
  'fr-CA': { name: 'Français (Canada)', englishName: 'French (Canada)', bcp47: 'fr-CA', dir: 'ltr' },
  'fr-BE': { name: 'Français (Belgique)', englishName: 'French (Belgium)', bcp47: 'fr-BE', dir: 'ltr' },
  'fr-CH': { name: 'Français (Suisse)', englishName: 'French (Switzerland)', bcp47: 'fr-CH', dir: 'ltr' },

  es: { name: 'Español', englishName: 'Spanish', bcp47: 'es-ES', dir: 'ltr' },
  'es-ES': { name: 'Español (España)', englishName: 'Spanish (Spain)', bcp47: 'es-ES', dir: 'ltr' },
  'es-MX': { name: 'Español (México)', englishName: 'Spanish (Mexico)', bcp47: 'es-MX', dir: 'ltr' },
  'es-AR': { name: 'Español (Argentina)', englishName: 'Spanish (Argentina)', bcp47: 'es-AR', dir: 'ltr' },
  'es-CO': { name: 'Español (Colombia)', englishName: 'Spanish (Colombia)', bcp47: 'es-CO', dir: 'ltr' },
  'es-419': { name: 'Español (Latinoamérica)', englishName: 'Spanish (Latin America)', bcp47: 'es-419', dir: 'ltr' },

  it: { name: 'Italiano', englishName: 'Italian', bcp47: 'it-IT', dir: 'ltr' },
  'it-IT': { name: 'Italiano (Italia)', englishName: 'Italian (Italy)', bcp47: 'it-IT', dir: 'ltr' },
  'it-CH': { name: 'Italiano (Svizzera)', englishName: 'Italian (Switzerland)', bcp47: 'it-CH', dir: 'ltr' },

  pt: { name: 'Português', englishName: 'Portuguese', bcp47: 'pt-PT', dir: 'ltr' },
  'pt-PT': { name: 'Português (Portugal)', englishName: 'Portuguese (Portugal)', bcp47: 'pt-PT', dir: 'ltr' },
  'pt-BR': { name: 'Português (Brasil)', englishName: 'Portuguese (Brazil)', bcp47: 'pt-BR', dir: 'ltr' },

  nl: { name: 'Nederlands', englishName: 'Dutch', bcp47: 'nl-NL', dir: 'ltr' },
  'nl-NL': { name: 'Nederlands (Nederland)', englishName: 'Dutch (Netherlands)', bcp47: 'nl-NL', dir: 'ltr' },
  'nl-BE': { name: 'Nederlands (België)', englishName: 'Dutch (Belgium)', bcp47: 'nl-BE', dir: 'ltr' },

  // Nordic Languages
  sv: { name: 'Svenska', englishName: 'Swedish', bcp47: 'sv-SE', dir: 'ltr' },
  'sv-SE': { name: 'Svenska (Sverige)', englishName: 'Swedish (Sweden)', bcp47: 'sv-SE', dir: 'ltr' },

  da: { name: 'Dansk', englishName: 'Danish', bcp47: 'da-DK', dir: 'ltr' },
  'da-DK': { name: 'Dansk (Danmark)', englishName: 'Danish (Denmark)', bcp47: 'da-DK', dir: 'ltr' },

  no: { name: 'Norsk', englishName: 'Norwegian', bcp47: 'nb-NO', dir: 'ltr' },
  nb: { name: 'Norsk bokmål', englishName: 'Norwegian Bokmål', bcp47: 'nb-NO', dir: 'ltr' },
  nn: { name: 'Norsk nynorsk', englishName: 'Norwegian Nynorsk', bcp47: 'nn-NO', dir: 'ltr' },

  fi: { name: 'Suomi', englishName: 'Finnish', bcp47: 'fi-FI', dir: 'ltr' },
  'fi-FI': { name: 'Suomi (Suomi)', englishName: 'Finnish (Finland)', bcp47: 'fi-FI', dir: 'ltr' },

  is: { name: 'Íslenska', englishName: 'Icelandic', bcp47: 'is-IS', dir: 'ltr' },

  // Eastern European Languages
  pl: { name: 'Polski', englishName: 'Polish', bcp47: 'pl-PL', dir: 'ltr' },
  'pl-PL': { name: 'Polski (Polska)', englishName: 'Polish (Poland)', bcp47: 'pl-PL', dir: 'ltr' },

  cs: { name: 'Čeština', englishName: 'Czech', bcp47: 'cs-CZ', dir: 'ltr' },
  'cs-CZ': { name: 'Čeština (Česko)', englishName: 'Czech (Czech Republic)', bcp47: 'cs-CZ', dir: 'ltr' },

  sk: { name: 'Slovenčina', englishName: 'Slovak', bcp47: 'sk-SK', dir: 'ltr' },
  'sk-SK': { name: 'Slovenčina (Slovensko)', englishName: 'Slovak (Slovakia)', bcp47: 'sk-SK', dir: 'ltr' },

  hu: { name: 'Magyar', englishName: 'Hungarian', bcp47: 'hu-HU', dir: 'ltr' },
  'hu-HU': { name: 'Magyar (Magyarország)', englishName: 'Hungarian (Hungary)', bcp47: 'hu-HU', dir: 'ltr' },

  ro: { name: 'Română', englishName: 'Romanian', bcp47: 'ro-RO', dir: 'ltr' },
  'ro-RO': { name: 'Română (România)', englishName: 'Romanian (Romania)', bcp47: 'ro-RO', dir: 'ltr' },

  bg: { name: 'Български', englishName: 'Bulgarian', bcp47: 'bg-BG', dir: 'ltr' },
  'bg-BG': { name: 'Български (България)', englishName: 'Bulgarian (Bulgaria)', bcp47: 'bg-BG', dir: 'ltr' },

  hr: { name: 'Hrvatski', englishName: 'Croatian', bcp47: 'hr-HR', dir: 'ltr' },
  sr: { name: 'Српски', englishName: 'Serbian', bcp47: 'sr-RS', dir: 'ltr' },
  sl: { name: 'Slovenščina', englishName: 'Slovenian', bcp47: 'sl-SI', dir: 'ltr' },

  uk: { name: 'Українська', englishName: 'Ukrainian', bcp47: 'uk-UA', dir: 'ltr' },
  'uk-UA': { name: 'Українська (Україна)', englishName: 'Ukrainian (Ukraine)', bcp47: 'uk-UA', dir: 'ltr' },

  ru: { name: 'Русский', englishName: 'Russian', bcp47: 'ru-RU', dir: 'ltr' },
  'ru-RU': { name: 'Русский (Россия)', englishName: 'Russian (Russia)', bcp47: 'ru-RU', dir: 'ltr' },

  // Baltic Languages
  lt: { name: 'Lietuvių', englishName: 'Lithuanian', bcp47: 'lt-LT', dir: 'ltr' },
  lv: { name: 'Latviešu', englishName: 'Latvian', bcp47: 'lv-LV', dir: 'ltr' },
  et: { name: 'Eesti', englishName: 'Estonian', bcp47: 'et-EE', dir: 'ltr' },

  // Greek
  el: { name: 'Ελληνικά', englishName: 'Greek', bcp47: 'el-GR', dir: 'ltr' },
  'el-GR': { name: 'Ελληνικά (Ελλάδα)', englishName: 'Greek (Greece)', bcp47: 'el-GR', dir: 'ltr' },

  // Asian Languages
  zh: { name: '中文', englishName: 'Chinese', bcp47: 'zh-CN', dir: 'ltr' },
  'zh-CN': { name: '中文 (简体)', englishName: 'Chinese (Simplified)', bcp47: 'zh-CN', dir: 'ltr' },
  'zh-TW': { name: '中文 (繁體)', englishName: 'Chinese (Traditional)', bcp47: 'zh-TW', dir: 'ltr' },
  'zh-HK': { name: '中文 (香港)', englishName: 'Chinese (Hong Kong)', bcp47: 'zh-HK', dir: 'ltr' },

  ja: { name: '日本語', englishName: 'Japanese', bcp47: 'ja-JP', dir: 'ltr' },
  'ja-JP': { name: '日本語 (日本)', englishName: 'Japanese (Japan)', bcp47: 'ja-JP', dir: 'ltr' },

  ko: { name: '한국어', englishName: 'Korean', bcp47: 'ko-KR', dir: 'ltr' },
  'ko-KR': { name: '한국어 (대한민국)', englishName: 'Korean (South Korea)', bcp47: 'ko-KR', dir: 'ltr' },

  vi: { name: 'Tiếng Việt', englishName: 'Vietnamese', bcp47: 'vi-VN', dir: 'ltr' },
  'vi-VN': { name: 'Tiếng Việt (Việt Nam)', englishName: 'Vietnamese (Vietnam)', bcp47: 'vi-VN', dir: 'ltr' },

  th: { name: 'ไทย', englishName: 'Thai', bcp47: 'th-TH', dir: 'ltr' },
  'th-TH': { name: 'ไทย (ประเทศไทย)', englishName: 'Thai (Thailand)', bcp47: 'th-TH', dir: 'ltr' },

  id: { name: 'Bahasa Indonesia', englishName: 'Indonesian', bcp47: 'id-ID', dir: 'ltr' },
  'id-ID': { name: 'Bahasa Indonesia (Indonesia)', englishName: 'Indonesian (Indonesia)', bcp47: 'id-ID', dir: 'ltr' },

  ms: { name: 'Bahasa Melayu', englishName: 'Malay', bcp47: 'ms-MY', dir: 'ltr' },
  'ms-MY': { name: 'Bahasa Melayu (Malaysia)', englishName: 'Malay (Malaysia)', bcp47: 'ms-MY', dir: 'ltr' },

  tl: { name: 'Tagalog', englishName: 'Tagalog', bcp47: 'tl-PH', dir: 'ltr' },
  fil: { name: 'Filipino', englishName: 'Filipino', bcp47: 'fil-PH', dir: 'ltr' },

  // South Asian Languages
  hi: { name: 'हिन्दी', englishName: 'Hindi', bcp47: 'hi-IN', dir: 'ltr' },
  'hi-IN': { name: 'हिन्दी (भारत)', englishName: 'Hindi (India)', bcp47: 'hi-IN', dir: 'ltr' },

  bn: { name: 'বাংলা', englishName: 'Bengali', bcp47: 'bn-BD', dir: 'ltr' },
  'bn-BD': { name: 'বাংলা (বাংলাদেশ)', englishName: 'Bengali (Bangladesh)', bcp47: 'bn-BD', dir: 'ltr' },
  'bn-IN': { name: 'বাংলা (ভারত)', englishName: 'Bengali (India)', bcp47: 'bn-IN', dir: 'ltr' },

  ta: { name: 'தமிழ்', englishName: 'Tamil', bcp47: 'ta-IN', dir: 'ltr' },
  te: { name: 'తెలుగు', englishName: 'Telugu', bcp47: 'te-IN', dir: 'ltr' },
  mr: { name: 'मराठी', englishName: 'Marathi', bcp47: 'mr-IN', dir: 'ltr' },
  gu: { name: 'ગુજરાતી', englishName: 'Gujarati', bcp47: 'gu-IN', dir: 'ltr' },
  kn: { name: 'ಕನ್ನಡ', englishName: 'Kannada', bcp47: 'kn-IN', dir: 'ltr' },
  ml: { name: 'മലയാളം', englishName: 'Malayalam', bcp47: 'ml-IN', dir: 'ltr' },
  pa: { name: 'ਪੰਜਾਬੀ', englishName: 'Punjabi', bcp47: 'pa-IN', dir: 'ltr' },
  ur: { name: 'اردو', englishName: 'Urdu', bcp47: 'ur-PK', dir: 'rtl' },

  // Middle Eastern Languages (RTL)
  ar: { name: 'العربية', englishName: 'Arabic', bcp47: 'ar-SA', dir: 'rtl' },
  'ar-SA': { name: 'العربية (السعودية)', englishName: 'Arabic (Saudi Arabia)', bcp47: 'ar-SA', dir: 'rtl' },
  'ar-EG': { name: 'العربية (مصر)', englishName: 'Arabic (Egypt)', bcp47: 'ar-EG', dir: 'rtl' },
  'ar-AE': { name: 'العربية (الإمارات)', englishName: 'Arabic (UAE)', bcp47: 'ar-AE', dir: 'rtl' },

  he: { name: 'עברית', englishName: 'Hebrew', bcp47: 'he-IL', dir: 'rtl' },
  'he-IL': { name: 'עברית (ישראל)', englishName: 'Hebrew (Israel)', bcp47: 'he-IL', dir: 'rtl' },

  fa: { name: 'فارسی', englishName: 'Persian', bcp47: 'fa-IR', dir: 'rtl' },
  'fa-IR': { name: 'فارسی (ایران)', englishName: 'Persian (Iran)', bcp47: 'fa-IR', dir: 'rtl' },

  tr: { name: 'Türkçe', englishName: 'Turkish', bcp47: 'tr-TR', dir: 'ltr' },
  'tr-TR': { name: 'Türkçe (Türkiye)', englishName: 'Turkish (Turkey)', bcp47: 'tr-TR', dir: 'ltr' },

  // African Languages
  sw: { name: 'Kiswahili', englishName: 'Swahili', bcp47: 'sw-KE', dir: 'ltr' },
  af: { name: 'Afrikaans', englishName: 'Afrikaans', bcp47: 'af-ZA', dir: 'ltr' },
  zu: { name: 'isiZulu', englishName: 'Zulu', bcp47: 'zu-ZA', dir: 'ltr' },

  // Celtic Languages
  cy: { name: 'Cymraeg', englishName: 'Welsh', bcp47: 'cy-GB', dir: 'ltr' },
  ga: { name: 'Gaeilge', englishName: 'Irish', bcp47: 'ga-IE', dir: 'ltr' },
  gd: { name: 'Gàidhlig', englishName: 'Scottish Gaelic', bcp47: 'gd-GB', dir: 'ltr' },

  // Other European Languages
  ca: { name: 'Català', englishName: 'Catalan', bcp47: 'ca-ES', dir: 'ltr' },
  eu: { name: 'Euskara', englishName: 'Basque', bcp47: 'eu-ES', dir: 'ltr' },
  gl: { name: 'Galego', englishName: 'Galician', bcp47: 'gl-ES', dir: 'ltr' },

  // Constructed Languages
  eo: { name: 'Esperanto', englishName: 'Esperanto', bcp47: 'eo', dir: 'ltr' },
};

/**
 * Get locale info for a given locale code
 * Falls back to a generated entry if not found
 */
export function getLocaleInfo(locale: string): LocaleInfo {
  if (LOCALE_DATABASE[locale]) {
    return LOCALE_DATABASE[locale];
  }

  // Generate fallback for unknown locales
  return {
    name: locale.toUpperCase(),
    englishName: locale.toUpperCase(),
    bcp47: locale,
    dir: 'ltr',
  };
}

/**
 * Build locale names mapping for discovered locales
 */
export function buildLocaleNames(locales: string[]): Record<string, string> {
  const names: Record<string, string> = {};
  for (const locale of locales) {
    names[locale] = getLocaleInfo(locale).name;
  }
  return names;
}

/**
 * Build locale to BCP47 mapping for discovered locales
 */
export function buildLocaleToBCP47(locales: string[]): Record<string, string> {
  const bcp47: Record<string, string> = {};
  for (const locale of locales) {
    bcp47[locale] = getLocaleInfo(locale).bcp47;
  }
  return bcp47;
}

/**
 * Build locale directions mapping for discovered locales
 */
export function buildLocaleDirections(locales: string[]): Record<string, 'ltr' | 'rtl'> {
  const dirs: Record<string, 'ltr' | 'rtl'> = {};
  for (const locale of locales) {
    dirs[locale] = getLocaleInfo(locale).dir;
  }
  return dirs;
}
