import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  splitting: false,
  external: [
    'react',
    'nanostores',
    '@nanostores/react',
    '@zachhandley/ez-i18n',
    /^@zachhandley\/ez-i18n\//,
  ],
});
