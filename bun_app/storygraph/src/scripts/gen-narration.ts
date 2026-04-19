/**
 * Narration.ts generator — Phase 33-F4a.
 *
 * Generates a narration.ts file from confirmed dialog/narration data.
 * Supports all 3 major categories:
 *   - narrative_drama: multi-character dialog with voice map
 *   - tech_explainer: single narrator with scene descriptions
 *   - galgame_vn: multi-character dialog (female cast)
 *
 * Usage:
 *   bun run storygraph gen-narration <episode-dir> --scenes <scenes.json>
 *   bun run storygraph gen-narration <episode-dir> --from-plan
 */

import {
  resolve,
  basename,
  dirname,
} from "node:path";
import {
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";

// ─── Types ───

interface NarrationSegment {
  character: string;
  text: string;
}

interface SceneInput {
  scene: string;
  segments: NarrationSegment[];
}

interface NarrationInput {
  scenes: SceneInput[];
  voice_map: Record<string, string>;
  voice_descriptions: Record<string, { voice: string; gender: string; accent: string }>;
  category: string;
}

// ─── Template generators ───

function generateNarrationDrama(input: NarrationInput): string {
  const characters = [...new Set(input.scenes.flatMap((s) => s.segments.map((seg) => seg.character)))];
  const voiceCharType = characters.map((c) => `"${c}"`).join(" | ");

  const scenesCode = input.scenes
    .map((scene, i) => {
      const fileNum = String(i + 1).padStart(2, "0");
      const fileName = `${fileNum}-${scene.scene.replace(/([A-Z])/g, (_, c, j) => (j > 0 ? "-" : "") + c.toLowerCase())}.wav`;
      const fullText = scene.segments.map((s) => s.text).join(" ");
      const segmentsStr = scene.segments
        .map((seg) => `      { character: "${seg.character}", text: "${seg.text.replace(/"/g, '\\"')}" }`)
        .join(",\n");

      return `  {
    scene: "${scene.scene}",
    file: "${fileName}",
    segments: [
${segmentsStr}
    ],
    fullText: "${fullText.replace(/"/g, '\\"')}",
  }`;
    })
    .join(",\n");

  const voiceMapEntries = Object.entries(input.voice_map)
    .map(([k, v]) => `  ${k}: "${v}"`)
    .join(",\n");

  const voiceDescEntries = Object.entries(input.voice_descriptions)
    .map(
      ([k, v]) =>
        `  ${k}: { voice: "${v.voice}", gender: "${v.gender}", accent: "${v.accent}" }`
    )
    .join(",\n");

  return `// Auto-generated narration script
// Category: narrative_drama
// Characters: ${characters.join(", ")}

export type VoiceCharacter = ${voiceCharType};

export interface NarrationSegment {
  character: VoiceCharacter;
  text: string;
}

export interface NarrationScript {
  scene: string;
  file: string;
  segments: NarrationSegment[];
  fullText: string;
}

export const VOICE_MAP: Record<VoiceCharacter, string> = {
${voiceMapEntries}
};

export const VOICE_DESCRIPTION: Record<VoiceCharacter, { voice: string; gender: string; accent: string }> = {
${voiceDescEntries}
};

export const narrations: NarrationScript[] = [
${scenesCode}
];
`;
}

function generateTechExplainer(input: NarrationInput): string {
  const scenesCode = input.scenes
    .map((scene, i) => {
      const fileNum = String(i + 1).padStart(2, "0");
      const fileName = `${fileNum}-${scene.scene.replace(/([A-Z])/g, (_, c, j) => (j > 0 ? "-" : "") + c.toLowerCase())}.wav`;
      const fullText = scene.segments.map((s) => s.text).join(" ");
      const segmentsStr = scene.segments
        .map((seg) => `      { character: "narrator", text: "${seg.text.replace(/"/g, '\\"')}" }`)
        .join(",\n");

      return `  {
    scene: "${scene.scene}",
    file: "${fileName}",
    segments: [
${segmentsStr}
    ],
    fullText: "${fullText.replace(/"/g, '\\"')}",
  }`;
    })
    .join(",\n");

  return `// Auto-generated narration script
// Category: tech_explainer

export type VoiceCharacter = "narrator";

export interface NarrationSegment {
  character: VoiceCharacter;
  text: string;
}

export interface NarrationScript {
  scene: string;
  file: string;
  segments: NarrationSegment[];
  fullText: string;
}

export const VOICE_MAP: Record<VoiceCharacter, string> = {
  narrator: "serena",
};

export const VOICE_DESCRIPTION: Record<VoiceCharacter, { voice: string; gender: string; accent: string }> = {
  narrator: { voice: "serena", gender: "female", accent: "standard Mandarin" },
};

export const narrations: NarrationScript[] = [
${scenesCode}
];
`;
}

function generateGalgameVN(input: NarrationInput): string {
  // Same structure as narrative_drama but with galgame-specific defaults
  return generateNarrationDrama(input);
}

function generateNarration(input: NarrationInput): string {
  switch (input.category) {
    case "tech_explainer":
    case "data_story":
      return generateTechExplainer(input);
    case "galgame_vn":
      return generateGalgameVN(input);
    case "narrative_drama":
    default:
      return generateNarrationDrama(input);
  }
}

// ─── PLAN.md scene extraction ───

function extractScenesFromPlan(planPath: string): SceneInput[] {
  if (!existsSync(planPath)) return [];

  const plan = readFileSync(planPath, "utf-8");

  // Find scene table rows: | TitleScene | ... | ... |
  const sceneRows: SceneInput[] = [];
  const tablePattern = /\|\s*(\w+Scene\w*)\s*\|/g;
  let match;

  while ((match = tablePattern.exec(plan)) !== null) {
    const sceneName = match[1];
    // Avoid header row
    if (sceneName === "Scene" || sceneName.startsWith("-")) continue;
    sceneRows.push({
      scene: sceneName,
      segments: [{ character: "narrator", text: `TODO: ${sceneName} narration` }],
    });
  }

  return sceneRows;
}

// ─── Exports ───

export {
  generateNarration,
  generateNarrationDrama,
  generateTechExplainer,
  generateGalgameVN,
  extractScenesFromPlan,
};
export type { NarrationInput, SceneInput, NarrationSegment };

// ─── CLI ───

if (import.meta.main) {
const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help")) {
  console.log(`gen-narration — Generate narration.ts from dialog data (Phase 33-F4a)

Usage:
  bun run storygraph gen-narration <episode-dir> --scenes <scenes.json>
  bun run storygraph gen-narration <episode-dir> --from-plan [--category <category>]

Options:
  --scenes <path>     JSON file with scene dialog data
  --from-plan         Extract scene names from episode PLAN.md
  --category <cat>    Video category (default: narrative_drama)
  --output <path>     Output path (default: <episode-dir>/src/narration.ts)
`);
  process.exit(0);
}

const episodeDir = resolve(args[0]);
if (!episodeDir.startsWith("/")) {
  console.error(`Error: "${episodeDir}" is not an absolute path.`);
  process.exit(1);
}

const scenesIdx = args.indexOf("--scenes");
const fromPlan = args.includes("--from-plan");
const categoryIdx = args.indexOf("--category");
const category = categoryIdx !== -1 ? args[categoryIdx + 1] : "narrative_drama";
const outputIdx = args.indexOf("--output");
const outputPath = outputIdx !== -1 ? resolve(args[outputIdx + 1]) : resolve(episodeDir, "src", "narration.ts");

let input: NarrationInput;

if (scenesIdx !== -1) {
  const scenesPath = resolve(args[scenesIdx + 1]);
  const raw = JSON.parse(readFileSync(scenesPath, "utf-8"));
  input = {
    scenes: raw.scenes ?? raw,
    voice_map: raw.voice_map ?? {},
    voice_descriptions: raw.voice_descriptions ?? {},
    category,
  };
} else if (fromPlan) {
  const planPath = resolve(episodeDir, "PLAN.md");
  const scenes = extractScenesFromPlan(planPath);
  if (scenes.length === 0) {
    console.error("No scenes found in PLAN.md. Use --scenes for explicit scene data.");
    process.exit(1);
  }
  input = {
    scenes,
    voice_map: { narrator: "serena" },
    voice_descriptions: { narrator: { voice: "serena", gender: "female", accent: "standard Mandarin" } },
    category,
  };
} else {
  console.error("Provide --scenes <path> or --from-plan");
  process.exit(1);
}

const code = generateNarration(input);

// Ensure output directory exists
const outputDir = dirname(outputPath);
if (!existsSync(outputDir)) {
  const { mkdirSync } = await import("node:fs");
  mkdirSync(outputDir, { recursive: true });
}

writeFileSync(outputPath, code);
console.log(`Generated: ${outputPath}`);
console.log(`Category: ${input.category}, Scenes: ${input.scenes.length}`);
} // end import.meta.main
