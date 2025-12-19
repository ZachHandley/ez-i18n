# @zachhandley/ez-i18n

Cookie-based i18n for Astro. Ships the Astro integration plus the shared runtime stores used by the React/Vue bindings.

## Installation

```bash
pnpm add @zachhandley/ez-i18n nanostores
```

## Astro Setup

```ts
// astro.config.ts
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import ezI18n from '@zachhandley/ez-i18n';

export default defineConfig({
  integrations: [
    vue(),
    ezI18n({
      locales: ['en', 'es', 'fr'],
      defaultLocale: 'en',
      translations: {
        en: './src/i18n/en.json',
        es: './src/i18n/es.json',
      },
    }),
  ],
});
```

Add `EzI18nHead` to your layout to hydrate the locale + translations on the client:

```astro
---
import EzI18nHead from '@zachhandley/ez-i18n/astro';
const { locale, translations } = Astro.locals;
---

<html lang={locale}>
  <head>
    <EzI18nHead locale={locale} translations={translations} />
  </head>
  <body><slot /></body>
</html>
```

## Translations

Place JSON files per locale (auto-discovered in `public/i18n/` by default):

```json
{
  "common": {
    "welcome": "Welcome",
    "save": "Save",
    "cancel": "Cancel"
  },
  "auth": {
    "login": "Log in",
    "signup": "Sign up"
  }
}
```

Use dot notation and `{placeholder}` interpolation:

```ts
import { t, locale, setLocale } from 'ez-i18n:runtime';

t('common.welcome'); // "Welcome"
t('auth.signup'); // "Sign up"
t('common.countdown', { seconds: 5 }); // "Ready in 5 seconds"
await setLocale('es');
```

## Virtual Modules

### `ez-i18n:runtime`

Core translation functions:

```ts
import { t, tc, locale, setLocale, initLocale } from 'ez-i18n:runtime';

t('key');                    // Translate a key
t('key', { name: 'World' }); // With interpolation
tc('key');                   // Returns ReadableAtom<string> for reactive subscriptions
tc('key', { name: 'World' }); // With interpolation (reactive)
locale;                      // Reactive store with current locale
await setLocale('es');       // Change locale (persists to cookie)
initLocale('en', data);      // Initialize with translations
```

### `ez-i18n:config`

Access your i18n configuration:

```ts
import {
  locales,          // ['en', 'es', 'fr']
  defaultLocale,    // 'en'
  cookieName,       // 'ez-locale'
  localeNames,      // { en: 'English', es: 'Español', fr: 'Français' }
  localeToBCP47,    // { en: 'en-US', es: 'es-ES', fr: 'fr-FR' }
  localeDirections, // { en: 'ltr', es: 'ltr', ar: 'rtl' }
} from 'ez-i18n:config';
```

### `ez-i18n:translations`

Dynamic translation loading:

```ts
import { loadTranslations, translationLoaders } from 'ez-i18n:translations';

const data = await loadTranslations('es');
```

## Reactive Translations with tc()

The `tc()` function returns a nanostore computed atom (`ReadableAtom<string>`) that automatically updates when the locale or translation data changes. This is useful when:

- Translations may load asynchronously after component mount
- You need fine-grained reactivity for specific translation keys
- Using with framework bindings (Vue/React) that need reactive subscriptions

```ts
import { tc } from 'ez-i18n:runtime';
import { useStore } from '@nanostores/react'; // or @nanostores/vue

// Returns a ReadableAtom that updates when locale changes
const title = tc('welcome.title');
const greeting = tc('welcome.message', { name: 'Alice' });

// In React/Vue, use with framework-specific store hooks
const titleValue = useStore(title); // Automatically re-renders on locale change
```

For most use cases, the regular `t()` function is sufficient. Use `tc()` when you need explicit reactive subscriptions in your framework code.

## Locale Utilities

The package includes a comprehensive locale database with 100+ languages:

```ts
import {
  LOCALE_DATABASE,
  getLocaleInfo,
  buildLocaleNames,
  buildLocaleToBCP47,
  buildLocaleDirections,
} from '@zachhandley/ez-i18n';
import type { LocaleInfo } from '@zachhandley/ez-i18n';

// Get info for any locale
const info = getLocaleInfo('es');
// { name: 'Español', englishName: 'Spanish', bcp47: 'es-ES', dir: 'ltr' }

// Build mappings for your supported locales
const names = buildLocaleNames(['en', 'es', 'ar']);
// { en: 'English', es: 'Español', ar: 'العربية' }

const directions = buildLocaleDirections(['en', 'es', 'ar']);
// { en: 'ltr', es: 'ltr', ar: 'rtl' }
```

Includes native display names, English names, BCP47 codes, and text direction (LTR/RTL) for all major languages and regional variants.

## Framework Bindings

- React: `@zachhandley/ez-i18n-react`
- Vue 3: `@zachhandley/ez-i18n-vue`

Both reuse the runtime stores provided by this package.

## License

MIT
