import { resolve, relative, basename } from "node:path";
import { existsSync, readdirSync, statSync, readFileSync } from "node:fs";

const REPO_ROOT = resolve(import.meta.dir, "../../../..");
export const PROJ_DIR = resolve(REPO_ROOT, "bun_remotion_proj");

const SAFE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".md", ".json", ".txt", ".css",
]);

const EXCLUDE_DIRS = new Set([
  "node_modules", ".git", "out", "storygraph_out", "assets", "public",
  "fixture", "scripts", "dist", ".claude",
]);

export function isSafePath(requestedPath: string): { safe: boolean; resolved: string } {
  const resolved = resolve(PROJ_DIR, requestedPath);
  if (!resolved.startsWith(PROJ_DIR)) return { safe: false, resolved };
  return { safe: true, resolved };
}

export function listSeries(): Array<{ id: string; path: string }> {
  const entries = readdirSync(PROJ_DIR, { withFileTypes: true });
  const series: Array<{ id: string; path: string }> = [];
  for (const e of entries) {
    if (!e.isDirectory() || e.name.startsWith(".")) continue;
    const seriesPath = resolve(PROJ_DIR, e.name);
    if (existsSync(resolve(seriesPath, "src"))) {
      series.push({ id: e.name, path: seriesPath });
    }
  }
  return series;
}

export interface ScannedFile {
  path: string;
  name: string;
  size: number;
  episode?: string;
}

export function scanSeriesFiles(seriesId: string): ScannedFile[] | { error: string } {
  const seriesPath = resolve(PROJ_DIR, seriesId);
  if (!existsSync(seriesPath)) return { error: `Series not found: ${seriesId}` };

  const files: ScannedFile[] = [];

  function scanDir(dir: string, episodeName?: string, depth = 0) {
    if (depth > 4) return;
    try {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith(".") || EXCLUDE_DIRS.has(entry.name)) continue;
        const fullPath = resolve(dir, entry.name);
        if (entry.isDirectory()) {
          const isEpisode = existsSync(resolve(fullPath, "src", "Root.tsx"));
          scanDir(fullPath, isEpisode ? entry.name : episodeName, depth + 1);
        } else if (entry.isFile()) {
          const ext = entry.name.slice(entry.name.lastIndexOf("."));
          if (!SAFE_EXTENSIONS.has(ext)) continue;
          const stat = statSync(fullPath);
          const relPath = relative(PROJ_DIR, fullPath);
          files.push({
            path: relPath,
            name: episodeName ? `${episodeName}/${entry.name}` : entry.name,
            size: stat.size,
            episode: episodeName,
          });
        }
      }
    } catch { /* permission errors, skip */ }
  }

  scanDir(seriesPath, undefined);
  files.sort((a, b) => a.name.localeCompare(b.name));
  return files;
}

export function readFileContent(filePath: string): { ok: true; data: { path: string; name: string; size: number; content: string } } | { ok: false; error: string; status?: number } {
  const { safe, resolved } = isSafePath(filePath);
  if (!safe) return { ok: false, error: "Invalid path", status: 403 };
  if (!existsSync(resolved)) return { ok: false, error: "File not found", status: 404 };

  const ext = filePath.slice(filePath.lastIndexOf("."));
  if (!SAFE_EXTENSIONS.has(ext)) return { ok: false, error: `File type not allowed: ${ext}`, status: 403 };

  try {
    const stat = statSync(resolved);
    if (stat.size > 200_000) return { ok: false, error: "File too large (max 200KB)", status: 413 };
    const content = readFileSync(resolved, "utf-8");
    return { ok: true, data: { path: filePath, name: basename(filePath), size: stat.size, content } };
  } catch (e: any) {
    return { ok: false, error: e.message, status: 500 };
  }
}
