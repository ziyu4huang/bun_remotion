/**
 * Series configuration registry for the scaffold generator.
 * Each series defines its naming, structure, and import conventions.
 */

import type { VideoCategoryId } from "remotion_types";

export interface TransitionDef {
  /** Import name, e.g. "slide" or "{ fade }" */
  importName: string;
  /** Import source, e.g. "@remotion/transitions/slide" */
  from: string;
  /** Usage expression, e.g. 'slide({ direction: "from-right" })' */
  usage: string;
}

export interface SeriesConfig {
  /** Directory name under bun_remotion_proj/ */
  id: string;
  /** Display name (Chinese) */
  displayName: string;
  /** Series abbreviation for script aliases */
  abbreviation: string;
  /** Whether the series uses chapters */
  chapterBased: boolean;
  /** Whether this is a standalone project (no episode numbering) */
  standalone?: boolean;
  /** Video category (for non-narrative series) */
  category?: VideoCategoryId;
  /** Content scene naming: "Content", "Joke", or custom prefix */
  contentScenePrefix: string;
  /** Default number of content scenes */
  defaultContentScenes: number;
  /** Relative path from episode src/scenes/ to assets/characters */
  charactersImportPath: string;
  /** Relative path from episode src/scenes/ to assets/components/ */
  componentsImportPath: string;
  /** Relative path from episode root to assets/scripts/generate-tts.ts */
  ttsScriptPath: string;
  /** Language tag for narration */
  language: string;
  /** Voice characters list (for narration.ts template) */
  voiceCharacters: string[];
  /** Transition types used between scenes (cycling) */
  transitions: TransitionDef[];
}

export const SERIES_REGISTRY: Record<string, SeriesConfig> = {
  "weapon-forger": {
    id: "weapon-forger",
    displayName: "誰讓他煉器的！",
    abbreviation: "wf",
    chapterBased: true,
    contentScenePrefix: "Content",
    defaultContentScenes: 2,
    charactersImportPath: "../../../assets/characters",
    componentsImportPath: "../../../assets/components",
    ttsScriptPath: "../assets/scripts/generate-tts.ts",
    language: "zh-TW",
    voiceCharacters: ["zhoumo", "examiner", "elder", "luyang", "mengjingzhou", "narrator"],
    transitions: [
      { importName: "fade", from: "@remotion/transitions/fade", usage: "fade()" },
      { importName: "slide", from: "@remotion/transitions/slide", usage: 'slide({ direction: "from-right" })' },
      { importName: "wipe", from: "@remotion/transitions/wipe", usage: 'wipe({ direction: "from-right" })' },
    ],
  },
  "my-core-is-boss": {
    id: "my-core-is-boss",
    displayName: "我的核心是大佬",
    abbreviation: "mcb",
    chapterBased: true,
    contentScenePrefix: "Content",
    defaultContentScenes: 3,
    charactersImportPath: "../../../assets/characters",
    componentsImportPath: "../../../assets/components",
    ttsScriptPath: "../assets/scripts/generate-tts.ts",
    language: "zh-TW",
    voiceCharacters: ["linyi", "zhaoxiaoqi", "xiaoelder", "narrator"],
    transitions: [
      { importName: "fade", from: "@remotion/transitions/fade", usage: "fade()" },
      { importName: "slide", from: "@remotion/transitions/slide", usage: 'slide({ direction: "from-right" })' },
      { importName: "wipe", from: "@remotion/transitions/wipe", usage: 'wipe({ direction: "from-right" })' },
      { importName: "flip", from: "@remotion/transitions/flip", usage: "flip()" },
    ],
  },
  "galgame-meme-theater": {
    id: "galgame-meme-theater",
    displayName: "美少女梗圖劇場",
    abbreviation: "meme",
    chapterBased: false,
    contentScenePrefix: "Joke",
    defaultContentScenes: 4,
    charactersImportPath: "../../../assets/characters",
    componentsImportPath: "../../../assets/components",
    ttsScriptPath: "../assets/scripts/generate-tts.ts",
    language: "zh-TW",
    voiceCharacters: ["xiaoxue", "xiaoyue", "xiaoying", "narrator"],
    transitions: [
      { importName: "fade", from: "@remotion/transitions/fade", usage: "fade()" },
      { importName: "slide", from: "@remotion/transitions/slide", usage: 'slide({ direction: "from-right" })' },
      { importName: "flip", from: "@remotion/transitions/flip", usage: 'flip({ direction: "from-bottom" })' },
      { importName: "wipe", from: "@remotion/transitions/wipe", usage: 'wipe({ direction: "from-right" })' },
      { importName: "clockWipe", from: "@remotion/transitions/clock-wipe", usage: "clockWipe()" },
    ],
  },

  // ─── Standalone Category-Based Presets ───

  "storygraph-explainer": {
    id: "storygraph-explainer",
    displayName: "storygraph 知識圖譜建構系統介紹",
    abbreviation: "sge",
    chapterBased: true,
    standalone: false,
    category: "tech_explainer",
    contentScenePrefix: "", // not used — tech explainer has named scenes
    defaultContentScenes: 7, // Problem + Architecture + Feature×3 + Demo + Comparison
    charactersImportPath: "../../shared/src/fonts",
    componentsImportPath: "../../shared/src/components",
    ttsScriptPath: "../assets/scripts/generate-tts.ts",
    language: "zh-TW",
    voiceCharacters: ["narrator"],
    transitions: [
      { importName: "fade", from: "@remotion/transitions/fade", usage: "fade()" },
      { importName: "slide", from: "@remotion/transitions/slide", usage: 'slide({ direction: "from-right" })' },
    ],
  },
};

export function getSeriesConfig(seriesId: string): SeriesConfig | null {
  return SERIES_REGISTRY[seriesId] ?? null;
}

export function requireSeriesConfig(seriesId: string): SeriesConfig {
  const config = SERIES_REGISTRY[seriesId];
  if (!config) {
    console.error(`ERROR: Unknown series "${seriesId}"`);
    console.error(`Available: ${Object.keys(SERIES_REGISTRY).join(", ")}`);
    process.exit(1);
  }
  return config;
}
