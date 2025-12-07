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

## How It Works

This package imports the shared store instance from `@zachhandley/ez-i18n/runtime` as a peer dependency. This ensures that all components in your application share the same translation state, enabling reactive updates across your entire React app when the locale changes.

## License

MIT
