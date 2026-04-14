import { loadFont } from "@remotion/google-fonts/NotoSansTC";
import { loadFont as loadMaShanZheng } from "@remotion/google-fonts/MaShanZheng";
import { loadFont as loadZCOOLKuaiLe } from "@remotion/google-fonts/ZCOOLKuaiLe";
import { loadFont as loadZhiMangXing } from "@remotion/google-fonts/ZhiMangXing";

// ─── Fonts ──────────────────────────────────────────────────────────────────────

export const { fontFamily: notoSansTC } = loadFont("normal", {
  weights: ["400", "700"],
});

// 馬善政 — brush calligraphy, best for manga SFX
export const { fontFamily: maShanZheng } = loadMaShanZheng();

// 站酷快樂體 — playful rounded handwritten, for comedic moments
export const { fontFamily: zcoolKuaiLe } = loadZCOOLKuaiLe();

// 志芒行 — quick-brush calligraphy, dynamic, for action SFX
export const { fontFamily: zhiMangXing } = loadZhiMangXing();

// ─── Emotion Types ──────────────────────────────────────────────────────────────

export type Emotion =
  | "default" | "shock" | "anger" | "smile" | "laugh"
  | "sweat" | "think" | "cry" | "gloating" | "confused"
  | "chibi";

// ─── Characters ─────────────────────────────────────────────────────────────────

/**
 * Characters for 我的核心是大佬 series.
 *
 * - 林逸 (linyi) — 現代玩家穿越，核心系統宿主
 * - 趙小七 (zhaoxiaoqi) — 外門弟子，頭號腦補狂魔
 * - 蕭長老 (xiaoelder) — 天道宗長老，內心戲極多
 * - 陳默 (chenmo) — 另一個穿越者（Ch8+）
 */

export type Character = "linyi" | "zhaoxiaoqi" | "xiaoelder" | "chenmo" | "narrator";

export interface CharacterConfig {
  name: string;
  color: string;
  bgColor: string;
  position: "left" | "center" | "right";
  voice: string;
  emotions: Emotion[];
  defaultEmotion?: Emotion;
}

export const CHARACTERS: Record<Character, CharacterConfig> = {
  linyi: {
    name: "林逸",
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.25)",
    position: "left",
    voice: "uncle_fu",
    emotions: ["default", "shock", "smile", "laugh", "sweat", "confused", "chibi"],
    defaultEmotion: "default",
  },
  zhaoxiaoqi: {
    name: "趙小七",
    color: "#38BDF8",
    bgColor: "rgba(56, 189, 248, 0.25)",
    position: "right",
    voice: "serena",
    emotions: ["default", "shock", "think", "gloating", "cry"],
    defaultEmotion: "default",
  },
  xiaoelder: {
    name: "蕭長老",
    color: "#A78BFA",
    bgColor: "rgba(167, 139, 250, 0.25)",
    position: "center",
    voice: "uncle_fu",
    emotions: ["default", "anger", "shock", "sweat", "cry"],
    defaultEmotion: "default",
  },
  chenmo: {
    name: "陳默",
    color: "#10B981",
    bgColor: "rgba(16, 185, 129, 0.25)",
    position: "right",
    voice: "uncle_fu",
    emotions: ["default", "shock", "smile", "confused", "think"],
    defaultEmotion: "default",
  },
  narrator: {
    name: "旁白",
    color: "#94A3B8",
    bgColor: "rgba(148, 163, 184, 0.25)",
    position: "center",
    voice: "uncle_fu",
    emotions: ["default"],
    defaultEmotion: "default",
  },
};

/**
 * Resolve emotion image filename for a character.
 * emotion undefined → {character}-default.png
 * emotion specified  → {character}-{emotion}.png
 */
export function resolveCharacterImage(
  character: Character,
  emotion?: Emotion,
): string {
  if (emotion && emotion !== "default") return `${character}-${emotion}.png`;
  return `${character}-default.png`;
}

// ─── Comic Effects ──────────────────────────────────────────────────────────────

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

export interface DialogLine {
  character: Character;
  text: string;
  emotion?: Emotion;
  effect?: ComicEffect | ComicEffect[];
  sfx?: MangaSfxEvent[];
}

// ─── Manga SFX Types ───────────────────────────────────────────────────────────

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

export function effectToEmoji(
  effect: ComicEffect | ComicEffect[] | undefined,
): string {
  if (!effect) return "";
  const single = Array.isArray(effect) ? effect[0] : effect;
  const map: Record<ComicEffect, string> = {
    surprise: "😳",
    shock: "😱",
    sweat: "💦",
    sparkle: "✨",
    heart: "❤️",
    anger: "💢",
    dots: "💭",
    cry: "😢",
    laugh: "😆",
    fire: "🔥",
    shake: "😤",
    gloating: "😏",
  };
  return map[single] ?? "";
}

export function normalizeEffects(effect?: ComicEffect | ComicEffect[]): ComicEffect[] {
  if (!effect) return [];
  return Array.isArray(effect) ? effect : [effect];
}

export function sfxFont(font?: "brush" | "playful" | "action"): string {
  switch (font) {
    case "brush": return maShanZheng;
    case "playful": return zcoolKuaiLe;
    case "action": return zhiMangXing;
    default: return maShanZheng;
  }
}
