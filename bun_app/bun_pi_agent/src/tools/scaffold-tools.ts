/**
 * Scaffold agent tools — wrap episodeforge for episode scaffolding.
 *
 * Tools:
 *   sc_scaffold     — Scaffold a new episode (wraps episodeforge scaffold())
 *   sc_series_list  — List available series from the registry
 *   sc_episode_list — Scan a series directory for existing episodes
 */

import { Type } from "@sinclair/typebox";
import type { AgentTool, AgentToolResult } from "@mariozechner/pi-agent-core";
import { resolve, basename } from "node:path";
import { existsSync, readdirSync, statSync } from "node:fs";
import { scaffold } from "../../../episodeforge/src/scaffold";
import { SERIES_REGISTRY } from "../../../episodeforge/src/series-config";

// ─── Helpers ───

function textResult(text: string, details?: unknown): AgentToolResult<unknown> {
  return { content: [{ type: "text" as const, text }], details: details ?? {} };
}

function errorResult(msg: string): AgentToolResult<unknown> {
  return { content: [{ type: "text" as const, text: `Error: ${msg}` }], details: { error: msg } };
}

// ─── Tool Schemas ───

const scaffoldSchema = Type.Object({
  series: Type.String({ description: "Series ID (e.g. weapon-forger, my-core-is-boss)" }),
  chapter: Type.Optional(Type.Number({ description: "Chapter number (required for chapter-based series)" })),
  episode: Type.Optional(Type.Number({ description: "Episode number (required for episode-based series)" })),
  category: Type.Optional(Type.String({ description: "Video category override (e.g. narrative_drama, tech_explainer)" })),
  scenes: Type.Optional(Type.Number({ description: "Number of content scenes (overrides series default)" })),
  dryRun: Type.Optional(Type.Boolean({ description: "Preview scaffold without writing files" })),
});

const episodeListSchema = Type.Object({
  seriesDir: Type.String({ description: "Path to the Remotion series directory (e.g. bun_remotion_proj/my-core-is-boss)" }),
});

// ─── Tools ───

export function createScaffoldTool(): AgentTool<typeof scaffoldSchema> {
  return {
    name: "sc_scaffold",
    label: "Scaffold Episode",
    description: "Scaffold a new Remotion episode. Generates all files (scenes, Root.tsx, package.json, narration.ts, etc.) using episodeforge.",
    parameters: scaffoldSchema,
    execute: async (params) => {
      try {
        const result = await scaffold({
          series: params.series,
          chapter: params.chapter,
          episode: params.episode,
          category: params.category as any,
          scenes: params.scenes,
          dryRun: params.dryRun,
        });

        if (!result.success) {
          return errorResult(`Scaffold failed: ${result.errors.join("; ")}`);
        }

        const lines = [
          `Scaffolded ${result.filesWritten} files for ${params.series}`,
          `  Directory: ${result.naming.episodeDir}`,
          `  Package: ${result.naming.packageName}`,
          `  Composition: ${result.naming.compositionId}`,
          `  Scenes: ${result.naming.numScenes} (${result.naming.numTransitions} transitions)`,
          `  Type: ${result.naming.isStandalone ? "standalone" : "episode-based"}`,
        ];
        if (result.errors.length > 0) {
          lines.push(`  Warnings: ${result.errors.join(", ")}`);
        }

        return textResult(lines.join("\n"), result);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  };
}

export function createSeriesListTool(): AgentTool<typeof episodeListSchema> {
  return {
    name: "sc_series_list",
    label: "List Series",
    description: "List all available series from the episodeforge registry with their configuration.",
    parameters: Type.Object({}),
    execute: async () => {
      const entries = Object.values(SERIES_REGISTRY);
      const lines = entries.map((s) => {
        const cat = s.category ?? "narrative_drama";
        const ch = s.chapterBased ? "chapter-based" : "episode-based";
        const standalone = s.standalone ? " (standalone)" : "";
        return `  ${s.id}: ${s.displayName} [${cat}, ${ch}${standalone}, ${s.defaultContentScenes} scenes]`;
      });

      return textResult(`Available series (${entries.length}):\n${lines.join("\n")}`, {
        series: entries.map((s) => ({
          id: s.id,
          displayName: s.displayName,
          category: s.category ?? "narrative_drama",
          chapterBased: s.chapterBased,
          standalone: s.standalone ?? false,
          defaultContentScenes: s.defaultContentScenes,
        })),
      });
    },
  };
}

export function createEpisodeListTool(): AgentTool<typeof episodeListSchema> {
  return {
    name: "sc_episode_list",
    label: "List Episodes",
    description: "Scan a series directory for existing episode directories.",
    parameters: episodeListSchema,
    execute: async (params) => {
      const seriesDir = resolve(params.seriesDir);
      if (!existsSync(seriesDir)) {
        return errorResult(`Series directory not found: ${seriesDir}`);
      }

      const skipDirs = new Set(["shared", "assets", "out", "storygraph_out", "fixture", "node_modules", ".git"]);
      const episodes: Array<{ name: string; path: string; hasPlan: boolean }> = [];

      try {
        const entries = readdirSync(seriesDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory() || skipDirs.has(entry.name) || entry.name.startsWith(".")) continue;
          const epPath = resolve(seriesDir, entry.name);
          const hasPlan = existsSync(resolve(epPath, "PLAN.md"));
          episodes.push({ name: entry.name, path: epPath, hasPlan });
        }
      } catch (err) {
        return errorResult(`Failed to scan directory: ${err instanceof Error ? err.message : String(err)}`);
      }

      episodes.sort((a, b) => a.name.localeCompare(b.name));

      if (episodes.length === 0) {
        return textResult(`No episodes found in ${seriesDir}`, { episodes: [], seriesDir });
      }

      const lines = episodes.map((ep) =>
        `  ${ep.name} ${ep.hasPlan ? "[has PLAN.md]" : "[no PLAN.md]"}`
      );

      return textResult(`Episodes in ${basename(seriesDir)} (${episodes.length}):\n${lines.join("\n")}`, {
        episodes,
        seriesDir,
      });
    },
  };
}

/** Create all scaffold tools. */
export function createScaffoldTools(): AgentTool<any>[] {
  return [
    createScaffoldTool(),
    createSeriesListTool(),
    createEpisodeListTool(),
  ];
}
