import { defineConfig } from 'tsup';

export default defineConfig([
  // Main entries with type declarations
  {
    entry: [
      'src/index.ts',
      'src/runtime/index.ts',
      'src/runtime/vue-plugin.ts',
      'src/runtime/react-plugin.ts',
      'src/utils/index.ts',
    ],
    format: ['esm'],
    dts: true,
    clean: true,
    splitting: false,
    external: [
      'astro',
      'astro:middleware',
      'vue',
      'react',
      'nanostores',
      '@nanostores/persistent',
      '@nanostores/vue',
      '@nanostores/react',
      /^ez-i18n/,
    ],
  },
  // Middleware (no dts - uses Astro virtual modules)
  {
    entry: ['src/middleware.ts'],
    format: ['esm'],
    dts: false,
    splitting: false,
    external: [
      'astro',
      'astro:middleware',
      /^ez-i18n/,
    ],
  },
]);
