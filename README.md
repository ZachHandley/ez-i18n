# ez-i18n

Cookie-based i18n for Astro + Vue. No URL prefixes, reactive language switching.

## Installation

```bash
pnpm add ez-i18n nanostores @nanostores/persistent
# If using Vue:
pnpm add @nanostores/vue
```

## Usage

### Astro Config

```typescript
// astro.config.ts
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import ezI18n from 'ez-i18n';

export default defineConfig({
  integrations: [
    vue(),
    ezI18n({
      locales: ['en', 'es', 'fr'],
      defaultLocale: 'en',
      cookieName: 'my-locale', // optional, defaults to 'ez-locale'
      translations: {
        en: './src/i18n/en.ts',
        es: './src/i18n/es.ts',
        fr: './src/i18n/fr.ts',
      },
    }),
  ],
});
```

### Translation Files

```typescript
// src/i18n/en.ts
export default {
  common: {
    welcome: 'Welcome',
    save: 'Save',
    cancel: 'Cancel',
  },
  auth: {
    login: 'Log in',
    signup: 'Sign up',
  },
};
```

### Layout Setup

Add the `EzI18nHead` component to your layout's head for automatic hydration:

```astro
---
// src/layouts/Layout.astro
import { EzI18nHead } from 'ez-i18n/astro';
const { locale, translations } = Astro.locals;
---

<html lang={locale}>
  <head>
    <meta charset="utf-8" />
    <EzI18nHead locale={locale} translations={translations} />
  </head>
  <body>
    <slot />
  </body>
</html>
```

### In Astro Files

```astro
---
import { t, locale } from 'ez-i18n:runtime';
// Or access from locals (auto-loaded by middleware):
const { locale, translations } = Astro.locals;
---

<h1>{t('common.welcome')}</h1>
<p>Current locale: {locale}</p>
```

### In Vue Components

```vue
<script setup lang="ts">
import { useI18n } from 'ez-i18n/vue';
import { translationLoaders } from 'ez-i18n:translations';

const { t, locale, setLocale } = useI18n();

// Change locale with dynamic translation loading
async function switchLocale(newLocale: string) {
  await setLocale(newLocale, {
    loadTranslations: translationLoaders[newLocale],
  });
}
</script>

<template>
  <!-- Global $t is available automatically -->
  <h1>{{ $t('common.welcome') }}</h1>

  <!-- Interpolation -->
  <p>{{ $t('greeting', { name: 'World' }) }}</p>

  <!-- Change language with dynamic loading -->
  <button @click="switchLocale('es')">Español</button>
  <button @click="switchLocale('fr')">Français</button>
</template>
```

### Vue Plugin Setup

Register the Vue plugin in your entrypoint:

```typescript
// src/_vueEntrypoint.ts
import type { App } from 'vue';
import { ezI18nVue } from 'ez-i18n/vue';

export default (app: App) => {
  app.use(ezI18nVue);
};
```

## Features

- **No URL prefixes** - Locale stored in cookie, not URL path
- **Reactive** - Language changes update immediately without page reload
- **SSR compatible** - Proper hydration with server-rendered locale
- **Vue integration** - Global `$t()`, `$locale`, `$setLocale` in templates
- **Composable API** - `useI18n()` for Composition API usage
- **Middleware included** - Auto-detects locale from cookie, query param, or Accept-Language header

## Locale Detection Priority

1. `?lang=xx` query parameter
2. Cookie value
3. Accept-Language header
4. Default locale

## API

### `ezI18n(config)`

Astro integration function.

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `locales` | `string[]` | Yes | Supported locale codes |
| `defaultLocale` | `string` | Yes | Fallback locale |
| `cookieName` | `string` | No | Cookie name (default: `'ez-locale'`) |
| `translations` | `Record<string, string>` | No | Paths to translation files (auto-loaded) |

### `EzI18nHead`

Astro component for i18n hydration. Place in your layout's `<head>`.

```astro
<EzI18nHead locale={Astro.locals.locale} translations={Astro.locals.translations} />
```

### `$t(key, params?)`

Translate a key with optional interpolation.

```typescript
$t('greeting'); // "Hello"
$t('greeting', { name: 'World' }); // "Hello, {name}" -> "Hello, World"
```

### `setLocale(locale, options?)`

Change the current locale. Updates cookie and triggers reactive update.

```typescript
// Simple usage
setLocale('es');

// With dynamic translation loading
import { translationLoaders } from 'ez-i18n:translations';
setLocale('es', { loadTranslations: translationLoaders['es'] });
```

### `useI18n()`

Vue composable for Composition API usage.

```typescript
const { t, locale, setLocale } = useI18n();
```

### Virtual Modules

- `ez-i18n:config` - Static config (locales, defaultLocale, cookieName)
- `ez-i18n:runtime` - Runtime functions (t, setLocale, initLocale, locale store)
- `ez-i18n:translations` - Translation loaders (loadTranslations, translationLoaders)

## License

MIT
