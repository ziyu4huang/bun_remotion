/**
 * Reaction effect presets for galgame meme theater comedy.
 *
 * Curated ComicEffect combos for common comedy reaction patterns.
 * Import from scenes: import { REACTIONS } from "../../assets/presets/reaction-effects";
 */

import type { ComicEffect, MangaSfxEvent } from "../characters";

// ─── Reaction Presets ────────────────────────────────────────────────────────

/** Single effect shortcuts — most common reactions */
export const FX = {
  surprise: ["surprise"] as ComicEffect[],
  shock: ["shock"] as ComicEffect[],
  sweat: ["sweat"] as ComicEffect[],
  sparkle: ["sparkle"] as ComicEffect[],
  heart: ["heart"] as ComicEffect[],
  anger: ["anger"] as ComicEffect[],
  dots: ["dots"] as ComicEffect[],
  cry: ["cry"] as ComicEffect[],
  laugh: ["laugh"] as ComicEffect[],
  fire: ["fire"] as ComicEffect[],
  shake: ["shake"] as ComicEffect[],
} as const;

/** Multi-effect combos for layered comedy reactions */
export const REACTIONS = {
  /** 被吐槽後的無奈 (embarrassed + speechless) */
  embarrassed: ["sweat", "dots"] as ComicEffect[],

  /** 爆笑反應 (can't stop laughing) */
  laughing: ["laugh", "sparkle"] as ComicEffect[],

  /** 社死瞬間 (social death moment) */
  socialDeath: ["shock", "cry"] as ComicEffect[],

  /** 暴怒吐槽 (angry retort) */
  angryRetort: ["anger", "shake"] as ComicEffect[],

  /** 被戳中心事 (secret exposed) */
  exposed: ["surprise", "sweat"] as ComicEffect[],

  /** 直男衝擊 (dumbfounded by straight-guy logic) */
  dumbfounded: ["dots", "sweat"] as ComicEffect[],

  /** 戀愛心動 (romance flutter) */
  flutter: ["heart", "sparkle"] as ComicEffect[],

  /** 嘴硬否認 (denying while clearly guilty) */
  denying: ["anger", "sweat"] as ComicEffect[],

  /** 絕望放棄 (giving up on life) */
  despair: ["cry", "dots"] as ComicEffect[],

  /** 熱血燃燒 (fired up / passionate) */
  firedUp: ["fire", "sparkle"] as ComicEffect[],
} as const;

// ─── SFX Presets ─────────────────────────────────────────────────────────────

/** Common manga SFX positions for comedy reactions */
export const SFX = {
  /** 笑果衝擊 — starburst at top center */
  gagHit: (text: string): MangaSfxEvent => ({
    text,
    x: 50,
    y: 15,
    color: "#FFD700",
    fontSize: 60,
    font: "playful",
    rotation: -5,
  }),

  /** 吐槽彈幕 — side comment */
  retort: (text: string, side: "left" | "right" = "right"): MangaSfxEvent => ({
    text,
    x: side === "right" ? 75 : 25,
    y: 25,
    color: "#EF4444",
    fontSize: 48,
    font: "brush",
    rotation: side === "right" ? 8 : -8,
  }),

  /** 社死特效 — dramatic reaction */
  socialDeath: (text: string): MangaSfxEvent => ({
    text,
    x: 50,
    y: 20,
    color: "#3B82F6",
    fontSize: 56,
    font: "action",
    rotation: 0,
  }),

  /** 暴擊金句 — devastating punchline */
  criticalHit: (text: string): MangaSfxEvent => ({
    text,
    x: 50,
    y: 10,
    color: "#EF4444",
    fontSize: 64,
    font: "action",
    rotation: -3,
  }),
} as const;
