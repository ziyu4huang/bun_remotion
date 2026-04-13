/**
 * Narration scripts with per-character voice assignment for
 * 誰讓他煉器的！ 第一章 第三集：丹爐修復
 *
 * Voices (mlx_tts):
 *   周墨 (zhoumo)    → uncle_fu  — male
 *   長老 (elder)     → uncle_fu  — male
 *   narrator         → uncle_fu  — male narrator
 *
 * All dialog text is in Traditional Chinese (zh_TW).
 */

export type VoiceCharacter = "zhoumo" | "elder" | "narrator";

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
  elder: "uncle_fu",
  narrator: "uncle_fu",
};

export const VOICE_DESCRIPTION: Record<VoiceCharacter, { voice: string; gender: string; accent: string }> = {
  zhoumo: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
  elder: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
  narrator: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
};

export const narrations: NarrationScript[] = [
  {
    scene: "TitleScene",
    file: "01-title.wav",
    segments: [
      { character: "narrator", text: "歡迎來到誰讓他煉器的！第一章，第三集，丹爐修復。" },
      { character: "narrator", text: "周墨正式加入煉器峰。長老交給他第一個任務：修復一座三百年歷史的丹爐。聽說這座丹爐有個小毛病——它會自己說話。而且脾氣比長老還大。" },
    ],
    fullText: "歡迎來到誰讓他煉器的！第一章，第三集，丹爐修復。周墨正式加入煉器峰。長老交給他第一個任務：修復一座三百年歷史的丹爐。聽說這座丹爐有個小毛病——它會自己說話。而且脾氣比長老還大。",
  },
  {
    scene: "ContentScene1",
    file: "02-content1.wav",
    segments: [
      { character: "elder", text: "周墨，歡迎加入煉器峰。從今天起，你就是正式弟子了。" },
      { character: "zhoumo", text: "謝謝長老！請問我的第一個任務是什麼？" },
      { character: "elder", text: "修丹爐。" },
      { character: "zhoumo", text: "修丹爐？聽起來很簡單。" },
      { character: "elder", text: "不簡單。這座丹爐有三百年歷史，上一位負責修理的弟子，被它罵哭了。" },
      { character: "zhoumo", text: "丹爐......罵人？" },
      { character: "elder", text: "它會說話。而且說的都是髒話。昨天它還在罵我們煉器峰的人連火都不會點。" },
      { character: "zhoumo", text: "有意思。技術上來說，一個有意識的丹爐，這是一個高級智能終端。" },
      { character: "elder", text: "你在說什麼？" },
      { character: "zhoumo", text: "沒什麼。帶我去看看吧。" },
      { character: "elder", text: "到了，就是這座。你小心點，它最近心情不好。" },
      { character: "zhoumo", text: "嗯......火焰陣法老化、溫控模組失靈、意識晶片過載。所以您生氣是因為沒有人維護您，對吧？" },
      { character: "elder", text: "它好像......安靜了？" },
      { character: "zhoumo", text: "問題的核心是使用者體驗。這座丹爐不是壞了，它是被忽視了三百年。" },
    ],
    fullText: "周墨，歡迎加入煉器峰。從今天起，你就是正式弟子了。謝謝長老！請問我的第一個任務是什麼？修丹爐。修丹爐？聽起來很簡單。不簡單。這座丹爐有三百年歷史，上一位負責修理的弟子，被它罵哭了。丹爐......罵人？它會說話。而且說的都是髒話。昨天它還在罵我們煉器峰的人連火都不會點。有意思。技術上來說，一個有意識的丹爐，這是一個高級智能終端。你在說什麼？沒什麼。帶我去看看吧。到了，就是這座。你小心點，它最近心情不好。嗯......火焰陣法老化、溫控模組失靈、意識晶片過載。所以您生氣是因為沒有人維護您，對吧？它好像......安靜了？問題的核心是使用者體驗。這座丹爐不是壞了，它是被忽視了三百年。",
  },
  {
    scene: "ContentScene2",
    file: "03-content2.wav",
    segments: [
      { character: "zhoumo", text: "好了，我來幫您做一個全面的系統升級。火焰陣法重寫、自動控溫模組、還有——情緒管理系統。" },
      { character: "elder", text: "情緒管理系統？你要給丹爐做心理諮詢？" },
      { character: "zhoumo", text: "準確地說，是情感交互界面。它生氣是因為沒有人聽它說話，所以我裝了一個傾聽模組。" },
      { character: "elder", text: "所以你修丹爐的方式是......陪它聊天？" },
      { character: "zhoumo", text: "這只是其中一個功能。我還加了語音控制。現在只需要說一聲「請幫忙燒一下」就自動點火了。" },
      { character: "elder", text: "倒是方便。不過......為什麼它在唱歌？" },
      { character: "zhoumo", text: "哦，那是音樂播放功能。我覺得丹爐工作時也需要娛樂，不然多無聊。" },
      { character: "elder", text: "你連丹爐的使用者體驗都考慮到了？" },
      { character: "zhoumo", text: "當然。使用者體驗是產品設計的核心。" },
      { character: "elder", text: "好吧......不過它會不會在半夜自動開派對？" },
      { character: "zhoumo", text: "不會。我加了定時休眠功能，它晚上會自動安靜下來。" },
      { character: "elder", text: "不錯不錯。看來你終於記得加停止鍵了。" },
      { character: "zhoumo", text: "嗯......不過我忘加音量控制了。" },
    ],
    fullText: "好了，我來幫您做一個全面的系統升級。火焰陣法重寫、自動控溫模組、還有——情緒管理系統。情緒管理系統？你要給丹爐做心理諮詢？準確地說，是情感交互界面。它生氣是因為沒有人聽它說話，所以我裝了一個傾聽模組。所以你修丹爐的方式是......陪它聊天？這只是其中一個功能。我還加了語音控制。現在只需要說一聲「請幫忙燒一下」就自動點火了。倒是方便。不過......為什麼它在唱歌？哦，那是音樂播放功能。我覺得丹爐工作時也需要娛樂，不然多無聊。你連丹爐的使用者體驗都考慮到了？當然。使用者體驗是產品設計的核心。好吧......不過它會不會在半夜自動開派對？不會。我加了定時休眠功能，它晚上會自動安靜下來。不錯不錯。看來你終於記得加停止鍵了。嗯......不過我忘加音量控制了。",
  },
  {
    scene: "OutroScene",
    file: "04-outro.wav",
    segments: [
      { character: "narrator", text: "感謝收看誰讓他煉器的！第一章第三集，丹爐修復。" },
      { character: "narrator", text: "周墨用他獨特的方式修好了會說話的丹爐。雖然這座丹爐現在會在半夜唱歌，但至少它不罵人了。周墨似乎有一種天賦——他總是忘記加最重要的那個按鈕。" },
      { character: "narrator", text: "下一章預告：周墨在煉器峰的日子剛開始，但他即將遇到兩個比他還不正常的人。問道宗禍害三人組，即將成軍。" },
    ],
    fullText: "感謝收看誰讓他煉器的！第一章第三集，丹爐修復。周墨用他獨特的方式修好了會說話的丹爐。雖然這座丹爐現在會在半夜唱歌，但至少它不罵人了。周墨似乎有一種天賦——他總是忘記加最重要的那個按鈕。下一章預告：周墨在煉器峰的日子剛開始，但他即將遇到兩個比他還不正常的人。問道宗禍害三人組，即將成軍。",
  },
];
