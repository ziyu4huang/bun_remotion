/**
 * Narration scripts with per-character voice assignment for 系統文小說梗 第一集.
 *
 * Each scene is split into segments, each with a speaking character and voice.
 * This allows multi-voice TTS: xiuxiu uses uncle_fu (male), shijie uses vivian (female),
 * system/narrator uses serena (female).
 *
 * Voices (Qwen3-TTS, all Standard Mandarin, no dialect):
 *   修修 (xiuxiu)   → uncle_fu  — male, standard Mandarin
 *   系統 (system)   → serena    — female, standard Mandarin (cold/system tone)
 *   師姐 (shijie)   → vivian    — female, standard Mandarin (clear)
 *   narrator        → uncle_fu  — male narrator
 */

export type VoiceCharacter = "xiuxiu" | "system" | "shijie" | "narrator";

export interface NarrationSegment {
  character: VoiceCharacter;
  text: string;
}

export interface NarrationScript {
  scene: string;
  file: string;
  segments: NarrationSegment[];
  /** Full text concatenated (for reference, not used for generation) */
  fullText: string;
}

export const VOICE_MAP: Record<VoiceCharacter, string> = {
  xiuxiu: "uncle_fu",
  system: "serena",
  shijie: "vivian",
  narrator: "uncle_fu",
};

export const VOICE_DESCRIPTION: Record<VoiceCharacter, { voice: string; gender: string; accent: string }> = {
  xiuxiu: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
  system: { voice: "serena", gender: "female", accent: "standard Mandarin" },
  shijie: { voice: "vivian", gender: "female", accent: "standard Mandarin" },
  narrator: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
};

export const narrations: NarrationScript[] = [
  {
    scene: "TitleScene",
    file: "01-title.wav",
    segments: [
      { character: "narrator", text: "歡迎來到系統文小說梗第一集。今天的主題是不完成任務就抹除。" },
      { character: "narrator", text: "一個廢柴修仙者被系統綁定，新手任務竟然是要在十秒內向師姐表白，否則直接抹除。" },
      { character: "narrator", text: "Q版戰鬥、系統倒數、師姐的反轉，每一幕都是系統文的經典梗。" },
      { character: "system", text: "任務開始。" },
    ],
    fullText: "歡迎來到系統文小說梗第一集。今天的主題是不完成任務就抹除。一個廢柴修仙者被系統綁定，新手任務竟然是要在十秒內向師姐表白，否則直接抹除。Q版戰鬥、系統倒數、師姐的反轉，每一幕都是系統文的經典梗。任務開始。",
  },
  {
    scene: "JokeScene1",
    file: "02-joke1.wav",
    segments: [
      { character: "xiuxiu", text: "啊頭好痛，剛才打坐的時候到底發生了什麼。" },
      { character: "system", text: "叮，修仙系統已成功綁定宿主。" },
      { character: "xiuxiu", text: "誰在說話，系統，什麼系統。" },
      { character: "system", text: "本系統將協助宿主完成修仙之路，請查收新手任務。" },
      { character: "xiuxiu", text: "等等等等，我連築基都還沒完成，你綁定我幹嘛。" },
      { character: "system", text: "新手任務，在十秒內向師姐表白，失敗懲罰，抹除。" },
      { character: "xiuxiu", text: "抹除，抹除是什麼意思，我不要被抹除啊。" },
      { character: "system", text: "倒數計時開始，十、九、八。" },
      { character: "xiuxiu", text: "這個系統是認真的嗎。" },
    ],
    fullText: "啊頭好痛，剛才打坐的時候到底發生了什麼。叮，修仙系統已成功綁定宿主。誰在說話，系統，什麼系統。本系統將協助宿主完成修仙之路，請查收新手任務。等等等等，我連築基都還沒完成，你綁定我幹嘛。新手任務，在十秒內向師姐表白，失敗懲罰，抹除。抹除，抹除是什麼意思，我不要被抹除啊。倒數計時開始，十、九、八。這個系統是認真的嗎。",
  },
  {
    scene: "JokeScene2",
    file: "03-joke2.wav",
    segments: [
      { character: "system", text: "七、六、五。" },
      { character: "xiuxiu", text: "師姐，我有話想對妳說。" },
      { character: "shijie", text: "什麼事，你的臉怎麼這麼紅。" },
      { character: "xiuxiu", text: "我、我、那個、就是。" },
      { character: "system", text: "三、二、一。" },
      { character: "xiuxiu", text: "我喜歡妳。" },
      { character: "shijie", text: "哦，真的假的。" },
      { character: "system", text: "叮，任務完成，獎勵靈力恢復一點。" },
      { character: "xiuxiu", text: "就一點，我剛才差點死了好嗎。" },
    ],
    fullText: "七、六、五。師姐，我有話想對妳說。什麼事，你的臉怎麼這麼紅。我、我、那個、就是。三、二、一。我喜歡妳。哦，真的假的。叮，任務完成，獎勵靈力恢復一點。就一點，我剛才差點死了好嗎。",
  },
  {
    scene: "JokeScene3",
    file: "04-joke3.wav",
    segments: [
      { character: "xiuxiu", text: "等等，剛才那個表白不算數吧。" },
      { character: "shijie", text: "怎麼，說了就說了，修仙之人豈能出爾反爾。告訴你一個秘密。" },
      { character: "system", text: "叮，觸發隱藏任務，與師姐進行修仙對決。" },
      { character: "xiuxiu", text: "什麼，我打不過師姐啊。" },
      { character: "system", text: "任務獎勵，晉升一個境界，失敗懲罰，退回煉氣期。" },
      { character: "xiuxiu", text: "我連煉氣期都還沒離開，退回去是什麼，變回凡人嗎。" },
      { character: "shijie", text: "來吧師弟，讓我看看你有多少斤兩。" },
      { character: "xiuxiu", text: "接招，修修超究極奧義。" },
      { character: "shijie", text: "就這。" },
      { character: "xiuxiu", text: "我的靈力，用完了。" },
    ],
    fullText: "等等，剛才那個表白不算數吧。怎麼，說了就說了，修仙之人豈能出爾反爾。告訴你一個秘密。叮，觸發隱藏任務，與師姐進行修仙對決。什麼，我打不過師姐啊。任務獎勵，晉升一個境界，失敗懲罰，退回煉氣期。我連煉氣期都還沒離開，退回去是什麼，變回凡人嗎。來吧師弟，讓我看看你有多少斤兩。接招，修修超究極奧義。就這。我的靈力，用完了。",
  },
  {
    scene: "JokeScene4",
    file: "05-joke4.wav",
    segments: [
      { character: "shijie", text: "師弟，你今天的表現讓我很滿意。" },
      { character: "xiuxiu", text: "師姐，剛才那些不是我在演戲，我是真的害怕啊。" },
      { character: "shijie", text: "告訴你一個秘密。" },
      { character: "xiuxiu", text: "什麼秘密。" },
      { character: "shijie", text: "這個修仙系統啊，是我安裝的。" },
      { character: "xiuxiu", text: "什麼，師姐妳。" },
      { character: "shijie", text: "我只是想聽你親口說那句話而已。" },
      { character: "xiuxiu", text: "妳知不知道我差點被抹除啊。" },
      { character: "shijie", text: "放心，抹除是假的，但下次的任務是真的喔。" },
      { character: "system", text: "叮，新任務發布，在師姐面前做一百個伏地挺身。" },
      { character: "xiuxiu", text: "我的靈力還沒恢復啊。" },
    ],
    fullText: "師弟，你今天的表現讓我很滿意。師姐，剛才那些不是我在演戲，我是真的害怕啊。告訴你一個秘密。什麼秘密。這個修仙系統啊，是我安裝的。什麼，師姐妳。我只是想聽你親口說那句話而已。妳知不知道我差點被抹除啊。放心，抹除是假的，但下次的任務是真的喔。叮，新任務發布，在師姐面前做一百個伏地挺身。我的靈力還沒恢復啊。",
  },
  {
    scene: "OutroScene",
    file: "06-outro.wav",
    segments: [
      { character: "narrator", text: "哈哈哈，是不是每個梗都讓你想起系統文小說的經典套路。" },
      { character: "narrator", text: "感謝收看系統文小說梗第一集，不完成任務就抹除。" },
      { character: "narrator", text: "記住，系統永遠不會放過你，表白要趁早不然系統會幫你，Q版戰鬥是認真的，師姐永遠是最大的BOSS。" },
      { character: "narrator", text: "我們下集見。" },
    ],
    fullText: "哈哈哈，是不是每個梗都讓你想起系統文小說的經典套路。感謝收看系統文小說梗第一集，不完成任務就抹除。記住，系統永遠不會放過你，表白要趁早不然系統會幫你，Q版戰鬥是認真的，師姐永遠是最大的BOSS。我們下集見。",
  },
];
