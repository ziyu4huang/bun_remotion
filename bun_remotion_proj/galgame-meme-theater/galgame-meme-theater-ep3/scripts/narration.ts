/**
 * Narration scripts for 美少女梗圖劇場 第三集 (EP3).
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
    text: "歡迎來到美少女梗圖劇場第三集。今天我們來聊聊台灣人的生活日常。從過年被親戚靈魂拷問，到夜市吃到撐，每一幕都是妳我的真實寫照。準備好了嗎？開始囉。",
  },
  {
    scene: "JokeScene1",
    file: "02-joke1.wav",
    text: "過年最可怕的事是什麼？不是紅包給太多。是親戚的靈魂拷問。考第幾名？有沒有男朋友？什麼時候結婚？我...我才大一啊。標準答案：還在努力，謝謝關心。可是阿嬤說我小時候胖胖的很可愛。然後她現在每年都說：怎麼又胖了。過年不是放假，是一場生存遊戲。我決定了，今年過年我要出國旅行。那我們明年見？明年我會說我在加班。",
  },
  {
    scene: "JokeScene2",
    file: "03-joke2.wav",
    text: "走！去夜市。妳不是說要減肥？減肥是明天的事，今天是夜市的事。我要大腸包小腸、鹽酥雞、珍珠奶茶、地瓜球。這是妳一個人的量？這只是開胃菜。啊！那邊有蚵仔煎。妳們不是剛吃完晚餐嗎？在夜市，沒有所謂的剛吃完。這裡的甜不辣好好吃，對了，還有雞蛋糕。我後悔跟妳們出門了，給我一口。",
  },
  {
    scene: "JokeScene3",
    file: "04-joke3.wav",
    text: "氣象局說今天降雨機率百分之十。那不會下雨，出門吧。我還是帶把傘好了。不用不用，妳太擔心了。果然。幸虧我帶了傘，啊，我的傘被風吹壞了。怎麼辦，我們三個都沒帶傘。是妳說不會下雨的。好吧，便利商店有賣傘。一個一百二，也太貴了吧。三個人都濕了，回家會被罵。永遠不要相信氣象局。",
  },
  {
    scene: "JokeScene4",
    file: "05-joke4.wav",
    text: "群組裡發了訊息，為什麼都沒人回。因為大家都在，只是選擇不回。我不是不回，我是在想怎麼回。在想怎麼回等於不回。已讀不回是現代人最基本的社交技能。可是，已讀不回會不會不太好。更可怕的是：對方傳貼圖，妳回貼圖，然後對話就結束了。這就是所謂的貼圖對話，一來一回就結束。啊，我剛才已讀了群組，忘記回了。沒關係，反正沒有人在等。妳們兩個不也沒回我昨天的訊息。",
  },
  {
    scene: "OutroScene",
    file: "06-outro.wav",
    text: "哈哈哈，是不是每個梗都踩到妳的痛點？感謝收看美少女梗圖劇場第三集，台灣日常篇。記得，過年是生存遊戲，夜市沒有所謂的吃太飽，永遠不要相信氣象局，已讀不回是基本社交技能。我們下集見。",
  },
];
