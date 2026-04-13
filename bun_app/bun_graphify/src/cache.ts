// SHA256-based file caching
// Compatible with Python graphify cache format

import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { CacheEntry } from './types';

const CACHE_DIR = 'graphify-out/cache';

export function fileHash(filePath: string): string {
  const data = require('node:fs').readFileSync(resolve(filePath));
  const h = createHash('sha256');
  h.update(data);
  h.update('\x00');
  h.update(resolve(filePath));
  return h.digest('hex');
}

export async function getCacheDir(): Promise<string> {
  const dir = join(process.cwd(), CACHE_DIR);
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function loadCached(
  filePath: string,
): Promise<CacheEntry | null> {
  try {
    const hash = fileHash(filePath);
    const cacheDir = await getCacheDir();
    const cachePath = join(cacheDir, `${hash}.json`);
    const data = await readFile(cachePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function saveCached(
  filePath: string,
  entry: CacheEntry,
): Promise<void> {
  const hash = fileHash(filePath);
  const cacheDir = await getCacheDir();
  const cachePath = join(cacheDir, `${hash}.json`);
  await writeFile(cachePath, JSON.stringify(entry), 'utf-8');
}

export async function cachedFiles(): Promise<Record<string, string>> {
  try {
    const cacheDir = await getCacheDir();
    const files = await readdir(cacheDir);
    const result: Record<string, string> = {};
    for (const f of files) {
      if (f.endsWith('.json')) {
        // The hash alone doesn't map back to file path in Python either
        // This returns hash -> cache path mapping
        result[f.slice(0, -5)] = join(cacheDir, f);
      }
    }
    return result;
  } catch {
    return {};
  }
}

export async function clearCache(): Promise<number> {
  try {
    const cacheDir = await getCacheDir();
    const files = await readdir(cacheDir);
    let count = 0;
    for (const f of files) {
      if (f.endsWith('.json')) {
        await rm(join(cacheDir, f));
        count++;
      }
    }
    return count;
  } catch {
    return 0;
  }
}
