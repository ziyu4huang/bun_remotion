/**
 * Narration scripts for 美少女梗圖劇場 第五集 (EP5).
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
    text: "歡迎來到美少女梗圖劇場第五集。今天的主題是職場求生指南。從面試時的誇張履歷，到老闆畫大餅的藝術，開會廢話大全，還有加班文化的真實面貌。每一幕都是打工人的血淚寫照。準備好了嗎？開始囉。",
  },
  {
    scene: "JokeScene1",
    file: "02-joke1.wav",
    text: "我的優點是抗压能力強，缺點是太追求完美。翻譯一下，優點是習慣被壓榨，缺點是沒有缺點。面試官問我為什麼想來這家公司。妳怎麼說的。因為你們離我家最近。至少很誠實。面試官問我期望待遇，我說隨便。結果真的給我很隨便。這就是為什麼我們說要有底線。我寫了精通Excel，其實我只會合併儲存格。",
  },
  {
    scene: "JokeScene2",
    file: "03-joke2.wav",
    text: "老闆說我們公司就像一個大家庭。對，大家庭的意思是，加班沒有加班費。他還說年終看表現，表現好有驚喜。驚喜就是沒有年終。我們老闆更厲害，他說我們是夥伴關係。所以呢。夥伴的意思是一起倒楣。老闆畫大餅的等級分三層。初級，公司會越來越好。中級，你的努力我都看在眼裡。高級，明年我們上市。我們老闆直接說，等公司賺錢了，虧待不了你們。等公司賺錢，這句話我聽了三年了。",
  },
  {
    scene: "JokeScene3",
    file: "04-joke3.wav",
    text: "今天的會議主題是討論下次開會的時間。這種會議為什麼不能在通訊軟體上說。因為那樣就沒有會議費可以報了。我最怕會議上有人說，我再補充一點。然後他補充了三十分鐘。還有那種會議結束前說，最後我說一句。最後一句說了五句。我建議會議室裝計時器，超時直接斷電。妳會被開除的。那就不用開會了，雙贏。",
  },
  {
    scene: "JokeScene4",
    file: "05-joke4.wav",
    text: "今天準時下班，感覺自己在做壞事。準時下班確實需要勇氣。我昨天加班到十點，走出公司發現同事還在。結果呢。他在打電動。這就是所謂的表演性加班。老闆說公司不鼓勵加班。對，但是工作做不完妳自己看著辦。我發現一個規律，下班後發的訊息，隔天才回。但老闆半夜發的，五分鐘內就要回。這就是職場的量子力學。",
  },
  {
    scene: "OutroScene",
    file: "06-outro.wav",
    text: "哈哈哈，是不是每個梗都讓妳想起自己的職場日常。感謝收看美少女梗圖劇場第五集，職場求生指南。記得，面試要會包裝，老闆的餅看看就好，開會帶耳機保平安，準時下班是一種勇氣。我們下集見。",
  },
];
