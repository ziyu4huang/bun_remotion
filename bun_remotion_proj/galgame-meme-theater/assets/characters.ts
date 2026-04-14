import { loadFont } from "@remotion/google-fonts/NotoSansTC";
import { loadFont as loadMaShanZheng } from "@remotion/google-fonts/MaShanZheng";
import { loadFont as loadZCOOLKuaiLe } from "@remotion/google-fonts/ZCOOLKuaiLe";
import { loadFont as loadZhiMangXing } from "@remotion/google-fonts/ZhiMangXing";

export const { fontFamily: notoSansTC } = loadFont("normal", {
  weights: ["400", "700"],
});

// 馬善政 — brush calligraphy, for manga SFX
export const { fontFamily: maShanZheng } = loadMaShanZheng();

// 站酷快樂體 — playful rounded, for comedic SFX
export const { fontFamily: zcoolKuaiLe } = loadZCOOLKuaiLe();

// 志芒行 — quick-brush calligraphy, for action SFX
export const { fontFamily: zhiMangXing } = loadZhiMangXing();

export function sfxFont(font?: "brush" | "playful" | "action"): string {
  switch (font) {
    case "brush": return maShanZheng;
    case "playful": return zcoolKuaiLe;
    case "action": return zhiMangXing;
    default: return maShanZheng;
  }
}

export interface MangaSfxEvent {
  text: string;
  x: number;
  y: number;
  color: string;
  rotation?: number;
  fontSize?: number;
  font?: "brush" | "playful" | "action";
  delay?: number;
}

/**
 * Characters for 美少女梗圖劇場 第四集 (Beautiful Girl Meme Theater EP4)
 *
 * - 小雪 (Xiaoxue) — 元氣系美少女，粉紅雙馬尾，熱情奔放
 * - 小月 (Xiaoyue) — 高冷系美少女，黑長直，毒舌學霸
 * - 小樱 (Xiaoying) — 天然呆美少女，橘色短髮，社恐常駐
 */
export type Character = "xiaoxue" | "xiaoyue" | "xiaoying";

export interface CharacterConfig {
  name: string;
  color: string;
  bgColor: string;
  position: "left" | "center" | "right";
  voice: string;
}

export const CHARACTERS: Record<Character, CharacterConfig> = {
  xiaoxue: {
    name: "小雪",
    color: "#F472B6",
    bgColor: "rgba(244, 114, 182, 0.25)",
    position: "left",
    voice: "serena",
  },
  xiaoyue: {
    name: "小月",
    color: "#818CF8",
    bgColor: "rgba(129, 140, 248, 0.25)",
    position: "right",
    voice: "vivian",
  },
  xiaoying: {
    name: "小樱",
    color: "#FB923C",
    bgColor: "rgba(251, 146, 60, 0.25)",
    position: "center",
    voice: "serena",
  },
};

export type ComicEffect =
  | "surprise"   // ?!
  | "shock"      // !
  | "sweat"      // sweat drop 💧
  | "sparkle"    // ✨ sparkles
  | "heart"      // ❤️
  | "anger"      // anger cross 💢
  | "dots"       // ... speechless
  | "cry"        // tears 😢
  | "laugh"      // laugh out loud 😆
  | "fire"       // burn 🔥
  | "shake"      // extra character shake

export interface DialogLine {
  character: Character;
  text: string;
  effect?: ComicEffect | ComicEffect[];
  sfx?: MangaSfxEvent[];
}

/**
 * Maps a ComicEffect to its representative emoji for the dialog name badge.
 * If multiple effects are provided, returns the emoji for the first one.
 */
export function effectToEmoji(
  effect: ComicEffect | ComicEffect[] | undefined
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
  };
  return map[single] ?? "";
}
