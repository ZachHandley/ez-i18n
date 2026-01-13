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
    <p>{{ $t('[i18n:greeting|name=World]') }}</p>

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

    <!-- Using tc() for reactive translations -->
    <h2>{{ greeting }}</h2>

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

const { t, tc, locale, setLocale } = useI18n();
const name = ref('Alice');

// tc() returns a Vue Ref that automatically updates on locale change
const greeting = tc('common.greeting', { name: 'World' });
</script>
```

### Embedded i18n Strings

`t()` and `$t()` also accept embedded i18n strings, which are formatted in the active locale:

```vue
<template>
  <p>{{ $t('[i18n:greeting|name=World]') }}</p>
  <p>{{ $t('Hello [i18n:greeting|name=World]!') }}</p>
</template>
```

## Features

- **Reactive Language Switching**: Automatically updates all translations when locale changes
- **TypeScript Support**: Full type safety with TypeScript
- **Nested Keys**: Access nested translations with dot notation (`common.buttons.submit`)
- **Interpolation**: Pass parameters to translations (`{ name: 'Alice' }`)
- **Shared Store Instance**: Uses the same nanostore instance as the main package via peer dependency

## Accessing Config & Locale Utilities

Access configuration and locale metadata from the core package:

```vue
<template>
  <select :value="locale" @change="setLocale(($event.target as HTMLSelectElement).value)">
    <option v-for="loc in locales" :key="loc" :value="loc">
      {{ localeNames[loc] }}
    </option>
  </select>
</template>

<script setup>
import { useI18n } from '@zachhandley/ez-i18n-vue';
import { locales, localeNames, localeDirections } from 'ez-i18n:config';
import { getLocaleInfo } from '@zachhandley/ez-i18n';

const { locale, setLocale } = useI18n();

// Get full locale info
const arabicInfo = getLocaleInfo('ar');
// { name: 'العربية', englishName: 'Arabic', bcp47: 'ar-SA', dir: 'rtl' }
</script>
```

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
- `tc(key, params?)`: Returns a Vue `Ref<string>` that automatically updates when locale changes
- `locale`: Current locale (reactive ref)
- `setLocale(locale)`: Change locale function

### Reactive Translations with tc()

The `tc()` function returns a Vue `Ref<string>` (wrapping a nanostore computed atom) that automatically updates when the locale or translations change. This is useful when:

- Translations may load asynchronously after component mount
- You want a dedicated reactive reference for a specific translation
- You need to pass a reactive translation to a child component

```vue
<script setup>
import { useI18n } from '@zachhandley/ez-i18n-vue';

const { tc } = useI18n();

// Returns a Ref that updates when locale changes
const title = tc('welcome.title');
const greeting = tc('welcome.message', { name: 'Alice' });
</script>

<template>
  <h1>{{ title }}</h1>
  <p>{{ greeting }}</p>
</template>
```

The `tc()` function is also available as a global property `$tc` in the Options API:

```vue
<template>
  <div>
    <h1>{{ pageTitle }}</h1>
  </div>
</template>

<script>
export default {
  computed: {
    pageTitle() {
      return this.$tc('page.title');
    }
  }
};
</script>
```

For most use cases, the regular `t()` function is sufficient. Use `tc()` when you need explicit reactive references.

## License

MIT
