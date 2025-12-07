# @zachhandley/ez-i18n

Cookie-based i18n for Astro + Vue + React. No URL prefixes, reactive language switching.

## Installation

```bash
# Core package (required) - includes Astro integration + runtime
pnpm add @zachhandley/ez-i18n nanostores @nanostores/persistent

# For Vue projects
pnpm add @zachhandley/ez-i18n-vue @nanostores/vue

# For React projects
pnpm add @zachhandley/ez-i18n-react @nanostores/react
```

## Usage

### Astro Config

```typescript
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
      cookieName: 'my-locale', // optional, defaults to 'ez-locale'
      translations: {
        en: './src/i18n/en.json',
        es: './src/i18n/es.json',
        fr: './src/i18n/fr.json',
      },
    }),
  ],
});
```

### Translation Files

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

Create similar files for each locale: `src/i18n/en.json`, `src/i18n/es.json`, etc.

### Multi-File Translations

ez-i18n supports flexible translation file organization:

#### Auto-Discovery (Zero Config)

Just put your files in `public/i18n/` and ez-i18n will discover them automatically:

```
public/i18n/
  en/
    common.json
    auth.json
  es/
    common.json
    auth.json
```

```typescript
// astro.config.ts - locales auto-discovered from folder names!
ezI18n({
  defaultLocale: 'en',
  // No locales or translations needed - auto-discovered
})
```

#### Base Directory

Point to a folder and locales are discovered from subfolders:

```typescript
ezI18n({
  defaultLocale: 'en',
  translations: './src/i18n/',  // Discovers en/, es/, fr/ folders
})
```

#### Per-Locale with Multiple Formats

Mix and match different formats per locale:

```typescript
ezI18n({
  locales: ['en', 'es', 'fr', 'de'],
  defaultLocale: 'en',
  translations: {
    en: './src/i18n/en.json',              // Single file
    es: './src/i18n/es/',                   // Folder (all JSONs merged)
    fr: './src/i18n/fr/**/*.json',          // Glob pattern
    de: ['./src/i18n/de/common.json',       // Array of files
         './src/i18n/de/auth.json'],
  },
})
```

#### Merge Order

When using multiple files per locale, files are merged **alphabetically by filename**. Later files override earlier ones for conflicting keys.

```
en/
  01-common.json    # Loaded first
  02-features.json  # Loaded second, overrides common
  99-overrides.json # Loaded last, highest priority
```

#### Path-Based Namespacing

When using folder-based translation organization, ez-i18n automatically creates namespaces from your file paths. This is **enabled by default** when using folder-based config.

**Example:**

```
public/i18n/
  en/
    auth/
      login.json     # { "title": "Sign In", "button": "Log In" }
      signup.json    # { "title": "Create Account" }
    common.json      # { "welcome": "Welcome" }
```

Access translations using dot notation that mirrors the folder structure:

```typescript
$t('auth.login.title')     // "Sign In"
$t('auth.login.button')    // "Log In"
$t('auth.signup.title')    // "Create Account"
$t('common.welcome')       // "Welcome"
```

**Disable path-based namespacing:**

If you prefer to manage namespaces manually within your JSON files, you can disable this feature:

```typescript
ezI18n({
  defaultLocale: 'en',
  translations: './src/i18n/',
  pathBasedNamespacing: false,  // Disable automatic path namespacing
})
```

With `pathBasedNamespacing: false`, the file structure is ignored and keys are used directly from each JSON file.

#### Cache File

A `.ez-i18n.json` cache file is generated to speed up subsequent builds. Add it to `.gitignore`:

```gitignore
.ez-i18n.json
```

### Layout Setup

Add the `EzI18nHead` component to your layout's head for automatic hydration:

```astro
---
// src/layouts/Layout.astro
import EzI18nHead from '@zachhandley/ez-i18n/astro';
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
import { useI18n } from '@zachhandley/ez-i18n-vue';
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
import { ezI18nVue } from '@zachhandley/ez-i18n-vue';

export default (app: App) => {
  app.use(ezI18nVue);
};
```

### In React Components

```tsx
import { useI18n } from '@zachhandley/ez-i18n-react';
import { translationLoaders } from 'ez-i18n:translations';

function MyComponent() {
  const { t, locale, setLocale } = useI18n();

  async function switchLocale(newLocale: string) {
    await setLocale(newLocale, {
      loadTranslations: translationLoaders[newLocale],
    });
  }

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <p>{t('greeting', { name: 'World' })}</p>
      <button onClick={() => switchLocale('es')}>Español</button>
      <button onClick={() => switchLocale('fr')}>Français</button>
    </div>
  );
}
```

## Features

- **No URL prefixes** - Locale stored in cookie, not URL path
- **Reactive** - Language changes update immediately without page reload
- **SSR compatible** - Proper hydration with server-rendered locale
- **Vue integration** - Global `$t()`, `$locale`, `$setLocale` in templates
- **React integration** - `useI18n()` hook for React components
- **Middleware included** - Auto-detects locale from cookie, query param, or Accept-Language header
- **Multi-file support** - Organize translations in folders, use globs, or arrays
- **Auto-discovery** - Automatic locale detection from folder structure
- **Path-based namespacing** - Automatic namespacing from folder structure (`auth/login.json` becomes `auth.login.*`)
- **HMR in dev** - Hot reload translation changes without restart

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
| `locales` | `string[]` | No | Supported locale codes (auto-discovered if not provided) |
| `defaultLocale` | `string` | Yes | Fallback locale |
| `cookieName` | `string` | No | Cookie name (default: `'ez-locale'`) |
| `translations` | `string \| Record<string, TranslationPath>` | No | Base directory or per-locale paths (default: `./public/i18n/`) |
| `pathBasedNamespacing` | `boolean` | No | Auto-namespace translations from folder paths (default: `true` for folder-based config) |

**TranslationPath** can be:
- Single file: `'./src/i18n/en.json'`
- Folder: `'./src/i18n/en/'`
- Glob: `'./src/i18n/en/**/*.json'`
- Array: `['./common.json', './auth.json']`

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

Hook for Vue (Composition API) and React.

```typescript
// Vue
import { useI18n } from '@zachhandley/ez-i18n-vue';

// React
import { useI18n } from '@zachhandley/ez-i18n-react';

const { t, locale, setLocale } = useI18n();
```

### Virtual Modules

- `ez-i18n:config` - Static config (locales, defaultLocale, cookieName)
- `ez-i18n:runtime` - Runtime functions (t, setLocale, initLocale, locale store)
- `ez-i18n:translations` - Translation loaders (loadTranslations, translationLoaders)

## License

MIT
