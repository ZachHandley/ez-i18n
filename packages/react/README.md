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
      <button onClick={() => setLocale('es')}>Español</button>
      <p>Current locale: {locale}</p>
    </div>
  );
}
```

## API

### `useI18n()`

Returns an object with:

- `t(key: string, params?: Record<string, string | number>)` - Translation function
- `locale: string` - Current locale
- `setLocale(locale: string)` - Function to change locale

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
