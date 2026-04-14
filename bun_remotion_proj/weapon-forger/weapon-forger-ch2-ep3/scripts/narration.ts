/**
 * Narration scripts with per-character voice assignment for
 * 誰讓他煉器的！ 第二章 第三集：三人成虎
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
      { character: "narrator", text: "歡迎來到誰讓他煉器的！第二章，第三集，三人成虎。" },
      { character: "narrator", text: "低語洞窟任務完成後，滄溟子的殘魂正式成為邏輯修正小組的「名譽顧問」。長老派了第二個任務：修復後山崩塌的藏經閣。三百年沒有人去過的藏經閣，書的怨念太重，把建築都震塌了。" },
    ],
    fullText: "歡迎來到誰讓他煉器的！第二章，第三集，三人成虎。低語洞窟任務完成後，滄溟子的殘魂正式成為邏輯修正小組的「名譽顧問」。長老派了第二個任務：修復後山崩塌的藏經閣。三百年沒有人去過的藏經閣，書的怨念太重，把建築都震塌了。",
  },
  {
    scene: "ContentScene1",
    file: "02-content1.wav",
    segments: [
      { character: "narrator", text: "長老召集邏輯修正小組，說明了任務內容。" },
      { character: "elder", text: "藏經閣三年前因為結構老化崩塌了。裡面的書籍至今沒有人整理。你們去修復一下。" },
      { character: "luyang", text: "長老，藏經閣為什麼會自己崩塌？" },
      { character: "elder", text: "三百年沒人去過。書的怨念太重，把建築震塌了。" },
      { character: "mengjingzhou", text: "……書會有怨念？" },
      { character: "elder", text: "你試試三百年沒有人翻開你寫的論文。" },
      { character: "mengjingzhou", text: "……長老這句話比我的論文還殘忍。" },
      { character: "zhoumo", text: "藏經閣。三百年沒人維護的資訊系統。典型的「缺乏使用者回饋導致系統退化」。我對這個任務很有興趣。" },
      { character: "elder", text: "周墨，我警告你，不許把藏經閣改成什麼奇怪的東西。" },
      { character: "zhoumo", text: "放心，長老。我只是去做系統維護。" },
      { character: "luyang", text: "每次周墨說「放心」，我就開始擔心。" },
    ],
    fullText: "長老召集邏輯修正小組，說明了任務內容。藏經閣三年前因為結構老化崩塌了。裡面的書籍至今沒有人整理。你們去修復一下。長老，藏經閣為什麼會自己崩塌？三百年沒人去過。書的怨念太重，把建築震塌了。……書會有怨念？你試試三百年沒有人翻開你寫的論文。……長老這句話比我的論文還殘忍。藏經閣。三百年沒人維護的資訊系統。典型的「缺乏使用者回饋導致系統退化」。我對這個任務很有興趣。周墨，我警告你，不許把藏經閣改成什麼奇怪的東西。放心，長老。我只是去做系統維護。每次周墨說「放心」，我就開始擔心。",
  },
  {
    scene: "ContentScene2",
    file: "03-content2.wav",
    segments: [
      { character: "narrator", text: "三人來到藏經閣廢墟。剛踏進門，一本書從空中飛來——" },
      { character: "luyang", text: "什麼——！" },
      { character: "narrator", text: "書本直接搶走了陸陽口袋裡的投降表，然後開始朗讀。" },
      { character: "luyang", text: "那是我的投降表！那是我精心設計的！裡面有十七種投降姿勢的插圖！" },
      { character: "narrator", text: "另一本書飛向孟景舟，搶走了他的論文草稿。幾秒後，書上多了一堆紅筆批改。" },
      { character: "mengjingzhou", text: "等等……這本書在批改我的論文？它加了一行：「論點不成立，建議重寫」——還畫了一個大大的叉。" },
      { character: "zhoumo", text: "有趣。這些書的攻擊行為，本質上是「尋求關注」。三百年沒有人閱讀它們，它們的防禦機制是對「被忽視」的反應。" },
      { character: "luyang", text: "所以你的意思是……這些書在鬧脾氣？" },
      { character: "zhoumo", text: "從工程學的角度來說，這是一個「缺乏正向回饋的系統」。解決方案很簡單——給它們「點讚」。" },
      { character: "narrator", text: "周墨掏出一個小裝置，對著每本書按了一下。書們立刻安靜了下來。" },
      { character: "mengjingzhou", text: "就……就這樣？" },
      { character: "zhoumo", text: "我給每本書加了一個「認可系統」。它們得到了三百年來第一個正向評價。問題解決。" },
      { character: "luyang", text: "但是周墨……藏經閣裡所有的書都在看著你。" },
      { character: "narrator", text: "數百本書同時翻開，書頁發出沙沙聲，仿佛在說——「我的呢？」" },
      { character: "zhoumo", text: "……我來給它們加一個「自動評價系統」。" },
      { character: "narrator", text: "三天後。藏經閣裡的書開始互相寫評論。一本《劍道入門》給自己打了五星，評語是「本世紀最偉大的著作」。旁邊的《煉丹基礎》不甘示弱，寫了一篇長文評論自己「超越了上古大能」。" },
      { character: "mengjingzhou", text: "周墨，你的自動評價系統出了問題。這些書的文學水平直線下降——它們現在只會互相吹捧。" },
      { character: "zhoumo", text: "啊……我忘記加「評價標準」了。沒有標準的評價系統，就像沒有尺的裁縫——" },
      { character: "luyang", text: "會把衣服做成正方形。" },
      { character: "zhoumo", text: "……我本來想說「會亂剪一氣」，但你的比喻更好。" },
    ],
    fullText: "三人來到藏經閣廢墟。剛踏進門，一本書從空中飛來——什麼——！書本直接搶走了陸陽口袋裡的投降表，然後開始朗讀。那是我的投降表！那是我精心設計的！裡面有十七種投降姿勢的插圖！另一本書飛向孟景舟，搶走了他的論文草稿。幾秒後，書上多了一堆紅筆批改。等等……這本書在批改我的論文？它加了一行：「論點不成立，建議重寫」——還畫了一個大大的叉。有趣。這些書的攻擊行為，本質上是「尋求關注」。三百年沒有人閱讀它們，它們的防禦機制是對「被忽視」的反應。所以你的意思是……這些書在鬧脾氣？從工程學的角度來說，這是一個「缺乏正向回饋的系統」。解決方案很簡單——給它們「點讚」。周墨掏出一個小裝置，對著每本書按了一下。書們立刻安靜了下來。就……就這樣？我給每本書加了一個「認可系統」。它們得到了三百年來第一個正向評價。問題解決。但是周墨……藏經閣裡所有的書都在看著你。數百本書同時翻開，書頁發出沙沙聲，仿佛在說——「我的呢？」……我來給它們加一個「自動評價系統」。三天後。藏經閣裡的書開始互相寫評論。一本《劍道入門》給自己打了五星，評語是「本世紀最偉大的著作」。旁邊的《煉丹基礎》不甘示弱，寫了一篇長文評論自己「超越了上古大能」。周墨，你的自動評價系統出了問題。這些書的文學水平直線下降——它們現在只會互相吹捧。啊……我忘記加「評價標準」了。沒有標準的評價系統，就像沒有尺的裁縫——會把衣服做成正方形。……我本來想說「會亂剪一氣」，但你的比喻更好。",
  },
  {
    scene: "OutroScene",
    file: "04-outro.wav",
    segments: [
      { character: "narrator", text: "感謝收看誰讓他煉器的！第二章第三集，三人成虎。" },
      { character: "narrator", text: "邏輯修正小組成功「修復」了藏經閣——雖然現在裡面的書都在互相吹捧，文學水平跌到了谷底。周墨的自動評價系統效率很高，但忘了加評價標準，導致藏經閣成了修仙界最大的「假評價工廠」。" },
      { character: "narrator", text: "下集預告：長老派邏輯修正小組參加五年一次的宗門秘境探索。別家宗門在認真破解上古禁制，周墨掏出了「雷射切割陣法」——效率很高，但把整座秘境的禁制全切斷了，觸發了自毀倒數。" },
    ],
    fullText: "感謝收看誰讓他煉器的！第二章第三集，三人成虎。邏輯修正小組成功「修復」了藏經閣——雖然現在裡面的書都在互相吹捧，文學水平跌到了谷底。周墨的自動評價系統效率很高，但忘了加評價標準，導致藏經閣成了修仙界最大的「假評價工廠」。下集預告：長老派邏輯修正小組參加五年一次的宗門秘境探索。別家宗門在認真破解上古禁制，周墨掏出了「雷射切割陣法」——效率很高，但把整座秘境的禁制全切斷了，觸發了自毀倒數。",
  },
];
