/**
 * Narration scripts with per-character voice assignment for
 * 誰讓他煉器的！ 第三章 第一集：秘境探索
 *
 * Voices (mlx_tts):
 *   周墨 (zhoumo)         → uncle_fu  — male
 *   陸陽 (luyang)         → uncle_fu  — male
 *   孟景舟 (mengjingzhou) → uncle_fu  — male
 *   長老 (elder)          → uncle_fu  — male
 *   narrator              → uncle_fu  — male narrator
 *
 * All dialog text is in Traditional Chinese (zh_TW).
 */

export type VoiceCharacter = "zhoumo" | "luyang" | "mengjingzhou" | "elder" | "narrator";

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
  luyang: "uncle_fu",
  mengjingzhou: "uncle_fu",
  elder: "uncle_fu",
  narrator: "uncle_fu",
};

export const VOICE_DESCRIPTION: Record<VoiceCharacter, { voice: string; gender: string; accent: string }> = {
  zhoumo: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
  luyang: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
  mengjingzhou: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
  elder: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
  narrator: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
};

export const narrations: NarrationScript[] = [
  {
    scene: "TitleScene",
    file: "01-title.wav",
    segments: [
      { character: "narrator", text: "歡迎來到誰讓他煉器的！第三章，第一集，秘境探索。" },
      { character: "narrator", text: "低語洞窟的任務完成後，邏輯修正小組的名聲傳遍了問道宗——當然，是「禍害」那種名聲。長老決定把他們派去參加五年一次的宗門秘境探索，希望他們在別人面前丟臉。但周墨對這次任務充滿期待——因為秘境裡有大量上古陣法，簡直是工程師的天堂。" },
    ],
    fullText: "歡迎來到誰讓他煉器的！第三章，第一集，秘境探索。低語洞窟的任務完成後，邏輯修正小組的名聲傳遍了問道宗——當然，是「禍害」那種名聲。長老決定把他們派去參加五年一次的宗門秘境探索，希望他們在別人面前丟臉。但周墨對這次任務充滿期待——因為秘境裡有大量上古陣法，簡直是工程師的天堂。",
  },
  {
    scene: "ContentScene1",
    file: "02-content1.wav",
    segments: [
      { character: "narrator", text: "宗門秘境入口，五大宗門齊聚。各派精英弟子正在研究上古禁制的破解方法。" },
      { character: "elder", text: "這次秘境探索，你們三個給我安分點。別丟問道宗的臉。" },
      { character: "luyang", text: "長老放心，我帶了五份投降表，涵蓋所有可能的宗門。" },
      { character: "mengjingzhou", text: "我帶了論文草稿——「秘境環境對單身光環的影響研究」。如果遇到女修，這是很好的數據採集機會。" },
      { character: "elder", text: "……你們能不能有一次正常的準備？" },
      { character: "zhoumo", text: "長老，我準備了「雷射切割陣法」。根據古籍記載，這個秘境的禁制是三千年前的陣法構建，結構規律性很高，可以用線性切割的方式高效破解。" },
      { character: "elder", text: "你說的是那個……看起來像一根會發光的筷子一樣的東西？" },
      { character: "zhoumo", text: "那是「聚焦式靈氣切割陣法發射器」。我簡稱它「雷射筆」。" },
      { character: "luyang", text: "看起來確實像一支筆。一支會把東西切開的筆。" },
      { character: "mengjingzhou", text: "記錄：周墨又造了一個危險的東西。這是第幾次了？" },
      { character: "zhoumo", text: "這不是危險，這是效率。" },
    ],
    fullText: "宗門秘境入口，五大宗門齊聚。各派精英弟子正在研究上古禁制的破解方法。這次秘境探索，你們三個給我安分點。別丟問道宗的臉。長老放心，我帶了五份投降表，涵蓋所有可能的宗門。我帶了論文草稿——「秘境環境對單身光環的影響研究」。如果遇到女修，這是很好的數據採集機會。……你們能不能有一次正常的準備？長老，我準備了「雷射切割陣法」。根據古籍記載，這個秘境的禁制是三千年前的陣法構建，結構規律性很高，可以用線性切割的方式高效破解。你說的是那個……看起來像一根會發光的筷子一樣的東西？那是「聚焦式靈氣切割陣法發射器」。我簡稱它「雷射筆」。看起來確實像一支筆。一支會把東西切開的筆。記錄：周墨又造了一個危險的東西。這是第幾次了？這不是危險，這是效率。",
  },
  {
    scene: "ContentScene2",
    file: "03-content2.wav",
    segments: [
      { character: "narrator", text: "秘境內部。其他宗門的弟子們正在用各種方法破解禁制——有人用符咒，有人用劍氣，有人用陣盤。進度：零。" },
      { character: "mengjingzhou", text: "那個天劍宗的首席弟子已經砍了三十七劍了。禁制連個痕跡都沒有。" },
      { character: "luyang", text: "我在旁邊觀察了。他的臉越來越紅。我覺得他快要——" },
      { character: "zhoumo", text: "閃開。" },
      { character: "narrator", text: "周墨按下雷射筆的按鈕。一道筆直的靈氣光束射出——" },
      { character: "narrator", text: "禁制。被切成了兩半。" },
      { character: "mengjingzhou", text: "……就這樣？" },
      { character: "zhoumo", text: "就這樣。三千年前的陣法結構是單層線性排列，沒有冗餘設計。一個工程師的基本常識：永遠不要信任沒有備份的系統。" },
      { character: "luyang", text: "但是周墨……你好像把所有禁制都切斷了。不只是入口這個——整座秘境的禁制系統。" },
      { character: "zhoumo", text: "嗯，雷射筆的切割範圍確實沒有設定邊界。我記得我加了方向控制……等等，我忘了加方向控制。" },
      { character: "narrator", text: "整座秘境震動。牆壁上浮現出上古文字：「警告——禁制系統已離線——保護機制啟動——自毀倒數：一百八十息。」" },
      { character: "mengjingzhou", text: "一百八十息？那是我們能活多久的意思嗎？" },
      { character: "luyang", text: "我的投降表能遞給上古大能的保護機制嗎？" },
      { character: "zhoumo", text: "冷靜。這只是一個計時觸發的自動防禦協議。我來看看能不能找到……出口。" },
      { character: "mengjingzhou", text: "出口也被你切斷了。你看，那個門已經變成兩半了。" },
      { character: "zhoumo", text: "……這是一個需要優化的設計缺陷。" },
    ],
    fullText: "秘境內部。其他宗門的弟子們正在用各種方法破解禁制——有人用符咒，有人用劍氣，有人用陣盤。進度：零。那個天劍宗的首席弟子已經砍了三十七劍了。禁制連個痕跡都沒有。我在旁邊觀察了。他的臉越來越紅。我覺得他快要——閃開。周墨按下雷射筆的按鈕。一道筆直的靈氣光束射出——禁制。被切成了兩半。……就這樣？就這樣。三千年前的陣法結構是單層線性排列，沒有冗餘設計。一個工程師的基本常識：永遠不要信任沒有備份的系統。但是周墨……你好像把所有禁制都切斷了。不只是入口這個——整座秘境的禁制系統。嗯，雷射筆的切割範圍確實沒有設定邊界。我記得我加了方向控制……等等，我忘了加方向控制。整座秘境震動。牆壁上浮現出上古文字：「警告——禁制系統已離線——保護機制啟動——自毀倒數：一百八十息。」一百八十息？那是我們能活多久的意思嗎？我的投降表能遞給上古大能的保護機制嗎？冷靜。這只是一個計時觸發的自動防禦協議。我來看看能不能找到……出口。出口也被你切斷了。你看，那個門已經變成兩半了。……這是一個需要優化的設計缺陷。",
  },
  {
    scene: "OutroScene",
    file: "04-outro.wav",
    segments: [
      { character: "narrator", text: "感謝收看誰讓他煉器的！第三章第一集，秘境探索。" },
      { character: "narrator", text: "邏輯修正小組成功進入了秘境——然後成功觸發了自毀倒數。周墨的雷射筆效率很高，但忘了加方向限制，導致出口也被切斷了。現在問題很簡單：在一百八十息之內，找到一個不存在的出口。" },
      { character: "narrator", text: "下集預告：邏輯修正小組在自毀倒計時中瘋狂找出口，結果發現秘境的核心藏著一個更大的秘密——上古大能設計這個秘境的真正目的，竟然是為了測試「後人的智商」。" },
    ],
    fullText: "感謝收看誰讓他煉器的！第三章第一集，秘境探索。邏輯修正小組成功進入了秘境——然後成功觸發了自毀倒數。周墨的雷射筆效率很高，但忘了加方向限制，導致出口也被切斷了。現在問題很簡單：在一百八十息之內，找到一個不存在的出口。下集預告：邏輯修正小組在自毀倒計時中瘋狂找出口，結果發現秘境的核心藏著一個更大的秘密——上古大能設計這個秘境的真正目的，竟然是為了測試「後人的智商」。",
  },
];
