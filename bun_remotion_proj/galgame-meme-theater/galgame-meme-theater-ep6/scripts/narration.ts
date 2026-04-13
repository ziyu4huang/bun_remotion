/**
 * Narration scripts for 美少女梗圖劇場 第六集 (EP6).
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
    text: "歡迎來到美少女梗圖劇場第六集。今天的主題是戀愛煩惱大會。暗戀的内心戲到底有多誇張，直男的迷惑行為大賞，LINE聊天求生指南，還有過年被催婚的真實面貌。每一幕都是單身狗的血淚史。準備好了嗎？開始囉。",
  },
  {
    scene: "JokeScene1",
    file: "02-joke1.wav",
    text: "他今天看了我一眼，一定是喜歡我。他也看了垃圾桶一眼。我暗戀他三年了，一句話都沒說過。妳有在他的動態按讚嗎。有，每篇都按。恭喜妳，妳在他的粉絲列表裡排第兩千三百名。我跟他傳訊息，他過了八小時才回喔。八小時，他是在用竹簡回訊息嗎。我朋友說要主動出擊，於是我跟他說嗨。然後呢。他說妳好，請問有什麼事嗎。",
  },
  {
    scene: "JokeScene2",
    file: "03-joke2.wav",
    text: "他說妳今天看起來不一樣，我問哪裡不一樣。他說有吧。我化了兩小時的妝。妳以為直男看得懂妝容嗎，他只分得出有沒有眉毛。有個男生說要給我驚喜。結果呢。他送了我一個電競滑鼠，說這個打遊戲超好用。這就是直男的浪漫。我生日他說要帶我吃大餐。然後帶妳去吃了什麼。鹽酥雞配珍奶，他說這就是台灣的米其林。至少很台。他說想帶我看星星。好浪漫喔。結果帶我去電子街看螢幕。",
  },
  {
    scene: "JokeScene3",
    file: "04-joke3.wav",
    text: "最煩那種已讀不回的人。我更煩那種一直打在嗎的人。在嗎。在嗎。在嗎。在嗎。妳再打一次在嗎我就 block 妳。最可怕的是看到對方正在輸入。然後輸入了十分鐘。最後只傳一個哈。我建議LINE加一個功能，已讀不回超過二十四小時自動發出死亡通知。太殘忍了吧。不殘忍，這叫社會進步。還有那種聊天永遠用 sticker 回覆的人。對，你永遠不知道他到底是同意還是在敷衍你。我全部都用貼圖回，因為打字好累。",
  },
  {
    scene: "JokeScene4",
    file: "05-joke4.wav",
    text: "過年回家，親戚第一句話就是有沒有男朋友。我媽更直接，妳是不是喜歡女生。我阿嬤說再不嫁人就要幫我去算命。算命師說我姻緣遲，要到二十八歲才會遇到。那是算命還是拖延症。親戚介紹一個男生給我，說條件很好。什麼條件。有房有車，月薪十萬。那很好啊。今年六十二歲。妳親戚的定義跟一般人不太一樣。我爸說只要妳帶回來是人類就好。這標準也太低了吧。不，這已經是很多家長的最高標準了。",
  },
  {
    scene: "OutroScene",
    file: "06-outro.wav",
    text: "哈哈哈，是不是每個梗都戳中妳的戀愛死穴。感謝收看美少女梗圖劇場第六集，戀愛煩惱大會。記得，暗戀不如明戀，直男的心思不要猜，已讀不回就當他死了，催婚的時候裝聽不懂就好。我們下集見。",
  },
];
