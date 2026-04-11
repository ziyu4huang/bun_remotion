/**
 * Narration scripts for 美少女梗圖劇場 (Beautiful Girl Meme Theater).
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
    text: "歡迎來到美少女梗圖劇場。今天要帶妳們看看美少女的日常有多荒謬，保證每個梗都讓妳直呼太真實。",
  },
  {
    scene: "JokeScene1",
    file: "02-joke1.wav",
    text: "今天又要早八，我感覺我的靈魂還在被窩裡。你不是昨天也這麼說？對啊，但今天是真的痛，我的黑眼圈已經比妝還濃了。我已經把鬧鐘關了七次了，再睡五分鐘。你們兩個已經遲到了，老師在看。完了完了完了，快跑！",
  },
  {
    scene: "JokeScene2",
    file: "03-joke2.wav",
    text: "從今天開始減肥，不吃了。支持妳，我陪妳一起，等等，那是什麼？珍珠奶茶，這是最後一杯。妳昨天也說是最後一杯喔。昨天那杯不算，因為那天是星期五。那今天星期幾？不重要，先喝再說。",
  },
  {
    scene: "JokeScene3",
    file: "04-joke3.wav",
    text: "小月，妳考了多少分？沒複習，隨便考考而已。我也是沒複習。我也是！等等，成績出來了，小月妳九十八分？！嗯，運氣好而已。那我們三十二分和二十八分也是運氣好？！那你們下次也隨便考考嘛。",
  },
  {
    scene: "JokeScene4",
    file: "05-joke4.wav",
    text: "老師好！小樱，那不是老師，是隔壁班的帥哥。啊啊啊啊，對不起！順便一提，整棟樓都聽到了。我想轉學，我想消失，把我埋了吧。別這樣嘛，至少他笑了，說妳很可愛。什麼，真的嗎？！我騙妳的。小月，妳給我站住！",
  },
  {
    scene: "OutroScene",
    file: "06-outro.wav",
    text: "哈哈，美少女的生活就是這麼荒謬又美好。感謝收看美少女梗圖劇場，我們下回見。記得，減肥從明天開始喔。",
  },
];
