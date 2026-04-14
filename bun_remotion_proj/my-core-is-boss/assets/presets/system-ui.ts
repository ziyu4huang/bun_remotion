/**
 * System UI presets for 起點系統流 (system novel) style videos.
 *
 * Provides typed preset configurations for GameUI and SystemOverlay components.
 * Scenes can spread these presets instead of hardcoding props.
 *
 * Usage:
 *   import { PRESETS } from "../../../assets/presets/system-ui";
 *   <SystemNotification {...PRESETS.mission("探索天道宗")} />
 */

// ─── System Notification Presets ──────────────────────────────────────────────

export type NotificationType = "mission" | "warning" | "success" | "info" | "achievement" | "levelup";

export interface SystemNotificationPreset {
  text: string;
  type: NotificationType;
  delay?: number;
}

export function missionNotification(text: string, delay?: number): SystemNotificationPreset {
  return { text, type: "mission", delay };
}

export function warningNotification(text: string, delay?: number): SystemNotificationPreset {
  return { text, type: "warning", delay };
}

export function successNotification(text: string, delay?: number): SystemNotificationPreset {
  return { text, type: "success", delay };
}

export function achievementNotification(title: string, rarity: "common" | "rare" | "legendary" = "common", delay?: number): SystemNotificationPreset {
  const prefix = rarity === "legendary" ? "★ 傳說成就解鎖：" : rarity === "rare" ? "◆ 稀有成就解鎖：" : "● 成就解鎖：";
  return { text: `${prefix}${title}`, type: "achievement", delay };
}

export function levelUpNotification(name: string, level: number, label: string, delay?: number): SystemNotificationPreset {
  return { text: `${name} 升級！Lv.${level}（${label}）`, type: "levelup", delay };
}

// ─── Quest Panel Presets ──────────────────────────────────────────────────────

export type QuestStatus = "active" | "completed" | "failed";

export interface QuestPanelPreset {
  title: string;
  description: string;
  status: QuestStatus;
  delay?: number;
}

export function activeQuest(title: string, description: string, delay?: number): QuestPanelPreset {
  return { title, description, status: "active", delay };
}

export function completedQuest(title: string, description: string, delay?: number): QuestPanelPreset {
  return { title, description, status: "completed", delay };
}

export function failedQuest(title: string, description: string, delay?: number): QuestPanelPreset {
  return { title, description, status: "failed", delay };
}

// ─── HP Bar Presets ───────────────────────────────────────────────────────────

export interface HpBarPreset {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  color: string;
  x: number;
  y: number;
  delay?: number;
}

/** Create an HP bar preset for a known character. */
export function characterHpBar(
  character: "linyi" | "zhaoxiaoqi" | "xiaoelder" | "chenmo",
  level: number,
  hp: number,
  maxHp: number,
  position: { x: number; y: number },
  delay?: number,
): HpBarPreset {
  const colors: Record<string, string> = {
    linyi: "#F59E0B",
    zhaoxiaoqi: "#38BDF8",
    xiaoelder: "#A78BFA",
    chenmo: "#10B981",
  };
  const names: Record<string, string> = {
    linyi: "林逸",
    zhaoxiaoqi: "趙小七",
    xiaoelder: "蕭長老",
    chenmo: "陳默",
  };
  return { name: names[character], level, hp, maxHp, color: colors[character], ...position, delay };
}

/** Create an HP bar preset for an NPC/enemy. */
export function enemyHpBar(
  name: string,
  level: number,
  hp: number,
  maxHp: number,
  position: { x: number; y: number },
  delay?: number,
): HpBarPreset {
  return { name, level, hp, maxHp, color: "#EF4444", ...position, delay };
}

// ─── Level Tag Presets ────────────────────────────────────────────────────────

export interface LevelTagPreset {
  level: string;
  color: string;
  x: number;
  y: number;
  delay?: number;
}

/** Cultivation level tags matching the system display. */
export function cultivationTag(
  stage: "鍛體期" | "築基期" | "金丹期" | "元嬰期" | "化神期" | "大乘期" | "渡劫期" | "???",
  position: { x: number; y: number },
  delay?: number,
): LevelTagPreset {
  const colors: Record<string, string> = {
    "鍛體期": "#94A3B8",
    "築基期": "#34D399",
    "金丹期": "#FBBF24",
    "元嬰期": "#F97316",
    "化神期": "#EF4444",
    "大乘期": "#A78BFA",
    "渡劫期": "#EC4899",
    "???": "#F59E0B",
  };
  return { level: `Lv.${stage}`, color: colors[stage] ?? "#94A3B8", ...position, delay };
}

// ─── Loading Text Presets ─────────────────────────────────────────────────────

export interface LoadingTextPreset {
  text: string;
  color?: string;
  delay?: number;
}

/** Common loading text variations. */
export const LOADING_TEXTS = {
  systemBoot: { text: "系統載入中", color: "#34D399" },
  connecting: { text: "連線中", color: "#38BDF8" },
  patching: { text: "更新中", color: "#FBBF24" },
  scanning: { text: "掃描中", color: "#A78BFA" },
  analyzing: { text: "分析中", color: "#F97316" },
} as const satisfies Record<string, LoadingTextPreset>;

// ─── Curated PRESETS Object ───────────────────────────────────────────────────

/**
 * Ready-to-use factory functions for common system UI patterns.
 *
 * Example:
 *   <SystemNotification {...PRESETS.mission("探索天道宗", 30)} />
 *   <QuestPanel {...PRESETS.quest("清剿妖獸", "難度：普通")} />
 */
export const PRESETS = {
  // System notifications
  mission: missionNotification,
  warning: warningNotification,
  success: successNotification,
  achievement: achievementNotification,
  levelUp: levelUpNotification,

  // Quest panels
  quest: activeQuest,
  questComplete: completedQuest,
  questFailed: failedQuest,

  // HP bars
  characterHp: characterHpBar,
  enemyHp: enemyHpBar,

  // Level tags
  cultivation: cultivationTag,

  // Loading text
  loading: LOADING_TEXTS,
} as const;
