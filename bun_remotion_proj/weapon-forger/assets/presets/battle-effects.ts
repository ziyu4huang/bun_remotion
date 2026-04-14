/**
 * Xianxia battle effect presets for 誰讓他煉器的！ (Weapon Forger).
 *
 * Pre-configured visual effect bundles for xianxia combat + forging scenes.
 * Each preset maps to BattleEffects.tsx components with curated props.
 *
 * Usage:
 *   import { BATTLE_EFFECTS, getBattleEffect } from "../../../assets/presets/battle-effects";
 *   const effect = getBattleEffect("energy-wave");
 *   <EnergyWave {...effect.energyWave} />
 *   <ImpactBurst {...effect.impactBurst} />
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScreenShakeConfig {
  intensity: number;
  duration: number;
  delay: number;
}

export interface BattleEffectConfig {
  name: string;
  description: string;         // zh_TW description for agent context
  components: string[];        // BattleEffects.tsx component names to use
  props: Record<string, Record<string, unknown>>; // props per component
  screenShake?: ScreenShakeConfig;
  particleColor?: string;      // primary particle/glow color
}

// ─── Preset Battle Effects ────────────────────────────────────────────────────

export const BATTLE_EFFECTS: Record<string, BattleEffectConfig> = {
  /** 飛劍攻擊 — 自導向飛劍斬擊 */
  "flying-sword": {
    name: "飛劍攻擊",
    description: "全自動自導向飛劍的斬擊",
    components: ["SlashEffect", "SpeedLines", "ScreenFlash"],
    props: {
      SlashEffect: { direction: "ltr", color: "#FFD700", thickness: 10 },
      SpeedLines: { color: "rgba(255, 215, 0, 0.6)", lineCount: 24 },
      ScreenFlash: { duration: 8, color: "#FFD700" },
    },
    screenShake: { intensity: 15, duration: 12, delay: 0 },
    particleColor: "#FFD700",
  },

  /** 能量波 — 靈力衝擊波，多弧線擴散 */
  "energy-wave": {
    name: "能量波",
    description: "靈力衝擊波，從一端向另一端的多弧線擴散",
    components: ["EnergyWave", "ImpactBurst"],
    props: {
      EnergyWave: { color: "#60A5FA", waveCount: 7, intensity: 1.2 },
      ImpactBurst: { color: "#60A5FA", maxRadius: 300 },
    },
    screenShake: { intensity: 20, duration: 18, delay: 0 },
    particleColor: "#60A5FA",
  },

  /** 爆炸 — 法寶失控爆炸 */
  "explosion": {
    name: "爆炸",
    description: "法寶失控/鍋爐爆炸，大範圍衝擊",
    components: ["ImpactBurst", "ScreenFlash", "SpeedLines", "GroundCrack"],
    props: {
      ImpactBurst: { color: "#EF4444", maxRadius: 350, particleCount: 24 },
      ScreenFlash: { duration: 15, color: "#EF4444" },
      SpeedLines: { color: "rgba(239, 68, 68, 0.6)", lineCount: 28 },
      GroundCrack: { color: "#92400E" },
    },
    screenShake: { intensity: 30, duration: 25, delay: 0 },
    particleColor: "#EF4444",
  },

  /** 鍋爐爆炸 — 周墨特色，改良失敗 */
  "boiler-explosion": {
    name: "鍋爐爆炸",
    description: "周墨改良壓力釋放模組後的鍋爐爆炸（招牌場景）",
    components: ["ImpactBurst", "ScreenFlash", "TriangleBurst", "DiamondShards"],
    props: {
      ImpactBurst: { color: "#FB923C", maxRadius: 280, particleCount: 20 },
      ScreenFlash: { duration: 10, color: "#FB923C" },
      TriangleBurst: { color: "#FBBF24", count: 8, maxRadius: 250 },
      DiamondShards: { color: "#FB923C", count: 10, maxRadius: 200 },
    },
    screenShake: { intensity: 25, duration: 20, delay: 0 },
    particleColor: "#FB923C",
  },

  /** 戰鬥氣場 — 角色凝聚靈力 */
  "battle-aura": {
    name: "戰鬥氣場",
    description: "角色凝聚靈力的脈動光暈",
    components: ["BattleAura", "ConcentrationLines", "PowerUpRings"],
    props: {
      BattleAura: { color: "#60A5FA", intensity: 1.5 },
      ConcentrationLines: { color: "rgba(96, 165, 250, 0.4)", lineCount: 20 },
      PowerUpRings: { color: "#60A5FA", ringCount: 3, maxRadius: 350 },
    },
    particleColor: "#60A5FA",
  },

  /** 雷射切割 — 雷射切割陣法（ch3 秘境專用） */
  "laser-cut": {
    name: "雷射切割",
    description: "聚焦式靈氣切割陣法，高效率切割禁制",
    components: ["EnergyWave", "SlashEffect", "ImpactBurst"],
    props: {
      EnergyWave: { color: "#22D3EE", waveCount: 5, intensity: 1.5, spread: 20 },
      SlashEffect: { direction: "ltr", color: "#22D3EE", thickness: 6 },
      ImpactBurst: { color: "#22D3EE", maxRadius: 200, particleCount: 12 },
    },
    screenShake: { intensity: 18, duration: 15, delay: 0 },
    particleColor: "#22D3EE",
  },

  /** 法寶光效 — 法寶出爐/激活 */
  "treasure-glow": {
    name: "法寶光效",
    description: "法寶出爐或激活時的金色光柱",
    components: ["PowerUpRings", "ScreenFlash", "SpeedLines"],
    props: {
      PowerUpRings: { color: "#FBBF24", ringCount: 5, maxRadius: 400 },
      ScreenFlash: { duration: 10, color: "#FBBF24" },
      SpeedLines: { color: "rgba(251, 191, 36, 0.5)", lineCount: 16 },
    },
    particleColor: "#FBBF24",
  },

  /** 結界破碎 — 禁制/陣法被打破 */
  "barrier-break": {
    name: "結界破碎",
    description: "禁制或陣法被打破，碎片四散",
    components: ["DiamondShards", "TriangleBurst", "ImpactBurst", "ScreenFlash"],
    props: {
      DiamondShards: { color: "#A78BFA", count: 12, maxRadius: 350 },
      TriangleBurst: { color: "#C4B5FD", count: 8, maxRadius: 280 },
      ImpactBurst: { color: "#A78BFA", maxRadius: 250 },
      ScreenFlash: { duration: 12, color: "#A78BFA" },
    },
    screenShake: { intensity: 22, duration: 20, delay: 0 },
    particleColor: "#A78BFA",
  },

  /** 地面裂開 — 重擊造成地面龜裂 */
  "ground-impact": {
    name: "地面裂開",
    description: "重擊造成地面龜裂，碎石飛濺",
    components: ["GroundCrack", "ImpactBurst", "DiamondShards"],
    props: {
      GroundCrack: { color: "#92400E" },
      ImpactBurst: { color: "#F59E0B", maxRadius: 200, particleCount: 16 },
      DiamondShards: { color: "#92400E", count: 6, maxRadius: 150 },
    },
    screenShake: { intensity: 28, duration: 22, delay: 0 },
    particleColor: "#92400E",
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
