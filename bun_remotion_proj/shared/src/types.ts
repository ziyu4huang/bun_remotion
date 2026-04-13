// ─── Emotion ────────────────────────────────────────────────────────────────────
// Superset of weapon-forger's CharacterPose and my-core-is-boss's Emotion.
// Image naming: {character}-{emotion}.png (e.g. zhoumo-angry.png)

export type Emotion =
  | "default"
  | "angry"
  | "shocked"
  | "smirk"
  | "nervous"
  | "smile"
  | "laugh"
  | "sweat"
  | "think"
  | "cry"
  | "gloating"
  | "confused"
  | "chibi";

// ─── Comic Effects ─────────────────────────────────────────────────────────────

export type ComicEffect =
  | "surprise"
  | "shock"
  | "sweat"
  | "sparkle"
  | "heart"
  | "anger"
  | "dots"
  | "cry"
  | "laugh"
  | "fire"
  | "shake"
  | "gloating";

// ─── Character ─────────────────────────────────────────────────────────────────

export type CharacterSide = "left" | "center" | "right";

export type AnimationIntensity = "subtle" | "enhanced";

export interface CharacterConfig {
  name: string;
  color: string;
  bgColor: string;
  position: CharacterSide;
  voice: string;
  /** Available emotions for this character (my-core-is-boss pattern) */
  emotions?: Emotion[];
  /** Fallback emotion when none specified (default: "default") */
  defaultEmotion?: Emotion;
}

// ─── Dialog ────────────────────────────────────────────────────────────────────

export interface DialogLine {
  character: string;
  text: string;
  emotion?: Emotion;
  effect?: ComicEffect | ComicEffect[];
  sfx?: MangaSfxEvent[];
}

// ─── Manga SFX ─────────────────────────────────────────────────────────────────

export interface MangaSfxEvent {
  text: string;
  x: number;
  y: number;
  color?: string;
  rotation?: number;
  fontSize?: number;
  font?: "brush" | "playful" | "action";
  delay?: number;
}

// ─── Image Manifests (JSON schema for fixture images) ──────────────────────────

export interface CharacterImageManifest {
  file: string;
  type: "emotion" | "chibi" | "normal";
  emotion?: Emotion;
  character: string;
  facing: "LEFT" | "RIGHT";
  description?: string;
  prompt: string;
  backgroundStrategy?: string;
  color?: string;
  width?: string;
}

export interface BackgroundImageManifest {
  file: string;
  description: string;
  prompt: string;
  color: string;
  chapters?: number[];
}

// ─── Episode Image Manifest (declares which images an episode needs) ───────────

export interface EpisodeImageManifest {
  characters: string[];
  backgrounds: string[];
}
