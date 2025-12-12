import { glob } from 'tinyglobby';
import * as path from 'node:path';
import * as fs from 'node:fs';
import type { LocaleTranslationPath, TranslationsConfig, TranslationCache } from '../types';

const CACHE_FILE = '.ez-i18n.json';
const CACHE_VERSION = 1;
const DEFAULT_I18N_DIR = './public/i18n';

export type PathType = 'file' | 'folder' | 'glob' | 'array';

/**
 * Detect the type of translation path
 */
export function detectPathType(input: string | string[]): PathType {
  if (Array.isArray(input)) return 'array';
  if (input.includes('*')) return 'glob';
  if (input.endsWith('/') || input.endsWith(path.sep)) return 'folder';
  return 'file';
}

/**
 * Check if a path is a directory (handles missing trailing slash)
 */
function isDirectory(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Resolve a single translation path to an array of absolute file paths.
 * Results are sorted alphabetically for predictable merge order.
 */
export async function resolveTranslationPaths(
  input: LocaleTranslationPath,
  projectRoot: string
): Promise<string[]> {
  const type = detectPathType(input);
  let files: string[] = [];

  switch (type) {
    case 'array':
      // Each entry could itself be a glob, folder, or file
      for (const entry of input as string[]) {
        const resolved = await resolveTranslationPaths(entry, projectRoot);
        files.push(...resolved);
      }
      break;

    case 'glob':
      files = await glob(input as string, {
        cwd: projectRoot,
        absolute: true,
      });
      break;

    case 'folder': {
      const folderPath = path.resolve(projectRoot, (input as string).replace(/\/$/, ''));
      files = await glob('**/*.json', {
        cwd: folderPath,
        absolute: true,
      });
      break;
    }

    case 'file':
    default: {
      const filePath = path.resolve(projectRoot, input as string);
      // Check if it's actually a directory (user omitted trailing slash)
      if (isDirectory(filePath)) {
        files = await glob('**/*.json', {
          cwd: filePath,
          absolute: true,
        });
      } else {
        files = [filePath];
      }
      break;
    }
  }

  // Sort alphabetically for predictable merge order
  return [...new Set(files)].sort((a, b) => a.localeCompare(b));
}

/**
 * Auto-discover translations from a base directory.
 * Scans for locale folders (e.g., en/, es/, fr/) and their JSON files.
 * Returns both discovered locales and their file mappings.
 */
export async function autoDiscoverTranslations(
  baseDir: string,
  projectRoot: string,
  configuredLocales?: string[]
): Promise<{ locales: string[]; translations: Record<string, string[]> }> {
  const absoluteBaseDir = path.resolve(projectRoot, baseDir.replace(/\/$/, ''));

  if (!isDirectory(absoluteBaseDir)) {
    console.warn(`[ez-i18n] Translation directory not found: ${absoluteBaseDir}`);
    return { locales: configuredLocales || [], translations: {} };
  }

  const translations: Record<string, string[]> = {};
  const discoveredLocales: string[] = [];

  // Read directory entries
  const entries = fs.readdirSync(absoluteBaseDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      // This is a locale folder (e.g., en/, es/)
      const locale = entry.name;

      // If locales were configured, only include matching ones
      if (configuredLocales && configuredLocales.length > 0) {
        if (!configuredLocales.includes(locale)) continue;
      }

      const localePath = path.join(absoluteBaseDir, locale);
      const files = await glob('**/*.json', {
        cwd: localePath,
        absolute: true,
      });

      if (files.length > 0) {
        discoveredLocales.push(locale);
        translations[locale] = files.sort((a, b) => a.localeCompare(b));
      }
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      // Root-level JSON files (e.g., en.json, es.json)
      // Extract locale from filename
      const locale = path.basename(entry.name, '.json');

      // If locales were configured, only include matching ones
      if (configuredLocales && configuredLocales.length > 0) {
        if (!configuredLocales.includes(locale)) continue;
      }

      const filePath = path.join(absoluteBaseDir, entry.name);

      if (!translations[locale]) {
        discoveredLocales.push(locale);
        translations[locale] = [];
      }
      translations[locale].push(filePath);
    }
  }

  // Sort locales for consistency
  const sortedLocales = [...new Set(discoveredLocales)].sort();

  return { locales: sortedLocales, translations };
}

/**
 * Resolve the full translations config to normalized form.
 * Handles string (base dir), object (per-locale), or undefined (auto-discover).
 */
export async function resolveTranslationsConfig(
  config: TranslationsConfig | undefined,
  projectRoot: string,
  configuredLocales?: string[]
): Promise<{ locales: string[]; translations: Record<string, string[]> }> {
  // No config - auto-discover from default location
  if (!config) {
    return autoDiscoverTranslations(DEFAULT_I18N_DIR, projectRoot, configuredLocales);
  }

  // String - treat as base directory for auto-discovery
  if (typeof config === 'string') {
    return autoDiscoverTranslations(config, projectRoot, configuredLocales);
  }

  // Object - per-locale mapping
  const translations: Record<string, string[]> = {};
  const locales = Object.keys(config);

  for (const [locale, localePath] of Object.entries(config)) {
    translations[locale] = await resolveTranslationPaths(localePath, projectRoot);
  }

  return { locales, translations };
}

/**
 * Deep merge translation objects.
 * - Objects are recursively merged
 * - Arrays are REPLACED (not concatenated)
 * - Primitives are overwritten by later values
 * - Prototype pollution safe
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  ...sources: T[]
): T {
  const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
  const result = { ...target };

  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;

    for (const key of Object.keys(source)) {
      if (FORBIDDEN_KEYS.has(key)) continue;

      const targetVal = result[key as keyof T];
      const sourceVal = source[key as keyof T];

      if (
        sourceVal !== null &&
        typeof sourceVal === 'object' &&
        !Array.isArray(sourceVal) &&
        targetVal !== null &&
        typeof targetVal === 'object' &&
        !Array.isArray(targetVal)
      ) {
        // Both are plain objects - recurse
        (result as Record<string, unknown>)[key] = deepMerge(
          targetVal as Record<string, unknown>,
          sourceVal as Record<string, unknown>
        );
      } else {
        // Arrays replace, primitives overwrite
        (result as Record<string, unknown>)[key] = sourceVal;
      }
    }
  }

  return result;
}

/**
 * Load cached translation discovery results
 */
export function loadCache(projectRoot: string): TranslationCache | null {
  const cachePath = path.join(projectRoot, CACHE_FILE);

  try {
    if (!fs.existsSync(cachePath)) return null;

    const content = fs.readFileSync(cachePath, 'utf-8');
    const cache = JSON.parse(content) as TranslationCache;

    // Validate cache version
    if (cache.version !== CACHE_VERSION) return null;

    return cache;
  } catch {
    return null;
  }
}

/**
 * Save translation discovery results to cache
 */
export function saveCache(
  projectRoot: string,
  discovered: Record<string, string[]>
): void {
  const cachePath = path.join(projectRoot, CACHE_FILE);

  const cache: TranslationCache = {
    version: CACHE_VERSION,
    discovered,
    lastScan: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.warn('[ez-i18n] Failed to write cache file:', error);
  }
}

/**
 * Check if cache is still valid (files haven't changed)
 */
export function isCacheValid(
  cache: TranslationCache,
  projectRoot: string
): boolean {
  // Check if all cached files still exist
  for (const files of Object.values(cache.discovered)) {
    for (const file of files) {
      if (!fs.existsSync(file)) return false;
    }
  }

  return true;
}

/**
 * Convert an absolute path to a relative import path for Vite
 */
export function toRelativeImport(absolutePath: string, projectRoot: string): string {
  const relativePath = path.relative(projectRoot, absolutePath);
  // Ensure it starts with ./ and uses forward slashes
  const normalized = relativePath.replace(/\\/g, '/');
  return normalized.startsWith('.') ? normalized : './' + normalized;
}

/**
 * Generate a glob pattern for import.meta.glob from a base directory.
 * In virtual modules, globs must start with '/' (project root relative).
 * Returns null if the path is in public/ (can't use import.meta.glob for public files).
 */
export function toGlobPattern(baseDir: string, projectRoot: string): string {
  const relativePath = path.relative(projectRoot, baseDir).replace(/\\/g, '/');
  // Virtual modules require globs to start with '/' (project root relative)
  // Works for both public/ and non-public directories
  return `/${relativePath}/**/*.json`;
}

/**
 * Check if an absolute path is inside the public directory
 */
export function isInPublicDir(filePath: string, projectRoot: string): boolean {
  const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');
  return relativePath.startsWith('public/') || relativePath === 'public';
}

/**
 * Convert a public directory path to its served URL.
 * public/i18n/en/common.json → /i18n/en/common.json
 */
export function toPublicUrl(filePath: string, projectRoot: string): string {
  const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');
  // Remove 'public/' prefix - files in public/ are served at root
  if (relativePath.startsWith('public/')) {
    return '/' + relativePath.slice('public/'.length);
  }
  return '/' + relativePath;
}

/**
 * Get the locale base directory for namespace calculation.
 * For public paths, strips the 'public/' prefix.
 */
export function getLocaleBaseDirForNamespace(localeBaseDir: string, projectRoot: string): string {
  const relativePath = path.relative(projectRoot, localeBaseDir).replace(/\\/g, '/');
  // For namespace calculation, we want the path without 'public/' prefix
  if (relativePath.startsWith('public/')) {
    return relativePath.slice('public/'.length);
  }
  return relativePath;
}

/**
 * Get namespace from file path relative to locale base directory.
 *
 * Examples:
 * - filePath: /project/public/i18n/en/auth/login.json, localeDir: /project/public/i18n/en
 *   → namespace: 'auth.login'
 * - filePath: /project/public/i18n/en/common.json, localeDir: /project/public/i18n/en
 *   → namespace: 'common'
 * - filePath: /project/public/i18n/en/settings/index.json, localeDir: /project/public/i18n/en
 *   → namespace: 'settings' (index is stripped)
 */
export function getNamespaceFromPath(filePath: string, localeDir: string): string {
  // Get relative path from locale directory
  const relative = path.relative(localeDir, filePath);

  // Remove .json extension
  const withoutExt = relative.replace(/\.json$/i, '');

  // Convert path separators to dots
  const namespace = withoutExt.replace(/[\\/]/g, '.');

  // Remove trailing .index (index.json files represent the folder itself)
  return namespace.replace(/\.index$/, '');
}

/**
 * Wrap a translation object with its namespace.
 *
 * Example:
 * - namespace: 'auth.login'
 * - content: { title: 'Welcome', subtitle: 'Login here' }
 * - result: { auth: { login: { title: 'Welcome', subtitle: 'Login here' } } }
 */
export function wrapWithNamespace(
  namespace: string,
  content: Record<string, unknown>
): Record<string, unknown> {
  if (!namespace) return content;

  const parts = namespace.split('.');
  let result: Record<string, unknown> = content;

  // Build from inside out
  for (let i = parts.length - 1; i >= 0; i--) {
    result = { [parts[i]]: result };
  }

  return result;
}

/**
 * Generate code that wraps imported content with namespace at runtime.
 * Used in virtual module generation.
 */
export function generateNamespaceWrapperCode(): string {
  return `
function __wrapWithNamespace(namespace, content) {
  if (!namespace) return content;
  const parts = namespace.split('.');
  let result = content;
  for (let i = parts.length - 1; i >= 0; i--) {
    result = { [parts[i]]: result };
  }
  return result;
}`;
}
