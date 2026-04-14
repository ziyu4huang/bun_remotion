/**
 * Narration scripts for 我的核心是大佬 第一章第一集：首次誤會
 *
 * Voice mapping is centralized in assets/voice-config.json.
 * Characters: linyi, zhaoxiaoqi, xiaoelder, narrator
 */

export type VoiceCharacter = "linyi" | "zhaoxiaoqi" | "xiaoelder" | "narrator";

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
      { character: "narrator", text: "蒼穹大陸，太平紀元三千年。一個自稱「玩家」的青年，踏入了天道宗的大門。他腦中裝著一個神秘系統——把整個修行世界，看成了遊戲。" },
    ],
    fullText: "蒼穹大陸，太平紀元三千年。一個自稱「玩家」的青年，踏入了天道宗的大門。他腦中裝著一個神秘系統——把整個修行世界，看成了遊戲。",
  },

  // ─── ContentScene1: linyi arrives at sect-plaza, sees game UI ─────────
  {
    scene: "ContentScene1",
    file: "02-content1.wav",
    segments: [
      { character: "narrator", text: "天道宗廣場，晨曦初照。弟子們正在晨練。" },
      { character: "linyi", text: "載入中……為什麼這麼慢啊？" },
      { character: "linyi", text: "這NPC的建模也太粗糙了吧……" },
      { character: "linyi", text: "等等，這個任務面板……新手教程在哪？" },
      { character: "linyi", text: "跳過對話，跳過對話……能不能全部跳過？" },
      { character: "narrator", text: "周圍的弟子們聽到了林逸的嘀咕，紛紛停下了動作。" },
      { character: "zhaoxiaoqi", text: "「載入中」……這位師兄說的，莫非是在感悟天道？！" },
      { character: "zhaoxiaoqi", text: "「不屑與凡人交流」……一定是看破紅塵了！" },
      { character: "zhaoxiaoqi", text: "「跳過對話」……天哪，他是在說跳過修行的俗世煩惱！" },
    ],
    fullText: "天道宗廣場，晨曦初照。弟子們正在晨練。載入中……為什麼這麼慢啊？這NPC的建模也太粗糙了吧……等等，這個任務面板……新手教程在哪？跳過對話，跳過對話……能不能全部跳過？周圍的弟子們聽到了林逸的嘀咕，紛紛停下了動作。「載入中」……這位師兄說的，莫非是在感悟天道？！「不屑與凡人交流」……一定是看破紅塵了！「跳過對話」……天哪，他是在說跳過修行的俗世煩惱！",
  },

  // ─── ContentScene2: zhaoxiaoqi witnesses, writes first quote ──────────
  {
    scene: "ContentScene2",
    file: "03-content2.wav",
    segments: [
      { character: "zhaoxiaoqi", text: "我一定要記下來！《林逸師兄語錄》第一篇！" },
      { character: "zhaoxiaoqi", text: "「載入中」——師兄正在深度冥想，感悟天道運行之理。" },
      { character: "zhaoxiaoqi", text: "「跳過對話」——師兄認為言語道斷，大道不可言說。" },
      { character: "zhaoxiaoqi", text: "太深奧了……每一句話都蘊含著天地至理！" },
      { character: "linyi", text: "這也有 bug？我剛才明明點了跳過啊。" },
      { character: "zhaoxiaoqi", text: "「這也有 bug」——師兄在質疑天道的運行！這是何等的氣魄！" },
      { character: "zhaoxiaoqi", text: "我趙小七，從今天起，就是林逸師兄的頭號追隨者！" },
    ],
    fullText: "我一定要記下來！《林逸師兄語錄》第一篇！「載入中」——師兄正在深度冥想，感悟天道運行之理。「跳過對話」——師兄認為言語道斷，大道不可言說。太深奧了……每一句話都蘊含著天地至理！這也有 bug？我剛才明明點了跳過啊。「這也有 bug」——師兄在質疑天道的運行！這是何等的氣魄！我趙小七，從今天起，就是林逸師兄的頭號追隨者！",
  },

  // ─── ContentScene3: xiaoelder confrontation ───────────────────────────
  {
    scene: "ContentScene3",
    file: "04-content3.wav",
    segments: [
      { character: "narrator", text: "消息傳到了蕭長老的耳中。煉器峰的資深長老，決定親自來看看這個「狂徒」。" },
      { character: "xiaoelder", text: "哪來的小子，竟敢在天道宗放肆！" },
      { character: "xiaoelder", text: "讓老夫看看……鍛體期？連修為都沒有，你憑什麼在此囂張？" },
      { character: "linyi", text: "等一下……這個老頭頭上怎麼飄著 Lv.85？" },
      { character: "linyi", text: "而且……隱藏等級：問號？這字體也太大了，擋到我視線了。" },
      { character: "xiaoelder", text: "你……你剛才說什麼？隱藏等級？" },
      { character: "narrator", text: "蕭長老聞言，臉色驟變。隱藏等級——那只有大乘期以上的存在才有的標記！" },
      { character: "xiaoelder", text: "這、這不可能……這小子明明沒有修為……" },
      { character: "linyi", text: "能不能把這個 UI 調小一點？真的很礙事。" },
      { character: "narrator", text: "蕭長老雙腿一軟，直接跪了下去。" },
      { character: "zhaoxiaoqi", text: "長老跪了！長老跪了！我就知道師兄不是普通人！" },
      { character: "xiaoelder", text: "前輩……不，前輩在上！晚輩有眼不識泰山！" },
      { character: "linyi", text: "……啊？你在跪什麼啊？" },
    ],
    fullText: "消息傳到了蕭長老的耳中。煉器峰的資深長老，決定親自來看看這個「狂徒」。哪來的小子，竟敢在天道宗放肆！讓老夫看看……鍛體期？連修為都沒有，你憑什麼在此囂張？等一下……這個老頭頭上怎麼飄著 Lv.85？而且……隱藏等級：問號？這字體也太大了，擋到我視線了。你……你剛才說什麼？隱藏等級？蕭長老聞言，臉色驟變。隱藏等級——那只有大乘期以上的存在才有的標記！這、這不可能……這小子明明沒有修為……能不能把這個 UI 調小一點？真的很礙事。蕭長老雙腿一軟，直接跪了下去。長老跪了！長老跪了！我就知道師兄不是普通人！前輩……不，前輩在上！晚輩有眼不識泰山！……啊？你在跪什麼啊？",
  },

  // ─── OutroScene ───────────────────────────────────────────────────────
  {
    scene: "OutroScene",
    file: "05-outro.wav",
    segments: [
      { character: "narrator", text: "就這樣，林逸在天道宗的第一天，就收穫了一個腦補狂魔粉絲，和一個嚇到腿軟的長老。而他本人，還在糾結系統 UI 的字體大小。" },
      { character: "narrator", text: "下集預告——宗門發布「清剿妖獸」任務，所有人都在認真準備。林逸發現了一個驚人的秘密——任務可以跳過！我的核心是大佬，第一章第二集：任務跳過。" },
    ],
    fullText: "就這樣，林逸在天道宗的第一天，就收穫了一個腦補狂魔粉絲，和一個嚇到腿軟的長老。而他本人，還在糾結系統 UI 的字體大小。下集預告——宗門發布「清剿妖獸」任務，所有人都在認真準備。林逸發現了一個驚人的秘密——任務可以跳過！我的核心是大佬，第一章第二集：任務跳過。",
  },
];
