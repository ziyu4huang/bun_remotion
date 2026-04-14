/**
 * Xianxia battle effect presets for 起點網文風格 videos.
 *
 * Pre-configured visual effect bundles for common xianxia combat scenes.
 * Each preset includes SFX overlays, comic effects, and optional screen shake.
 *
 * Usage:
 *   import { BATTLE_EFFECTS, getBattleEffect } from "../../../assets/presets/battle-effects";
 *   const effect = getBattleEffect("sword-qi");
 *   <ComicEffects effects={effect.effects} side="left" />
 *   <MangaSfx events={effect.sfx} />
 */

import type { ComicEffect, MangaSfxEvent } from "../characters";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScreenShakeConfig {
  intensity: number;
  duration: number;
  delay: number;
}

export interface BattleEffectConfig {
  name: string;
  description: string;         // zh_TW description for agent context
  sfx: MangaSfxEvent[];
  effects: ComicEffect[];
  screenShake?: ScreenShakeConfig;
  particleColor?: string;      // primary particle/glow color
}

// ─── Preset Battle Effects ────────────────────────────────────────────────────

export const BATTLE_EFFECTS: Record<string, BattleEffectConfig> = {
  /** 劍氣斬擊 — 劍修基礎攻擊，藍色劍氣橫掃 */
  "sword-qi": {
    name: "劍氣斬擊",
    description: "劍修的基礎攻擊，藍色劍氣橫掃",
    sfx: [
      { text: "斬", x: 960, y: 450, font: "action", fontSize: 120, color: "#60A5FA", rotation: -10 },
    ],
    effects: ["shock"],
    screenShake: { intensity: 15, duration: 12, delay: 0 },
    particleColor: "#60A5FA",
  },

  /** 能量波 — 靈力衝擊波，從中心向外擴散 */
  "energy-wave": {
    name: "能量波",
    description: "靈力衝擊波，從中心向外擴散",
    sfx: [
      { text: "轟", x: 960, y: 400, font: "action", fontSize: 150, color: "#F59E0B", rotation: 5 },
    ],
    effects: ["shock", "fire"],
    screenShake: { intensity: 25, duration: 20, delay: 0 },
    particleColor: "#F59E0B",
  },

  /** 陣法啟動 — 法陣光芒閃爍 */
  "array-formation": {
    name: "陣法啟動",
    description: "法陣光芒閃爍，陣紋浮現",
    sfx: [
      { text: "陣", x: 960, y: 350, font: "brush", fontSize: 100, color: "#A78BFA", rotation: 0 },
      { text: "起", x: 800, y: 500, font: "brush", fontSize: 80, color: "#C4B5FD", rotation: 15 },
    ],
    effects: ["sparkle"],
    particleColor: "#A78BFA",
  },

  /** 法寶光效 — 法寶出鞘/激活時的耀眼光芒 */
  "treasure-glow": {
    name: "法寶光效",
    description: "法寶出鞘時的耀眼光芒，金色光柱",
    sfx: [
      { text: "鏘", x: 1100, y: 400, font: "action", fontSize: 100, color: "#FBBF24", rotation: -15 },
    ],
    effects: ["sparkle"],
    particleColor: "#FBBF24",
  },

  /** 爆炸 — 大範圍爆炸效果 */
  "explosion": {
    name: "爆炸",
    description: "大範圍爆炸，火焰四散",
    sfx: [
      { text: "爆", x: 960, y: 400, font: "action", fontSize: 180, color: "#EF4444", rotation: -5 },
    ],
    effects: ["fire", "shock"],
    screenShake: { intensity: 30, duration: 25, delay: 0 },
    particleColor: "#EF4444",
  },

  /** 護盾 — 防禦型靈力屏障 */
  "barrier": {
    name: "護盾",
    description: "靈力護盾展開，抵擋攻擊",
    sfx: [
      { text: "擋", x: 960, y: 420, font: "brush", fontSize: 110, color: "#34D399", rotation: 0 },
    ],
    effects: ["sparkle"],
    particleColor: "#34D399",
  },

  /** 吞噬 — 魔尊特殊技能，黑暗能量 */
  "devour": {
    name: "吞噬",
    description: "魔尊的黑暗吞噬技能，Ch9 Boss 特殊攻擊",
    sfx: [
      { text: "噬", x: 960, y: 380, font: "action", fontSize: 160, color: "#7C3AED", rotation: 8 },
    ],
    effects: ["shock"],
    screenShake: { intensity: 20, duration: 30, delay: 0 },
    particleColor: "#7C3AED",
  },

  /** 系統故障 — 本系列獨有：系統 UI 故障/閃爍效果 */
  "system-glitch": {
    name: "系統故障",
    description: "核心系統 UI 故障閃爍，林逸獨有的視覺標記",
    sfx: [
      { text: "BUG", x: 960, y: 400, font: "playful", fontSize: 100, color: "#22D3EE", rotation: -12 },
    ],
    effects: ["surprise"],
    particleColor: "#22D3EE",
  },

  /** 冰凍 — 冰系法術 */
  "freeze": {
    name: "冰凍",
    description: "冰系法術，寒氣凝結",
    sfx: [
      { text: "凍", x: 960, y: 420, font: "brush", fontSize: 120, color: "#67E8F9", rotation: 5 },
    ],
    effects: ["sparkle"],
    particleColor: "#67E8F9",
  },

  /** 雷擊 — 雷系法術 */
  "thunder": {
    name: "雷擊",
    description: "雷系法術，天雷降臨",
    sfx: [
      { text: "霹", x: 860, y: 350, font: "action", fontSize: 140, color: "#FDE68A", rotation: -8 },
      { text: "靂", x: 1060, y: 480, font: "action", fontSize: 140, color: "#FDE68A", rotation: 8 },
    ],
    effects: ["shock", "fire"],
    screenShake: { intensity: 22, duration: 18, delay: 0 },
    particleColor: "#FDE68A",
  },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

/** Get a battle effect config by name. Throws if not found. */
export function getBattleEffect(name: string): BattleEffectConfig {
  const effect = BATTLE_EFFECTS[name];
  if (!effect) {
    throw new Error(`Unknown battle effect: "${name}". Available: ${Object.keys(BATTLE_EFFECTS).join(", ")}`);
  }
  return effect;
}

/** Get multiple battle effects in sequence (for combo attacks). */
export function chainEffects(...names: string[]): BattleEffectConfig[] {
  return names.map((name) => getBattleEffect(name));
}

/** Get a battle effect, returning null instead of throwing if not found. */
export function findBattleEffect(name: string): BattleEffectConfig | null {
  return BATTLE_EFFECTS[name] ?? null;
}

/** List all available battle effect names with their zh_TW descriptions. */
export function listBattleEffects(): Array<{ name: string; description: string }> {
  return Object.entries(BATTLE_EFFECTS).map(([key, config]) => ({
    name: key,
    description: `${config.name} — ${config.description}`,
  }));
}
