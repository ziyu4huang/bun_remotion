// Re-export shared types, fonts, and utilities
export { notoSansTC, maShanZheng, zcoolKuaiLe, zhiMangXing, sfxFont } from "@bun-remotion/shared";
export { resolveCharacterImage, effectToEmoji } from "@bun-remotion/shared";
export type { Emotion, ComicEffect, CharacterConfig, DialogLine, MangaSfxEvent, CharacterSide, AnimationIntensity } from "@bun-remotion/shared";

// ─── Characters ─────────────────────────────────────────────────────────────────

import type { Emotion } from "@bun-remotion/shared";

export type Character = "zhoumo" | "examiner" | "elder" | "luyang" | "mengjingzhou" | "soul" | "yunzhi";

export type CharacterPose = Emotion;

export const CHARACTER_POSES: Partial<Record<Character, CharacterPose[]>> = {
  zhoumo: ["angry", "shocked", "smirk", "nervous"],
  luyang: ["angry", "shocked", "smirk", "nervous"],
  mengjingzhou: ["angry", "shocked", "smirk", "nervous"],
};

import type { CharacterConfig } from "@bun-remotion/shared";

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
  yunzhi: {
    name: "雲芝",
    color: "#EC4899",
    bgColor: "rgba(236, 72, 153, 0.25)",
    position: "right",
    voice: "serena",
  },
};
