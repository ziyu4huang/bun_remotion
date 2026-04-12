import { loadFont } from "@remotion/google-fonts/NotoSansTC";

export const { fontFamily: notoSansTC } = loadFont("normal", {
  weights: ["400", "700"],
});

/**
 * Characters for 系統文小說梗 第二集 — 師姐的龜派氣功
 *
 * - 修修 (Xiuxiu) — 廢柴修仙者，綁定修仙系統，永遠在崩潰邊緣
 * - 系統 (System) — 修仙系統，冷淡女聲，任務狂魔（隱藏身份：萬古劍仙·劍無痕）
 * - 師姐 (Shijie) — 高冷師姐，實力超強，看似溫柔實則腹黑
 */
export type Character = "xiuxiu" | "system" | "shijie";

export interface CharacterConfig {
  name: string;
  color: string;
  bgColor: string;
  position: "left" | "center" | "right";
  voice: string;
  narratorVoice?: string;
}

export const CHARACTERS: Record<Character, CharacterConfig> = {
  xiuxiu: {
    name: "修修",
    color: "#60A5FA",
    bgColor: "rgba(96, 165, 250, 0.25)",
    position: "left",
    voice: "uncle_fu",
  },
  system: {
    name: "系統",
    color: "#34D399",
    bgColor: "rgba(52, 211, 153, 0.25)",
    position: "center",
    voice: "serena",
  },
  shijie: {
    name: "師姐",
    color: "#F472B6",
    bgColor: "rgba(244, 114, 182, 0.25)",
    position: "right",
    voice: "vivian",
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
