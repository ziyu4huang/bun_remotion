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

// ─── Characters ─────────────────────────────────────────────────────────────────

/**
 * Characters for 誰讓他煉器的！series.
 *
 * - 周墨 (Zhou Mo) — 邏輯閉環改造狂魔
 * - 考官 (Examiner) — 問道宗入宗考試考官
 * - 長老 (Elder) — 問道宗煉器峰長老，神秘評審
 */

export type Character = "zhoumo" | "examiner" | "elder" | "luyang" | "mengjingzhou" | "soul";

export type CharacterPose = "angry" | "shocked" | "smirk" | "nervous";

/**
 * Pose image mapping per character.
 * Default (no pose) uses <character>.png as before.
 */
export const CHARACTER_POSES: Partial<Record<Character, CharacterPose[]>> = {
  zhoumo: ["angry", "shocked", "smirk", "nervous"],
  luyang: ["angry", "shocked", "smirk", "nervous"],
  mengjingzhou: ["angry", "shocked", "smirk", "nervous"],
};

/**
 * Resolve image filename for a character + pose.
 * pose undefined → <character>.png (base image)
 * pose specified  → <character>-<pose>.png
 */
export function resolveCharacterImage(
  character: Character,
  pose?: CharacterPose
): string {
  if (pose) return `${character}-${pose}.png`;
  return `${character}.png`;
}

export interface CharacterConfig {
  name: string;
  color: string;
  bgColor: string;
  position: "left" | "center" | "right";
  voice: string;
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
  elder: {
    name: "長老",
    color: "#A78BFA",
    bgColor: "rgba(167, 139, 250, 0.25)",
    position: "center",
    voice: "uncle_fu",
  },
  luyang: {
    name: "陸陽",
    color: "#38BDF8",
    bgColor: "rgba(56, 189, 248, 0.25)",
    position: "center",
    voice: "uncle_fu",
  },
  mengjingzhou: {
    name: "孟景舟",
    color: "#FB923C",
    bgColor: "rgba(251, 146, 60, 0.25)",
    position: "right",
    voice: "uncle_fu",
  },
  soul: {
    name: "滄溟子",
    color: "#A78BFA",
    bgColor: "rgba(167, 139, 250, 0.25)",
    position: "center",
    voice: "uncle_fu",
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
  | "shake"
  | "gloating";

export interface DialogLine {
  character: Character;
  text: string;
  pose?: CharacterPose;
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
    gloating: "😏",
  };
  return map[single] ?? "";
}

export function sfxFont(font?: "brush" | "playful" | "action"): string {
  switch (font) {
    case "brush": return maShanZheng;
    case "playful": return zcoolKuaiLe;
    case "action": return zhiMangXing;
    default: return maShanZheng;
  }
}
