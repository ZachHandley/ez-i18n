# @zachhandley/ez-i18n-vue

Vue 3 plugin for [@zachhandley/ez-i18n](https://github.com/zachhandley/ez-i18n) - Cookie-based i18n with reactive language switching.

## Installation

```bash
pnpm add @zachhandley/ez-i18n @zachhandley/ez-i18n-vue
```

This package requires:
- `@zachhandley/ez-i18n` (peer dependency)
- `vue` ^3.4.0
- `@nanostores/vue` ^0.10.0

## Usage

### Setup Plugin

```typescript
// In your Vue app entry point (e.g., main.ts)
import { createApp } from 'vue';
import { ezI18nVue } from '@zachhandley/ez-i18n-vue';
import App from './App.vue';

const app = createApp(App);
app.use(ezI18nVue);
app.mount('#app');
```

### Options API

Use the global properties `$t`, `$locale`, and `$setLocale`:

```vue
<template>
  <div>
    <h1>{{ $t('welcome.title') }}</h1>
    <p>{{ $t('welcome.message', { name: userName }) }}</p>

    <div>
      <span>Current locale: {{ $locale }}</span>
      <button @click="$setLocale('en')">English</button>
      <button @click="$setLocale('es')">Español</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      userName: 'Alice'
    };
  }
};
</script>
```

### Composition API

Use the `useI18n` composable:

```vue
<template>
  <div>
    <h1>{{ t('welcome.title') }}</h1>
    <p>{{ t('welcome.message', { name }) }}</p>

    <div>
      <span>Current locale: {{ locale }}</span>
      <button @click="setLocale('en')">English</button>
      <button @click="setLocale('es')">Español</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from '@zachhandley/ez-i18n-vue';

const { t, locale, setLocale } = useI18n();
const name = ref('Alice');
</script>
```

## Features

- **Reactive Language Switching**: Automatically updates all translations when locale changes
- **TypeScript Support**: Full type safety with TypeScript
- **Nested Keys**: Access nested translations with dot notation (`common.buttons.submit`)
- **Interpolation**: Pass parameters to translations (`{ name: 'Alice' }`)
- **Shared Store Instance**: Uses the same nanostore instance as the main package via peer dependency

## API

### `ezI18nVue`

Vue plugin that adds global properties to all components.

**Global Properties:**
- `$t(key, params?)`: Translate function
- `$locale`: Current locale (reactive ref)
- `$setLocale(locale)`: Change locale function

### `useI18n()`

Composable for Composition API usage.

**Returns:**
- `t(key, params?)`: Translate function
- `locale`: Current locale (reactive ref)
- `setLocale(locale)`: Change locale function

## License

MIT
