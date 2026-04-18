// ─── Existing (stock chart related) ──────────────────────────────────────────
export { FadeText } from "./FadeText";
export { Candle } from "./Candle";
export type { CandleData } from "./Candle";
export { CandleChart } from "./CandleChart";

// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  Emotion,
  ComicEffect,
  CharacterSide,
  AnimationIntensity,
  CharacterConfig,
  DialogLine,
  MangaSfxEvent,
  CharacterImageManifest,
  BackgroundImageManifest,
  EpisodeImageManifest,
} from "./types";

// ─── Fonts ───────────────────────────────────────────────────────────────────
export {
  notoSansTC,
  maShanZheng,
  zcoolKuaiLe,
  zhiMangXing,
  sfxFont,
} from "./fonts";

// ─── Utils ───────────────────────────────────────────────────────────────────
export {
  resolveCharacterImage,
  effectToEmoji,
} from "./utils";

// ─── Components ──────────────────────────────────────────────────────────────
export {
  CharacterSprite,
  DialogBox,
  BackgroundLayer,
  ComicEffects,
  MangaSfx,
  SystemNotification,
  SystemMessage,
  PlotBeatOverlay,
  TensionMeter,
  CharacterStateOverlay,
} from "./components";

// ─── Story Graph Utilities ──────────────────────────────────────────────────
export {
  loadSceneTensions,
  loadPlotBeats,
  loadCharacterGrowth,
} from "./story-graph";
export type {
  SceneTension,
  PlotBeatData,
  CharacterGrowthData,
} from "./story-graph";
