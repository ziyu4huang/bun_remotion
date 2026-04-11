/**
 * Narration scripts for 美少女梗圖劇場 第二集 (EP2).
 *
 * Each scene narration reads the ACTUAL dialog lines so voice matches subtitles.
 * Audio is generated via MLX TTS (Qwen3-TTS) or Gemini TTS fallback.
 *
 * To regenerate: bun run scripts/generate-tts.ts
 */

export interface NarrationScript {
  scene: string;
  file: string;
  text: string;
}

export const narrations: NarrationScript[] = [
  {
    scene: "TitleScene",
    file: "01-title.wav",
    text: "歡迎回到美少女梗圖劇場第二集。今天的主題是網路與遊戲，保證每個梗都讓妳覺得是在偷窺自己的生活。",
  },
  {
    scene: "JokeScene1",
    file: "02-joke1.wav",
    text: "今天讀書會，帶好妳們的筆記。收到，我準備好了手機充電器。我帶了零食和肥宅快樂水。我叫妳們帶筆記，不是開派對。等等，我排位開了，先打一局。我剛好蝦皮有折扣，妳們要不要看。妳們到底有沒有人在讀書。有啊，我在讀對面的出裝。我在讀評價，這個商品好可愛。我悔恨，我不該相信妳們。",
  },
  {
    scene: "JokeScene2",
    file: "03-joke2.wav",
    text: "小樱，妳的Steam遊戲庫有多少個遊戲。三百四十二個吧，我沒仔細數。妳打了幾個。七個。花錢買一堆不玩的東西，妳是圖什麼。可是打折的時候不買，會覺得虧啊。妳虧的不是錢，是硬碟空間。不對，我是在投資，萬一哪天想玩呢。妳三年前買的那款，現在還在特價，更便宜了。那我再買一份，省得後悔。等等，什麼邏輯。",
  },
  {
    scene: "JokeScene3",
    file: "04-joke3.wav",
    text: "好，最後一局，打完就睡。妳半小時前也這麼說的。這次是真的，我看一下時間，凌晨兩點半。我也要睡了，晚安。等等，這局我快贏了，再打一局。小雪，現在凌晨三點四十七分。好好好，這局打完真的睡，我發誓。天亮了，小雪妳還在打。我沒有在打，我在等排隊。妳的再一局跟減肥的最後一杯是同一個老師教的吧。",
  },
  {
    scene: "JokeScene4",
    file: "05-joke4.wav",
    text: "又輸了，這已經第六場了。要不要休息一下，喝口水。不用，我一定能贏回來，這局穩的。小月妳的手在抖耶。沒有，那是興奮。小月妳連敗十場了，要不要考慮。考慮什麼，考慮這遊戲有問題，我也覺得。那個小月，妳的KDA是零比十二。那是隊友不給我支援，不是我的問題。好好好，都是隊友的錯，妳先放下滑鼠，我們去吃飯。再打最後一局，這次一定贏。小月。",
  },
  {
    scene: "OutroScene",
    file: "06-outro.wav",
    text: "哈哈，是不是覺得每個梗都在說自己？感謝收看美少女梗圖劇場第二集。記得，再一局就睡，打折不買會虧，輸了都是隊友的錯。我們下集見。",
  },
];
