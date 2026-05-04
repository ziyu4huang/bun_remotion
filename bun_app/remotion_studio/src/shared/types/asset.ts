// ── Assets ──

export type AssetType = "character" | "background" | "audio";
export type AssetFormat = "png" | "jpg" | "jpeg" | "wav" | "mp3";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  format: AssetFormat;
  seriesId: string;
  episodeId?: string;
  path: string;
  size: number;
}

export interface SeriesAssets {
  seriesId: string;
  characters: Asset[];
  backgrounds: Asset[];
  audio: Asset[];
}

export interface AssetSummary {
  seriesId: string;
  seriesName: string;
  characters: number;
  backgrounds: number;
  audio: number;
}

// ── TTS ──

export interface TTSStatus {
  episodeId: string;
  hasNarration: boolean;
  hasAudio: boolean;
  audioFiles: string[];
  voiceMap?: Record<string, string>;
}

export interface VoiceInfo {
  id: string;
  name: string;
  gender: "male" | "female";
  engine: "mlx" | "gemini";
  language: string;
  description?: string;
}

// ── Render ──

export interface RenderStatus {
  episodeId: string;
  hasRender: boolean;
  outputPath?: string;
  fileSize?: number;
  modifiedAt?: string;
}

// ── Image Generation ──

export interface ImageStatus {
  seriesId: string;
  characterDir: string;
  backgroundDir: string;
  characters: number;
  backgrounds: number;
}

export interface CharacterImageVariant {
  file: string;
  type: string;
  character: string;
  facing: string;
  prompt: string;
  emotion?: string;
  description?: string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  position: string;
  voice: string;
  appearance: string | null;
  basePrompt: string | null;
  variants: CharacterImageVariant[];
  emotions: string[];
}

export interface ImageGenerateRequest {
  seriesId: string;
  images: Array<{
    filename: string;
    prompt: string;
    aspectRatio?: string;
    resolution?: string;
    metadata?: Record<string, unknown>;
  }>;
  skipExisting?: boolean;
}

// ── Style Guide ──

export interface StyleGuide {
  seriesId: string;
  artStyle: string;
  colorPalette: string;
  mood: string;
  recurringElements: string;
  additionalNotes: string;
  updatedAt: string;
}
