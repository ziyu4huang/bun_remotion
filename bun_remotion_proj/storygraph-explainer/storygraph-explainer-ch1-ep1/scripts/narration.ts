/**
 * Narration script for storygraph-explainer ch1-ep1: 知識圖譜是什麼？
 *
 * Tech explainer — narrator only, zh-TW
 * Duration target: ~50s (1500 frames at 30fps)
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
        text: "你的系列影片做到第十集，突然發現——主角的性格跟第一集完全不一樣了。",
      },
    ],
    fullText:
      "你的系列影片做到第十集，突然發現——主角的性格跟第一集完全不一樣了。",
  },

  // ─── ProblemScene: 資訊碎片化的痛 ──────────────────────────────────────
  {
    scene: "ProblemScene",
    file: "02-problem.wav",
    segments: [
      {
        character: "narrator",
        text: "劇情設定散落在幾十個文件的角落，角色關係只存在你的腦袋裡。",
      },
      {
        character: "narrator",
        text: "上一集埋的伏筆，三集之後你自己都忘了。連續劇、Podcast、連載小說——所有系列內容都有同樣的問題：資訊碎片化。",
      },
      {
        character: "narrator",
        text: "你需要一張地圖，把所有角色、事件、關係串在一起。這就是知識圖譜。",
      },
    ],
    fullText:
      "劇情設定散落在幾十個文件的角落，角色關係只存在你的腦袋裡。上一集埋的伏筆，三集之後你自己都忘了。連續劇、Podcast、連載小說——所有系列內容都有同樣的問題：資訊碎片化。你需要一張地圖，把所有角色、事件、關係串在一起。這就是知識圖譜。",
  },

  // ─── SolutionScene: 知識圖譜概念 ───────────────────────────────────────
  {
    scene: "SolutionScene",
    file: "03-solution.wav",
    segments: [
      {
        character: "narrator",
        text: "知識圖譜用節點代表每個角色、事件、場景，用邊連接它們的關係。",
      },
      {
        character: "narrator",
        text: "社群偵測自動分群，PageRank 找出最重要的角色，跨集連結追蹤故事弧線。",
      },
      {
        character: "narrator",
        text: "storygraph 做的就是這件事——從你的劇本自動萃取知識圖譜，視覺化呈現整個系列的故事結構。",
      },
    ],
    fullText:
      "知識圖譜用節點代表每個角色、事件、場景，用邊連接它們的關係。社群偵測自動分群，PageRank 找出最重要的角色，跨集連結追蹤故事弧線。storygraph 做的就是這件事——從你的劇本自動萃取知識圖譜，視覺化呈現整個系列的故事結構。",
  },

  // ─── OutroScene ───────────────────────────────────────────────────────
  {
    scene: "OutroScene",
    file: "04-outro.wav",
    segments: [
      {
        character: "narrator",
        text: "但它是怎麼做到的？五階段管線，從萃取到聚類到一致性檢查。下一集，我們拆解整個流程。",
      },
    ],
    fullText:
      "但它是怎麼做到的？五階段管線，從萃取到聚類到一致性檢查。下一集，我們拆解整個流程。",
  },
];
