/**
 * Narration scripts with per-character voice assignment for
 * 美少女梗圖劇場 第七集：AI 時代求生
 *
 * Voices (mlx_tts):
 *   小雪 (xiaoxue)    → serena   — female
 *   小月 (xiaoyue)    → vivian   — female
 *   小樱 (xiaoying)   → serena   — female
 *   narrator          → serena   — female narrator
 */

export type VoiceCharacter = "xiaoxue" | "xiaoyue" | "xiaoying" | "narrator";

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
  xiaoxue: "serena",
  xiaoyue: "vivian",
  xiaoying: "serena",
  narrator: "serena",
};

export const VOICE_DESCRIPTION: Record<VoiceCharacter, { voice: string; gender: string; accent: string }> = {
  xiaoxue: { voice: "serena", gender: "female", accent: "Taiwan Mandarin" },
  xiaoyue: { voice: "vivian", gender: "female", accent: "Taiwan Mandarin" },
  xiaoying: { voice: "serena", gender: "female", accent: "Taiwan Mandarin" },
  narrator: { voice: "serena", gender: "female", accent: "Taiwan Mandarin" },
};

export const narrations: NarrationScript[] = [
  {
    scene: "TitleScene",
    file: "01-title.wav",
    segments: [
      { character: "narrator", text: "歡迎來到美少女梗圖劇場第七集！AI 時代求生。" },
      { character: "narrator", text: "小雪、小月和小樱面對人工智能的全面入侵，發現人類的生存危機不是 AI 太聰明，而是自己太依賴 AI。" },
    ],
    fullText: "歡迎來到美少女梗圖劇場第七集！AI 時代求生。小雪、小月和小樱面對人工智能的全面入侵，發現人類的生存危機不是 AI 太聰明，而是自己太依賴 AI。",
  },
  {
    scene: "JokeScene1",
    file: "02-joke1.wav",
    segments: [
      { character: "narrator", text: "小雪發現小月和小樱都在用 AI 寫作業。" },
      { character: "xiaoxue", text: "小月！你的報告怎麼寫了三十頁？" },
      { character: "xiaoyue", text: "我叫 ChatGPT 幫我擴寫。" },
      { character: "xiaoxue", text: "擴寫？你原本寫了幾頁？" },
      { character: "xiaoyue", text: "三行。" },
      { character: "xiaoxue", text: "三行變三十頁？！" },
      { character: "xiaoyue", text: "我說「請詳細擴寫」，它真的很詳細。連參考文獻都幫我編了十七篇。" },
      { character: "xiaoxue", text: "那你交了嗎？" },
      { character: "xiaoyue", text: "當然沒有。教授問我參考文獻的作者，我一個都叫不出來。" },
      { character: "xiaoying", text: "其實……我也用 AI 寫了。" },
      { character: "xiaoxue", text: "小樱也？！" },
      { character: "xiaoying", text: "我的 AI 很貼心，幫我在結尾加了「本報告由 AI 輔助撰寫」。" },
      { character: "xiaoxue", text: "……" },
      { character: "xiaoyue", text: "至少你的 AI 有良心。" },
    ],
    fullText: "小雪發現小月和小樱都在用 AI 寫作業。小月！你的報告怎麼寫了三十頁？我叫 ChatGPT 幫我擴寫。擴寫？你原本寫了幾頁？三行。三行變三十頁？！我說「請詳細擴寫」，它真的很詳細。連參考文獻都幫我編了十七篇。那你交了嗎？當然沒有。教授問我參考文獻的作者，我一個都叫不出來。其實……我也用 AI 寫了。小樱也？！我的 AI 很貼心，幫我在結尾加了「本報告由 AI 輔助撰寫」。……至少你的 AI 有良心。",
  },
  {
    scene: "JokeScene2",
    file: "03-joke2.wav",
    segments: [
      { character: "narrator", text: "小雪設定 AI 自動回訊息，結果比本人更受歡迎。" },
      { character: "xiaoxue", text: "好了！我設定了 AI 自動回訊息。以後再也不用煩惱要回什麼了！" },
      { character: "xiaoyue", text: "你確定？上次你用自動回覆，跟你媽說「收到，感謝您的反饋」。" },
      { character: "xiaoxue", text: "那是意外！我重新訓練過了。現在它會模仿我的語氣。" },
      { character: "xiaoying", text: "小雪……你 AI 剛才回了我一個「好的呢～♡」。" },
      { character: "xiaoxue", text: "怎麼了？那是我平常的語氣啊。" },
      { character: "xiaoying", text: "可是你剛才問我「今天晚上吃什麼」。" },
      { character: "xiaoxue", text: "……" },
      { character: "xiaoyue", text: "你的 AI 比你還有禮貌。它甚至會加「辛苦了」。" },
      { character: "xiaoxue", text: "最慘的是，我男友說他比較喜歡 AI 回的訊息。" },
      { character: "xiaoying", text: "……那是不是代表，你的存在被 AI 取代了？" },
      { character: "xiaoxue", text: "小樱！你不准說實話！" },
    ],
    fullText: "小雪設定 AI 自動回訊息，結果比本人更受歡迎。好了！我設定了 AI 自動回訊息。以後再也不用煩惱要回什麼了！你確定？上次你用自動回覆，跟你媽說「收到，感謝您的反饋」。那是意外！我重新訓練過了。現在它會模仿我的語氣。小雪……你 AI 剛才回了我一個「好的呢～♡」。怎麼了？那是我平常的語氣啊。可是你剛才問我「今天晚上吃什麼」。……你的 AI 比你還有禮貌。它甚至會加「辛苦了」。最慘的是，我男友說他比較喜歡 AI 回的訊息。……那是不是代表，你的存在被 AI 取代了？小樱！你不准說實話！",
  },
  {
    scene: "JokeScene3",
    file: "04-joke3.wav",
    segments: [
      { character: "narrator", text: "小月發現有人用深度偽造技術做了她的假影片。" },
      { character: "xiaoyue", text: "你們看這個影片。這是我嗎？" },
      { character: "xiaoxue", text: "哇，真的好像你！你在做什麼？" },
      { character: "xiaoyue", text: "我在……跳抖音。" },
      { character: "xiaoxue", text: "你會跳舞嗎？" },
      { character: "xiaoyue", text: "不會。這是深度偽造。有人用我的照片做了假的影片。" },
      { character: "xiaoying", text: "那你怎麼辦？" },
      { character: "xiaoyue", text: "我也用 AI 做了一個假的自己。讓那個假的去跳舞，真的我在家睡覺。" },
      { character: "xiaoxue", text: "等等，這樣你不就變成 AI 了嗎？" },
      { character: "xiaoyue", text: "不，我還是真人。只是我的「數位分身」替我工作。" },
      { character: "xiaoying", text: "那如果大家都有數位分身，真人是不是就不用出門了？" },
      { character: "xiaoyue", text: "理論上是的。" },
      { character: "xiaoxue", text: "太好了！以後數位小雪去上課，真的小雪在家追劇！" },
      { character: "xiaoyue", text: "然後你的數位分身考了第一名。" },
      { character: "xiaoxue", text: "……那我就更不想出門了。" },
    ],
    fullText: "小月發現有人用深度偽造技術做了她的假影片。你們看這個影片。這是我嗎？哇，真的好像你！你在做什麼？我在……跳抖音。你會跳舞嗎？不會。這是深度偽造。有人用我的照片做了假的影片。那你怎麼辦？我也用 AI 做了一個假的自己。讓那個假的去跳舞，真的我在家睡覺。等等，這樣你不就變成 AI 了嗎？不，我還是真人。只是我的「數位分身」替我工作。那如果大家都有數位分身，真人是不是就不用出門了？理論上是的。太好了！以後數位小雪去上課，真的小雪在家追劇！然後你的數位分身考了第一名。……那我就更不想出門了。",
  },
  {
    scene: "JokeScene4",
    file: "05-joke4.wav",
    segments: [
      { character: "narrator", text: "三人討論在 AI 時代，人類到底還有什麼存在的意義。" },
      { character: "xiaoyue", text: "AI 會寫程式、會畫畫、會寫小說、會作曲。人類還能做什麼？" },
      { character: "xiaoxue", text: "人類還能……吃飯！" },
      { character: "xiaoyue", text: "AI 不需要吃飯。" },
      { character: "xiaoxue", text: "人類還能……睡覺！" },
      { character: "xiaoyue", text: "AI 不需要睡覺，而且二十四小時工作。" },
      { character: "xiaoying", text: "人類還能……犯錯。" },
      { character: "xiaoyue", text: "……這倒是真的。AI 不會犯錯。" },
      { character: "xiaoxue", text: "等等，小樱這個說法好深。" },
      { character: "xiaoying", text: "我不是在說深奧的話。我只是說，我昨天把鹽當糖加了。" },
      { character: "xiaoxue", text: "……" },
      { character: "xiaoyue", text: "但她說得對。AI 的完美反而讓它沒有靈魂。人類之所以有趣，就是因為我們會犯蠢。" },
      { character: "xiaoxue", text: "對！AI 永遠不會在半夜三點買一堆不需要的東西！" },
      { character: "xiaoyue", text: "也不會在社群媒體上發布後悔的動態。" },
      { character: "xiaoying", text: "更不會把密碼設成「123456」。" },
      { character: "xiaoxue", text: "……小樱，你的密碼是 123456 嗎？" },
      { character: "xiaoying", text: "不是。是「123456789」。" },
      { character: "xiaoyue", text: "比原來的還糟。" },
    ],
    fullText: "三人討論在 AI 時代，人類到底還有什麼存在的意義。AI 會寫程式、會畫畫、會寫小說、會作曲。人類還能做什麼？人類還能……吃飯！AI 不需要吃飯。人類還能……睡覺！AI 不需要睡覺，而且二十四小時工作。人類還能……犯錯。……這倒是真的。AI 不會犯錯。等等，小樱這個說法好深。我不是在說深奧的話。我只是說，我昨天把鹽當糖加了。……但她說得對。AI 的完美反而讓它沒有靈魂。人類之所以有趣，就是因為我們會犯蠢。對！AI 永遠不會在半夜三點買一堆不需要的東西！也不會在社群媒體上發布後悔的動態。更不會把密碼設成「123456」。……小樱，你的密碼是 123456 嗎？不是。是「123456789」。比原來的還糟。",
  },
  {
    scene: "OutroScene",
    file: "06-outro.wav",
    segments: [
      { character: "narrator", text: "感謝收看美少女梗圖劇場第七集！AI 時代求生。" },
      { character: "narrator", text: "AI 可以幫我們寫作業、回訊息、做影片，但有一件事 AI 永遠做不到——那就是像小雪一樣在半夜買不需要的東西。人類的不完美，才是我們最可愛的地方。" },
      { character: "narrator", text: "下集預告：三人踏入了加密貨幣的世界。小雪投資了一萬塊買了一個叫「狗狗幣超級無敵版」的虛擬貨幣。小月冷靜分析後發現，這個幣的官網是用 Canva 做的。" },
    ],
    fullText: "感謝收看美少女梗圖劇場第七集！AI 時代求生。AI 可以幫我們寫作業、回訊息、做影片，但有一件事 AI 永遠做不到——那就是像小雪一樣在半夜買不需要的東西。人類的不完美，才是我們最可愛的地方。下集預告：三人踏入了加密貨幣的世界。小雪投資了一萬塊買了一個叫「狗狗幣超級無敵版」的虛擬貨幣。小月冷靜分析後發現，這個幣的官網是用 Canva 做的。",
  },
];
