/**
 * Episode TODO.md generator — Phase 33-F4b.
 *
 * Generates a standard episode TODO.md from PLAN.md data.
 * Includes story summary, quality gate checklist, setup tasks,
 * and category-specific items.
 *
 * Usage:
 *   bun run storygraph gen-todo <episode-dir>
 *   bun run storygraph gen-todo <episode-dir> --category <category>
 */

import { resolve, basename } from "node:path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";

// ─── Types ───

interface EpisodeInfo {
  series_name: string;
  ep_id: string;
  title: string;
  category: string;
  scenes: string[];
  characters: string[];
  has_parent_todo: boolean;
  language: string;
}

// ─── PLAN.md parsing ───

function parsePlanForEpisode(episodeDir: string): EpisodeInfo {
  const planPath = resolve(episodeDir, "PLAN.md");
  const dirName = basename(episodeDir);

  // Extract ep_id from directory name
  const epMatch = dirName.match(/[-](?:ch)?(\d+)[-]?ep(\d+)$/);
  const epId = epMatch ? `ch${epMatch[1]}ep${epMatch[2]}` : dirName;

  // Extract series name (parent directory)
  const parentDir = basename(resolve(episodeDir, ".."));
  const seriesName = parentDir.replace(/[-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const defaults: EpisodeInfo = {
    series_name: seriesName,
    ep_id: epId,
    title: "",
    category: "narrative_drama",
    scenes: [],
    characters: [],
    has_parent_todo: existsSync(resolve(episodeDir, "..", "TODO.md")),
    language: "zh-TW (Traditional Chinese)",
  };

  if (!existsSync(planPath)) return defaults;

  const plan = readFileSync(planPath, "utf-8");

  // Extract title from first heading
  const titleMatch = plan.match(/^#\s+(.+)$/m);
  if (titleMatch) defaults.title = titleMatch[1].replace(/^TODO\s*[-—]\s*/, "");

  // Extract scene names from table rows
  const scenePattern = /\|\s*(\w+Scene\w*)\s*\|/g;
  let match;
  while ((match = scenePattern.exec(plan)) !== null) {
    const name = match[1];
    if (name !== "Scene" && !name.startsWith("-")) {
      defaults.scenes.push(name);
    }
  }

  // Extract characters from plan
  const charLine = plan.match(/(?:Characters|角色)[：:]\s*(.+?)[\n\r]/i);
  if (charLine) {
    defaults.characters = charLine[1]
      .split(/[,，、]/)
      .map((c) => c.trim())
      .filter(Boolean);
  }

  // Detect category from directory structure
  if (dirName.includes("storygraph-explainer") || dirName.includes("claude-code-intro")) {
    defaults.category = "tech_explainer";
  } else if (dirName.includes("galgame")) {
    defaults.category = "galgame_vn";
  } else if (dirName.includes("taiwan-stock")) {
    defaults.category = "data_story";
  }

  return defaults;
}

// ─── Template generation ───

function generateNarrativeDramaTodo(info: EpisodeInfo): string {
  const sceneFiles = info.scenes.map(
    (s) => `- [ ] Write src/scenes/${s}.tsx`
  ).join("\n");

  const charSetup = info.characters.length > 0
    ? info.characters
        .filter((c) => c !== "narrator")
        .map((c) => `- [ ] Ensure ${c} character image exists in assets/`)
        .join("\n")
    : "- [ ] Verify character images in assets/";

  return `# TODO — ${info.series_name} ${info.ep_id}${info.title ? `: ${info.title}` : ""}

${info.has_parent_todo ? `> Parent: [../TODO.md](../TODO.md)\n` : ""}## Story

${info.title || "Episode " + info.ep_id}

Characters: ${info.characters.join(", ") || "narrator"}
Language: ${info.language}

## Quality Gate

- [ ] Create episode directory + narration.ts (${info.scenes.length} scenes: ${info.scenes.join(", ") || "TBD"})
- [ ] Create episode PLAN.md (story contract)
- [ ] Run storygraph pipeline (episode → merge → check)
- [ ] User approved gate results

## Setup Tasks

- [ ] Create TODO.md
- [ ] Write src/narration.ts (${info.scenes.length} scenes: ${info.scenes.join(", ") || "TBD"})
${charSetup}
- [ ] Create package.json
- [ ] Create tsconfig.json
- [ ] Create src/index.ts
- [ ] Create src/Root.tsx
- [ ] Create main composition component
${sceneFiles}
- [ ] Update workspace PLAN.md (episode guide + commands)
- [ ] Update scripts/dev.sh ALL_APPS + get_comp_id()
- [ ] Update root package.json with scripts
- [ ] Run \`bun install\` to link workspace
- [ ] Generate TTS audio
- [ ] Open in Remotion Studio and verify visuals
- [ ] Render final MP4
`;
}

function generateTechExplainerTodo(info: EpisodeInfo): string {
  const sceneFiles = info.scenes.map(
    (s) => `- [ ] Write src/scenes/${s}.tsx`
  ).join("\n");

  return `# TODO — ${info.series_name} ${info.ep_id}${info.title ? `: ${info.title}` : ""}

${info.has_parent_todo ? `> Parent: [../TODO.md](../TODO.md)\n` : ""}## Story

${info.title || "Episode " + info.ep_id}

Characters: narrator
Language: ${info.language}
Category: tech_explainer

## Quality Gate

- [ ] Create episode directory + narration.ts (${info.scenes.length} scenes: ${info.scenes.join(", ") || "TBD"})
- [ ] Create episode PLAN.md (story contract)
- [ ] Run storygraph pipeline (episode → merge → check) — hybrid mode
- [ ] User approved gate results

## Setup Tasks

- [ ] Create TODO.md
- [ ] Write src/narration.ts (${info.scenes.length} scenes: ${info.scenes.join(", ") || "TBD"})
- [ ] Create package.json
- [ ] Create tsconfig.json
- [ ] Create src/index.ts
- [ ] Create src/Root.tsx
- [ ] Create main composition component
${sceneFiles}
- [ ] Update workspace PLAN.md (episode guide + commands)
- [ ] Update scripts/dev.sh ALL_APPS + get_comp_id()
- [ ] Update root package.json with scripts
- [ ] Run \`bun install\` to link workspace
- [ ] Generate TTS (narrator: serena)
- [ ] Open in Remotion Studio and verify visuals
- [ ] Render final MP4
`;
}

function generateGalgameVNTodo(info: EpisodeInfo): string {
  // Galgame is similar to narrative_drama but with different defaults
  return generateNarrativeDramaTodo(info);
}

function generateEpisodeTodo(episodeDir: string, categoryOverride?: string): string {
  const info = parsePlanForEpisode(episodeDir);
  if (categoryOverride) info.category = categoryOverride;

  switch (info.category) {
    case "tech_explainer":
    case "data_story":
      return generateTechExplainerTodo(info);
    case "galgame_vn":
      return generateGalgameVNTodo(info);
    case "narrative_drama":
    default:
      return generateNarrativeDramaTodo(info);
  }
}

// ─── Exports ───

export {
  generateEpisodeTodo,
  parsePlanForEpisode,
  generateNarrativeDramaTodo,
  generateTechExplainerTodo,
  generateGalgameVNTodo,
};
export type { EpisodeInfo };

// ─── CLI ───

if (import.meta.main) {
const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help")) {
  console.log(`gen-episode-todo — Generate episode TODO.md from PLAN.md (Phase 33-F4b)

Usage:
  bun run storygraph gen-todo <episode-dir> [--category <category>]

Reads episode PLAN.md and generates a standard TODO.md with quality gate,
setup tasks, and category-specific items.

Options:
  --category <cat>    Override detected category (narrative_drama, tech_explainer, galgame_vn)
  --output <path>     Output path (default: <episode-dir>/TODO.md)
`);
  process.exit(0);
}

const episodeDir = resolve(args[0]);
if (!episodeDir.startsWith("/")) {
  console.error(`Error: "${episodeDir}" is not an absolute path.`);
  process.exit(1);
}

const categoryIdx = args.indexOf("--category");
const categoryOverride = categoryIdx !== -1 ? args[categoryIdx + 1] : undefined;

const outputIdx = args.indexOf("--output");
const outputPath = outputIdx !== -1 ? resolve(args[outputIdx + 1]) : resolve(episodeDir, "TODO.md");

const todo = generateEpisodeTodo(episodeDir, categoryOverride);

writeFileSync(outputPath, todo);
console.log(`Generated: ${outputPath}`);
const info = parsePlanForEpisode(episodeDir);
console.log(`Category: ${info.category}, Scenes: ${info.scenes.length}, Characters: ${info.characters.length}`);
} // end import.meta.main
