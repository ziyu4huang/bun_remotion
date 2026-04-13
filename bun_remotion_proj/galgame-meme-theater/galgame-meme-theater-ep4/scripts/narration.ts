/**
 * Narration scripts for 美少女梗圖劇場 第四集 (EP4).
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
    text: "歡迎來到美少女梗圖劇場第四集。今天的主題是學生黃金時代。從期末考前一週的極限操作，到手搖飲永遠戒不掉，搭捷運的社交距離大師技巧，還有實習生的真實血淚史。每一幕都是妳我的學生時期真實寫照。準備好了嗎？開始囉。",
  },
  {
    scene: "JokeScene1",
    file: "02-joke1.wav",
    text: "期末考還有一週。沒關係，我還有七天可以讀。六天。五天。三天。明天考，我現在開始讀還來得及嗎。這就是所謂的極限操作。教授說這次是開書考。太好了，可以帶課本進去。結果整本書都考。我的人生已經結束了。別灰心，補考也是一種體驗。",
  },
  {
    scene: "JokeScene2",
    file: "03-joke2.wav",
    text: "我今天不喝手搖飲了。真的嗎，妳撐得住嗎。她撐不到的，上次她也這樣說。我這次是認真的，我已經戒了三小時了。妳的意志力跟WiFi斷線一樣短。妳們看好了，我今天只喝水。那是什麼。這不算手搖飲，這是鮮奶茶。鮮奶茶也是手搖飲。不一樣，這個是用鮮奶做的。妳手上那杯明明是黑糖珍奶加珍珠加布丁加椰果。這是我的最後一杯。妳昨天也這樣說，前天也是，大前天也是。那是因為每次都是不同的最後一杯。",
  },
  {
    scene: "JokeScene3",
    file: "04-joke3.wav",
    text: "搭捷運最重要的技能是什麼。找位置。假裝睡覺。正確，假裝睡覺可以解決一切。有人在看我怎麼辦。拿出手機，假裝在回重要訊息。但妳明明沒有訊息啊。所以我打開天氣預報。看天氣預報能看十分鐘。我還順便看了明天的、後天的、一週後的。捷運上最遠的距離，是站在你旁邊，你卻假裝看不到我讓座。還有，上捷運前先查有沒有座位，有座位才上車。妳那不叫搭捷運，妳那叫蹲點。",
  },
  {
    scene: "JokeScene4",
    file: "05-joke4.wav",
    text: "我拿到實習了，好興奮。恭喜，準備好做免費勞工了嗎。第一天，好新鮮，公司的咖啡機好高級。第二天，原來咖啡機這麼難用。第三天，我為什麼要幫大家訂便當。第七天，我現在的正式工作是影印、掃描、倒垃圾。實習學到的最重要的事是什麼。如何用Excel排出好看的表格。還有。如何在開會時假裝聽懂。以及如何在老闆走過來的瞬間切回工作畫面。這就是職場預備班，歡迎來到真實世界。我，我想回學校上課。",
  },
  {
    scene: "OutroScene",
    file: "06-outro.wav",
    text: "哈哈哈，是不是每個梗都讓妳想起自己的學生時代。感謝收看美少女梗圖劇場第四集，學生黃金時代。記得，極限操作是基本技能，手搖飲沒有所謂的最後一杯，假裝睡覺可以解決一切，實習是職場預備班。我們下集見。",
  },
];
