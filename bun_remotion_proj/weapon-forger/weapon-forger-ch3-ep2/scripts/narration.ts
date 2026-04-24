/**
 * Narration scripts with per-character voice assignment for
 * 誰讓他煉器的！ 第三章 第二集：智商測試
 *
 * Voices (mlx_tts):
 *   周墨 (zhoumo)         → uncle_fu  — male
 *   陸陽 (luyang)         → uncle_fu  — male
 *   孟景舟 (mengjingzhou) → uncle_fu  — male
 *   narrator              → uncle_fu  — male narrator
 *
 * All dialog text is in Traditional Chinese (zh_TW).
 */

export type VoiceCharacter = "zhoumo" | "luyang" | "mengjingzhou" | "narrator";

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
  narrator: "uncle_fu",
};

export const VOICE_DESCRIPTION: Record<VoiceCharacter, { voice: string; gender: string; accent: string }> = {
  zhoumo: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
  luyang: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
  mengjingzhou: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
  narrator: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
};

export const narrations: NarrationScript[] = [
  {
    scene: "TitleScene",
    file: "01-title.wav",
    segments: [
      { character: "narrator", text: "歡迎來到誰讓他煉器的！第三章，第二集，智商測試。" },
      { character: "narrator", text: "上一集，邏輯修正小組成功觸發了秘境自毀倒數。周墨忘記給雷射筆加方向限制，一刀切斷了所有禁制——包括出口。現在倒數還在跑，而他們唯一的生路，是往秘境深處走。" },
    ],
    fullText: "歡迎來到誰讓他煉器的！第三章，第二集，智商測試。上一集，邏輯修正小組成功觸發了秘境自毀倒數。周墨忘記給雷射筆加方向限制，一刀切斷了所有禁制——包括出口。現在倒數還在跑，而他們唯一的生路，是往秘境深處走。",
  },
  {
    scene: "ContentScene1",
    file: "02-content1.wav",
    segments: [
      { character: "narrator", text: "秘境深處。倒數已經從一百八十息變成一百二十息。地面每隔十息震動一次，牆上的上古文字閃爍著紅光。" },
      { character: "luyang", text: "我覺得我們應該往左走。直覺告訴我左邊有出口。" },
      { character: "mengjingzhou", text: "你上次直覺告訴你食堂有折扣，結果那是上個月的事。" },
      { character: "zhoumo", text: "別爭了。我發現這個秘境的禁制系統底層有一個隱藏的子系統，從未被啟動過。坐標在正前方。" },
      { character: "luyang", text: "等等，你怎麼發現的？" },
      { character: "zhoumo", text: "我剛才用雷射筆切斷禁制的時候，順便掃描了一下整個結構。工程師的基本習慣——動刀之前先做CT。" },
      { character: "mengjingzhou", text: "你切之前怎麼不做CT？" },
      { character: "zhoumo", text: "……那是流程上的優化空間。" },
      { character: "narrator", text: "三人到達秘境核心。一扇巨大的石門出現在眼前，上面刻著八個大字——「智商測試中心，請勿作弊」。石門自動開啟，裡面是一個空曠的大廳，中央漂浮著一個發光的水晶球。" },
    ],
    fullText: "秘境深處。倒數已經從一百八十息變成一百二十息。地面每隔十息震動一次，牆上的上古文字閃爍著紅光。我覺得我們應該往左走。直覺告訴我左邊有出口。你上次直覺告訴你食堂有折扣，結果那是上個月的事。別爭了。我發現這個秘境的禁制系統底層有一個隱藏的子系統，從未被啟動過。坐標在正前方。等等，你怎麼發現的？我剛才用雷射筆切斷禁制的時候，順便掃描了一下整個結構。工程師的基本習慣——動刀之前先做CT。你切之前怎麼不做CT？……那是流程上的優化空間。三人到達秘境核心。一扇巨大的石門出現在眼前，上面刻著八個大字——「智商測試中心，請勿作弊」。石門自動開啟，裡面是一個空曠的大廳，中央漂浮著一個發光的水晶球。",
  },
  {
    scene: "ContentScene2",
    file: "03-content2.wav",
    segments: [
      { character: "narrator", text: "水晶球亮起，投射出第一道題目：「一個法寶製造者造了一把能切斷一切的劍，但他忘記加了一個功能。請問是什麼？」" },
      { character: "luyang", text: "「停下來的功能」。周墨，這題是不是在說你？" },
      { character: "zhoumo", text: "這是一道陷阱題。答案不可能是這麼簡單的。" },
      { character: "mengjingzhou", text: "但這確實就是你幹的事啊。你的雷射筆沒有方向限制，沒有範圍限制，也沒有停止按鈕。" },
      { character: "zhoumo", text: "那不叫「忘記加」，那叫「最小可行性產品」。啟動創業的人都知道——先上線，再迭代。" },
      { character: "luyang", text: "你這個迭代會把我們送走。" },
      { character: "narrator", text: "水晶球亮起綠光——答案正確。石門深處傳來新的通道開啟的聲音。" },
      { character: "mengjingzhou", text: "等等，正確答案就是「停止功能」？那周墨的歪理居然答對了？" },
      { character: "zhoumo", text: "不是歪理，是產品哲學。上古大能顯然也是個有經驗的項目管理者。" },
      { character: "luyang", text: "倒數還剩六十息！快走！" },
      { character: "narrator", text: "三人衝進新開啟的通道。身後的大廳開始崩塌。周墨回頭看了一眼——水晶球上浮現出最後一行字：「測試結果：勉強及格。恭喜你們沒有笨到死在這裡。」" },
      { character: "zhoumo", text: "……這個上古大能的評價系統有待改進。" },
    ],
    fullText: "水晶球亮起，投射出第一道題目：「一個法寶製造者造了一把能切斷一切的劍，但他忘記加了一個功能。請問是什麼？」「停下來的功能」。周墨，這題是不是在說你？這是一道陷阱題。答案不可能是這麼簡單的。但這確實就是你幹的事啊。你的雷射筆沒有方向限制，沒有範圍限制，也沒有停止按鈕。那不叫「忘記加」，那叫「最小可行性產品」。啟動創業的人都知道——先上線，再迭代。你這個迭代會把我們送走。水晶球亮起綠光——答案正確。石門深處傳來新的通道開啟的聲音。等等，正確答案就是「停止功能」？那周墨的歪理居然答對了？不是歪理，是產品哲學。上古大能顯然也是個有經驗的項目管理者。倒數還剩六十息！快走！三人衝進新開啟的通道。身後的大廳開始崩塌。周墨回頭看了一眼——水晶球上浮現出最後一行字：「測試結果：勉強及格。恭喜你們沒有笨到死在這裡。」……這個上古大能的評價系統有待改進。",
  },
  {
    scene: "OutroScene",
    file: "04-outro.wav",
    segments: [
      { character: "narrator", text: "感謝收看誰讓他煉器的！第三章第二集，智商測試。" },
      { character: "narrator", text: "邏輯修正小組勉強通過了上古大能的智商測試。周墨學到了一個教訓：做東西的時候，記得加停止按鈕。不過他好像沒有真的學到，因為他已經在想下一個法寶了。" },
      { character: "narrator", text: "下集預告：逃出秘境後，邏輯修正小組帶回了上古大能的測試記錄。長老看了一眼，發現上面記載的不是測試成績——而是一份三千年前就寫好的「宗門大比預測報告」，準確預測了每一屆冠軍。" },
    ],
    fullText: "感謝收看誰讓他煉器的！第三章第二集，智商測試。邏輯修正小組勉強通過了上古大能的智商測試。周墨學到了一個教訓：做東西的時候，記得加停止按鈕。不過他好像沒有真的學到，因為他已經在想下一個法寶了。下集預告：逃出秘境後，邏輯修正小組帶回了上古大能的測試記錄。長老看了一眼，發現上面記載的不是測試成績——而是一份三千年前就寫好的「宗門大比預測報告」，準確預測了每一屆冠軍。",
  },
];
