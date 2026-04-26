import { Type } from "@sinclair/typebox";
import type { AgentTool, AgentToolResult } from "@mariozechner/pi-agent-core";
import { resolve, basename } from "node:path";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { detectCategoryFromDirname, type VideoCategoryId } from "../../../remotion_types/src/category-types";

// ─── Helpers ─────────────────────────────────────────────────────

function textResult(text: string, details?: unknown): AgentToolResult<unknown> {
  return { content: [{ type: "text" as const, text }], details: details ?? {} };
}

function errorResult(msg: string): AgentToolResult<unknown> {
  return { content: [{ type: "text" as const, text: `Error: ${msg}` }], details: { error: msg } };
}

function resolveDir(dir: string, fallbackBase?: string): string {
  const resolved = resolve(dir);
  if (existsSync(resolved)) return resolved;
  if (fallbackBase) return resolve(fallbackBase, dir);
  return resolved;
}

// ─── Source Parsing ──────────────────────────────────────────────

interface DialogEntry {
  character: string;
  text: string;
  effect?: string;
  emotion?: string;
}

interface SceneAnalysis {
  name: string;
  frames: number;
  seconds: number;
  dialogCount: number;
  characters: string[];
  effects: string[];
}

/** Parse dialogLines[] from a .tsx file content string. */
function parseDialogLines(content: string): DialogEntry[] {
  const results: DialogEntry[] = [];

  // Two-pass: isolate array block, then extract entries
  const arrayMatch = content.match(/const\s+dialogLines\s*:\s*DialogLine\[\]\s*=\s*\[/);
  if (!arrayMatch) return results;

  const startIdx = arrayMatch.index! + arrayMatch[0].length;
  let depth = 1;
  let endIdx = startIdx;
  for (let i = startIdx; i < content.length && depth > 0; i++) {
    if (content[i] === "[") depth++;
    else if (content[i] === "]") depth--;
    if (depth === 0) { endIdx = i; break; }
  }

  const block = content.slice(startIdx, endIdx);

  // Extract each { character, text, ... } entry
  const entryPattern = /\{\s*character:\s*["']([^"']+)["']\s*,\s*text:\s*["']([^"']*?)["']/g;
  let m: RegExpExecArray | null;
  while ((m = entryPattern.exec(block)) !== null) {
    const entry: DialogEntry = { character: m[1], text: m[2] };

    // Check for effect in the rest of this entry
    const afterText = block.slice(m.index + m[0].length, block.indexOf("}", m.index));
    const effectMatch = afterText.match(/effect:\s*["']([^"']+)["']/);
    if (effectMatch) entry.effect = effectMatch[1];
    const emotionMatch = afterText.match(/emotion:\s*["']([^"']+)["']/);
    if (emotionMatch) entry.emotion = emotionMatch[1];

    results.push(entry);
  }

  return results;
}

/** Read all .tsx files from src/scenes/ and extract dialog data. */
function parseScenesFromSource(episodeDir: string): { scenes: Map<string, DialogEntry[]>; allDialog: DialogEntry[] } {
  const scenesMap = new Map<string, DialogEntry[]>();
  const allDialog: DialogEntry[] = [];
  const scenesDir = resolve(episodeDir, "src/scenes");

  if (!existsSync(scenesDir)) return { scenes: scenesMap, allDialog };

  let entries: string[];
  try {
    entries = readdirSync(scenesDir).filter(f => f.endsWith(".tsx")).sort();
  } catch {
    return { scenes: scenesMap, allDialog };
  }

  for (const file of entries) {
    const content = readFileSync(resolve(scenesDir, file), "utf-8");
    const dialogs = parseDialogLines(content);
    const sceneName = file.replace(".tsx", "");
    if (dialogs.length > 0) {
      scenesMap.set(sceneName, dialogs);
      allDialog.push(...dialogs);
    }
  }

  return { scenes: scenesMap, allDialog };
}

/** Read audio/durations.json. */
function readDurations(episodeDir: string): number[] {
  const path = resolve(episodeDir, "audio/durations.json");
  if (!existsSync(path)) return [];
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return [];
  }
}

/** Read audio/voice-manifest.json and extract voice assignments. */
function readVoiceManifest(episodeDir: string): Record<string, string> {
  const path = resolve(episodeDir, "audio/voice-manifest.json");
  if (!existsSync(path)) return {};
  try {
    const manifest = JSON.parse(readFileSync(path, "utf-8"));
    const voiceMap: Record<string, string> = {};
    for (const scene of manifest) {
      for (const seg of scene.segments ?? []) {
        if (seg.character && seg.voice) {
          voiceMap[seg.character] = seg.voice;
        }
      }
    }
    return voiceMap;
  } catch {
    return {};
  }
}

/** Discover episode directories in a series. */
function discoverEpisodes(seriesDir: string): string[] {
  const pattern = /-ch(\d+)-ep(\d+)$/i;
  try {
    return readdirSync(seriesDir)
      .filter(e => {
        const full = resolve(seriesDir, e);
        return statSync(full).isDirectory() && pattern.test(e);
      })
      .sort();
  } catch {
    return [];
  }
}

/** Detect series name from episode directory path. */
function detectSeriesName(episodeDir: string): string {
  const pattern = /(.+)-ch\d+-ep\d+$/i;
  const match = basename(episodeDir).match(pattern);
  return match ? match[1] : basename(episodeDir);
}

/** Get series directory from episode directory. */
function getSeriesDir(episodeDir: string): string {
  return resolve(episodeDir, "..");
}

// ─── Lint Types ──────────────────────────────────────────────────

interface LintIssue {
  rule: string;
  severity: "error" | "warning";
  file: string;
  line?: number;
  message: string;
  detail?: string;
}

function loadEpisodeFiles(episodeDir: string): Map<string, string> {
  const files = new Map<string, string>();
  const dirs = [
    resolve(episodeDir, "src"),
    resolve(episodeDir, "src/scenes"),
  ];

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir)) {
      if (!entry.endsWith(".tsx") && !entry.endsWith(".ts")) continue;
      const fullPath = resolve(dir, entry);
      try {
        files.set(entry, readFileSync(fullPath, "utf-8"));
      } catch { /* skip unreadable */ }
    }
  }

  // Also load Root.tsx
  const rootPath = resolve(episodeDir, "src/Root.tsx");
  if (existsSync(rootPath)) {
    files.set("Root.tsx", readFileSync(rootPath, "utf-8"));
  }

  return files;
}

// ─── Lint Rules ──────────────────────────────────────────────────

function lintNaming(files: Map<string, string>, episodeDir: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const rootContent = files.get("Root.tsx") ?? "";
  const dirName = basename(episodeDir);

  // Check Composition id matches directory name (PascalCase)
  const idMatch = rootContent.match(/id=["']([^"']+)["']/);
  if (idMatch) {
    const expected = dirName
      .split("-")
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join("");
    if (idMatch[1] !== expected) {
      issues.push({
        rule: "naming", severity: "warning", file: "Root.tsx",
        message: `Composition id "${idMatch[1]}" doesn't match expected "${expected}" from directory name`,
      });
    }
  }

  // Check NUM_SCENES matches scene imports
  const numScenesMatch = rootContent.match(/NUM_SCENES\s*=\s*(\d+)/);
  if (numScenesMatch) {
    const declared = parseInt(numScenesMatch[1]);
    const sceneFiles = [...files.keys()].filter(f =>
      f.endsWith(".tsx") && f !== "Root.tsx" && !f.includes("WeaponForger") && !f.includes("MyCoreIsBoss")
    );
    // Scene files in src/scenes/ should match NUM_SCENES
    const scenesDir = resolve(episodeDir, "src/scenes");
    let sceneCount = 0;
    if (existsSync(scenesDir)) {
      sceneCount = readdirSync(scenesDir).filter(f => f.endsWith(".tsx")).length;
    }
    if (sceneCount > 0 && sceneCount !== declared) {
      issues.push({
        rule: "naming", severity: "error", file: "Root.tsx",
        message: `NUM_SCENES=${declared} but found ${sceneCount} scene files in src/scenes/`,
      });
    }
  }

  return issues;
}

function lintStaticFile(files: Map<string, string>, _episodeDir: string): LintIssue[] {
  const issues: LintIssue[] = [];

  for (const [file, content] of files) {
    // Check for raw string paths that should use staticFile()
    const rawBgPath = content.match(/["']\/backgrounds\/[^"']+["']/);
    if (rawBgPath) {
      issues.push({
        rule: "staticFile", severity: "error", file,
        message: `Raw path ${rawBgPath[0]} should use staticFile("backgrounds/...")`,
      });
    }

    // Check audio uses require() not staticFile()
    const audioStaticFile = content.match(/staticFile\([^)]*\.wav["']/);
    if (audioStaticFile) {
      issues.push({
        rule: "staticFile", severity: "warning", file,
        message: "Audio files should use require() not staticFile()",
      });
    }
  }

  return issues;
}

function lintAnimation(files: Map<string, string>, _episodeDir: string): LintIssue[] {
  const issues: LintIssue[] = [];

  for (const [file, content] of files) {
    // Check for CSS transition (not Remotion)
    const cssTransition = content.match(/transition:\s*[^;]*\b(all|opacity|transform)\b[^;]*\d+ms/);
    if (cssTransition) {
      issues.push({
        rule: "animation", severity: "warning", file,
        message: "CSS transition detected — prefer useCurrentFrame() + interpolate() for frame-accurate animation",
      });
    }

    // Check for CSS animation property
    const cssAnimation = content.match(/animation:\s*[^;]+/);
    if (cssAnimation) {
      issues.push({
        rule: "animation", severity: "warning", file,
        message: "CSS animation property detected — use useCurrentFrame() + interpolate()/spring() instead",
      });
    }
  }

  return issues;
}

function lintImports(files: Map<string, string>, _episodeDir: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const sharedComponents = ["DialogBox", "CharacterSprite", "ComicEffects", "MangaSfx", "SystemOverlay", "BackgroundLayer"];

  for (const [file, content] of files) {
    // Check for legacy relative imports of shared components
    for (const comp of sharedComponents) {
      const legacyImport = content.match(new RegExp(`import.*\\b${comp}\\b.*from\\s*["']\\.\\./\\.\\./\\.\\./assets`));
      if (legacyImport) {
        issues.push({
          rule: "imports", severity: "warning", file,
          message: `Legacy import of ${comp} from "../../../assets/" — use "@bun-remotion/shared" instead`,
        });
      }
    }
  }

  return issues;
}

function lintAssets(files: Map<string, string>, episodeDir: string): LintIssue[] {
  const issues: LintIssue[] = [];

  // Collect all staticFile() references
  const referenced = new Set<string>();
  for (const [_file, content] of files) {
    const staticMatches = content.matchAll(/staticFile\(["']([^"']+)["']\)/g);
    for (const m of staticMatches) {
      referenced.add(m[1]);
    }
  }

  // Check assets directory
  const assetsDir = resolve(getSeriesDir(episodeDir), "assets");
  if (!existsSync(assetsDir)) {
    if (referenced.size > 0) {
      issues.push({
        rule: "assets", severity: "warning", file: "(assets)",
        message: `No assets/ directory found, but ${referenced.size} staticFile() references exist`,
      });
    }
    return issues;
  }

  // Check each referenced asset exists
  for (const ref of referenced) {
    const assetPath = resolve(assetsDir, ref);
    if (!existsSync(assetPath)) {
      issues.push({
        rule: "assets", severity: "error", file: "(assets)",
        message: `Referenced asset not found: ${ref}`,
      });
    }
  }

  return issues;
}

function lintStructure(files: Map<string, string>, episodeDir: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const rootContent = files.get("Root.tsx") ?? "";

  // Check TransitionSeries usage in main component
  const mainFile = [...files.keys()].find(f =>
    !f.startsWith("Root") && !f.includes("scenes/") && f.endsWith(".tsx") && f !== "Root.tsx"
  );
  const mainContent = mainFile ? files.get(mainFile)! : "";

  if (mainContent && !mainContent.includes("TransitionSeries") && !mainContent.includes("<Series")) {
    issues.push({
      rule: "structure", severity: "warning", file: mainFile ?? "main.tsx",
      message: "Main component doesn't use TransitionSeries — scenes may not have proper transitions",
    });
  }

  // Check durations.json matches NUM_SCENES
  const durations = readDurations(episodeDir);
  const numScenesMatch = rootContent.match(/NUM_SCENES\s*=\s*(\d+)/);
  if (durations.length > 0 && numScenesMatch) {
    const declared = parseInt(numScenesMatch[1]);
    if (durations.length !== declared) {
      issues.push({
        rule: "structure", severity: "error", file: "audio/durations.json",
        message: `durations.json has ${durations.length} entries but NUM_SCENES=${declared}`,
      });
    }
  }

  return issues;
}

const ALL_LINT_RULES = ["naming", "staticFile", "animation", "imports", "assets", "structure"] as const;
type LintRuleId = typeof ALL_LINT_RULES[number];

const LINT_RULE_FACTORIES: Record<LintRuleId, (files: Map<string, string>, episodeDir: string) => LintIssue[]> = {
  naming: lintNaming,
  staticFile: lintStaticFile,
  animation: lintAnimation,
  imports: lintImports,
  assets: lintAssets,
  structure: lintStructure,
};

// ─── Tool Schemas ────────────────────────────────────────────────

const analyzeSchema = Type.Object({
  episodeDir: Type.String({ description: "Path to a specific episode directory (e.g. bun_remotion_proj/weapon-forger/weapon-forger-ch1-ep1)" }),
  source: Type.Optional(Type.String({ description: "Preferred source: 'storygraph', 'src', or 'auto' (default: auto — storygraph first, src fallback)" })),
});

const suggestSchema = Type.Object({
  seriesDir: Type.String({ description: "Path to the Remotion series directory (e.g. bun_remotion_proj/weapon-forger)" }),
  targetEpId: Type.Optional(Type.String({ description: "Target episode ID for suggestions (e.g. 'ch3ep2'). Defaults to episode after the latest." })),
  focus: Type.Optional(Type.String({ description: "Suggestion focus: 'characters', 'pacing', 'gags', 'arcs', or 'all' (default: all)" })),
});

const lintSchema = Type.Object({
  episodeDir: Type.String({ description: "Path to a specific episode directory to lint" }),
  rules: Type.Optional(Type.String({ description: "Comma-separated rule IDs to run (default: all). Available: naming, staticFile, animation, imports, assets, structure" })),
  strict: Type.Optional(Type.Boolean({ description: "Strict mode: warnings become errors (default: false)" })),
});

// ─── Tool: rm_analyze ────────────────────────────────────────────

export function createRemotionAnalyzeTool(): AgentTool<typeof analyzeSchema> {
  return {
    name: "rm_analyze",
    label: "Remotion Episode Analysis",
    description: "Analyze a Remotion episode's content: dialog, characters, scenes, effects, timing, and voice assignments. Hybrid: uses storygraph artifacts if available, else parses source files directly.",
    parameters: analyzeSchema,
    execute: async (_id, params) => {
      try {
        const dir = resolveDir(params.episodeDir);
        if (!existsSync(dir)) return errorResult(`Episode directory not found: ${dir}`);

        const sourcePref = params.source ?? "auto";
        const seriesName = detectSeriesName(dir);
        const category = detectCategoryFromDirname(seriesName) as VideoCategoryId;

        // Read durations
        const durations = readDurations(dir);
        const fps = 30;

        // Parse dialog from source
        const { scenes: scenesDialog, allDialog } = parseScenesFromSource(dir);

        // Read voice manifest
        const voiceMap = readVoiceManifest(dir);

        // Try storygraph plan.json for supplemental data
        let usedSource: "storygraph" | "src" | "hybrid" = "src";
        const planPath = resolve(dir, "storygraph_out/plan.json");
        if (sourcePref !== "src" && existsSync(planPath)) {
          usedSource = "storygraph";
        }
        if (sourcePref === "auto" && existsSync(planPath) && allDialog.length > 0) {
          usedSource = "hybrid";
        }
        if (sourcePref === "src") usedSource = "src";
        if (sourcePref === "storygraph" && !existsSync(planPath)) usedSource = "src";

        // Build scene analysis
        const sceneNames = [...scenesDialog.keys()];
        const scenes: SceneAnalysis[] = sceneNames.map((name, i) => {
          const dialogs = scenesDialog.get(name) ?? [];
          const chars = [...new Set(dialogs.map(d => d.character))];
          const effects = dialogs.filter(d => d.effect).map(d => d.effect!);
          const frames = durations[i] ?? 240;
          return { name, frames, seconds: Math.round(frames / fps * 10) / 10, dialogCount: dialogs.length, characters: chars, effects };
        });

        // Character stats
        const charStats: Record<string, { lineCount: number; sceneCount: number }> = {};
        for (const scene of scenes) {
          for (const ch of scene.characters) {
            if (!charStats[ch]) charStats[ch] = { lineCount: 0, sceneCount: 0 };
            charStats[ch].sceneCount++;
          }
        }
        for (const d of allDialog) {
          if (!charStats[d.character]) charStats[d.character] = { lineCount: 0, sceneCount: 0 };
          charStats[d.character].lineCount++;
        }

        // Effect distribution
        const effectDist: Record<string, number> = {};
        for (const d of allDialog) {
          if (d.effect) effectDist[d.effect] = (effectDist[d.effect] ?? 0) + 1;
        }

        // Emotion distribution
        const emotionDist: Record<string, number> = {};
        for (const d of allDialog) {
          if (d.emotion) emotionDist[d.emotion] = (emotionDist[d.emotion] ?? 0) + 1;
        }

        // Format output
        const totalFrames = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) : scenes.reduce((a, s) => a + s.frames, 0);
        const totalSeconds = Math.round(totalFrames / fps * 10) / 10;

        const lines = [
          `Episode Analysis: ${basename(dir)} (${seriesName})`,
          `Category: ${category} | Source: ${usedSource}`,
          "",
          `Scene Structure (${scenes.length} scenes, ${totalFrames} frames / ${totalSeconds}s at ${fps}fps):`,
        ];

        for (const s of scenes) {
          const chars = s.characters.length > 0 ? s.characters.join(", ") : "(none)";
          lines.push(`  ${s.name.padEnd(16)} ${String(s.frames).padStart(5)} frames (${s.seconds}s) — ${s.dialogCount} lines, ${s.characters.length} chars${s.effects.length > 0 ? `, ${s.effects.length} effects` : ""}`);
        }

        if (Object.keys(charStats).length > 0) {
          lines.push("", "Character Interactions:");
          for (const [ch, stats] of Object.entries(charStats).sort((a, b) => b[1].lineCount - a[1].lineCount)) {
            lines.push(`  ${ch}: ${stats.lineCount} lines across ${stats.sceneCount} scenes`);
          }
        }

        if (Object.keys(effectDist).length > 0) {
          lines.push("", "Effect Distribution:");
          for (const [eff, count] of Object.entries(effectDist).sort((a, b) => b[1] - a[1])) {
            lines.push(`  ${eff}: ${count} uses`);
          }
        }

        if (Object.keys(emotionDist).length > 0) {
          lines.push("", "Emotion Distribution:");
          for (const [emo, count] of Object.entries(emotionDist).sort((a, b) => b[1] - a[1])) {
            lines.push(`  ${emo}: ${count} uses`);
          }
        }

        if (Object.keys(voiceMap).length > 0) {
          lines.push("", "Voice Assignments:");
          for (const [ch, voice] of Object.entries(voiceMap)) {
            lines.push(`  ${ch} → ${voice}`);
          }
        }

        return textResult(lines.join("\n"), {
          episodeId: basename(dir),
          category,
          scenes,
          characterStats: charStats,
          effectDistribution: effectDist,
          emotionDistribution: emotionDist,
          totalFrames,
          totalSeconds,
          voiceMap,
          source: usedSource,
        });
      } catch (e: any) {
        return errorResult(e.message ?? String(e));
      }
    },
  };
}

// ─── Tool: rm_suggest ────────────────────────────────────────────

interface Suggestion {
  severity: "HIGH" | "MEDIUM" | "LOW";
  category: string;
  description: string;
  affectedEpisodes: string[];
  hint: string;
}

export function createRemotionSuggestTool(): AgentTool<typeof suggestSchema> {
  return {
    name: "rm_suggest",
    label: "Remotion Content Suggestions",
    description: "Analyze a Remotion series and generate content suggestions: character gaps, pacing issues, gag stagnation, missing interactions, arc continuity. Hybrid: uses storygraph + source analysis.",
    parameters: suggestSchema,
    execute: async (_id, params) => {
      try {
        const dir = resolveDir(params.seriesDir);
        if (!existsSync(dir)) return errorResult(`Series directory not found: ${dir}`);

        const focus = params.focus ?? "all";
        const suggestions: Suggestion[] = [];
        const episodeNames = discoverEpisodes(dir);
        const seriesName = basename(dir);

        if (episodeNames.length === 0) {
          return textResult(`No episodes found in ${dir}`, { suggestions: [], episodeCount: 0 });
        }

        // Collect data from all episodes
        const episodeData: Array<{
          name: string;
          dir: string;
          characters: string[];
          totalFrames: number;
          totalSeconds: number;
          dialogCount: number;
          characterPairs: Set<string>;
        }> = [];

        const seriesChars = new Set<string>();

        for (const epName of episodeNames) {
          const epDir = resolve(dir, epName);
          const { allDialog } = parseScenesFromSource(epDir);
          const durations = readDurations(epDir);
          const totalFrames = durations.reduce((a, b) => a + b, 0);

          const chars = [...new Set(allDialog.map(d => d.character))];
          const pairs = new Set<string>();
          for (let i = 0; i < chars.length; i++) {
            seriesChars.add(chars[i]);
            for (let j = i + 1; j < chars.length; j++) {
              pairs.add([chars[i], chars[j]].sort().join("+"));
            }
          }

          episodeData.push({
            name: epName,
            dir: epDir,
            characters: chars,
            totalFrames,
            totalSeconds: Math.round(totalFrames / 30 * 10) / 10,
            dialogCount: allDialog.length,
            characterPairs: pairs,
          });
        }

        // Character usage analysis
        if (focus === "all" || focus === "characters") {
          const charAppearances: Record<string, string[]> = {};
          for (const ep of episodeData) {
            for (const ch of ep.characters) {
              if (!charAppearances[ch]) charAppearances[ch] = [];
              charAppearances[ch].push(ep.name);
            }
          }

          // Characters appearing in < 30% of episodes
          const threshold = Math.ceil(episodeData.length * 0.3);
          for (const [ch, eps] of Object.entries(charAppearances)) {
            if (eps.length < threshold && eps.length > 0) {
              suggestions.push({
                severity: eps.length <= 1 ? "HIGH" : "MEDIUM",
                category: "characters",
                description: `${ch} appears in only ${eps.length}/${episodeData.length} episodes (${(eps.length / episodeData.length * 100).toFixed(0)}%)`,
                affectedEpisodes: eps,
                hint: `Consider giving ${ch} more screen time or consolidating their role`,
              });
            }
          }

          // Characters absent for 3+ consecutive episodes
          const sortedEpNames = episodeData.map(e => e.name);
          for (const ch of Object.keys(charAppearances)) {
            const epIdxs = charAppearances[ch].map(e => sortedEpNames.indexOf(e)).filter(i => i >= 0).sort();
            for (let i = 0; i < epIdxs.length - 1; i++) {
              const gap = epIdxs[i + 1] - epIdxs[i] - 1;
              if (gap >= 3) {
                suggestions.push({
                  severity: "HIGH",
                  category: "characters",
                  description: `${ch} is absent for ${gap} consecutive episodes (between ${sortedEpNames[epIdxs[i]]} and ${sortedEpNames[epIdxs[i + 1]]})`,
                  affectedEpisodes: sortedEpNames.slice(epIdxs[i] + 1, epIdxs[i + 1]),
                  hint: `Consider a cameo or mention of ${ch} to maintain presence`,
                });
              }
            }
          }
        }

        // Pacing analysis
        if (focus === "all" || focus === "pacing") {
          const seconds = episodeData.map(e => e.totalSeconds).filter(s => s > 0);
          if (seconds.length >= 3) {
            const mean = seconds.reduce((a, b) => a + b, 0) / seconds.length;
            const stdDev = Math.sqrt(seconds.reduce((a, b) => a + (b - mean) ** 2, 0) / seconds.length);
            const threshold = mean + 1.5 * stdDev;
            const lowThreshold = mean - 1.5 * stdDev;

            for (const ep of episodeData) {
              if (ep.totalSeconds > threshold) {
                suggestions.push({
                  severity: "MEDIUM",
                  category: "pacing",
                  description: `${ep.name} (${ep.totalSeconds}s) is significantly longer than series average (${Math.round(mean)}s)`,
                  affectedEpisodes: [ep.name],
                  hint: "Consider splitting into two shorter episodes or trimming less essential scenes",
                });
              } else if (ep.totalSeconds < lowThreshold && ep.totalSeconds > 0) {
                suggestions.push({
                  severity: "MEDIUM",
                  category: "pacing",
                  description: `${ep.name} (${ep.totalSeconds}s) is significantly shorter than series average (${Math.round(mean)}s)`,
                  affectedEpisodes: [ep.name],
                  hint: "Consider adding another ContentScene or extending existing scenes",
                });
              }
            }
          }
        }

        // Gag stagnation (from PLAN.md)
        if (focus === "all" || focus === "gags") {
          const planPath = resolve(dir, "PLAN.md");
          if (existsSync(planPath)) {
            const planContent = readFileSync(planPath, "utf-8");
            // Look for running gag table entries
            const gagMatches = [...planContent.matchAll(/\|\s*([^|]+)\s*\|\s*([^|]*)\s*\|\s*([^|]*)\s*\|\s*([^|]*)\s*\|/g)];
            for (const m of gagMatches) {
              const gagName = m[1].trim();
              const evolution = m[2].trim() + m[3].trim() + m[4].trim();
              if (gagName.toLowerCase().includes("gag") || gagName.toLowerCase().includes("笑") || gagName.toLowerCase().includes("梗")) continue; // header row
              if (evolution.toLowerCase().includes("tbd") || evolution.includes("待定")) {
                suggestions.push({
                  severity: "MEDIUM",
                  category: "gags",
                  description: `Running gag "${gagName}" has TBD/undecided evolution entries`,
                  affectedEpisodes: [],
                  hint: `Plan a new variation for "${gagName}" — stagnant gags lose comedic impact`,
                });
              }
            }
          }
        }

        // Missing interactions
        if (focus === "all" || focus === "arcs") {
          // Check for character pairs that share episodes but never interact
          const allPairs = new Map<string, { episodes: string[]; interacted: boolean }>();
          for (const ep of episodeData) {
            for (const pair of ep.characterPairs) {
              if (!allPairs.has(pair)) allPairs.set(pair, { episodes: [], interacted: false });
              allPairs.get(pair)!.episodes.push(ep.name);
            }
            // A pair "interacted" if they share a scene with dialog
            const { scenes } = parseScenesFromSource(ep.dir);
            for (const [_sceneName, dialogs] of scenes) {
              const sceneChars = [...new Set(dialogs.map(d => d.character))];
              for (let i = 0; i < sceneChars.length; i++) {
                for (let j = i + 1; j < sceneChars.length; j++) {
                  const pair = [sceneChars[i], sceneChars[j]].sort().join("+");
                  if (allPairs.has(pair)) allPairs.get(pair)!.interacted = true;
                }
              }
            }
          }

          // Not adding missing interaction suggestions at series level — too noisy
          // This is better handled per-episode
        }

        // Sort by severity
        const severityOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        suggestions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        // Filter by focus
        const filtered = focus === "all" ? suggestions : suggestions.filter(s => s.category === focus);

        // Format output
        const lines = [
          `Content Suggestions: ${seriesName} (${episodeData.length} episodes)`,
          params.targetEpId ? `Target: ${params.targetEpId}` : `Latest: ${episodeNames[episodeNames.length - 1]}`,
          `Source: hybrid (storygraph + src)`,
          "",
        ];

        for (let i = 0; i < filtered.length; i++) {
          const s = filtered[i];
          lines.push(`${i + 1}. [${s.severity}] ${s.category} — ${s.description}`);
          if (s.affectedEpisodes.length > 0) lines.push(`   Episodes: ${s.affectedEpisodes.join(", ")}`);
          if (s.hint) lines.push(`   Hint: ${s.hint}`);
        }

        if (filtered.length === 0) {
          lines.push(`No issues found for focus area "${focus}" — series looks healthy!`);
        }

        const highCount = filtered.filter(s => s.severity === "HIGH").length;
        const medCount = filtered.filter(s => s.severity === "MEDIUM").length;
        lines.push("", `Story Debt: ${highCount + medCount} items (${highCount} high, ${medCount} medium severity)`);

        return textResult(lines.join("\n"), {
          seriesName,
          episodeCount: episodeData.length,
          suggestions: filtered,
          storyDebtCount: highCount + medCount,
          focus,
        });
      } catch (e: any) {
        return errorResult(e.message ?? String(e));
      }
    },
  };
}

// ─── Tool: rm_lint ───────────────────────────────────────────────

export function createRemotionLintTool(): AgentTool<typeof lintSchema> {
  return {
    name: "rm_lint",
    label: "Remotion Code Quality Lint",
    description: "Check Remotion episode code quality: naming conventions, staticFile() usage, animation patterns, import paths, asset references, and scene structure.",
    parameters: lintSchema,
    execute: async (_id, params) => {
      try {
        const dir = resolveDir(params.episodeDir);
        if (!existsSync(dir)) return errorResult(`Episode directory not found: ${dir}`);

        // Parse requested rules
        const requestedRules = params.rules
          ? params.rules.split(",").map(r => r.trim()).filter((r): r is LintRuleId => ALL_LINT_RULES.includes(r as LintRuleId))
          : [...ALL_LINT_RULES];

        if (requestedRules.length === 0) {
          return errorResult(`No valid rules specified. Available: ${ALL_LINT_RULES.join(", ")}`);
        }

        // Load all episode files
        const files = loadEpisodeFiles(dir);

        if (files.size === 0) {
          return errorResult(`No .tsx files found in ${dir}/src/`);
        }

        // Run lint rules
        const allIssues: LintIssue[] = [];
        for (const ruleId of requestedRules) {
          const factory = LINT_RULE_FACTORIES[ruleId];
          if (factory) {
            allIssues.push(...factory(files, dir));
          }
        }

        // Apply strict mode
        const strict = params.strict ?? false;
        const issues = strict
          ? allIssues.map(i => ({ ...i, severity: "error" as const }))
          : allIssues;

        const errors = issues.filter(i => i.severity === "error");
        const warnings = issues.filter(i => i.severity === "warning");

        // Format output
        const lines = [
          `Remotion Lint: ${basename(dir)}`,
          `${requestedRules.length} rules checked, ${issues.length} issues found (${warnings.length} warnings, ${errors.length} errors)`,
          "",
        ];

        if (errors.length > 0) {
          lines.push("ERRORS:");
          for (const e of errors) {
            lines.push(`  [${e.rule}] ${e.file}${e.line ? `:${e.line}` : ""} — ${e.message}`);
            if (e.detail) lines.push(`    ${e.detail}`);
          }
          lines.push("");
        }

        if (warnings.length > 0) {
          lines.push("WARNINGS:");
          for (const w of warnings) {
            lines.push(`  [${w.rule}] ${w.file}${w.line ? `:${w.line}` : ""} — ${w.message}`);
            if (w.detail) lines.push(`    ${w.detail}`);
          }
          lines.push("");
        }

        // Passed rules
        const failedRules = new Set(issues.map(i => i.rule));
        const passedRules = requestedRules.filter(r => !failedRules.has(r));
        if (passedRules.length > 0) {
          lines.push("PASSED:");
          for (const rule of passedRules) {
            lines.push(`  [${rule}] No issues found`);
          }
        }

        return textResult(lines.join("\n"), {
          episodeDir: basename(dir),
          rulesChecked: requestedRules,
          totalIssues: issues.length,
          errors: errors.length,
          warnings: warnings.length,
          strict,
          issues: issues.map(i => ({ rule: i.rule, severity: i.severity, file: i.file, message: i.message })),
        });
      } catch (e: any) {
        return errorResult(e.message ?? String(e));
      }
    },
  };
}

// ─── Exports ─────────────────────────────────────────────────────

/** Create all Remotion content analysis tools. */
export function createRemotionTools(): AgentTool<any>[] {
  return [
    createRemotionAnalyzeTool(),
    createRemotionSuggestTool(),
    createRemotionLintTool(),
  ];
}
