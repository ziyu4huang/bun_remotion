/**
 * Image agent tools — character/background image generation for Remotion series.
 *
 * Tools:
 *   image_generate    — Batch generate images using bun_image
 *   image_status      — Check image asset status for a series
 *   image_characters  — List character profiles with appearance data and existing variants
 */

import { Type } from "@sinclair/typebox";
import type { AgentTool, AgentToolResult } from "@mariozechner/pi-agent-core";
import { resolve, join, basename } from "node:path";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { generateImageBatch, buildCharacterPrompt, buildBackgroundPrompt } from "bun_image";

const REPO_ROOT = resolve(import.meta.dir, "../../../..");
const PROJ_DIR = resolve(REPO_ROOT, "bun_remotion_proj");

// ─── Helpers ───

function textResult(text: string, details?: unknown): AgentToolResult<unknown> {
  return { content: [{ type: "text" as const, text }], details: details ?? {} };
}

function errorResult(msg: string): AgentToolResult<unknown> {
  return { content: [{ type: "text" as const, text: `Error: ${msg}` }], details: { error: msg } };
}

function findSeriesDir(seriesId: string): string | null {
  const direct = resolve(PROJ_DIR, seriesId);
  if (existsSync(direct)) return direct;
  return null;
}

// ─── Schemas ───

const generateSchema = Type.Object({
  seriesId: Type.String({ description: "Series ID (e.g. weapon-forger, my-core-is-boss)" }),
  images: Type.Array(Type.Object({
    filename: Type.String({ description: "Output filename (e.g. lin-chen-normal.png)" }),
    prompt: Type.String({ description: "Image generation prompt" }),
    aspectRatio: Type.Optional(Type.Union([
      Type.Literal("1:1"), Type.Literal("16:9"), Type.Literal("9:16"), Type.Literal("4:3"),
    ], { description: "Aspect ratio (default: 1:1 for characters, 16:9 for backgrounds)" })),
    resolution: Type.Optional(Type.Union([Type.Literal("1K"), Type.Literal("2K")], { description: "Resolution (default: 1K)" })),
  }), { description: "Array of images to generate" }),
  outputDir: Type.Optional(Type.String({ description: "Override output directory (default: assets/characters or assets/backgrounds)" })),
  skipExisting: Type.Optional(Type.Boolean({ description: "Skip images that already exist (default: true)" })),
  facing: Type.Optional(Type.Union([Type.Literal("LEFT"), Type.Literal("RIGHT")], { description: "Character facing direction for prompt enhancement" })),
});

const statusSchema = Type.Object({
  seriesId: Type.String({ description: "Series ID" }),
});

const charactersSchema = Type.Object({
  seriesId: Type.String({ description: "Series ID" }),
});

// ─── Tools ───

export function createImageGenerateTool(): AgentTool<typeof generateSchema> {
  return {
    name: "image_generate",
    label: "Generate Images",
    description:
      "Batch generate character/background images for a Remotion series using bun_image (z.ai). " +
      "Supports prompt enhancement for character facing direction. Output goes to assets/characters or assets/backgrounds.",
    parameters: generateSchema,
    execute: async (params) => {
      const seriesDir = findSeriesDir(params.seriesId);
      if (!seriesDir) {
        return errorResult(`Series not found: ${params.seriesId}. Searched in ${PROJ_DIR}`);
      }

      if (!params.images.length) {
        return errorResult("images array is empty — nothing to generate.");
      }

      // Enhance prompts for character images if facing specified
      const images = params.facing
        ? params.images.map((img) => ({
            ...img,
            prompt: buildCharacterPrompt(img.prompt, { facing: params.facing! }),
          }))
        : params.images;

      // Determine output directory
      const outputDir = params.outputDir
        ? resolve(params.outputDir)
        : resolve(seriesDir, "assets", "characters");

      try {
        const result = await generateImageBatch({
          images,
          outputDir,
          skipExisting: params.skipExisting ?? true,
          browserConfig: {
            headed: true,
            mode: "cdp",
            channel: "chrome",
          },
          onProgress: () => {},
        });

        const lines = [
          `Image generation complete for ${params.seriesId}`,
          `  Generated: ${result.generated}, Skipped: ${result.skipped}, Failed: ${result.failed}`,
          `  Output dir: ${outputDir}`,
        ];

        if (result.results.length > 0) {
          lines.push(`  Results:`);
          for (const r of result.results) {
            const path = r.localPath ? basename(r.localPath) : "no local file";
            lines.push(`    ${path} — ${r.prompt.slice(0, 60)}...`);
          }
        }

        if (result.failed > 0) {
          lines.push(`  WARNING: ${result.failed} image(s) failed to generate.`);
        }

        return textResult(lines.join("\n"), result);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  };
}

export function createImageStatusTool(): AgentTool<typeof statusSchema> {
  return {
    name: "image_status",
    label: "Check Image Status",
    description:
      "Check image asset status for a series. Reports character image count, background image count, " +
      "and lists files in assets/characters and assets/backgrounds directories.",
    parameters: statusSchema,
    execute: async (params) => {
      const seriesDir = findSeriesDir(params.seriesId);
      if (!seriesDir) {
        return errorResult(`Series not found: ${params.seriesId}`);
      }

      const charDir = resolve(seriesDir, "assets", "characters");
      const bgDir = resolve(seriesDir, "assets", "backgrounds");

      const charFiles = listImageFiles(charDir);
      const bgFiles = listImageFiles(bgDir);

      const lines = [`Image status for ${params.seriesId}`];
      lines.push(`  Characters: ${charFiles.length} files (${charDir})`);
      lines.push(`  Backgrounds: ${bgFiles.length} files (${bgDir})`);

      if (charFiles.length > 0) {
        lines.push(`\n  Character files:`);
        for (const f of charFiles.slice(0, 20)) {
          const sizeKb = (f.size / 1024).toFixed(0);
          lines.push(`    ${f.name} (${sizeKb} KB, ${f.modified})`);
        }
        if (charFiles.length > 20) {
          lines.push(`    ... and ${charFiles.length - 20} more`);
        }
      }

      if (bgFiles.length > 0) {
        lines.push(`\n  Background files:`);
        for (const f of bgFiles.slice(0, 20)) {
          const sizeKb = (f.size / 1024).toFixed(0);
          lines.push(`    ${f.name} (${sizeKb} KB, ${f.modified})`);
        }
        if (bgFiles.length > 20) {
          lines.push(`    ... and ${bgFiles.length - 20} more`);
        }
      }

      // Check for manifest metadata files
      const manifestFiles = charFiles.filter((f) => f.name.endsWith(".json"));
      const pngFiles = charFiles.filter((f) => f.name.endsWith(".png") || f.name.endsWith(".jpg"));
      const unpaired = pngFiles.filter(
        (png) => !manifestFiles.some((m) => m.name.replace(/\.json$/, ".png") === png.name || m.name.replace(/\.json$/, ".jpg") === png.name),
      );

      if (unpaired.length > 0) {
        lines.push(`\n  WARNING: ${unpaired.length} image(s) without manifest metadata:`);
        for (const f of unpaired.slice(0, 10)) {
          lines.push(`    ${f.name}`);
        }
      }

      return textResult(lines.join("\n"), {
        characterCount: charFiles.length,
        backgroundCount: bgFiles.length,
        manifestCount: manifestFiles.length,
        unpairedCount: unpaired.length,
      });
    },
  };
}

export function createImageCharactersTool(): AgentTool<typeof charactersSchema> {
  return {
    name: "image_characters",
    label: "List Character Profiles",
    description:
      "List character profiles for a series with appearance data, existing image variants, and base prompts. " +
      "Reads from characters.md (appearance), characters.ts (colors/voices), and asset manifests (images).",
    parameters: charactersSchema,
    execute: async (params) => {
      const seriesDir = findSeriesDir(params.seriesId);
      if (!seriesDir) {
        return errorResult(`Series not found: ${params.seriesId}`);
      }

      const profiles = buildCharacterProfiles(seriesDir);
      if (profiles.length === 0) {
        return textResult(`No character profiles found for ${params.seriesId}.`, { characters: [] });
      }

      const lines = [`Character profiles for ${params.seriesId} (${profiles.length} characters)`];

      for (const char of profiles) {
        lines.push(`\n  ${char.name} (${char.id})`);
        if (char.appearance) lines.push(`    Appearance: ${char.appearance}`);
        if (char.color) lines.push(`    Color: ${char.color}`);
        if (char.voice) lines.push(`    Voice: ${char.voice}`);
        if (char.emotions.length > 0) lines.push(`    Emotions: ${char.emotions.join(", ")}`);
        if (char.variants.length > 0) {
          lines.push(`    Image variants (${char.variants.length}):`);
          for (const v of char.variants) {
            lines.push(`      ${v.type}${v.emotion ? `/${v.emotion}` : ""} — ${v.facing} — ${v.file}`);
          }
        } else {
          lines.push(`    Image variants: none generated`);
        }
        if (char.basePrompt) {
          lines.push(`    Base prompt: ${char.basePrompt.slice(0, 80)}...`);
        }
      }

      return textResult(lines.join("\n"), { characters: profiles });
    },
  };
}

// ─── Internal Helpers ───

interface ImageFileInfo {
  name: string;
  size: number;
  modified: string;
}

function listImageFiles(dir: string): ImageFileInfo[] {
  if (!existsSync(dir)) return [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    const files: ImageFileInfo[] = [];
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!entry.name.match(/\.(png|jpg|jpeg|json)$/i)) continue;
      const stat = statSync(join(dir, entry.name));
      files.push({ name: entry.name, size: stat.size, modified: stat.mtime.toISOString().slice(0, 10) });
    }
    return files.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

interface CharacterProfileResult {
  id: string;
  name: string;
  color: string;
  voice: string;
  appearance: string | null;
  basePrompt: string | null;
  emotions: string[];
  variants: Array<{ type: string; emotion: string | null; facing: string; file: string; prompt: string }>;
}

function buildCharacterProfiles(seriesDir: string): CharacterProfileResult[] {
  // Parse characters.ts for basic info
  const tsMap = parseCharactersTs(resolve(seriesDir, "assets", "characters.ts"));

  // Parse characters.md for appearance data
  const mdMap = parseCharactersMd(resolve(seriesDir, "assets", "story", "characters.md"));

  // Scan manifest files for image variants
  const manifestMap = scanManifests(resolve(seriesDir, "assets", "characters"));

  const allIds = new Set([...tsMap.keys(), ...mdMap.keys(), ...manifestMap.keys()]);
  const profiles: CharacterProfileResult[] = [];

  for (const id of allIds) {
    if (id === "narrator") continue;
    const ts = tsMap.get(id);
    const md = mdMap.get(id);
    const variants = manifestMap.get(id) ?? [];

    const normalVariant = variants.find((v) => v.type === "normal" || v.type === "emotion");
    const defaultVariant = normalVariant?.emotion === "default" ? normalVariant : normalVariant;

    profiles.push({
      id,
      name: ts?.name ?? md?.name ?? id,
      color: ts?.color ?? "",
      voice: ts?.voice ?? "",
      appearance: md?.appearance ?? null,
      basePrompt: defaultVariant?.prompt ?? null,
      emotions: ts?.emotions ?? [],
      variants: variants.map((v) => ({
        type: v.type,
        emotion: v.emotion ?? null,
        facing: v.facing,
        file: v.file,
        prompt: v.prompt,
      })),
    });
  }

  return profiles.sort((a, b) => a.id.localeCompare(b.id));
}

// Minimal parsers (duplicated from character-profiles.ts to avoid importing server code in agent tools)

interface TsCharData { name: string; color: string; voice: string; emotions: string[] }

function parseCharactersTs(path: string): Map<string, TsCharData> {
  const map = new Map<string, TsCharData>();
  if (!existsSync(path)) return map;
  const text = readFileSync(path, "utf-8");

  const charBlockMatch = text.match(/CHARACTERS\s*:\s*Record<[^>]+>\s*=\s*\{([\s\S]*?)\n\};/);
  if (!charBlockMatch) return map;

  const block = charBlockMatch[1];
  const entryRegex = /(\w+)\s*:\s*\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = entryRegex.exec(block)) !== null) {
    const id = m[1];
    const body = m[2];
    const str = (field: string) => {
      const fm = body.match(new RegExp(`${field}\\s*:\\s*"([^"]*)"`));
      return fm?.[1] ?? "";
    };
    map.set(id, { name: str("name"), color: str("color"), voice: str("voice"), emotions: [] });
  }

  const posesMatch = text.match(/CHARACTER_POSES\s*:\s*Partial<Record<[^>]+>>\s*=\s*\{([\s\S]*?)\n\};/);
  if (posesMatch) {
    const poseBlock = posesMatch[1];
    const poseEntry = /(\w+)\s*:\s*\[([^\]]*)\]/g;
    let pm: RegExpExecArray | null;
    while ((pm = poseEntry.exec(poseBlock)) !== null) {
      const id = pm[1];
      const poses = pm[2].match(/"([^"]+)"/g)?.map((s) => s.replace(/"/g, "")) ?? [];
      const existing = map.get(id);
      if (existing) existing.emotions = poses;
    }
  }

  return map;
}

interface MdCharData { name: string; appearance: string | null }

function parseCharactersMd(path: string): Map<string, MdCharData> {
  const map = new Map<string, MdCharData>();
  if (!existsSync(path)) return map;

  const text = readFileSync(path, "utf-8");
  const sections = text.split(/^### /m).slice(1);

  for (const section of sections) {
    const headerLine = section.split("\n")[0] ?? "";
    const idMatch = headerLine.match(/\(([^)]+)\)/);
    if (!idMatch) continue;
    const id = idMatch[1].toLowerCase();
    const name = headerLine.split("(")[0].trim();

    let appearance: string | null = null;
    for (const line of section.split("\n")) {
      const appearanceMatch = line.match(/\*?\*?外型[：:]\*?\*?\s*(.+)/);
      if (appearanceMatch) {
        appearance = appearanceMatch[1].replace(/\*\*/g, "").trim();
        break;
      }
    }

    map.set(id, { name, appearance });
  }
  return map;
}

interface ManifestVariant { type: string; character: string; facing: string; file: string; prompt: string; emotion?: string }

function scanManifests(dir: string): Map<string, ManifestVariant[]> {
  const map = new Map<string, ManifestVariant[]>();
  if (!existsSync(dir)) return map;

  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".json")) continue;
    try {
      const raw = JSON.parse(readFileSync(resolve(dir, f), "utf-8"));
      if (!raw.character || !raw.prompt) continue;
      const variant: ManifestVariant = {
        type: raw.type ?? "normal",
        character: raw.character,
        facing: raw.facing ?? "LEFT",
        file: raw.file ?? f.replace(/\.json$/, ".png"),
        prompt: raw.prompt,
        emotion: raw.emotion,
      };
      const arr = map.get(raw.character) ?? [];
      arr.push(variant);
      map.set(raw.character, arr);
    } catch { /* skip malformed */ }
  }
  return map;
}

/** Create all image tools. */
export function createImageTools(): AgentTool<any>[] {
  return [createImageGenerateTool(), createImageStatusTool(), createImageCharactersTool()];
}
