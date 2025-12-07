import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import type { EzI18nConfig, ResolvedEzI18nConfig } from './types';
import {
  resolveTranslationsConfig,
  toRelativeImport,
  toGlobPattern,
  loadCache,
  saveCache,
  isCacheValid,
  detectPathType,
  getNamespaceFromPath,
  generateNamespaceWrapperCode,
} from './utils/translations';
import * as path from 'node:path';

const VIRTUAL_CONFIG = 'ez-i18n:config';
const VIRTUAL_RUNTIME = 'ez-i18n:runtime';
const VIRTUAL_TRANSLATIONS = 'ez-i18n:translations';
const RESOLVED_PREFIX = '\0';

interface TranslationInfo {
  locale: string;
  files: string[];
  /** Glob pattern for dev mode HMR (if applicable) */
  globPattern?: string;
  /** Base directory for this locale (used for namespace calculation) */
  localeBaseDir?: string;
}

/**
 * Vite plugin that provides virtual modules for ez-i18n
 */
export function vitePlugin(config: EzI18nConfig): Plugin {
  let viteConfig: ResolvedConfig;
  let isDev = false;
  let resolved: ResolvedEzI18nConfig;
  let translationInfo: Map<string, TranslationInfo> = new Map();

  return {
    name: 'ez-i18n-vite',
    enforce: 'pre',

    configResolved(resolvedConfig) {
      viteConfig = resolvedConfig;
      isDev = resolvedConfig.command === 'serve';
    },

    async buildStart() {
      const projectRoot = viteConfig.root;

      // Determine if path-based namespacing should be enabled
      // Default to true when using folder-based or auto-discovery config
      const isAutoDiscovery = !config.translations || typeof config.translations === 'string';
      const pathBasedNamespacing = config.pathBasedNamespacing ?? isAutoDiscovery;

      // Calculate base translation directory
      const translationsBaseDir = typeof config.translations === 'string'
        ? path.resolve(projectRoot, config.translations.replace(/\/$/, ''))
        : path.resolve(projectRoot, './public/i18n');

      // Try to use cache in production builds
      let useCache = false;
      if (!isDev) {
        const cache = loadCache(projectRoot);
        if (cache && isCacheValid(cache, projectRoot)) {
          // Build locale base dirs
          const localeBaseDirs: Record<string, string> = {};
          for (const locale of Object.keys(cache.discovered)) {
            localeBaseDirs[locale] = path.join(translationsBaseDir, locale);
          }

          // Use cached discovery
          resolved = {
            locales: config.locales || Object.keys(cache.discovered),
            defaultLocale: config.defaultLocale,
            cookieName: config.cookieName ?? 'ez-locale',
            translations: cache.discovered,
            pathBasedNamespacing,
            localeBaseDirs,
          };
          useCache = true;

          // Populate translationInfo from cache
          for (const [locale, files] of Object.entries(cache.discovered)) {
            translationInfo.set(locale, {
              locale,
              files,
              localeBaseDir: localeBaseDirs[locale],
            });
          }
        }
      }

      if (!useCache) {
        // Resolve translations config
        const { locales, translations } = await resolveTranslationsConfig(
          config.translations,
          projectRoot,
          config.locales
        );

        // Merge with configured locales (config takes precedence if specified)
        const finalLocales = config.locales && config.locales.length > 0
          ? config.locales
          : locales;

        // Build locale base dirs
        const localeBaseDirs: Record<string, string> = {};
        for (const locale of finalLocales) {
          if (isAutoDiscovery) {
            // For auto-discovery, locale folder is under the base dir
            localeBaseDirs[locale] = path.join(translationsBaseDir, locale);
          } else if (typeof config.translations === 'object' && config.translations[locale]) {
            // For explicit config, determine base from the config value
            const localeConfig = config.translations[locale];
            if (typeof localeConfig === 'string') {
              const pathType = detectPathType(localeConfig);
              if (pathType === 'folder' || pathType === 'file') {
                // Use the folder itself or parent of file
                const resolved = path.resolve(projectRoot, localeConfig.replace(/\/$/, ''));
                localeBaseDirs[locale] = pathType === 'folder' ? resolved : path.dirname(resolved);
              } else {
                // Glob - use the non-glob prefix
                const baseDir = localeConfig.split('*')[0].replace(/\/$/, '');
                localeBaseDirs[locale] = path.resolve(projectRoot, baseDir);
              }
            } else {
              // Array - use common parent directory
              localeBaseDirs[locale] = translationsBaseDir;
            }
          } else {
            localeBaseDirs[locale] = translationsBaseDir;
          }
        }

        resolved = {
          locales: finalLocales,
          defaultLocale: config.defaultLocale,
          cookieName: config.cookieName ?? 'ez-locale',
          translations,
          pathBasedNamespacing,
          localeBaseDirs,
        };

        // Build translation info for each locale
        for (const locale of finalLocales) {
          const files = translations[locale] || [];
          const info: TranslationInfo = {
            locale,
            files,
            localeBaseDir: localeBaseDirs[locale],
          };

          // For dev mode, determine if we can use import.meta.glob
          if (isDev && config.translations) {
            const localeConfig = typeof config.translations === 'string'
              ? path.join(config.translations, locale)
              : config.translations[locale];

            if (localeConfig && typeof localeConfig === 'string') {
              const pathType = detectPathType(localeConfig);
              if (pathType === 'folder' || pathType === 'glob') {
                // Can use import.meta.glob for HMR
                const basePath = pathType === 'glob'
                  ? localeConfig
                  : toGlobPattern(path.resolve(projectRoot, localeConfig), projectRoot);
                info.globPattern = basePath;
              }
            }
          }

          translationInfo.set(locale, info);
        }

        // Save cache for future builds
        if (!isDev && Object.keys(translations).length > 0) {
          saveCache(projectRoot, translations);
        }
      }

      // Validate defaultLocale
      if (!resolved.locales.includes(resolved.defaultLocale)) {
        console.warn(
          `[ez-i18n] defaultLocale "${resolved.defaultLocale}" not found in locales: [${resolved.locales.join(', ')}]`
        );
      }
    },

    resolveId(id) {
      if (id === VIRTUAL_CONFIG || id === VIRTUAL_RUNTIME || id === VIRTUAL_TRANSLATIONS) {
        return RESOLVED_PREFIX + id;
      }
      return null;
    },

    load(id) {
      // ez-i18n:config - Static config values
      if (id === RESOLVED_PREFIX + VIRTUAL_CONFIG) {
        return `
export const locales = ${JSON.stringify(resolved.locales)};
export const defaultLocale = ${JSON.stringify(resolved.defaultLocale)};
export const cookieName = ${JSON.stringify(resolved.cookieName)};
`;
      }

      // ez-i18n:runtime - Runtime exports for Astro files
      if (id === RESOLVED_PREFIX + VIRTUAL_RUNTIME) {
        return `
import { effectiveLocale, translations, setLocale, initLocale } from '@zachhandley/ez-i18n/runtime';

export { setLocale, initLocale };
export { effectiveLocale as locale };

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value == null || typeof value !== 'object') return undefined;
    value = value[key];
  }
  return value;
}

/**
 * Interpolate params into string
 */
function interpolate(str, params) {
  if (!params) return str;
  return str.replace(/\\{(\\w+)\\}/g, (match, key) => {
    return key in params ? String(params[key]) : match;
  });
}

/**
 * Translate a key to the current locale
 * @param key - Dot-notation key (e.g., 'common.welcome')
 * @param params - Optional interpolation params
 */
export function t(key, params) {
  const trans = translations.get();
  const value = getNestedValue(trans, key);

  if (typeof value !== 'string') {
    if (import.meta.env.DEV) {
      console.warn('[ez-i18n] Missing translation:', key);
    }
    return key;
  }

  return interpolate(value, params);
}
`;
      }

      // ez-i18n:translations - Translation loaders
      if (id === RESOLVED_PREFIX + VIRTUAL_TRANSLATIONS) {
        return isDev
          ? generateDevTranslationsModule(translationInfo, viteConfig.root, resolved.pathBasedNamespacing)
          : generateBuildTranslationsModule(translationInfo, viteConfig.root, resolved.pathBasedNamespacing);
      }

      return null;
    },

    // HMR support for dev mode
    handleHotUpdate({ file, server }) {
      if (!isDev) return;

      // Check if the changed file is a translation file
      for (const info of translationInfo.values()) {
        if (info.files.includes(file)) {
          // Invalidate the virtual translations module
          const mod = server.moduleGraph.getModuleById(RESOLVED_PREFIX + VIRTUAL_TRANSLATIONS);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
            // Full reload to ensure translations are updated everywhere
            server.ws.send({
              type: 'full-reload',
              path: '*',
            });
          }
          break;
        }
      }
    },

    configureServer(server: ViteDevServer) {
      // Watch translation directories for new/deleted files
      const watchedDirs = new Set<string>();

      if (config.translations) {
        if (typeof config.translations === 'string') {
          // Base directory
          watchedDirs.add(path.resolve(viteConfig.root, config.translations));
        } else {
          // Per-locale config
          for (const localePath of Object.values(config.translations)) {
            if (typeof localePath === 'string') {
              const pathType = detectPathType(localePath);
              if (pathType === 'folder') {
                watchedDirs.add(path.resolve(viteConfig.root, localePath));
              } else if (pathType === 'glob') {
                // Extract base directory from glob
                const baseDir = localePath.split('*')[0].replace(/\/$/, '');
                if (baseDir) {
                  watchedDirs.add(path.resolve(viteConfig.root, baseDir));
                }
              }
            } else if (Array.isArray(localePath)) {
              // Array of files - watch parent directories
              for (const file of localePath) {
                const dir = path.dirname(path.resolve(viteConfig.root, file));
                watchedDirs.add(dir);
              }
            }
          }
        }
      } else {
        // Default directory
        watchedDirs.add(path.resolve(viteConfig.root, './public/i18n'));
      }

      // Add directories to watcher
      for (const dir of watchedDirs) {
        server.watcher.add(dir);
      }
    },
  };
}

/**
 * Generate the translations virtual module for dev mode.
 * Uses import.meta.glob where possible for HMR support.
 */
function generateDevTranslationsModule(
  translationInfo: Map<string, TranslationInfo>,
  projectRoot: string,
  pathBasedNamespacing: boolean
): string {
  const imports: string[] = [];
  const loaderEntries: string[] = [];

  // Add deepMerge inline for runtime merging
  imports.push(getDeepMergeCode());

  // Add namespace wrapper if needed
  if (pathBasedNamespacing) {
    imports.push(generateNamespaceWrapperCode());
  }

  for (const [locale, info] of translationInfo) {
    if (info.files.length === 0) {
      // No files - return empty object
      loaderEntries.push(`  ${JSON.stringify(locale)}: async () => ({})`);
    } else if (info.globPattern && pathBasedNamespacing && info.localeBaseDir) {
      // Use import.meta.glob with namespace wrapping
      const varName = `__${locale}Modules`;
      const localeBaseDir = info.localeBaseDir.replace(/\\/g, '/');
      imports.push(
        `const ${varName} = import.meta.glob(${JSON.stringify(info.globPattern)}, { eager: true, import: 'default' });`
      );

      loaderEntries.push(`  ${JSON.stringify(locale)}: async () => {
    const entries = Object.entries(${varName});
    if (entries.length === 0) return {};
    const localeBaseDir = ${JSON.stringify(localeBaseDir)};
    const wrapped = entries.map(([filePath, content]) => {
      // Extract relative path from locale base dir
      const relativePath = filePath.replace(localeBaseDir + '/', '').replace(/\\.json$/i, '');
      const namespace = relativePath.replace(/[\\/]/g, '.').replace(/\\.index$/, '');
      return __wrapWithNamespace(namespace, content);
    });
    return __deepMerge({}, ...wrapped);
  }`);
    } else if (info.globPattern) {
      // Use import.meta.glob without namespace wrapping
      const varName = `__${locale}Modules`;
      imports.push(
        `const ${varName} = import.meta.glob(${JSON.stringify(info.globPattern)}, { eager: true, import: 'default' });`
      );

      loaderEntries.push(`  ${JSON.stringify(locale)}: async () => {
    const modules = Object.values(${varName});
    if (modules.length === 0) return {};
    if (modules.length === 1) return modules[0];
    return __deepMerge({}, ...modules);
  }`);
    } else if (info.files.length === 1) {
      // Single file
      const relativePath = toRelativeImport(info.files[0], projectRoot);
      if (pathBasedNamespacing && info.localeBaseDir) {
        const namespace = getNamespaceFromPath(info.files[0], info.localeBaseDir);
        loaderEntries.push(
          `  ${JSON.stringify(locale)}: () => import(${JSON.stringify(relativePath)}).then(m => __wrapWithNamespace(${JSON.stringify(namespace)}, m.default ?? m))`
        );
      } else {
        loaderEntries.push(
          `  ${JSON.stringify(locale)}: () => import(${JSON.stringify(relativePath)}).then(m => m.default ?? m)`
        );
      }
    } else {
      // Multiple explicit files - import all and merge
      if (pathBasedNamespacing && info.localeBaseDir) {
        const fileEntries = info.files.map(f => {
          const relativePath = toRelativeImport(f, projectRoot);
          const namespace = getNamespaceFromPath(f, info.localeBaseDir!);
          return `{ path: ${JSON.stringify(relativePath)}, namespace: ${JSON.stringify(namespace)} }`;
        });

        loaderEntries.push(`  ${JSON.stringify(locale)}: async () => {
    const fileInfos = [${fileEntries.join(', ')}];
    const modules = await Promise.all(fileInfos.map(f => import(f.path)));
    const wrapped = modules.map((m, i) => __wrapWithNamespace(fileInfos[i].namespace, m.default ?? m));
    return __deepMerge({}, ...wrapped);
  }`);
      } else {
        const fileImports = info.files
          .map(f => `import(${JSON.stringify(toRelativeImport(f, projectRoot))})`)
          .join(', ');

        loaderEntries.push(`  ${JSON.stringify(locale)}: async () => {
    const modules = await Promise.all([${fileImports}]);
    const contents = modules.map(m => m.default ?? m);
    if (contents.length === 1) return contents[0];
    return __deepMerge({}, ...contents);
  }`);
      }
    }
  }

  return `
${imports.join('\n')}

export const translationLoaders = {
${loaderEntries.join(',\n')}
};

export async function loadTranslations(locale) {
  const loader = translationLoaders[locale];
  if (!loader) {
    if (import.meta.env.DEV) {
      console.warn('[ez-i18n] No translations configured for locale:', locale);
    }
    return {};
  }

  try {
    return await loader();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[ez-i18n] Failed to load translations for locale:', locale, error);
    }
    return {};
  }
}
`;
}

/**
 * Generate the translations virtual module for production builds.
 * Pre-resolves all imports for optimal bundling.
 */
function generateBuildTranslationsModule(
  translationInfo: Map<string, TranslationInfo>,
  projectRoot: string,
  pathBasedNamespacing: boolean
): string {
  const loaderEntries: string[] = [];
  let needsDeepMerge = false;
  let needsNamespaceWrapper = false;

  for (const [locale, info] of translationInfo) {
    if (info.files.length === 0) {
      loaderEntries.push(`  ${JSON.stringify(locale)}: async () => ({})`);
    } else if (info.files.length === 1) {
      // Single file
      const relativePath = toRelativeImport(info.files[0], projectRoot);
      if (pathBasedNamespacing && info.localeBaseDir) {
        needsNamespaceWrapper = true;
        const namespace = getNamespaceFromPath(info.files[0], info.localeBaseDir);
        loaderEntries.push(
          `  ${JSON.stringify(locale)}: () => import(${JSON.stringify(relativePath)}).then(m => __wrapWithNamespace(${JSON.stringify(namespace)}, m.default ?? m))`
        );
      } else {
        loaderEntries.push(
          `  ${JSON.stringify(locale)}: () => import(${JSON.stringify(relativePath)}).then(m => m.default ?? m)`
        );
      }
    } else {
      // Multiple files - import and merge
      needsDeepMerge = true;

      if (pathBasedNamespacing && info.localeBaseDir) {
        needsNamespaceWrapper = true;
        const fileEntries = info.files.map(f => {
          const relativePath = toRelativeImport(f, projectRoot);
          const namespace = getNamespaceFromPath(f, info.localeBaseDir!);
          return `{ path: ${JSON.stringify(relativePath)}, namespace: ${JSON.stringify(namespace)} }`;
        });

        loaderEntries.push(`  ${JSON.stringify(locale)}: async () => {
    const fileInfos = [${fileEntries.join(', ')}];
    const modules = await Promise.all(fileInfos.map(f => import(f.path)));
    const wrapped = modules.map((m, i) => __wrapWithNamespace(fileInfos[i].namespace, m.default ?? m));
    return __deepMerge({}, ...wrapped);
  }`);
      } else {
        const fileImports = info.files
          .map(f => `import(${JSON.stringify(toRelativeImport(f, projectRoot))})`)
          .join(', ');

        loaderEntries.push(`  ${JSON.stringify(locale)}: async () => {
    const modules = await Promise.all([${fileImports}]);
    const contents = modules.map(m => m.default ?? m);
    return __deepMerge({}, ...contents);
  }`);
      }
    }
  }

  const helperCode = [
    needsDeepMerge ? getDeepMergeCode() : '',
    needsNamespaceWrapper ? generateNamespaceWrapperCode() : '',
  ].filter(Boolean).join('\n');

  return `
${helperCode}

export const translationLoaders = {
${loaderEntries.join(',\n')}
};

export async function loadTranslations(locale) {
  const loader = translationLoaders[locale];
  if (!loader) {
    return {};
  }

  try {
    return await loader();
  } catch (error) {
    console.error('[ez-i18n] Failed to load translations:', locale, error);
    return {};
  }
}
`;
}

/**
 * Inline deepMerge function for the virtual module
 */
function getDeepMergeCode(): string {
  return `
function __deepMerge(target, ...sources) {
  const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);
  const result = { ...target };
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    for (const key of Object.keys(source)) {
      if (FORBIDDEN.has(key)) continue;
      const tv = result[key], sv = source[key];
      if (sv && typeof sv === 'object' && !Array.isArray(sv) && tv && typeof tv === 'object' && !Array.isArray(tv)) {
        result[key] = __deepMerge(tv, sv);
      } else {
        result[key] = sv;
      }
    }
  }
  return result;
}`;
}

// Re-export resolveConfig for backwards compatibility
export function resolveConfig(config: EzI18nConfig): ResolvedEzI18nConfig {
  // This is now a simplified version - full resolution happens in buildStart
  const isAutoDiscovery = !config.translations || typeof config.translations === 'string';
  return {
    locales: config.locales || [],
    defaultLocale: config.defaultLocale,
    cookieName: config.cookieName ?? 'ez-locale',
    translations: {},
    pathBasedNamespacing: config.pathBasedNamespacing ?? isAutoDiscovery,
    localeBaseDirs: {},
  };
}
