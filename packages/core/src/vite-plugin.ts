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
  isInPublicDir,
  toPublicUrl,
  getLocaleBaseDirForNamespace,
} from './utils/translations';
import {
  buildLocaleNames,
  buildLocaleToBCP47,
  buildLocaleDirections,
} from './utils/locales';
import * as path from 'node:path';

const VIRTUAL_CONFIG = 'ez-i18n:config';
const VIRTUAL_RUNTIME = 'ez-i18n:runtime';
const VIRTUAL_TRANSLATIONS = 'ez-i18n:translations';
const RESOLVED_PREFIX = '\0';

interface TranslationInfo {
  locale: string;
  files: string[];
  /** Glob pattern for dev mode HMR (if applicable, null for public files) */
  globPattern?: string | null;
  /** Base directory for this locale (used for namespace calculation) */
  localeBaseDir?: string;
  /** Whether files are in the public directory (use fetch instead of import) */
  isPublic?: boolean;
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
            const filesInPublic = files.length > 0 && isInPublicDir(files[0], projectRoot);
            translationInfo.set(locale, {
              locale,
              files,
              localeBaseDir: localeBaseDirs[locale],
              isPublic: filesInPublic,
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
          // Check if files are in public directory
          const filesInPublic = files.length > 0 && isInPublicDir(files[0], projectRoot);

          const info: TranslationInfo = {
            locale,
            files,
            localeBaseDir: localeBaseDirs[locale],
            isPublic: filesInPublic,
          };

          // For dev mode, determine if we can use import.meta.glob (not for public files)
          if (isDev && config.translations && !filesInPublic) {
            const localeConfig = typeof config.translations === 'string'
              ? path.join(config.translations, locale) + '/'  // Trailing slash ensures detectPathType returns 'folder'
              : config.translations[locale];

            if (localeConfig && typeof localeConfig === 'string') {
              const pathType = detectPathType(localeConfig);
              if (pathType === 'folder' || pathType === 'glob') {
                // Can use import.meta.glob for HMR (returns null for public files)
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
        const localeNames = buildLocaleNames(resolved.locales);
        const localeToBCP47 = buildLocaleToBCP47(resolved.locales);
        const localeDirections = buildLocaleDirections(resolved.locales);

        return `
export const locales = ${JSON.stringify(resolved.locales)};
export const defaultLocale = ${JSON.stringify(resolved.defaultLocale)};
export const cookieName = ${JSON.stringify(resolved.cookieName)};

/** Display names for each locale (in native language) */
export const localeNames = ${JSON.stringify(localeNames)};

/** BCP47 language tags for each locale */
export const localeToBCP47 = ${JSON.stringify(localeToBCP47)};

/** Text direction for each locale ('ltr' or 'rtl') */
export const localeDirections = ${JSON.stringify(localeDirections)};
`;
      }

      // ez-i18n:runtime - Runtime exports for Astro files
      if (id === RESOLVED_PREFIX + VIRTUAL_RUNTIME) {
        return `
import { computed } from 'nanostores';
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
 * Translate a key to the current locale (non-reactive)
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

/**
 * Create a reactive translation computed (nanostore computed atom)
 * @param key - Dot-notation key (e.g., 'common.welcome')
 * @param params - Optional interpolation params
 */
export function tc(key, params) {
  return computed(translations, (trans) => {
    const value = getNestedValue(trans, key);

    if (typeof value !== 'string') {
      if (import.meta.env.DEV) {
        console.warn('[ez-i18n] Missing translation:', key);
      }
      return key;
    }

    return interpolate(value, params);
  });
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

      // Only process JSON files
      if (!file.endsWith('.json')) return;

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
      // Map of watched directory -> locale (for determining which locale a new file belongs to)
      const watchedDirToLocale = new Map<string, string>();

      if (config.translations) {
        if (typeof config.translations === 'string') {
          // Base directory with auto-discovery - watch each locale's subdirectory
          const baseDir = path.resolve(viteConfig.root, config.translations.replace(/\/$/, ''));
          for (const locale of translationInfo.keys()) {
            const localeDir = path.join(baseDir, locale);
            watchedDirToLocale.set(localeDir, locale);
          }
        } else {
          // Per-locale config - watch each locale's configured path
          for (const [locale, localePath] of Object.entries(config.translations)) {
            if (typeof localePath === 'string') {
              const pathType = detectPathType(localePath);
              if (pathType === 'folder') {
                watchedDirToLocale.set(path.resolve(viteConfig.root, localePath.replace(/\/$/, '')), locale);
              } else if (pathType === 'glob') {
                const baseDir = localePath.split('*')[0].replace(/\/$/, '');
                if (baseDir) {
                  watchedDirToLocale.set(path.resolve(viteConfig.root, baseDir), locale);
                }
              }
            } else if (Array.isArray(localePath)) {
              for (const file of localePath) {
                const dir = path.dirname(path.resolve(viteConfig.root, file));
                watchedDirToLocale.set(dir, locale);
              }
            }
          }
        }
      } else {
        // Default directory - watch each locale's subdirectory
        const baseDir = path.resolve(viteConfig.root, './public/i18n');
        for (const locale of translationInfo.keys()) {
          const localeDir = path.join(baseDir, locale);
          watchedDirToLocale.set(localeDir, locale);
        }
      }

      // Add directories to watcher
      for (const dir of watchedDirToLocale.keys()) {
        server.watcher.add(dir);
      }

      // Handle new translation files
      server.watcher.on('add', (file) => {
        if (!file.endsWith('.json')) return;

        // Find which locale this file belongs to by checking watched directories
        let locale: string | undefined;
        for (const [dir, loc] of watchedDirToLocale) {
          if (file.startsWith(dir + path.sep) || file.startsWith(dir + '/')) {
            locale = loc;
            break;
          }
        }

        if (!locale || !translationInfo.has(locale)) return;

        // Add file to translationInfo
        const info = translationInfo.get(locale)!;
        if (!info.files.includes(file)) {
          info.files.push(file);
          info.files.sort((a, b) => a.localeCompare(b));
        }

        // Invalidate and reload
        const mod = server.moduleGraph.getModuleById(RESOLVED_PREFIX + VIRTUAL_TRANSLATIONS);
        if (mod) {
          server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: 'full-reload', path: '*' });
        }
      });

      // Handle deleted translation files
      server.watcher.on('unlink', (file) => {
        if (!file.endsWith('.json')) return;

        // Find and remove from translationInfo
        for (const info of translationInfo.values()) {
          const index = info.files.indexOf(file);
          if (index !== -1) {
            info.files.splice(index, 1);

            // Invalidate and reload
            const mod = server.moduleGraph.getModuleById(RESOLVED_PREFIX + VIRTUAL_TRANSLATIONS);
            if (mod) {
              server.moduleGraph.invalidateModule(mod);
              server.ws.send({ type: 'full-reload', path: '*' });
            }
            break;
          }
        }
      });
    },
  };
}

/**
 * Generate the translations virtual module for dev mode.
 * Uses import.meta.glob where possible for HMR support.
 * Uses fetch() for files in public/ directory (with fs fallback for SSR).
 */
function generateDevTranslationsModule(
  translationInfo: Map<string, TranslationInfo>,
  projectRoot: string,
  pathBasedNamespacing: boolean
): string {
  const imports: string[] = [];
  const loaderEntries: string[] = [];
  let needsPublicLoader = false;

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
    } else if (info.isPublic) {
      // Public directory files - use fetch in browser, fs in SSR
      needsPublicLoader = true;
      if (pathBasedNamespacing && info.localeBaseDir) {
        const fileEntries = info.files.map(f => {
          const url = toPublicUrl(f, projectRoot);
          const absolutePath = f.replace(/\\/g, '/');
          const namespace = getNamespaceFromPath(f, info.localeBaseDir!);
          return `{ url: ${JSON.stringify(url)}, path: ${JSON.stringify(absolutePath)}, namespace: ${JSON.stringify(namespace)} }`;
        });

        loaderEntries.push(`  ${JSON.stringify(locale)}: async () => {
    const fileInfos = [${fileEntries.join(', ')}];
    const responses = await Promise.all(fileInfos.map(f => __loadPublicJson(f.url, f.path)));
    const wrapped = responses.map((content, i) => __wrapWithNamespace(fileInfos[i].namespace, content));
    return __deepMerge({}, ...wrapped);
  }`);
      } else {
        const fileEntries = info.files.map(f => {
          const url = toPublicUrl(f, projectRoot);
          const absolutePath = f.replace(/\\/g, '/');
          return `{ url: ${JSON.stringify(url)}, path: ${JSON.stringify(absolutePath)} }`;
        });
        loaderEntries.push(`  ${JSON.stringify(locale)}: async () => {
    const files = [${fileEntries.join(', ')}];
    const responses = await Promise.all(files.map(f => __loadPublicJson(f.url, f.path)));
    if (responses.length === 1) return responses[0];
    return __deepMerge({}, ...responses);
  }`);
      }
    } else if (info.globPattern && pathBasedNamespacing && info.localeBaseDir) {
      // Use import.meta.glob with namespace wrapping
      const varName = `__${locale}Modules`;
      const localeBaseDirForNs = getLocaleBaseDirForNamespace(info.localeBaseDir, projectRoot);
      imports.push(
        `const ${varName} = import.meta.glob(${JSON.stringify(info.globPattern)}, { eager: true, import: 'default' });`
      );

      loaderEntries.push(`  ${JSON.stringify(locale)}: async () => {
    const entries = Object.entries(${varName});
    if (entries.length === 0) return {};
    const localeBaseDir = ${JSON.stringify(localeBaseDirForNs)};
    const wrapped = entries.map(([filePath, content]) => {
      // Extract relative path from locale base dir - filePath starts with /
      const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      const relativePath = normalizedPath.replace(localeBaseDir + '/', '').replace(/\\.json$/i, '');
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
      // Single file - use import
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
    const modules = await Promise.all(fileInfos.map(f => import(/* @vite-ignore */ f.path)));
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

  // Add public loader helper if needed
  if (needsPublicLoader) {
    imports.push(getPublicLoaderCode());
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
 * Uses fetch() for files in public/ directory (with fs fallback for SSR).
 */
function generateBuildTranslationsModule(
  translationInfo: Map<string, TranslationInfo>,
  projectRoot: string,
  pathBasedNamespacing: boolean
): string {
  const loaderEntries: string[] = [];
  let needsDeepMerge = false;
  let needsNamespaceWrapper = false;
  let needsPublicLoader = false;

  for (const [locale, info] of translationInfo) {
    if (info.files.length === 0) {
      loaderEntries.push(`  ${JSON.stringify(locale)}: async () => ({})`);
    } else if (info.isPublic) {
      // Public directory files - use fetch in browser, fs in SSR
      needsPublicLoader = true;
      needsDeepMerge = info.files.length > 1;
      if (pathBasedNamespacing && info.localeBaseDir) {
        needsNamespaceWrapper = true;
        const fileEntries = info.files.map(f => {
          const url = toPublicUrl(f, projectRoot);
          const absolutePath = f.replace(/\\/g, '/');
          const namespace = getNamespaceFromPath(f, info.localeBaseDir!);
          return `{ url: ${JSON.stringify(url)}, path: ${JSON.stringify(absolutePath)}, namespace: ${JSON.stringify(namespace)} }`;
        });

        loaderEntries.push(`  ${JSON.stringify(locale)}: async () => {
    const fileInfos = [${fileEntries.join(', ')}];
    const responses = await Promise.all(fileInfos.map(f => __loadPublicJson(f.url, f.path)));
    const wrapped = responses.map((content, i) => __wrapWithNamespace(fileInfos[i].namespace, content));
    return __deepMerge({}, ...wrapped);
  }`);
      } else {
        const fileEntries = info.files.map(f => {
          const url = toPublicUrl(f, projectRoot);
          const absolutePath = f.replace(/\\/g, '/');
          return `{ url: ${JSON.stringify(url)}, path: ${JSON.stringify(absolutePath)} }`;
        });
        if (fileEntries.length === 1) {
          const f = info.files[0];
          const url = toPublicUrl(f, projectRoot);
          const absolutePath = f.replace(/\\/g, '/');
          loaderEntries.push(`  ${JSON.stringify(locale)}: () => __loadPublicJson(${JSON.stringify(url)}, ${JSON.stringify(absolutePath)})`);
        } else {
          loaderEntries.push(`  ${JSON.stringify(locale)}: async () => {
    const files = [${fileEntries.join(', ')}];
    const responses = await Promise.all(files.map(f => __loadPublicJson(f.url, f.path)));
    return __deepMerge({}, ...responses);
  }`);
        }
      }
    } else if (info.files.length === 1) {
      // Single file - use import
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
    const modules = await Promise.all(fileInfos.map(f => import(/* @vite-ignore */ f.path)));
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
    needsPublicLoader ? getPublicLoaderCode() : '',
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

/**
 * Inline public JSON loader for the virtual module.
 * Runtime-aware: detects environment and uses appropriate file loading strategy.
 */
function getPublicLoaderCode(): string {
  return `
async function __loadPublicJson(url, absolutePath) {
  async function __parseJsonResponse(response) {
    const text = await response.text();
    if (!text) return {};
    return JSON.parse(text);
  }

  // Browser - fetch with relative URL
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(\`Failed to fetch translations from \${url}: \${response.status}\`);
    }
    return __parseJsonResponse(response);
  }

  // Cloudflare Workers - use ASSETS binding (set by middleware)
  const assets = globalThis.__EZ_I18N_ASSETS__;
  if (assets && typeof assets.fetch === 'function') {
    const response = await assets.fetch(new URL(url, 'https://assets.local'));
    if (!response.ok) {
      throw new Error(\`Failed to fetch translations from \${url}: \${response.status}\`);
    }
    return __parseJsonResponse(response);
  }

  // Deno - use Deno.readTextFile
  if (typeof Deno !== 'undefined') {
    const content = await Deno.readTextFile(absolutePath);
    if (!content) return {};
    return JSON.parse(content);
  }

  // Node.js / Bun - use absolute path with node:fs
  const { readFileSync } = await import('node:fs');
  const content = readFileSync(absolutePath, 'utf-8');
  if (!content) return {};
  return JSON.parse(content);
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
