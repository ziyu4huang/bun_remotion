/**
 * Narration script for storygraph-explainer ch1-ep2: 五階段管線
 *
 * Tech explainer — narrator only, zh-TW
 * Duration target: ~60s (1800 frames at 30fps)
 */

export type VoiceCharacter = "narrator";

export interface NarrationSegment {
  character: VoiceCharacter;
  text: string;
}

export interface NarrationScript {
  scene: string;
  file: string;
  segments: NarrationSegment[];
  fullText: string;
}

export const NARRATOR_LANG = "zh-TW";

export const narrations: NarrationScript[] = [
  // ─── TitleScene ────────────────────────────────────────────────────────
  {
    scene: "TitleScene",
    file: "01-title.wav",
    segments: [
      {
        character: "narrator",
        text: "上一集我們說了知識圖譜能解決資訊碎片化的問題。但 storygraph 到底怎麼從你的劇本裡，自動長出一張完整的圖譜？",
      },
    ],
    fullText:
      "上一集我們說了知識圖譜能解決資訊碎片化的問題。但 storygraph 到底怎麼從你的劇本裡，自動長出一張完整的圖譜？",
  },

  // ─── ExtractScene: 第一階段 萃取 ───────────────────────────────────────
  {
    scene: "ExtractScene",
    file: "02-extract.wav",
    segments: [
      {
        character: "narrator",
        text: "第一步：萃取。storygraph 分析你的劇本結構，用 AST 語法樹剖析每一句對話，從中抽出角色、場景、事件、關鍵概念。",
      },
      {
        character: "narrator",
        text: "不管你的劇本是 TypeScript、Markdown 還是純文字，都能萃取。",
      },
    ],
    fullText:
      "第一步：萃取。storygraph 分析你的劇本結構，用 AST 語法樹剖析每一句對話，從中抽出角色、場景、事件、關鍵概念。不管你的劇本是 TypeScript、Markdown 還是純文字，都能萃取。",
  },

  // ─── BuildScene: 第二階段 建構 ─────────────────────────────────────────
  {
    scene: "BuildScene",
    file: "03-build.wav",
    segments: [
      {
        character: "narrator",
        text: "第二步：建構。萃取出的節點和邊，交給 graphology 建立圖資料結構。每個角色是一個節點，每段關係是一條邊，形成這一集的知識子圖。",
      },
    ],
    fullText:
      "第二步：建構。萃取出的節點和邊，交給 graphology 建立圖資料結構。每個角色是一個節點，每段關係是一條邊，形成這一集的知識子圖。",
  },

  // ─── ClusterScene: 第三階段 聚類 ───────────────────────────────────────
  {
    scene: "ClusterScene",
    file: "04-cluster.wav",
    segments: [
      {
        character: "narrator",
        text: "第三步：聚類。社群偵測演算法把相關的節點自動分群。戰鬥場景一組，感情線一組，伏筆追蹤一組——你一眼就能看出故事的結構。",
      },
    ],
    fullText:
      "第三步：聚類。社群偵測演算法把相關的節點自動分群。戰鬥場景一組，感情線一組，伏筆追蹤一組——你一眼就能看出故事的結構。",
  },

  // ─── MergeScene: 第四階段 聯邦合併 ─────────────────────────────────────
  {
    scene: "MergeScene",
    file: "05-merge.wav",
    segments: [
      {
        character: "narrator",
        text: "第四步：聯邦合併。每一集的知識子圖合併成完整的系列圖譜。跨集連結追蹤角色成長，故事弧線自然浮現，你埋的伏筆不會再被遺忘。",
      },
    ],
    fullText:
      "第四步：聯邦合併。每一集的知識子圖合併成完整的系列圖譜。跨集連結追蹤角色成長，故事弧線自然浮現，你埋的伏筆不會再被遺忘。",
  },

  // ─── CheckScene: 第五階段 一致性檢查 ────────────────────────────────────
  {
    scene: "CheckScene",
    file: "06-check.wav",
    segments: [
      {
        character: "narrator",
        text: "第五步：一致性檢查。PageRank 找出最重要的節點，品質閘門檢查圖譜的完整度。萃取不夠豐富？退回重跑。",
      },
    ],
    fullText:
      "第五步：一致性檢查。PageRank 找出最重要的節點，品質閘門檢查圖譜的完整度。萃取不夠豐富？退回重跑。",
  },

  // ─── OutroScene ───────────────────────────────────────────────────────
  {
    scene: "OutroScene",
    file: "07-outro.wav",
    segments: [
      {
        character: "narrator",
        text: "五個階段，從萃取到聚類到聯邦合併，全自動管線。但聽起來還是太抽象了——下一集，我們實際跑一次給你看。",
      },
    ],
    fullText:
      "五個階段，從萃取到聚類到聯邦合併，全自動管線。但聽起來還是太抽象了——下一集，我們實際跑一次給你看。",
  },
];
