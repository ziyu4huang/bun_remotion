/**
 * Narration script for storygraph-explainer ch1-ep3: 一行程式看見全貌
 *
 * Tech explainer — narrator only, zh-TW
 * Duration target: ~55s (1650 frames at 30fps)
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
        text: "前面兩集，我們說了知識圖譜的原理和五階段管線。現在——一行指令，看見全貌。",
      },
    ],
    fullText:
      "前面兩集，我們說了知識圖譜的原理和五階段管線。現在——一行指令，看見全貌。",
  },

  // ─── DemoScene: CLI 實際操作 ──────────────────────────────────────────
  {
    scene: "DemoScene",
    file: "02-demo.wav",
    segments: [
      {
        character: "narrator",
        text: "打開終端機，輸入 storygraph，指定你的專案目錄。萃取、建構、聚類、聯邦合併、一致性檢查——五個階段自動跑完。",
      },
      {
        character: "narrator",
        text: "輸出一個 JSON 檔案，你的整個系列濃縮成一張知識圖譜。節點是角色和事件，邊是它們的關係。",
      },
    ],
    fullText:
      "打開終端機，輸入 storygraph，指定你的專案目錄。萃取、建構、聚類、聯邦合併、一致性檢查——五個階段自動跑完。輸出一個 JSON 檔案，你的整個系列濃縮成一張知識圖譜。節點是角色和事件，邊是它們的關係。",
  },

  // ─── ComparisonScene: Before vs After ──────────────────────────────────
  {
    scene: "ComparisonScene",
    file: "03-comparison.wav",
    segments: [
      {
        character: "narrator",
        text: "以前：你翻遍幾十個文件，靠記憶拼湊角色關係，伏筆忘了就忘了。資訊碎片化讓每集都是獨立的孤島。",
      },
      {
        character: "narrator",
        text: "現在：跨集連結一目了然，社群偵測把故事弧線分好群，PageRank 標出關鍵轉折。開啟視覺化的 HTML 報告，整個系列的全景，一眼看完。",
      },
    ],
    fullText:
      "以前：你翻遍幾十個文件，靠記憶拼湊角色關係，伏筆忘了就忘了。資訊碎片化讓每集都是獨立的孤島。現在：跨集連結一目了然，社群偵測把故事弧線分好群，PageRank 標出關鍵轉折。開啟視覺化的 HTML 報告，整個系列的全景，一眼看完。",
  },

  // ─── CTAScene: Call to Action ──────────────────────────────────────────
  {
    scene: "CTAScene",
    file: "04-cta.wav",
    segments: [
      {
        character: "narrator",
        text: "這就是 storygraph——從劇本到知識圖譜，一條管線搞定。開源免費，用 Bun 和 TypeScript 打造，支援 tree-sitter 和 AST 分析。",
      },
      {
        character: "narrator",
        text: "你的下一個系列，讓知識圖譜幫你記住每一個細節。",
      },
    ],
    fullText:
      "這就是 storygraph——從劇本到知識圖譜，一條管線搞定。開源免費，用 Bun 和 TypeScript 打造，支援 tree-sitter 和 AST 分析。你的下一個系列，讓知識圖譜幫你記住每一個細節。",
  },

  // ─── OutroScene ───────────────────────────────────────────────────────
  {
    scene: "OutroScene",
    file: "05-outro.wav",
    segments: [
      {
        character: "narrator",
        text: "感謝觀看。如果你也在做系列內容，試試 storygraph，讓萃取和一致性檢查幫你管理故事。我們下次見。",
      },
    ],
    fullText:
      "感謝觀看。如果你也在做系列內容，試試 storygraph，讓萃取和一致性檢查幫你管理故事。我們下次見。",
  },
];
