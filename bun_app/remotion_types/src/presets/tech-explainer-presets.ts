/**
 * Series config presets for non-narrative categories.
 *
 * Narrative genres (xianxia_comedy, galgame_meme) stay in series-config.ts.
 * This file adds category-aware presets for Tech Explainer, Data Story, etc.
 */

import type { VideoCategoryId } from "../category-types";
import type { TechExplainerData } from "../scene-templates";

// ─── Tech Explainer Presets ───

export interface TechExplainerPreset {
  seriesId: string;
  displayName: string;
  category: VideoCategoryId;
  /** Term patterns for tech extraction */
  techPatterns: RegExp[];
  /** Feature extraction keywords */
  featureKeywords: string[];
}

// ─── storygraph Explainer ───

export const storygraphExplainerPreset: TechExplainerPreset = {
  seriesId: "storygraph-explainer",
  displayName: "storygraph 知識圖譜建構系統介紹",
  category: "tech_explainer",
  techPatterns: [
    /知識圖譜/g, /knowledge.?graph/gi,
    /AST/g, /tree-sitter/gi,
    /graphology/gi,
    /pipeline/gi, /管線/g,
    /federated/gi, /聯邦/g,
    /community.?detection/gi, /社群偵測/g,
    /PageRank/gi,
    /JSON/g, /HTML/g,
    /subagent/gi,
  ],
  featureKeywords: [
    "codebase", "AST", "NLP", "graph", "community",
    "pipeline", "federated", "cross-link", "quality scoring",
    "HTML", "JSON", "audit",
  ],
};

export const TECH_EXPLAINER_PRESETS: TechExplainerPreset[] = [
  storygraphExplainerPreset,
];

/** Detect tech explainer preset from directory name */
export function detectTechExplainerPreset(dirname: string): TechExplainerPreset | null {
  return TECH_EXPLAINER_PRESETS.find(p => dirname.includes(p.seriesId)) ?? null;
}

// ─── storygraph Explainer Composition Data ───

export const storygraphExplainerData: TechExplainerData = {
  title: "storygraph",
  tagline: "任何輸入 → 知識圖譜",
  painPoint: "文件散落各處，程式碼、論文、對話記錄……資訊碎片化，找不到關聯",
  pipeline: [
    { name: "輸入", icon: "📥", description: "程式碼、文件、論文、對話" },
    { name: "解析", icon: "🔬", description: "AST + NLP 雙通道萃取" },
    { name: "建圖", icon: "🕸️", description: "節點 + 邊 + 關聯類型" },
    { name: "聚類", icon: "🔮", description: "社群偵測 + PageRank" },
    { name: "輸出", icon: "📊", description: "HTML + JSON + 稽核報告" },
  ],
  features: [
    {
      name: "程式碼 AST 分析",
      description: "tree-sitter 解析 → 符號萃取 → 呼叫關聯圖",
      visual: "diagram",
    },
    {
      name: "聯邦故事知識圖譜",
      description: "多集合併 + 跨集連結發現 + 角色弧線追蹤",
      visual: "diagram",
    },
    {
      name: "品質評分系統",
      description: "5 維度自動評分：節點密度、圖完整性、敘事弧線、幽默演化、主題一致性",
      visual: "icon",
    },
  ],
  demoSteps: [
    "bun run graphify-episode — 分析單集",
    "bun run graphify-merge — 聯邦合併",
    "bun run graphify-check — 品質評分",
    "bun run graphify-compare — 跨集比較",
  ],
  comparison: {
    before: "手動整理筆記，花 2 小時找關聯",
    after: "storygraph 一鍵生成知識圖譜，30 秒看到全貌",
  },
  cta: "Star on GitHub",
  links: ["github.com/storygraph"],
};
