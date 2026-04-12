import { loadFont } from "@remotion/google-fonts/NotoSansTC";

export const { fontFamily: notoSansTC } = loadFont("normal", {
  weights: ["400", "700"],
});

/**
 * Characters for 炼器师同人创作 第一章 — 入宗考试
 *
 * - 周墨 (Zhou Mo) — 逻辑闭环改造狂魔，法宝不需要灵识，需要用户体验
 * - 考官 (Examiner) — 问道宗入宗考试考官
 */
export type Character = "zhoumo" | "examiner";

export interface CharacterConfig {
  name: string;
  color: string;
  bgColor: string;
  position: "left" | "center" | "right";
  voice: string;
  narratorVoice?: string;
}

export const CHARACTERS: Record<Character, CharacterConfig> = {
  zhoumo: {
    name: "周墨",
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.25)",
    position: "left",
    voice: "uncle_fu",
  },
  examiner: {
    name: "考官",
    color: "#34D399",
    bgColor: "rgba(52, 211, 153, 0.25)",
    position: "right",
    voice: "serena",
  },
};

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
  | "shake";

export interface DialogLine {
  character: Character;
  text: string;
  effect?: ComicEffect | ComicEffect[];
}

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
