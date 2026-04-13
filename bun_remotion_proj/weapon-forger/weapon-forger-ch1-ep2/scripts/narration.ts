/**
 * Narration scripts with per-character voice assignment for
 * 誰讓他煉器的！ 第一章 第二集：成績公布
 *
 * Voices (mlx_tts):
 *   周墨 (zhoumo)    → uncle_fu  — male
 *   考官 (examiner)  → serena    — female
 *   長老 (elder)     → uncle_fu  — male
 *   narrator         → uncle_fu  — male narrator
 *
 * All dialog text is in Traditional Chinese (zh_TW).
 */

export type VoiceCharacter = "zhoumo" | "examiner" | "elder" | "narrator";

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
  zhoumo: "uncle_fu",
  examiner: "serena",
  elder: "uncle_fu",
  narrator: "uncle_fu",
};

export const VOICE_DESCRIPTION: Record<VoiceCharacter, { voice: string; gender: string; accent: string }> = {
  zhoumo: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
  examiner: { voice: "serena", gender: "female", accent: "standard Mandarin" },
  elder: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
  narrator: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
};

export const narrations: NarrationScript[] = [
  {
    scene: "TitleScene",
    file: "01-title.wav",
    segments: [
      { character: "narrator", text: "歡迎來到誰讓他煉器的！第一章，成績公布。" },
      { character: "narrator", text: "上一集，周墨的飛劍搶了考官的儲物袋。這一集，考官終於要公布成績了。周墨到底是被認可，還是被趕出去？答案可能出乎意料。" },
    ],
    fullText: "歡迎來到誰讓他煉器的！第一章，成績公布。上一集，周墨的飛劍搶了考官的儲物袋。這一集，考官終於要公布成績了。周墨到底是被認可，還是被趕出去？答案可能出乎意料。",
  },
  {
    scene: "ContentScene1",
    file: "02-content1.wav",
    segments: [
      { character: "examiner", text: "周墨，你知不知道你剛才做了什麼？你的飛劍搶了我的儲物袋！" },
      { character: "zhoumo", text: "技術上來說，是飛劍自己決定的。我只是寫了演算法而已。" },
      { character: "examiner", text: "你還敢狡辯！你知道那裡面有多少靈石嗎？那是我三個月的薪水！" },
      { character: "zhoumo", text: "這恰好證明了飛劍的目標鎖定功能非常精準。這是一個亮點。" },
      { character: "examiner", text: "亮點？！你管搶劫叫亮點？！" },
      { character: "zhoumo", text: "請冷靜。我願意用我剩下的材料來賠償。我還有一個自動按摩陣法和一個智能鬧鐘。" },
      { character: "examiner", text: "......誰要你的智能鬧鐘啊。" },
      { character: "examiner", text: "我宣布，你的入宗考試——" },
      { character: "elder", text: "等一下。" },
      { character: "examiner", text: "長、長老？！" },
      { character: "elder", text: "讓我看看這個年輕人的作品。" },
      { character: "elder", text: "這把飛劍......三個微型隱藏機關、指紋識別陣法、自動格式化模組......" },
      { character: "elder", text: "你是說，這把劍會自己找目標、自己鎖定、還有防盜系統？" },
      { character: "zhoumo", text: "是的！我追求的是使用者體驗和底層邏輯閉環。" },
      { character: "elder", text: "有意思......非常有意思。" },
    ],
    fullText: "周墨，你知不知道你剛才做了什麼？你的飛劍搶了我的儲物袋！技術上來說，是飛劍自己決定的。我只是寫了演算法而已。你還敢狡辯！你知道那裡面有多少靈石嗎？那是我三個月的薪水！這恰好證明了飛劍的目標鎖定功能非常精準。這是一個亮點。亮點？！你管搶劫叫亮點？！請冷靜。我願意用我剩下的材料來賠償。我還有一個自動按摩陣法和一個智能鬧鐘。......誰要你的智能鬧鐘啊。我宣布，你的入宗考試——等一下。長、長老？！讓我看看這個年輕人的作品。這把飛劍......三個微型隱藏機關、指紋識別陣法、自動格式化模組......你是說，這把劍會自己找目標、自己鎖定、還有防盜系統？是的！我追求的是使用者體驗和底層邏輯閉環。有意思......非常有意思。",
  },
  {
    scene: "ContentScene2",
    file: "03-content2.wav",
    segments: [
      { character: "elder", text: "周墨，你為什麼要給飛劍裝自動格式化？" },
      { character: "zhoumo", text: "因為萬一飛劍被別人搶走，它會在三分鐘後自動清除所有資料。就像手機一樣。" },
      { character: "elder", text: "......手機是什麼？" },
      { character: "zhoumo", text: "呃，一種......通訊法器。概念上的。" },
      { character: "elder", text: "你的腦袋裡裝的都是什麼亂七八糟的。" },
      { character: "examiner", text: "長老，這個人根本不適合修道！他的煉器方式簡直是褻瀆！" },
      { character: "elder", text: "你說得對。他的方式確實......不合常規。" },
      { character: "examiner", text: "對吧！" },
      { character: "elder", text: "但是，這恰恰是我們煉器峰最需要的。" },
      { character: "examiner", text: "什麼？！" },
      { character: "elder", text: "三百年来，我們煉器峰的法寶設計越來越保守。大家都只知道照著古方煉，沒有人敢創新。" },
      { character: "elder", text: "這個年輕人雖然方法奇怪，但他的思路......是我見過最新穎的。" },
      { character: "elder", text: "周墨，恭喜你。你通過了入宗考試。" },
      { character: "zhoumo", text: "真的嗎？！" },
      { character: "examiner", text: "長老，您不是在開玩笑吧？！" },
      { character: "elder", text: "考官，你是不是還想讓他把飛劍收回來？" },
      { character: "examiner", text: "......他還沒收回去嗎？" },
      { character: "zhoumo", text: "對，我說了，忘加停止按鈕了。" },
      { character: "elder", text: "你看，這就說明他的防盜系統做得很好。連他自己都收不回來。" },
    ],
    fullText: "周墨，你為什麼要給飛劍裝自動格式化？因為萬一飛劍被別人搶走，它會在三分鐘後自動清除所有資料。就像手機一樣。......手機是什麼？呃，一種......通訊法器。概念上的。你的腦袋裡裝的都是什麼亂七八糟的。長老，這個人根本不適合修道！他的煉器方式簡直是褻瀆！你說得對。他的方式確實......不合常規。對吧！但是，這恰恰是我們煉器峰最需要的。什麼？！三百年来，我們煉器峰的法寶設計越來越保守。大家都只知道照著古方煉，沒有人敢創新。這個年輕人雖然方法奇怪，但他的思路......是我見過最新穎的。周墨，恭喜你。你通過了入宗考試。真的嗎？！長老，您不是在開玩笑吧？！考官，你是不是還想讓他把飛劍收回來？......他還沒收回去嗎？對，我說了，忘加停止按鈕了。你看，這就說明他的防盜系統做得很好。連他自己都收不回來。",
  },
  {
    scene: "OutroScene",
    file: "04-outro.wav",
    segments: [
      { character: "narrator", text: "感謝收看誰讓他煉器的！第一章第二集，成績公布。" },
      { character: "narrator", text: "周墨以他獨特的煉器理念，獲得了煉器峰長老的認可。但考官的儲物袋......至今還沒拿回來。" },
      { character: "narrator", text: "下集預告：周墨正式加入煉器峰，他的第一個任務居然是——修丹爐。而且這個丹爐，會說話。" },
    ],
    fullText: "感謝收看誰讓他煉器的！第一章第二集，成績公布。周墨以他獨特的煉器理念，獲得了煉器峰長老的認可。但考官的儲物袋......至今還沒拿回來。下集預告：周墨正式加入煉器峰，他的第一個任務居然是——修丹爐。而且這個丹爐，會說話。",
  },
];
