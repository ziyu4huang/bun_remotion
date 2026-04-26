/**
 * Narration scripts for 我的核心是大佬 第3章 第5集
 *
 * Voice mapping is centralized in assets/voice-config.json.
 * Characters: linyi, zhaoxiaoqi, xiaoelder, narrator
 */

export type VoiceCharacter = "linyi" | "zhaoxiaoqi" | "xiaoelder" | "narrator";

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

export const NARRATOR_LANG = "zh-TW";

export const narrations: NarrationScript[] = [
  // ─── TitleScene ──────────────────────────────────────────────────
  {
    scene: "TitleScene",
    file: "01-title.wav",
    segments: [
      // TODO: Add narration segments
    ],
    fullText: "",
  },

  // ─── ContentScene1 ───────────────────────────────────────────────
  {
    scene: "ContentScene1",
    file: "02-contentscene1.wav",
    segments: [
      // TODO: Add narration segments
    ],
    fullText: "",
  },

  // ─── ContentScene2 ───────────────────────────────────────────────
  {
    scene: "ContentScene2",
    file: "03-contentscene2.wav",
    segments: [
      // TODO: Add narration segments
    ],
    fullText: "",
  },

  // ─── ContentScene3 ───────────────────────────────────────────────
  {
    scene: "ContentScene3",
    file: "04-contentscene3.wav",
    segments: [
      // TODO: Add narration segments
    ],
    fullText: "",
  },

  // ─── OutroScene ──────────────────────────────────────────────────
  {
    scene: "OutroScene",
    file: "05-outro.wav",
    segments: [
      // TODO: Add narration segments
    ],
    fullText: "",
  },
];
