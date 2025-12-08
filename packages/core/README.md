# @zachhandley/ez-i18n

Cookie-based i18n for Astro. Ships the Astro integration plus the shared runtime stores used by the React/Vue bindings.

## Installation

```bash
pnpm add @zachhandley/ez-i18n nanostores @nanostores/persistent
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

## Framework Bindings

- React: `@zachhandley/ez-i18n-react`
- Vue 3: `@zachhandley/ez-i18n-vue`

Both reuse the runtime stores provided by this package.

## License

MIT
