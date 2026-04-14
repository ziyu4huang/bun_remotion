/**
 * Narration scripts with per-character voice assignment for
 * 我的核心是大佬 第一章第二集：任務跳過
 *
 * Voices (mlx_tts):
 *   林逸 (linyi)       → uncle_fu  — male
 *   趙小七 (zhaoxiaoqi) → serena    — female
 *   narrator            → uncle_fu  — male narrator
 */

export type VoiceCharacter = "linyi" | "zhaoxiaoqi" | "narrator";

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

export const VOICE_MAP: Record<VoiceCharacter, string> = {
  linyi: "uncle_fu",
  zhaoxiaoqi: "serena",
  narrator: "uncle_fu",
};

export const VOICE_DESCRIPTION: Record<VoiceCharacter, { voice: string; gender: string; accent: string }> = {
  linyi: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin, casual gamer tone" },
  zhaoxiaoqi: { voice: "serena", gender: "female", accent: "standard Mandarin, enthusiastic fanboy tone" },
  narrator: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin, neutral narrator" },
};

export const narrations: NarrationScript[] = [
  // ─── TitleScene ────────────────────────────────────────────────────────
  {
    scene: "TitleScene",
    file: "01-title.wav",
    segments: [
      { character: "narrator", text: "蒼穹大陸，天道宗。宗門例行任務「清剿妖獸」即將開始。所有弟子嚴陣以待——唯獨一個人，還在研究系統面板。" },
    ],
    fullText: "蒼穹大陸，天道宗。宗門例行任務「清剿妖獸」即將開始。所有弟子嚴陣以待——唯獨一個人，還在研究系統面板。",
  },

  // ─── ContentScene1: quest announcement, Lin Yi discovers skip ─────────
  {
    scene: "ContentScene1",
    file: "02-content1.wav",
    segments: [
      { character: "narrator", text: "宗門廣場上，任務榜高懸。數十名弟子摩拳擦掌，法器丹藥準備齊全。" },
      { character: "linyi", text: "清剿妖獸……難度普通……獎勵靈石一百……" },
      { character: "linyi", text: "等等，這個「跳過」按鈕是什麼？" },
      { character: "linyi", text: "「跳過過場動畫，直接領取獎勵」？還有這種好事？點一下試試。" },
      { character: "zhaoxiaoqi", text: "師兄！你不去準備裝備嗎？大家都帶好了法器和丹藥！" },
      { character: "linyi", text: "不用不用，我找到了一條捷徑。" },
      { character: "zhaoxiaoqi", text: "捷徑？！師兄是說……修行也有捷徑可走？" },
    ],
    fullText: "宗門廣場上，任務榜高懸。數十名弟子摩拳擦掌，法器丹藥準備齊全。清剿妖獸……難度普通……獎勵靈石一百……等等，這個「跳過」按鈕是什麼？「跳過過場動畫，直接領取獎勵」？還有這種好事？點一下試試。師兄！你不去準備裝備嗎？大家都帶好了法器和丹藥！不用不用，我找到了一條捷徑。捷徑？！師兄是說……修行也有捷徑可走？",
  },

  // ─── ContentScene2: Lin Yi bypasses beasts, takes reward ──────────────
  {
    scene: "ContentScene2",
    file: "03-content2.wav",
    segments: [
      { character: "narrator", text: "靈獸洞窟外。數十頭妖獸盤踞其中，其他弟子小心翼翼地潛入。而林逸……大搖大擺地走了過去。" },
      { character: "linyi", text: "自動尋路啟動……繞過怪物……直走……左轉……到了。" },
      { character: "linyi", text: "寶箱……打開。靈石到手，經驗值到手。三秒通關。" },
      { character: "narrator", text: "妖獸們看著林逸就這麼走過去，集體一臉茫然。" },
      { character: "linyi", text: "那些人還在前面打怪呢。算了，先去吃飯。" },
      { character: "zhaoxiaoqi", text: "師、師兄？！你已經回來了？！" },
      { character: "linyi", text: "啊，任務做完了。寶箱裡的東西還不錯。" },
      { character: "zhaoxiaoqi", text: "可是……妖獸都還在啊！你怎麼通過的？" },
      { character: "linyi", text: "嗯？就走過去了啊。牠們沒攔我。" },
    ],
    fullText: "靈獸洞窟外。數十頭妖獸盤踞其中，其他弟子小心翼翼地潛入。而林逸……大搖大擺地走了過去。自動尋路啟動……繞過怪物……直走……左轉……到了。寶箱……打開。靈石到手，經驗值到手。三秒通關。妖獸們看著林逸就這麼走過去，集體一臉茫然。那些人還在前面打怪呢。算了，先去吃飯。師、師兄？！你已經回來了？！啊，任務做完了。寶箱裡的東西還不錯。可是……妖獸都還在啊！你怎麼通過的？嗯？就走過去了啊。牠們沒攔我。",
  },

  // ─── ContentScene3: Zhao Xiaoqi over-interpretation ───────────────────
  {
    scene: "ContentScene3",
    file: "04-content3.wav",
    segments: [
      { character: "zhaoxiaoqi", text: "我明白了！師兄根本不需要打敗妖獸！他以大乘期的修為，直接無視了妖獸的存在！" },
      { character: "zhaoxiaoqi", text: "「走過去」——師兄的意思是，這些妖獸根本不值一提，就像路邊的石頭一樣！" },
      { character: "zhaoxiaoqi", text: "「三秒通關」——師兄用三秒完成了我們需要三天的任務！這是何等境界！" },
      { character: "zhaoxiaoqi", text: "我要更新《林逸師兄語錄》！第二篇：「跳過」——真正的強者，不需要出手！" },
      { character: "linyi", text: "不是，我只是用了系統的跳過功能……" },
      { character: "zhaoxiaoqi", text: "師兄又在謙虛了！「跳過」的真諦就是——超越！超越一切障礙！" },
      { character: "linyi", text: "……算了，你高興就好。" },
    ],
    fullText: "我明白了！師兄根本不需要打敗妖獸！他以大乘期的修為，直接無視了妖獸的存在！「走過去」——師兄的意思是，這些妖獸根本不值一提，就像路邊的石頭一樣！「三秒通關」——師兄用三秒完成了我們需要三天的任務！這是何等境界！我要更新《林逸師兄語錄》！第二篇：「跳過」——真正的強者，不需要出手！不是，我只是用了系統的跳過功能……師兄又在謙虛了！「跳過」的真諦就是——超越！超越一切障礙！……算了，你高興就好。",
  },

  // ─── OutroScene ───────────────────────────────────────────────────────
  {
    scene: "OutroScene",
    file: "05-outro.wav",
    segments: [
      { character: "narrator", text: "林逸用系統的「跳過」功能，三秒鐘完成了宗門任務。趙小七把這解讀為「以大乘期修為直取天道本源」。而蕭長老聽說此事後，開始暗中記錄林逸的每一句話。" },
      { character: "narrator", text: "下集預告——宗門大比，林逸發現比武台有碰撞體 Bug，可以把對手卡在牆裡。我的核心是大佬，第一章第三集：Bug 利用。" },
    ],
    fullText: "林逸用系統的「跳過」功能，三秒鐘完成了宗門任務。趙小七把這解讀為「以大乘期修為直取天道本源」。而蕭長老聽說此事後，開始暗中記錄林逸的每一句話。下集預告——宗門大比，林逸發現比武台有碰撞體 Bug，可以把對手卡在牆裡。我的核心是大佬，第一章第三集：Bug 利用。",
  },
];
