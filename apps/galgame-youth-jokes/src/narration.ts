/**
 * Narration scripts for Galgame Youth Jokes video.
 *
 * Each scene has a narration text for TTS generation.
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
    text: "歡迎來到青春笑話劇場。今天要分享幾個校園裡的趣事，保證讓你笑到肚子痛。",
  },
  {
    scene: "JokeScene1",
    file: "02-joke1.wav",
    text: "王老師問小明，請用果然造句。小明回答，我先吃水果，然後喝果汁。全班同學笑翻了。",
  },
  {
    scene: "JokeScene2",
    file: "03-joke2.wav",
    text: "王老師問小明，你的作業呢？小明說，老師，我的狗把它吃了。王老師說，你昨天也這麼說。小明回答，對啊，因為我昨天也沒寫。",
  },
  {
    scene: "JokeScene3",
    file: "04-joke3.wav",
    text: "小美問小明，你今天有讀書嗎？小明回答，有啊！我翻開書本就睡著了，這叫夢中學習法！小美無言以對。",
  },
  {
    scene: "JokeScene4",
    file: "05-joke4.wav",
    text: "小美問小明，期末考你準備好了嗎？小明說，準備好了啊！小美驚訝地問，真的？小明回答，對，我準備好要補考了。",
  },
  {
    scene: "OutroScene",
    file: "06-outro.wav",
    text: "哈哈，這就是青春啊！感謝收看青春笑話劇場，我們下回見。",
  },
];
