/**
 * TTS agent tools — voice synthesis for Remotion episodes.
 *
 * Tools:
 *   tts_generate — Generate TTS audio files for an episode
 *   tts_voices   — Show voice configuration for a series/episode
 *   tts_status   — Check TTS audio status for an episode
 */

import { Type } from "@sinclair/typebox";
import type { AgentTool, AgentToolResult } from "@mariozechner/pi-agent-core";
import { resolve, basename, join } from "node:path";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { generateTTS } from "../../../bun_tts/src/tts-pipeline";

const REPO_ROOT = resolve(import.meta.dir, "../../../..");

// ─── Helpers ───

function textResult(text: string, details?: unknown): AgentToolResult<unknown> {
  return { content: [{ type: "text" as const, text }], details: details ?? {} };
}

function errorResult(msg: string): AgentToolResult<unknown> {
  return { content: [{ type: "text" as const, text: `Error: ${msg}` }], details: { error: msg } };
}

// ─── Schemas ───

const generateSchema = Type.Object({
  episodeDir: Type.String({ description: "Path to the episode directory (e.g. bun_remotion_proj/weapon-forger/weapon-forger-ch1-ep1)" }),
  engine: Type.Optional(Type.Union([Type.Literal("mlx"), Type.Literal("gemini")], { description: "TTS engine override (default: mlx on macOS, gemini otherwise)" })),
  scene: Type.Optional(Type.String({ description: "Only generate audio for this specific scene name" })),
  skipExisting: Type.Optional(Type.Boolean({ description: "Skip scenes that already have audio files" })),
});

const voicesSchema = Type.Object({
  path: Type.String({ description: "Path to series directory or episode directory to read voice config from" }),
});

const statusSchema = Type.Object({
  episodeDir: Type.String({ description: "Path to the episode directory" }),
});

// ─── Tools ───

export function createTtsGenerateTool(): AgentTool<typeof generateSchema> {
  return {
    name: "tts_generate",
    label: "Generate TTS Audio",
    description:
      "Generate TTS audio files for a Remotion episode. Reads dialog/narration from scripts/narration.ts and produces .wav files in public/audio/.",
    parameters: generateSchema,
    execute: async (params) => {
      const episodePath = resolve(params.episodeDir);
      if (!existsSync(episodePath)) {
        return errorResult(`Episode directory not found: ${episodePath}`);
      }

      const narrationPath = join(episodePath, "scripts", "narration.ts");
      if (!existsSync(narrationPath)) {
        return errorResult(`narration.ts not found at ${narrationPath}. Episode must have a narration script.`);
      }

      try {
        const result = await generateTTS({
          episodePath,
          repoRoot: REPO_ROOT,
          engine: params.engine,
          sceneFilter: params.scene,
          skipExisting: params.skipExisting,
          onProgress: () => {},
        });

        if (result.generated === 0 && result.skipped === 0) {
          return errorResult("TTS generated 0 audio files. No scenes matched.");
        }

        const lines = [
          `TTS generation complete for ${basename(episodePath)}`,
          `  Generated: ${result.generated}, Skipped: ${result.skipped}`,
          `  Audio dir: ${result.audioDir}`,
          `  Scenes:`,
        ];
        for (const s of result.scenes) {
          lines.push(`    ${s.scene}: ${s.segmentCount} segments, ${s.durationFrames} frames`);
        }

        return textResult(lines.join("\n"), result);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  };
}

export function createTtsVoicesTool(): AgentTool<typeof voicesSchema> {
  return {
    name: "tts_voices",
    label: "Show Voice Configuration",
    description:
      "Show voice configuration for a series or episode. Reads voice-config.json (centralized) or VOICE_MAP from narration.ts (per-episode).",
    parameters: voicesSchema,
    execute: async (params) => {
      const targetPath = resolve(params.path);
      if (!existsSync(targetPath)) {
        return errorResult(`Path not found: ${targetPath}`);
      }

      // Try centralized voice-config.json (series-level)
      const voiceConfigPath = findVoiceConfig(targetPath);
      if (voiceConfigPath) {
        try {
          const config = JSON.parse(readFileSync(voiceConfigPath, "utf-8"));
          const lines = [`Voice config: ${voiceConfigPath}`];
          lines.push(`  Language: ${config.language ?? "unknown"}`);
          lines.push(`  Default engine: ${config.defaultEngine ?? "unknown"}`);

          if (config.characters) {
            lines.push(`  Characters (${Object.keys(config.characters).length}):`);
            for (const [id, char] of Object.entries(config.characters as Record<string, any>)) {
              const voices = char.voices ? Object.entries(char.voices).map(([e, v]) => `${e}=${v}`).join(", ") : "none";
              lines.push(`    ${id}: ${char.name} (${char.gender}) — ${voices}`);
            }
          }

          return textResult(lines.join("\n"), { source: "voice-config.json", path: voiceConfigPath, config });
        } catch (err) {
          return errorResult(`Failed to parse voice-config.json: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      // Try per-episode VOICE_MAP from narration.ts
      const narrationPath = findNarration(targetPath);
      if (narrationPath) {
        try {
          const mod = await import(narrationPath);
          const { VOICE_MAP, VOICE_DESCRIPTION } = mod;
          if (!VOICE_MAP) {
            return errorResult("narration.ts found but no VOICE_MAP exported.");
          }

          const lines = [`Voice map from narration.ts: ${narrationPath}`];
          for (const [char, voice] of Object.entries(VOICE_MAP as Record<string, string>)) {
            const desc = VOICE_DESCRIPTION?.[char];
            const info = desc ? ` (${desc.gender}, ${desc.accent})` : "";
            lines.push(`  ${char} → ${voice}${info}`);
          }

          return textResult(lines.join("\n"), { source: "narration.ts", path: narrationPath, voiceMap: VOICE_MAP });
        } catch (err) {
          return errorResult(`Failed to import narration.ts: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      return errorResult(
        `No voice configuration found at ${targetPath}.\n` +
        `Expected: voice-config.json in assets/ or VOICE_MAP in scripts/narration.ts`
      );
    },
  };
}

export function createTtsStatusTool(): AgentTool<typeof statusSchema> {
  return {
    name: "tts_status",
    label: "Check TTS Status",
    description:
      "Check TTS audio status for an episode. Reports which scenes have audio, durations, and overall completeness.",
    parameters: statusSchema,
    execute: async (params) => {
      const episodePath = resolve(params.episodeDir);
      if (!existsSync(episodePath)) {
        return errorResult(`Episode directory not found: ${episodePath}`);
      }

      // Find audio directory (public/audio/ or audio/)
      const audioDirs = [join(episodePath, "public", "audio"), join(episodePath, "audio")];
      let audioDir = audioDirs.find((d) => existsSync(d));
      if (!audioDir) {
        return textResult(`No audio directory found for ${basename(episodePath)}.\nExpected: public/audio/ or audio/`, {
          hasAudio: false,
          episodePath,
        });
      }

      // Collect audio files
      const wavFiles: Array<{ name: string; size: number; modified: string }> = [];
      try {
        const entries = readdirSync(audioDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile() && entry.name.endsWith(".wav")) {
            const stat = statSync(join(audioDir, entry.name));
            wavFiles.push({
              name: entry.name,
              size: stat.size,
              modified: stat.mtime.toISOString().slice(0, 10),
            });
          }
        }
      } catch (err) {
        return errorResult(`Failed to read audio directory: ${err instanceof Error ? err.message : String(err)}`);
      }

      wavFiles.sort((a, b) => a.name.localeCompare(b.name));

      // Check metadata files
      const durationsPath = join(audioDir, "durations.json");
      const segmentDurationsPath = join(audioDir, "segment-durations.json");
      const manifestPath = join(audioDir, "voice-manifest.json");

      let durations: number[] | null = null;
      if (existsSync(durationsPath)) {
        try {
          durations = JSON.parse(readFileSync(durationsPath, "utf-8"));
        } catch { /* ignore */ }
      }

      const lines = [`TTS status for ${basename(episodePath)}`];
      lines.push(`  Audio dir: ${audioDir}`);
      lines.push(`  WAV files: ${wavFiles.length}`);
      lines.push(`  durations.json: ${existsSync(durationsPath) ? "yes" : "missing"}`);
      lines.push(`  segment-durations.json: ${existsSync(segmentDurationsPath) ? "yes" : "missing"}`);
      lines.push(`  voice-manifest.json: ${existsSync(manifestPath) ? "yes" : "missing"}`);

      if (wavFiles.length > 0) {
        const totalSize = wavFiles.reduce((sum, f) => sum + f.size, 0);
        lines.push(`  Total size: ${(totalSize / 1024 / 1024).toFixed(1)} MB`);

        lines.push(`\n  Audio files:`);
        for (const f of wavFiles) {
          const sizeKb = (f.size / 1024).toFixed(0);
          lines.push(`    ${f.name} (${sizeKb} KB, ${f.modified})`);
        }
      }

      if (durations) {
        const totalFrames = durations.reduce((a, b) => a + b, 0);
        const totalSeconds = (totalFrames / 30).toFixed(1);
        lines.push(`\n  Total duration: ${totalFrames} frames (${totalSeconds}s at 30fps)`);
      }

      const complete = wavFiles.length > 0 && existsSync(durationsPath);

      return textResult(lines.join("\n"), {
        hasAudio: true,
        complete,
        wavFiles: wavFiles.length,
        hasDurations: existsSync(durationsPath),
        hasSegmentDurations: existsSync(segmentDurationsPath),
        hasManifest: existsSync(manifestPath),
      });
    },
  };
}

// ─── Helpers ───

/** Walk up from targetPath looking for assets/voice-config.json */
function findVoiceConfig(targetPath: string): string | null {
  let dir = targetPath;
  for (let i = 0; i < 4; i++) {
    const candidate = join(dir, "assets", "voice-config.json");
    if (existsSync(candidate)) return candidate;
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/** Find narration.ts from targetPath (episode dir or series dir) */
function findNarration(targetPath: string): string | null {
  // Direct: episode/scripts/narration.ts
  const direct = join(targetPath, "scripts", "narration.ts");
  if (existsSync(direct)) return direct;

  // Scan subdirectories for episode dirs with narration.ts
  const skipDirs = new Set(["shared", "assets", "out", "storygraph_out", "fixture", "node_modules", ".git", "public", "scripts"]);
  try {
    const entries = readdirSync(targetPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || skipDirs.has(entry.name) || entry.name.startsWith(".")) continue;
      const narrationPath = join(targetPath, entry.name, "scripts", "narration.ts");
      if (existsSync(narrationPath)) return narrationPath;
    }
  } catch { /* ignore */ }

  return null;
}

/** Create all TTS tools. */
export function createTtsTools(): AgentTool<any>[] {
  return [createTtsGenerateTool(), createTtsVoicesTool(), createTtsStatusTool()];
}
