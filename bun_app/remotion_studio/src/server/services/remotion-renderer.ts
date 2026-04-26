import { resolve } from "node:path";
import { existsSync, statSync } from "node:fs";
import { spawn } from "node:child_process";
import type { RenderStatus } from "../../shared/types";

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");
const PROJ_DIR = resolve(REPO_ROOT, "bun_remotion_proj");

export function deriveCompositionId(episodeDirName: string): string {
  // weapon-forger-ch1-ep1 → WeaponForgerCh1Ep1
  return episodeDirName
    .split("-")
    .map((part) => {
      // ch1 → Ch1, ep1 → Ep1, numbers stay
      if (part.match(/^(ch|ep)\d+$/i)) {
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase().slice(0, 1) + part.slice(2);
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

export function findEpisodePath(episodeId: string): string | null {
  // Try direct path first: PROJ_DIR/episodeId
  const direct = resolve(PROJ_DIR, episodeId);
  if (existsSync(direct) && existsSync(resolve(direct, "src/Root.tsx"))) return direct;

  // Try nested: episodeId might be like "weapon-forger-ch1-ep1" without series prefix
  // Scan series dirs for it
  try {
    const entries = require("fs").readdirSync(PROJ_DIR);
    for (const entry of entries) {
      const candidate = resolve(PROJ_DIR, entry, episodeId);
      if (existsSync(candidate) && existsSync(resolve(candidate, "src/Root.tsx"))) return candidate;
    }
  } catch { /* ignore */ }

  return null;
}

export function getRenderStatus(episodeId: string): RenderStatus {
  const episodePath = findEpisodePath(episodeId);
  if (!episodePath) {
    return { episodeId, hasRender: false };
  }

  const dirName = episodePath.split("/").pop()!;
  const outputPath = resolve(episodePath, "out", `${dirName}.mp4`);

  if (!existsSync(outputPath)) {
    // Also check repo-root out/ dir
    const altOutput = resolve(REPO_ROOT, "out", `${dirName}.mp4`);
    if (existsSync(altOutput)) {
      const stat = statSync(altOutput);
      return {
        episodeId,
        hasRender: true,
        outputPath: altOutput,
        fileSize: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      };
    }
    return { episodeId, hasRender: false };
  }

  const stat = statSync(outputPath);
  return {
    episodeId,
    hasRender: true,
    outputPath,
    fileSize: stat.size,
    modifiedAt: stat.mtime.toISOString(),
  };
}

export interface RenderOptions {
  episodeId: string;
  onProgress?: (msg: string) => void;
}

export function renderVideo(options: RenderOptions): Promise<{ outputPath: string; durationMs: number }> {
  const episodePath = findEpisodePath(options.episodeId);
  if (!episodePath) throw new Error(`Episode not found: ${options.episodeId}`);

  const dirName = episodePath.split("/").pop()!;
  const compId = deriveCompositionId(dirName);
  const outputPath = resolve(episodePath, "out", `${dirName}.mp4`);
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      REMOTION_CHROME_EXECUTABLE_PATH: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    };

    const proc = spawn("bun", ["run", "build"], { cwd: episodePath, env, timeout: 600_000 });

    proc.stdout?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) options.onProgress?.(msg);
    });

    proc.stderr?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg && !msg.includes("Downloading")) options.onProgress?.(msg);
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ outputPath, durationMs: Date.now() - start });
      } else {
        reject(new Error(`Render failed with exit code ${code}`));
      }
    });

    proc.on("error", (err) => reject(err));
  });
}
