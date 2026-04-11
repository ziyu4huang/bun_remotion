import { loadFont } from "@remotion/google-fonts/NotoSansTC";

export const { fontFamily: notoSansTC } = loadFont("normal", {
  weights: ["400", "700"],
});

/**
 * Characters for 美少女梗圖劇場 第二集 (Beautiful Girl Meme Theater EP2)
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
  voice: string; // TTS voice name — must match gender
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

export interface DialogLine {
  character: Character;
  text: string;
}
