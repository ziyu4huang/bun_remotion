/**
 * Weapon crafting visual presets for 誰讓他煉器的！ (Weapon Forger).
 *
 * Pre-configured visual presets for forging scenes — furnace glow, hammer sparks,
 * treasure emergence, and other weapon crafting moments.
 *
 * Usage:
 *   import { CRAFTING_EFFECTS, getCraftingEffect } from "../../../assets/presets/weapon-crafting";
 *   const effect = getCraftingEffect("furnace-glow");
 *   <PowerUpRings {...effect.props.PowerUpRings} />
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CraftingEffectConfig {
  name: string;
  description: string;         // zh_TW description for agent context
  components: string[];        // BattleEffects.tsx component names to use
  props: Record<string, Record<string, unknown>>; // props per component
  particleColor?: string;
}

// ─── Preset Crafting Effects ──────────────────────────────────────────────────

export const CRAFTING_EFFECTS: Record<string, CraftingEffectConfig> = {
  /** 爐火閃耀 — 丹爐/鍋爐燃燒 */
  "furnace-glow": {
    name: "爐火閃耀",
    description: "丹爐或鍋爐燃燒時的暖色光暈",
    components: ["PowerUpRings", "BattleAura"],
    props: {
      PowerUpRings: { color: "#F97316", ringCount: 3, maxRadius: 250 },
      BattleAura: { color: "#F97316", intensity: 1.2 },
    },
    particleColor: "#F97316",
  },

  /** 錘擊火花 — 鍛造敲擊 */
  "hammer-spark": {
    name: "錘擊火花",
    description: "鍛造敲擊時的火花四散",
    components: ["ImpactBurst", "DiamondShards", "ScreenFlash"],
    props: {
      ImpactBurst: { color: "#FBBF24", maxRadius: 150, particleCount: 12 },
      DiamondShards: { color: "#FDE68A", count: 6, maxRadius: 100 },
      ScreenFlash: { duration: 6, color: "#FBBF24" },
    },
    particleColor: "#FBBF24",
  },

  /** 法寶出爐 — 法寶完成 */
  "treasure-emerge": {
    name: "法寶出爐",
    description: "法寶完成煉製，從爐中浮現",
    components: ["PowerUpRings", "ScreenFlash", "SpeedLines"],
    props: {
      PowerUpRings: { color: "#FBBF24", ringCount: 5, maxRadius: 400 },
      ScreenFlash: { duration: 12, color: "#FBBF24" },
      SpeedLines: { color: "rgba(251, 191, 36, 0.5)", lineCount: 18 },
    },
    particleColor: "#FBBF24",
  },

  /** 模組組裝 — 工程師式煉器 */
  "module-assembly": {
    name: "模組組裝",
    description: "周墨式的模組化煉器——零件飛入組裝",
    components: ["DiamondShards", "PowerUpRings", "ConcentrationLines"],
    props: {
      DiamondShards: { color: "#38BDF8", count: 8, maxRadius: 200 },
      PowerUpRings: { color: "#38BDF8", ringCount: 4, maxRadius: 300 },
      ConcentrationLines: { color: "rgba(56, 189, 248, 0.4)", lineCount: 16 },
    },
    particleColor: "#38BDF8",
  },

  /** 丹爐暴走 — 丹爐失控 */
  "furnace-rampage": {
    name: "丹爐暴走",
    description: "丹爐情緒管理系統啟動，但忘加音量控制（ch1-ep3 經典場景）",
    components: ["TriangleBurst", "ImpactBurst", "ScreenFlash", "BattleAura"],
    props: {
      TriangleBurst: { color: "#A78BFA", count: 10, maxRadius: 300 },
      ImpactBurst: { color: "#A78BFA", maxRadius: 200, particleCount: 16 },
      ScreenFlash: { duration: 10, color: "#A78BFA" },
      BattleAura: { color: "#A78BFA", intensity: 2 },
    },
    particleColor: "#A78BFA",
  },

  /** 壓力釋放 — 壓力釋放模組（會爆炸的那種） */
  "pressure-release": {
    name: "壓力釋放",
    description: "周墨改良的壓力釋放模組——忘加防爆閥的版本",
    components: ["ImpactBurst", "EnergyWave", "GroundCrack", "ScreenFlash"],
    props: {
      ImpactBurst: { color: "#FB923C", maxRadius: 350, particleCount: 24 },
      EnergyWave: { color: "#FB923C", waveCount: 5, intensity: 1.3 },
      GroundCrack: { color: "#92400E" },
      ScreenFlash: { duration: 15, color: "#FB923C" },
    },
    particleColor: "#FB923C",
  },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

/** Get a crafting effect config by name. Throws if not found. */
export function getCraftingEffect(name: string): CraftingEffectConfig {
  const effect = CRAFTING_EFFECTS[name];
  if (!effect) {
    throw new Error(`Unknown crafting effect: "${name}". Available: ${Object.keys(CRAFTING_EFFECTS).join(", ")}`);
  }
  return effect;
}

/** List all available crafting effect names with their zh_TW descriptions. */
export function listCraftingEffects(): Array<{ name: string; description: string }> {
  return Object.entries(CRAFTING_EFFECTS).map(([key, config]) => ({
    name: key,
    description: `${config.name} — ${config.description}`,
  }));
}
