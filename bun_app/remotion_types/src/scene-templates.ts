/**
 * Scene structure templates per video category.
 *
 * Each template defines what to scaffold for a new Remotion project:
 * - Scene component code generation hints
 * - Default props and data shapes
 * - Sequence layout (start frames, durations)
 *
 * Used by the scaffolding system to auto-generate scene files.
 */

import type { VideoCategoryId, VideoCategory, SceneTemplate } from "./category-types";
import { VIDEO_CATEGORIES } from "./category-types";

// ─── Scene Data Shapes ───

/** Props for a single scene in the generated composition */
export interface SceneSpec {
  name: string;
  startFrame: number;
  durationInFrames: number;
  props: Record<string, unknown>;
}

/** Full composition spec for scaffolding */
export interface CompositionSpec {
  id: string;
  category: VideoCategoryId;
  totalFrames: number;
  fps: number;
  width: number;
  height: number;
  scenes: SceneSpec[];
}

// ─── Template: Tech Explainer ───

export interface TechExplainerData {
  title: string;
  tagline: string;
  painPoint: string;
  /** Pipeline stages for ArchitectureScene */
  pipeline: Array<{
    name: string;
    icon: string;
    description: string;
  }>;
  /** Features to showcase */
  features: Array<{
    name: string;
    description: string;
    visual: "icon" | "diagram" | "code" | "screenshot";
  }>;
  /** Demo workflow steps */
  demoSteps: string[];
  /** Before/after comparison */
  comparison?: {
    before: string;
    after: string;
  };
  cta: string;
  links: string[];
}

export function buildTechExplainerSpec(data: TechExplainerData, targetDurationSec: number = 90): CompositionSpec {
  const fps = 30;
  const totalFrames = targetDurationSec * fps;
  const cat = VIDEO_CATEGORIES.tech_explainer;

  const scenes: SceneSpec[] = [];
  let frame = 0;

  // Fixed scene durations
  const titleFrames = 120;    // 4s
  const problemFrames = 150;  // 5s
  const archFrames = 240;     // 8s
  const demoFrames = 180;     // 6s
  const compFrames = 120;     // 4s
  const outroFrames = 120;    // 4s

  // TitleScene
  scenes.push({ name: "TitleScene", startFrame: frame, durationInFrames: titleFrames, props: { title: data.title, tagline: data.tagline } });
  frame += titleFrames;

  // ProblemScene
  scenes.push({ name: "ProblemScene", startFrame: frame, durationInFrames: problemFrames, props: { painPoint: data.painPoint } });
  frame += problemFrames;

  // ArchitectureScene — pipeline visualization
  scenes.push({ name: "ArchitectureScene", startFrame: frame, durationInFrames: archFrames, props: { pipeline: data.pipeline } });
  frame += archFrames;

  // FeatureScene ×N — cap at 10s each, auto-extend total duration
  const fixedTotal = titleFrames + problemFrames + archFrames + demoFrames + (data.comparison ? compFrames : 0) + outroFrames;
  const perFeature = Math.min(300, Math.max(120, Math.floor((totalFrames - fixedTotal) / Math.max(1, data.features.length))));
  for (const feature of data.features) {
    scenes.push({ name: "FeatureScene", startFrame: frame, durationInFrames: perFeature, props: { ...feature } });
    frame += perFeature;
  }

  // DemoScene
  scenes.push({ name: "DemoScene", startFrame: frame, durationInFrames: demoFrames, props: { steps: data.demoSteps } });
  frame += demoFrames;

  // ComparisonScene (optional)
  if (data.comparison) {
    scenes.push({ name: "ComparisonScene", startFrame: frame, durationInFrames: compFrames, props: data.comparison });
    frame += compFrames;
  }

  // OutroScene
  scenes.push({ name: "OutroScene", startFrame: frame, durationInFrames: outroFrames, props: { cta: data.cta, links: data.links } });
  frame += outroFrames;

  return {
    id: data.title.toLowerCase().replace(/\s+/g, "-"),
    category: "tech_explainer",
    totalFrames,
    fps,
    width: 1920,
    height: 1080,
    scenes,
  };
}

// ─── Template: Narrative Drama ───

export interface NarrativeDramaData {
  title: string;
  episodeTitle: string;
  chapterNum: number;
  episodeNum: number;
  characters: Array<{ id: string; name: string; side: "left" | "right" }>;
  scenes: Array<{
    id: string;
    background: string;
    dialogLines: Array<{ character: string; text: string; emotion?: string }>;
    effects?: string[];
  }>;
  outroQuest?: string;
}

export function buildNarrativeDramaSpec(data: NarrativeDramaData, fps: number = 30): CompositionSpec {
  const scenes: SceneSpec[] = [];
  let frame = 0;

  // TitleScene (2s)
  scenes.push({ name: "TitleScene", startFrame: frame, durationInFrames: 60, props: { title: data.title, subtitle: `第${data.chapterNum}章 第${data.episodeNum}集：${data.episodeTitle}` } });
  frame += 60;

  // ContentScene ×N (5-10s each, based on dialog count)
  for (const scene of data.scenes) {
    const duration = Math.max(150, scene.dialogLines.length * 60);
    scenes.push({
      name: "ContentScene",
      startFrame: frame,
      durationInFrames: duration,
      props: {
        id: scene.id,
        background: scene.background,
        dialogLines: scene.dialogLines,
        characters: data.characters,
        effects: scene.effects ?? [],
      },
    });
    frame += duration;
  }

  // OutroScene (2s)
  scenes.push({ name: "OutroScene", startFrame: frame, durationInFrames: 60, props: { questBadge: data.outroQuest } });
  frame += 60;

  return {
    id: `${data.title.toLowerCase().replace(/\s+/g, "-")}-ch${data.chapterNum}-ep${data.episodeNum}`,
    category: "narrative_drama",
    totalFrames: frame,
    fps,
    width: 1920,
    height: 1080,
    scenes,
  };
}

// ─── Template: Galgame VN ───

export interface GalgameVNData {
  title: string;
  episodeNum: number;
  characters: Array<{ id: string; name: string }>;
  jokes: Array<{
    setup: Array<{ character: string; text: string; emotion?: string }>;
    punchline: Array<{ character: string; text: string; emotion?: string }>;
  }>;
  nextTeaser?: string;
}

export function buildGalgameVNSpec(data: GalgameVNData, fps: number = 30): CompositionSpec {
  const scenes: SceneSpec[] = [];
  let frame = 0;

  // TitleScene (2s)
  scenes.push({ name: "TitleScene", startFrame: frame, durationInFrames: 60, props: { title: data.title, episodeNum: data.episodeNum } });
  frame += 60;

  // JokeScene ×N
  for (let i = 0; i < data.jokes.length; i++) {
    const joke = data.jokes[i];
    const allLines = [...joke.setup, ...joke.punchline];
    const duration = Math.max(120, allLines.length * 50);
    scenes.push({
      name: "JokeScene",
      startFrame: frame,
      durationInFrames: duration,
      props: {
        id: `joke-${i + 1}`,
        dialogLines: allLines,
        setup: joke.setup,
        punchline: joke.punchline,
        characters: data.characters,
      },
    });
    frame += duration;
  }

  // OutroScene (2s)
  scenes.push({ name: "OutroScene", startFrame: frame, durationInFrames: 45, props: { nextTeaser: data.nextTeaser } });
  frame += 45;

  return {
    id: `${data.title.toLowerCase().replace(/\s+/g, "-")}-ep${data.episodeNum}`,
    category: "galgame_vn",
    totalFrames: frame,
    fps,
    width: 1920,
    height: 1080,
    scenes,
  };
}

// ─── Template: Listicle ───

export interface ListicleData {
  title: string;
  hookStatement: string;
  items: Array<{
    rank: number;
    title: string;
    description: string;
    visual?: string;
  }>;
  verdict?: string;
  cta: string;
}

export function buildListicleSpec(data: ListicleData, fps: number = 30): CompositionSpec {
  const scenes: SceneSpec[] = [];
  let frame = 0;

  // HookScene (2s)
  scenes.push({ name: "HookScene", startFrame: frame, durationInFrames: 60, props: { title: data.title, hookStatement: data.hookStatement } });
  frame += 60;

  // ItemScene ×N (4s each)
  for (const item of data.items) {
    scenes.push({ name: "ItemScene", startFrame: frame, durationInFrames: 120, props: item });
    frame += 120;
  }

  // SummaryScene (2s)
  scenes.push({ name: "SummaryScene", startFrame: frame, durationInFrames: 60, props: { items: data.items, verdict: data.verdict } });
  frame += 60;

  // OutroScene (1.5s)
  scenes.push({ name: "OutroScene", startFrame: frame, durationInFrames: 45, props: { cta: data.cta } });
  frame += 45;

  return {
    id: data.title.toLowerCase().replace(/\s+/g, "-"),
    category: "listicle",
    totalFrames: frame,
    fps,
    width: 1920,
    height: 1080,
    scenes,
  };
}

// ─── Template: Tutorial ───

export interface TutorialData {
  title: string;
  prerequisites: string[];
  steps: Array<{
    instruction: string;
    code?: string;
    result?: string;
  }>;
  keyTakeaway: string;
  cta: string;
}

export function buildTutorialSpec(data: TutorialData, fps: number = 30): CompositionSpec {
  const scenes: SceneSpec[] = [];
  let frame = 0;

  // IntroScene (2s)
  scenes.push({ name: "IntroScene", startFrame: frame, durationInFrames: 60, props: { title: data.title, prerequisites: data.prerequisites } });
  frame += 60;

  // StepScene ×N (6s each)
  const totalSteps = data.steps.length;
  for (let i = 0; i < totalSteps; i++) {
    const step = data.steps[i];
    scenes.push({
      name: "StepScene",
      startFrame: frame,
      durationInFrames: 180,
      props: { stepNum: i + 1, totalSteps, ...step },
    });
    frame += 180;
  }

  // ResultScene (3s)
  scenes.push({ name: "ResultScene", startFrame: frame, durationInFrames: 90, props: { steps: data.steps } });
  frame += 90;

  // RecapScene (2s)
  scenes.push({ name: "RecapScene", startFrame: frame, durationInFrames: 60, props: { steps: data.steps, keyTakeaway: data.keyTakeaway } });
  frame += 60;

  // OutroScene (1.5s)
  scenes.push({ name: "OutroScene", startFrame: frame, durationInFrames: 45, props: { cta: data.cta } });
  frame += 45;

  return {
    id: data.title.toLowerCase().replace(/\s+/g, "-"),
    category: "tutorial",
    totalFrames: frame,
    fps,
    width: 1920,
    height: 1080,
    scenes,
  };
}

// ─── Template: Data Story ───

export interface DataStoryData {
  title: string;
  dataSource: string;
  charts: Array<{
    chartType: "line" | "bar" | "candle" | "pie" | "area";
    title: string;
    data: Record<string, unknown>;
    insight: string;
  }>;
  trends: Array<{
    title: string;
    annotation: string;
  }>;
  summary: string;
  callToAction: string;
}

export function buildDataStorySpec(data: DataStoryData, fps: number = 30): CompositionSpec {
  const scenes: SceneSpec[] = [];
  let frame = 0;

  // DataIntroScene (2s)
  scenes.push({ name: "DataIntroScene", startFrame: frame, durationInFrames: 60, props: { title: data.title, dataSource: data.dataSource } });
  frame += 60;

  // ChartScene ×N (6s each)
  for (const chart of data.charts) {
    scenes.push({ name: "ChartScene", startFrame: frame, durationInFrames: 180, props: chart });
    frame += 180;
  }

  // TrendScene ×N (4s each)
  for (const trend of data.trends) {
    scenes.push({ name: "TrendScene", startFrame: frame, durationInFrames: 120, props: trend });
    frame += 120;
  }

  // ConclusionScene (2s)
  scenes.push({ name: "ConclusionScene", startFrame: frame, durationInFrames: 60, props: { summary: data.summary, callToAction: data.callToAction } });
  frame += 60;

  return {
    id: data.title.toLowerCase().replace(/\s+/g, "-"),
    category: "data_story",
    totalFrames: frame,
    fps,
    width: 1920,
    height: 1080,
    scenes,
  };
}

// ─── Template: Shorts / Meme ───

export interface ShortsMemeData {
  hook: string;
  visual: string;
  setup: string;
  punchline: string;
  reaction?: string;
  loopText?: string;
}

export function buildShortsMemeSpec(data: ShortsMemeData, fps: number = 30): CompositionSpec {
  const scenes: SceneSpec[] = [];
  let frame = 0;

  // HookScene (1s)
  scenes.push({ name: "HookScene", startFrame: frame, durationInFrames: 30, props: { hook: data.hook, visual: data.visual } });
  frame += 30;

  // PunchlineScene (3s)
  scenes.push({ name: "PunchlineScene", startFrame: frame, durationInFrames: 90, props: { setup: data.setup, punchline: data.punchline, reaction: data.reaction } });
  frame += 90;

  // LoopOutroScene (1s)
  scenes.push({ name: "LoopOutroScene", startFrame: frame, durationInFrames: 30, props: { loopText: data.loopText } });
  frame += 30;

  return {
    id: `shorts-${Date.now()}`,
    category: "shorts_meme",
    totalFrames: frame,
    fps,
    width: 1080,
    height: 1920,
    scenes,
  };
}

// ─── Generic Builder ───

const BUILDERS: Record<VideoCategoryId, (data: any, fps?: number) => CompositionSpec> = {
  narrative_drama: buildNarrativeDramaSpec,
  galgame_vn: buildGalgameVNSpec,
  tech_explainer: buildTechExplainerSpec,
  data_story: buildDataStorySpec,
  listicle: buildListicleSpec,
  tutorial: buildTutorialSpec,
  shorts_meme: buildShortsMemeSpec,
};

/** Build a composition spec for any category */
export function buildCompositionSpec(category: VideoCategoryId, data: unknown, fps?: number): CompositionSpec {
  const builder = BUILDERS[category];
  if (!builder) throw new Error(`No builder for category: ${category}`);
  return builder(data, fps);
}
