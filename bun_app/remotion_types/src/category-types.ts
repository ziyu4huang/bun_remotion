/**
 * YouTube video category taxonomy for Remotion project scaffolding.
 *
 * Each category defines:
 * - Scene structure template (what scenes to generate)
 * - Component mapping (which shared components to use)
 * - Animation style hints
 * - Audio/TTS requirements
 * - Default duration and aspect ratio
 *
 * Categories are independent of genre presets in series-config.ts.
 * Genre = story content style (xianxia_comedy, galgame_meme)
 * Category = video format/structure (narrative_drama, tech_explainer, listicle)
 *
 * A series has BOTH a genre AND a category:
 *   weapon-forger → xianxia_comedy + narrative_drama
 *   storygraph-explainer → (none) + tech_explainer
 *   taiwan-stock-market → (none) + data_story
 */

// ─── Category IDs ───

export type VideoCategoryId =
  | "narrative_drama"
  | "galgame_vn"
  | "tech_explainer"
  | "data_story"
  | "listicle"
  | "tutorial"
  | "shorts_meme";

// ─── Scene Template ───

export interface SceneTemplate {
  /** Scene component name (e.g., "TitleScene") */
  name: string;
  /** Factory function name for the scene */
  factory: string;
  /** Required props beyond the standard ones */
  requiredProps: string[];
  /** Typical frame count range [min, max] */
  frameRange: [number, number];
  /** Whether this scene can repeat (e.g., FeatureScene ×N) */
  repeatable: boolean;
}

// ─── Animation Style ───

export type AnimationStyle = "spring_energy" | "tween_clean" | "spring_pop" | "tween_sequential" | "fast_cuts";

// ─── Audio Mode ───

export type AudioMode = "character_voices" | "single_narrator" | "narrator_plus_sfx" | "sfx_only" | "music_plus_sfx";

// ─── Aspect Ratio ───

export type AspectRatio = "16:9" | "9:16" | "1:1";

// ─── Category Definition ───

export interface VideoCategory {
  id: VideoCategoryId;
  label: { en: string; zh_TW: string };
  description: string;
  /** Ordered scene templates — scaffold generates these */
  scenes: SceneTemplate[];
  /** Which @bun-remotion/shared components to import */
  components: string[];
  /** Overall animation style hint */
  animationStyle: AnimationStyle;
  /** Audio requirements */
  audioMode: AudioMode;
  /** Default video duration range in seconds */
  durationRange: [number, number];
  /** Default aspect ratio */
  aspectRatio: AspectRatio;
  /** Default fps */
  fps: number;
  /** Which dialog system to use */
  dialogSystem: "dialogLines_array" | "narration_script" | "item_list" | "step_guide" | "none";
  /** PLAN.md template key */
  planTemplateKey: string;
  /** Example YouTube references */
  examples: string[];
}

// ─── Category Registry ───

export const VIDEO_CATEGORIES: Record<VideoCategoryId, VideoCategory> = {

  // ─── 1. Narrative Drama (敘事劇情) ───

  narrative_drama: {
    id: "narrative_drama",
    label: { en: "Narrative Drama", zh_TW: "敘事劇情" },
    description: "Character-driven story with dialog, emotions, and multi-episode arcs. Battle FX optional.",
    scenes: [
      { name: "TitleScene", factory: "createTitleScene", requiredProps: ["title", "subtitle"], frameRange: [60, 90], repeatable: false },
      { name: "ContentScene", factory: "createContentScene", requiredProps: ["dialogLines", "characters"], frameRange: [150, 300], repeatable: true },
      { name: "BattleScene", factory: "createBattleScene", requiredProps: ["attacker", "defender", "effects"], frameRange: [120, 240], repeatable: true },
      { name: "TransitionScene", factory: "createTransitionScene", requiredProps: ["text"], frameRange: [30, 45], repeatable: true },
      { name: "OutroScene", factory: "createOutroScene", requiredProps: ["questBadge"], frameRange: [60, 90], repeatable: false },
    ],
    components: ["CharacterSprite", "DialogBox", "BackgroundLayer", "ComicEffects", "MangaSfx", "SystemOverlay"],
    animationStyle: "spring_energy",
    audioMode: "character_voices",
    durationRange: [40, 120],
    aspectRatio: "16:9",
    fps: 30,
    dialogSystem: "dialogLines_array",
    planTemplateKey: "narrative_drama",
    examples: ["誰讓他煉器的 (weapon-forger)", "我的核心是大佬 (my-core-is-boss)", "系統文小說梗 (xianxia-system-meme)"],
  },

  // ─── 2. Galgame VN (美少女遊戲風) ───

  galgame_vn: {
    id: "galgame_vn",
    label: { en: "Galgame VN", zh_TW: "美少女遊戲風" },
    description: "Visual novel style with character sprites, dialog boxes, emotional transitions. Meme/joke driven.",
    scenes: [
      { name: "TitleScene", factory: "createTitleScene", requiredProps: ["title", "episodeNum"], frameRange: [60, 90], repeatable: false },
      { name: "JokeScene", factory: "createJokeScene", requiredProps: ["dialogLines", "setup", "punchline"], frameRange: [120, 240], repeatable: true },
      { name: "OutroScene", factory: "createOutroScene", requiredProps: ["nextTeaser"], frameRange: [45, 60], repeatable: false },
    ],
    components: ["CharacterSprite", "DialogBox", "BackgroundLayer", "ComicEffects", "MangaSfx"],
    animationStyle: "spring_energy",
    audioMode: "character_voices",
    durationRange: [30, 90],
    aspectRatio: "16:9",
    fps: 30,
    dialogSystem: "dialogLines_array",
    planTemplateKey: "galgame_vn",
    examples: ["美少女梗圖劇場", "青春笑話"],
  },

  // ─── 3. Tech Explainer (技術講解) ───

  tech_explainer: {
    id: "tech_explainer",
    label: { en: "Tech Explainer", zh_TW: "技術講解" },
    description: "Product/tool introduction with architecture diagrams, feature showcase, and workflow demos.",
    scenes: [
      { name: "TitleScene", factory: "createTitleScene", requiredProps: ["title", "tagline"], frameRange: [90, 120], repeatable: false },
      { name: "ProblemScene", factory: "createProblemScene", requiredProps: ["painPoint", "chaosVisual"], frameRange: [90, 150], repeatable: false },
      { name: "ArchitectureScene", factory: "createArchitectureScene", requiredProps: ["pipeline", "nodes"], frameRange: [180, 300], repeatable: false },
      { name: "FeatureScene", factory: "createFeatureScene", requiredProps: ["featureName", "description", "visual"], frameRange: [90, 150], repeatable: true },
      { name: "DemoScene", factory: "createDemoScene", requiredProps: ["workflow", "steps"], frameRange: [120, 240], repeatable: false },
      { name: "ComparisonScene", factory: "createComparisonScene", requiredProps: ["before", "after"], frameRange: [90, 120], repeatable: false },
      { name: "OutroScene", factory: "createOutroScene", requiredProps: ["cta", "links"], frameRange: [60, 90], repeatable: false },
    ],
    components: ["BackgroundLayer", "DialogBox"],
    animationStyle: "tween_clean",
    audioMode: "single_narrator",
    durationRange: [60, 180],
    aspectRatio: "16:9",
    fps: 30,
    dialogSystem: "narration_script",
    planTemplateKey: "tech_explainer",
    examples: ["Claude Code Intro", "storygraph Explainer", "Fireship-style explainers"],
  },

  // ─── 4. Data Story (數據故事) ───

  data_story: {
    id: "data_story",
    label: { en: "Data Story", zh_TW: "數據故事" },
    description: "Data-driven narrative with animated charts, trend reveals, and insight narration.",
    scenes: [
      { name: "DataIntroScene", factory: "createDataIntroScene", requiredProps: ["title", "dataSource"], frameRange: [60, 90], repeatable: false },
      { name: "ChartScene", factory: "createChartScene", requiredProps: ["chartType", "data", "insight"], frameRange: [150, 300], repeatable: true },
      { name: "TrendScene", factory: "createTrendScene", requiredProps: ["trendData", "annotation"], frameRange: [120, 180], repeatable: true },
      { name: "ConclusionScene", factory: "createConclusionScene", requiredProps: ["summary", "callToAction"], frameRange: [60, 90], repeatable: false },
    ],
    components: ["BackgroundLayer", "CandleChart", "Candle"],
    animationStyle: "tween_sequential",
    audioMode: "narrator_plus_sfx",
    durationRange: [45, 120],
    aspectRatio: "16:9",
    fps: 30,
    dialogSystem: "narration_script",
    planTemplateKey: "data_story",
    examples: ["台灣股市解析", "Market trends", "Johnny Harris-style data stories"],
  },

  // ─── 5. Listicle / Top N (盤點清單) ───

  listicle: {
    id: "listicle",
    label: { en: "Listicle / Top N", zh_TW: "盤點清單" },
    description: "Numbered list with dramatic reveals, rankings, and countdown animations.",
    scenes: [
      { name: "HookScene", factory: "createHookScene", requiredProps: ["title", "hookStatement"], frameRange: [45, 75], repeatable: false },
      { name: "ItemScene", factory: "createItemScene", requiredProps: ["rank", "title", "description", "visual"], frameRange: [90, 150], repeatable: true },
      { name: "SummaryScene", factory: "createSummaryScene", requiredProps: ["items", "verdict"], frameRange: [60, 90], repeatable: false },
      { name: "OutroScene", factory: "createOutroScene", requiredProps: ["cta"], frameRange: [30, 45], repeatable: false },
    ],
    components: ["BackgroundLayer", "ComicEffects", "MangaSfx"],
    animationStyle: "spring_pop",
    audioMode: "narrator_plus_sfx",
    durationRange: [60, 180],
    aspectRatio: "16:9",
    fps: 30,
    dialogSystem: "item_list",
    planTemplateKey: "listicle",
    examples: ["Top 10 AI tools 2025", "5 best practices for X", "WatchMojo-style countdowns"],
  },

  // ─── 6. Tutorial / How-To (教學指南) ───

  tutorial: {
    id: "tutorial",
    label: { en: "Tutorial / How-To", zh_TW: "教學指南" },
    description: "Step-by-step guide with code highlighting, progress tracking, and result demos.",
    scenes: [
      { name: "IntroScene", factory: "createIntroScene", requiredProps: ["title", "prerequisites"], frameRange: [60, 90], repeatable: false },
      { name: "StepScene", factory: "createStepScene", requiredProps: ["stepNum", "totalSteps", "instruction", "code?"], frameRange: [150, 300], repeatable: true },
      { name: "ResultScene", factory: "createResultScene", requiredProps: ["before", "after", "explanation"], frameRange: [90, 120], repeatable: false },
      { name: "RecapScene", factory: "createRecapScene", requiredProps: ["steps", "keyTakeaway"], frameRange: [60, 90], repeatable: false },
      { name: "OutroScene", factory: "createOutroScene", requiredProps: ["cta"], frameRange: [30, 45], repeatable: false },
    ],
    components: ["BackgroundLayer", "DialogBox"],
    animationStyle: "tween_sequential",
    audioMode: "single_narrator",
    durationRange: [120, 300],
    aspectRatio: "16:9",
    fps: 30,
    dialogSystem: "step_guide",
    planTemplateKey: "tutorial",
    examples: ["How to build a KG", "React tutorial", "Traversy Media-style tutorials"],
  },

  // ─── 7. Shorts / Meme (短影音迷因) ───

  shorts_meme: {
    id: "shorts_meme",
    label: { en: "Shorts / Meme", zh_TW: "短影音迷因" },
    description: "Quick punchy content (15-60s) with hook, punchline, and loop-friendly ending.",
    scenes: [
      { name: "HookScene", factory: "createHookScene", requiredProps: ["hook", "visual"], frameRange: [15, 30], repeatable: false },
      { name: "PunchlineScene", factory: "createPunchlineScene", requiredProps: ["setup", "punchline", "reaction"], frameRange: [45, 120], repeatable: false },
      { name: "LoopOutroScene", factory: "createLoopOutroScene", requiredProps: ["loopText?"], frameRange: [15, 30], repeatable: false },
    ],
    components: ["BackgroundLayer", "ComicEffects", "MangaSfx"],
    animationStyle: "fast_cuts",
    audioMode: "music_plus_sfx",
    durationRange: [15, 60],
    aspectRatio: "9:16",
    fps: 30,
    dialogSystem: "none",
    planTemplateKey: "shorts_meme",
    examples: ["TikTok memes", "Reels", "YouTube Shorts reactions"],
  },
};

// ─── Helpers ───

/** Get category by ID */
export function getCategory(id: VideoCategoryId): VideoCategory {
  return VIDEO_CATEGORIES[id];
}

/** List all category IDs */
export function listCategoryIds(): VideoCategoryId[] {
  return Object.keys(VIDEO_CATEGORIES) as VideoCategoryId[];
}

/** Detect category from project directory name heuristics */
export function detectCategoryFromDirname(dirname: string): VideoCategoryId {
  const lower = dirname.toLowerCase();

  // Tech explainer
  if (lower.includes("intro") || lower.includes("explainer") || lower.includes("demo")) return "tech_explainer";
  if (lower.includes("claude-code-intro")) return "tech_explainer";

  // Data story
  if (lower.includes("stock") || lower.includes("chart") || lower.includes("data")) return "data_story";
  if (lower.includes("taiwan-stock")) return "data_story";

  // Listicle
  if (lower.includes("top") || lower.includes("list") || lower.includes("rank") || lower.includes("盤點")) return "listicle";

  // Tutorial
  if (lower.includes("tutorial") || lower.includes("how-to") || lower.includes("guide")) return "tutorial";

  // Shorts / meme (but not galgame-meme which is galgame_vn)
  if (lower.includes("short") || lower.includes("shorts")) return "shorts_meme";

  // Galgame VN
  if (lower.includes("galgame") || lower.includes("gal-")) return "galgame_vn";

  // Narrative drama (weapon-forger, my-core-is-boss, xianxia-system-meme)
  if (lower.includes("weapon-forger")) return "narrative_drama";
  if (lower.includes("my-core-is-boss")) return "narrative_drama";
  if (lower.includes("xianxia-system-meme")) return "narrative_drama";
  if (lower.includes("xianxia")) return "narrative_drama";

  // Default: narrative drama is the most common type
  return "narrative_drama";
}

/** Map existing genre presets to suggested categories */
export function genreToCategory(genre: string): VideoCategoryId {
  switch (genre) {
    case "xianxia_comedy":
    case "novel_system":
      return "narrative_drama";
    case "galgame_meme":
      return "galgame_vn";
    default:
      return "narrative_drama";
  }
}

/** Get scene count estimate for a category */
export function estimateSceneCount(category: VideoCategoryId, targetDurationSec: number): Record<string, number> {
  const cat = VIDEO_CATEGORIES[category];
  const totalFrames = targetDurationSec * cat.fps;
  const result: Record<string, number> = {};

  let remaining = totalFrames;
  const nonRepeatable = cat.scenes.filter(s => !s.repeatable);
  const repeatable = cat.scenes.filter(s => s.repeatable);

  for (const scene of nonRepeatable) {
    const avg = (scene.frameRange[0] + scene.frameRange[1]) / 2;
    result[scene.name] = 1;
    remaining -= avg;
  }

  if (repeatable.length > 0 && remaining > 0) {
    const avgRepeatable = mean(repeatable.map(s => (s.frameRange[0] + s.frameRange[1]) / 2));
    const count = Math.max(1, Math.round(remaining / avgRepeatable));
    for (const scene of repeatable) {
      result[scene.name] = count;
    }
  }

  return result;
}

function mean(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
}
