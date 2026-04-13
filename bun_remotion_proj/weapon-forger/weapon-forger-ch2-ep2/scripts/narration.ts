/**
 * Narration scripts with per-character voice assignment for
 * 誰讓他煉器的！ 第二章 第二集：低語洞窟
 *
 * Voices (mlx_tts):
 *   周墨 (zhoumo)         → uncle_fu  — male
 *   陸陽 (luyang)         → uncle_fu  — male
 *   孟景舟 (mengjingzhou) → uncle_fu  — male
 *   殘魂 (soul)           → uncle_fu  — male (elder voice)
 *   narrator              → uncle_fu  — male narrator
 *
 * All dialog text is in Traditional Chinese (zh_TW).
 */

export type VoiceCharacter = "zhoumo" | "luyang" | "mengjingzhou" | "soul" | "narrator";

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
  soul: "uncle_fu",
  narrator: "uncle_fu",
};

export const VOICE_DESCRIPTION: Record<VoiceCharacter, { voice: string; gender: string; accent: string }> = {
  zhoumo: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
  luyang: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
  mengjingzhou: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
  soul: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
  narrator: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
};

export const narrations: NarrationScript[] = [
  {
    scene: "TitleScene",
    file: "01-title.wav",
    segments: [
      { character: "narrator", text: "歡迎來到誰讓他煉器的！第二章，第二集，低語洞窟。" },
      { character: "narrator", text: "邏輯修正小組成立後的第一個任務——探索後山的低語洞窟。聽說那裡住著一個上古大能的殘魂，已經嚇跑了十七批弟子。但周墨認為，這只是一個「待修復的離線終端」。" },
    ],
    fullText: "歡迎來到誰讓他煉器的！第二章，第二集，低語洞窟。邏輯修正小組成立後的第一個任務——探索後山的低語洞窟。聽說那裡住著一個上古大能的殘魂，已經嚇跑了十七批弟子。但周墨認為，這只是一個「待修復的離線終端」。",
  },
  {
    scene: "ContentScene1",
    file: "02-content1.wav",
    segments: [
      { character: "zhoumo", text: "邏輯修正小組，第一次正式任務——低語洞窟探索。" },
      { character: "luyang", text: "我帶了投降表。三份。" },
      { character: "mengjingzhou", text: "我帶了研究筆記。如果洞窟裡有女性殘魂，我要記錄單身光環的有效範圍。" },
      { character: "zhoumo", text: "先進去再說。這個洞窟的結構很有規律，像是某種陣法構建的空間。" },
      { character: "soul", text: "吾乃上古劍仙——滄溟子！誰敢闖入吾之領地！" },
      { character: "luyang", text: "對不起對不起對不起！我投降！" },
      { character: "zhoumo", text: "有意思。一個語音觸發的自動防禦系統。讓我看看能不能重設密碼。" },
      { character: "soul", text: "你說什麼？！吾乃——" },
      { character: "zhoumo", text: "找到了。能量核心有裂痕，記憶區段損壞。他只能重複同一句話。" },
    ],
    fullText: "邏輯修正小組，第一次正式任務——低語洞窟探索。我帶了投降表。三份。我帶了研究筆記。如果洞窟裡有女性殘魂，我要記錄單身光環的有效範圍。先進去再說。這個洞窟的結構很有規律，像是某種陣法構建的空間。吾乃上古劍仙——滄溟子！誰敢闖入吾之領地！對不起對不起對不起！我投降！有意思。一個語音觸發的自動防禦系統。讓我看看能不能重設密碼。你說什麼？！吾乃——找到了。能量核心有裂痕，記憶區段損壞。他只能重複同一句話。",
  },
  {
    scene: "ContentScene2",
    file: "03-content2.wav",
    segments: [
      { character: "mengjingzhou", text: "所以這個上古劍仙其實是一個記憶體壞掉的人工智慧？" },
      { character: "zhoumo", text: "更精確地說，是「靈魂驅動的自動防禦系統」。我來修復他。" },
      { character: "soul", text: "你——你要修復吾？三千年来，你是第一個不逃跑的人。" },
      { character: "zhoumo", text: "當然。這只是常規維護。修好了，以後別再大喊大叫。" },
      { character: "soul", text: "吾想起了……吾是滄溟子，問道宗第三代長老。吾把畢生修為煉成了一把劍——但是忘記放哪了。" },
      { character: "luyang", text: "三千年前的長老也忘東西？" },
      { character: "zhoumo", text: "忘加位置標記是普遍性問題。不過至少他不再重複那句話了。" },
      { character: "mengjingzhou", text: "等一下，他煉的那把劍——煉器峰傳說中的「滄溟之劍」不會就是吧？" },
      { character: "zhoumo", text: "有意思。那把劍被列為宗門至寶，但沒有人能拔出來。" },
      { character: "soul", text: "吾知道原因。吾當年……忘記加拔劍按鈕了。" },
      { character: "zhoumo", text: "原來忘加按鈕是家族遺傳。" },
    ],
    fullText: "所以這個上古劍仙其實是一個記憶體壞掉的人工智慧？更精確地說，是「靈魂驅動的自動防禦系統」。我來修復他。你——你要修復吾？三千年来，你是第一個不逃跑的人。當然。這只是常規維護。修好了，以後別再大喊大叫。吾想起了……吾是滄溟子，問道宗第三代長老。吾把畢生修為煉成了一把劍——但是忘記放哪了。三千年前的長老也忘東西？忘加位置標記是普遍性問題。不過至少他不再重複那句話了。等一下，他煉的那把劍——煉器峰傳說中的「滄溟之劍」不會就是吧？有意思。那把劍被列為宗門至寶，但沒有人能拔出來。吾知道原因。吾當年……忘記加拔劍按鈕了。原來忘加按鈕是家族遺傳。",
  },
  {
    scene: "OutroScene",
    file: "04-outro.wav",
    segments: [
      { character: "narrator", text: "感謝收看誰讓他煉器的！第二章第二集，低語洞窟。" },
      { character: "narrator", text: "邏輯修正小組的第一個任務圓滿完成——殘魂被修好了，但那把「忘加拔劍按鈕」的滄溟之劍還在等著有人來拔。周墨已經在研究那個按鈕該怎麼加了。" },
      { character: "narrator", text: "下集預告：低語洞窟的事傳開了，長老派邏輯修正小組參加宗門秘境探索。別的宗門在破解上古禁制，周墨掏出了「雷射切割陣法」。長老說：「這不是禁制破解工具！」「但效率很高。」" },
    ],
    fullText: "感謝收看誰讓他煉器的！第二章第二集，低語洞窟。邏輯修正小組的第一個任務圓滿完成——殘魂被修好了，但那把「忘加拔劍按鈕」的滄溟之劍還在等著有人來拔。周墨已經在研究那個按鈕該怎麼加了。下集預告：低語洞窟的事傳開了，長老派邏輯修正小組參加宗門秘境探索。別的宗門在破解上古禁制，周墨掏出了「雷射切割陣法」。長老說：「這不是禁制破解工具！」「但效率很高。」",
  },
];
