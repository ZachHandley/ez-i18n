# @zachhandley/ez-i18n-react

React integration for [@zachhandley/ez-i18n](https://github.com/zachhandley/ez-i18n) - Cookie-based i18n with reactive language switching.

## Installation

```bash
pnpm add @zachhandley/ez-i18n @zachhandley/ez-i18n-react @nanostores/react
```

## Usage

```tsx
import { useI18n } from '@zachhandley/ez-i18n-react';

function MyComponent() {
  const { t, locale, setLocale } = useI18n();

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <p>{t('greeting', { name: 'World' })}</p>
      <p>{t('[i18n:greeting|name=World]')}</p>
      <button onClick={() => setLocale('es')}>Español</button>
      <p>Current locale: {locale}</p>
    </div>
  );
}
```

### Embedded i18n Strings

`t()` accepts embedded i18n strings, which are formatted in the active locale:

```tsx
<p>{t('[i18n:greeting|name=World]')}</p>
<p>{t('Hello [i18n:greeting|name=World]!')}</p>
```

## API

### `useI18n()`

Returns an object with:

- `t(key: string, params?: Record<string, string | number>)` - Translation function (reactive - component re-renders when translations change)
- `locale: string` - Current locale
- `setLocale(locale: string)` - Function to change locale

### `useTranslation(key, params?)`

A convenience hook that subscribes to a single translation key and returns the translated string. The component automatically re-renders when the locale or translation changes.

```tsx
import { useTranslation } from '@zachhandley/ez-i18n-react';

function PageTitle() {
  // Subscribes to this specific translation key
  const title = useTranslation('page.title');
  const greeting = useTranslation('welcome.message', { name: 'Alice' });

  return (
    <div>
      <h1>{title}</h1>
      <p>{greeting}</p>
    </div>
  );
}
```

**Note on Reactivity:**

In React, the `t()` function from `useI18n()` is already reactive - your component will automatically re-render when the locale or translations change. The `useTranslation()` hook is provided as a convenience for subscribing to individual translation keys, but both approaches are reactive.

```tsx
// Both of these are reactive and will update on locale change:

// Approach 1: Using t() from useI18n
function Component1() {
  const { t } = useI18n();
  return <h1>{t('welcome.title')}</h1>; // Re-renders on locale change
}

// Approach 2: Using useTranslation hook
function Component2() {
  const title = useTranslation('welcome.title');
  return <h1>{title}</h1>; // Also re-renders on locale change
}
```

## Accessing Config & Locale Utilities

Access configuration and locale metadata from the core package:

```tsx
import { useI18n } from '@zachhandley/ez-i18n-react';
import { locales, localeNames, localeDirections } from 'ez-i18n:config';
import { getLocaleInfo } from '@zachhandley/ez-i18n';

function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value)}>
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {localeNames[loc]} {/* Native name: "Español" */}
        </option>
      ))}
    </select>
  );
}

// Or get full locale info
const info = getLocaleInfo('ar');
// { name: 'العربية', englishName: 'Arabic', bcp47: 'ar-SA', dir: 'rtl' }
```

## How It Works

This package imports the shared store instance from `@zachhandley/ez-i18n/runtime` as a peer dependency. This ensures that all components in your application share the same translation state, enabling reactive updates across your entire React app when the locale changes.

## License

MIT
