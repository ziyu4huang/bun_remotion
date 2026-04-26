/**
 * Render agent tools - episode rendering for Remotion videos.
 *
 * Tools:
 *   render_episode - Render an episode to MP4 via `bun run build`
 *   render_status  - Check render output status for an episode
 *   render_list    - List episodes in a series with their render status
 */

import { Type } from "@sinclair/typebox";
import type { AgentTool, AgentToolResult } from "@mariozechner/pi-agent-core";
import { resolve, basename, join } from "node:path";
import { existsSync, statSync, readdirSync } from "node:fs";
import { spawn } from "node:child_process";

const REPO_ROOT = resolve(import.meta.dir, "../../../..");
const PROJ_DIR = resolve(REPO_ROOT, "bun_remotion_proj");

// --- Helpers ---

function textResult(text: string, details?: unknown): AgentToolResult<unknown> {
  return { content: [{ type: "text" as const, text }], details: details ?? {} };
}

function errorResult(msg: string): AgentToolResult<unknown> {
  return { content: [{ type: "text" as const, text: "Error: " + msg }], details: { error: msg } };
}

function deriveCompositionId(episodeDirName: string): string {
  return episodeDirName
    .split("-")
    .map((part) => {
      if (part.match(/^(ch|ep)\d+$/i)) {
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase().slice(0, 1) + part.slice(2);
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

function findEpisodePath(episodeId: string): string | null {
  const direct = resolve(PROJ_DIR, episodeId);
  if (existsSync(direct) && existsSync(resolve(direct, "src/Root.tsx"))) return direct;

  try {
    const entries = readdirSync(PROJ_DIR);
    for (const entry of entries) {
      const candidate = resolve(PROJ_DIR, entry, episodeId);
      if (existsSync(candidate) && existsSync(resolve(candidate, "src/Root.tsx"))) return candidate;
    }
  } catch { /* ignore */ }

  return null;
}

// --- Schemas ---

const episodeSchema = Type.Object({
  episodeId: Type.String({ description: "Episode ID or directory name (e.g. weapon-forger-ch1-ep1)" }),
  timeout: Type.Optional(Type.Number({ description: "Render timeout in seconds (default: 600)" })),
});

const statusSchema = Type.Object({
  episodeId: Type.String({ description: "Episode ID or directory name" }),
});

const listSchema = Type.Object({
  seriesId: Type.String({ description: "Series ID (e.g. weapon-forger, my-core-is-boss)" }),
});

// --- Tools ---

export function createRenderEpisodeTool(): AgentTool<typeof episodeSchema> {
  return {
    name: "render_episode",
    label: "Render Episode",
    description:
      "Render a Remotion episode to MP4. Runs `bun run build` in the episode directory. Output: 1920x1080 at 30fps.",
    parameters: episodeSchema,
    execute: async (params) => {
      const episodePath = findEpisodePath(params.episodeId);
      if (!episodePath) {
        return errorResult("Episode not found: " + params.episodeId + ". Searched in " + PROJ_DIR);
      }

      const dirName = basename(episodePath);
      const outputPath = resolve(episodePath, "out", dirName + ".mp4");
      const timeoutMs = (params.timeout ?? 600) * 1000;
      const start = Date.now();

      try {
        const result = await new Promise<{ exitCode: number; stdout: string; stderr: string }>((ok, fail) => {
          const env = {
            ...process.env,
            REMOTION_CHROME_EXECUTABLE_PATH: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          };

          const proc = spawn("bun", ["run", "build"], { cwd: episodePath, env, timeout: timeoutMs });
          let stdout = "";
          let stderr = "";

          proc.stdout?.on("data", (data: Buffer) => { stdout += data.toString(); });
          proc.stderr?.on("data", (data: Buffer) => { stderr += data.toString(); });
          proc.on("close", (code) => ok({ exitCode: code ?? 1, stdout, stderr }));
          proc.on("error", (err) => fail(err));
        });

        const durationSec = ((Date.now() - start) / 1000).toFixed(1);

        if (result.exitCode !== 0) {
          return errorResult(
            "Render failed (exit code " + result.exitCode + ") after " + durationSec + "s.\n" +
            "stderr: " + result.stderr.slice(-500)
          );
        }

        const outputExists = existsSync(outputPath);
        const fileSize = outputExists ? statSync(outputPath).size : 0;
        const sizeMb = (fileSize / 1024 / 1024).toFixed(1);

        const lines = [
          "Render complete for " + dirName,
          "  Duration: " + durationSec + "s",
          "  Output: " + outputPath,
          "  Size: " + sizeMb + " MB",
          "  Status: " + (outputExists ? "OK" : "WARNING: output file not found"),
        ];

        return textResult(lines.join("\n"), {
          outputPath,
          durationMs: Date.now() - start,
          fileSize,
          exitCode: result.exitCode,
        });
      } catch (err) {
        return errorResult("Render error: " + (err instanceof Error ? err.message : String(err)));
      }
    },
  };
}

export function createRenderStatusTool(): AgentTool<typeof statusSchema> {
  return {
    name: "render_status",
    label: "Check Render Status",
    description:
      "Check render output status for a Remotion episode. Reports output path, file size, modification date, and whether render is up to date.",
    parameters: statusSchema,
    execute: async (params) => {
      const episodePath = findEpisodePath(params.episodeId);
      if (!episodePath) {
        return errorResult("Episode not found: " + params.episodeId);
      }

      const dirName = basename(episodePath);
      const outputLocations = [
        resolve(episodePath, "out", dirName + ".mp4"),
        resolve(REPO_ROOT, "out", dirName + ".mp4"),
      ];

      for (const outputPath of outputLocations) {
        if (existsSync(outputPath)) {
          const stat = statSync(outputPath);
          const sizeMb = (stat.size / 1024 / 1024).toFixed(1);
          const modified = stat.mtime.toISOString().slice(0, 19);

          const rootTsx = resolve(episodePath, "src/Root.tsx");
          let sourceNewer = false;
          if (existsSync(rootTsx)) {
            sourceNewer = statSync(rootTsx).mtime > stat.mtime;
          }

          const lines = [
            "Render status for " + dirName,
            "  Output: " + outputPath,
            "  Size: " + sizeMb + " MB",
            "  Modified: " + modified,
            "  Source newer: " + (sourceNewer ? "YES: render may be stale" : "no"),
          ];

          return textResult(lines.join("\n"), {
            hasRender: true,
            outputPath,
            fileSize: stat.size,
            modifiedAt: stat.mtime.toISOString(),
            sourceNewer,
          });
        }
      }

      return textResult("No render output found for " + dirName + ".\nExpected: out/" + dirName + ".mp4", {
        hasRender: false,
        episodeId: params.episodeId,
      });
    },
  };
}

export function createRenderListTool(): AgentTool<typeof listSchema> {
  return {
    name: "render_list",
    label: "List Episode Renders",
    description:
      "List episodes in a series with their render status. Shows which episodes have been rendered, output sizes, and staleness.",
    parameters: listSchema,
    execute: async (params) => {
      const seriesDir = resolve(PROJ_DIR, params.seriesId);
      if (!existsSync(seriesDir)) {
        return errorResult("Series directory not found: " + seriesDir);
      }

      const episodes: Array<{ id: string; hasRender: boolean; sizeMb?: string; modified?: string; stale?: boolean }> = [];

      try {
        const entries = readdirSync(seriesDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
          if (["shared", "assets", "fixture", "node_modules", "out", "storygraph_out", "public", "scripts"].includes(entry.name)) continue;

          const epPath = resolve(seriesDir, entry.name);
          if (!existsSync(resolve(epPath, "src/Root.tsx"))) continue;

          const outputPath = resolve(epPath, "out", entry.name + ".mp4");
          const altOutput = resolve(REPO_ROOT, "out", entry.name + ".mp4");

          const mp4Path = existsSync(outputPath) ? outputPath : existsSync(altOutput) ? altOutput : null;

          if (mp4Path) {
            const stat = statSync(mp4Path);
            const rootTsx = resolve(epPath, "src/Root.tsx");
            const stale = existsSync(rootTsx) && statSync(rootTsx).mtime > stat.mtime;

            episodes.push({
              id: entry.name,
              hasRender: true,
              sizeMb: (stat.size / 1024 / 1024).toFixed(1),
              modified: stat.mtime.toISOString().slice(0, 10),
              stale,
            });
          } else {
            episodes.push({ id: entry.name, hasRender: false });
          }
        }
      } catch (err) {
        return errorResult("Failed to scan series: " + (err instanceof Error ? err.message : String(err)));
      }

      if (episodes.length === 0) {
        return textResult("No episodes found in " + params.seriesId, { episodes: [] });
      }

      const rendered = episodes.filter((e) => e.hasRender);
      const stale = episodes.filter((e) => e.stale);
      const notRendered = episodes.filter((e) => !e.hasRender);

      const lines = ["Render status for " + params.seriesId + " (" + episodes.length + " episodes)"];
      lines.push("  Rendered: " + rendered.length + ", Not rendered: " + notRendered.length + ", Stale: " + stale.length);
      lines.push("");

      for (const ep of episodes) {
        if (ep.hasRender) {
          const staleTag = ep.stale ? " [STALE]" : "";
          lines.push("  OK " + ep.id + " - " + ep.sizeMb + " MB, " + ep.modified + staleTag);
        } else {
          lines.push("  X  " + ep.id + " - not rendered");
        }
      }

      return textResult(lines.join("\n"), {
        total: episodes.length,
        rendered: rendered.length,
        notRendered: notRendered.length,
        stale: stale.length,
        episodes,
      });
    },
  };
}

/** Create all render tools. */
export function createRenderTools(): AgentTool<any>[] {
  return [createRenderEpisodeTool(), createRenderStatusTool(), createRenderListTool()];
}
