/**
 * Narration scripts with per-character voice assignment for 系統文小說梗 第二集 — 師姐的龜派氣功.
 *
 * Each scene is split into segments, each with a speaking character and voice.
 * Voices (mlx_tts / Qwen3-TTS, all Standard Mandarin):
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
      { character: "narrator", text: "歡迎來到系統文小說梗第二集。今天的主題是師姐的龜派氣功。" },
      { character: "narrator", text: "修修參加築基晉升考試，系統解鎖了新技能靈力波，結果只有微風等級。師姐看不下去，決定親自示範什麼叫真正的靈力波。" },
      { character: "system", text: "任務開始。" },
    ],
    fullText: "歡迎來到系統文小說梗第二集。今天的主題是師姐的龜派氣功。修修參加築基晉升考試，系統解鎖了新技能靈力波，結果只有微風等級。師姐看不下去，決定親自示範什麼叫真正的靈力波。任務開始。",
  },
  {
    scene: "JokeScene1",
    file: "02-joke1.wav",
    segments: [
      { character: "xiuxiu", text: "系統，我準備好了嗎？築基考試就在今天。" },
      { character: "system", text: "宿主境界評估：煉氣期一層。建議：放棄。" },
      { character: "xiuxiu", text: "你能不能有點鼓勵的話？" },
      { character: "system", text: "好的，你是最棒的廢物。加油。" },
      { character: "xiuxiu", text: "這不是鼓勵吧。" },
      { character: "system", text: "叮，考試限時任務：通過築基考試。獎勵：晉升築基期。失敗懲罰：靈力鎖定為零。" },
      { character: "xiuxiu", text: "零？！那不就變成普通人了嗎！" },
      { character: "system", text: "考生修修，請進入試煉場。" },
      { character: "shijie", text: "師弟加油，我會在外面看著你的。" },
      { character: "xiuxiu", text: "師姐在看我，我不能丟臉！" },
      { character: "system", text: "試煉開始。第一關：接住師姐的一擊。" },
      { character: "xiuxiu", text: "什麼？！師姐是考官！" },
    ],
    fullText: "系統，我準備好了嗎？築基考試就在今天。宿主境界評估：煉氣期一層。建議：放棄。你能不能有點鼓勵的話？好的，你是最棒的廢物。加油。這不是鼓勵吧。叮，考試限時任務：通過築基考試。獎勵：晉升築基期。失敗懲罰：靈力鎖定為零。零？！那不就變成普通人了嗎！考生修修，請進入試煉場。師弟加油，我會在外面看著你的。師姐在看我，我不能丟臉！試煉開始。第一關：接住師姐的一擊。什麼？！師姐是考官！",
  },
  {
    scene: "JokeScene2",
    file: "03-joke2.wav",
    segments: [
      { character: "system", text: "叮，緊急技能解鎖：靈力波。" },
      { character: "xiuxiu", text: "靈力波？聽起來很厲害啊！" },
      { character: "system", text: "請將靈力集中在雙手，向前推出。" },
      { character: "xiuxiu", text: "看我的——修修超究極靈力波！！" },
      { character: "shijie", text: "..." },
      { character: "xiuxiu", text: "怎麼...怎麼只有三條線？" },
      { character: "system", text: "靈力不足，技能已自動降級為「靈力微風」。" },
      { character: "xiuxiu", text: "微風？！" },
      { character: "shijie", text: "師弟，我感覺到了。真的很像微風。" },
      { character: "xiuxiu", text: "系統，你給我的技能是不是有bug！" },
      { character: "system", text: "本系統沒有bug，只有靈力不足的宿主。" },
    ],
    fullText: "叮，緊急技能解鎖：靈力波。靈力波？聽起來很厲害啊！請將靈力集中在雙手，向前推出。看我的——修修超究極靈力波！！怎麼...怎麼只有三條線？靈力不足，技能已自動降級為「靈力微風」。微風？！師弟，我感覺到了。真的很像微風。系統，你給我的技能是不是有bug！本系統沒有bug，只有靈力不足的宿主。",
  },
  {
    scene: "JokeScene3",
    file: "04-joke3.wav",
    segments: [
      { character: "xiuxiu", text: "師姐，妳能示範一下什麼叫真正的靈力波嗎？" },
      { character: "shijie", text: "你確定要看？這裡可能會被炸掉。" },
      { character: "xiuxiu", text: "沒關係，我有系統保護！" },
      { character: "system", text: "本系統不提供物理防護。" },
      { character: "xiuxiu", text: "什麼時候說的！" },
      { character: "shijie", text: "那我就不客氣了。" },
      { character: "shijie", text: "龜——派——氣——功——" },
      { character: "system", text: "警告！偵測到危險等級靈力波動。建議宿主立即撤退。" },
      { character: "xiuxiu", text: "來不及了啦！！" },
      { character: "shijie", text: "——哈！！" },
      { character: "xiuxiu", text: "我的頭髮被燒掉了..." },
      { character: "system", text: "考試結束。考生修修，不及格。考場已毀損。" },
      { character: "shijie", text: "抱歉抱歉，力道沒控制好。" },
    ],
    fullText: "師姐，妳能示範一下什麼叫真正的靈力波嗎？你確定要看？這裡可能會被炸掉。沒關係，我有系統保護！本系統不提供物理防護。什麼時候說的！那我就不客氣了。龜——派——氣——功——警告！偵測到危險等級靈力波動。建議宿主立即撤退。來不及了啦！！——哈！！我的頭髮被燒掉了...考試結束。考生修修，不及格。考場已毀損。抱歉抱歉，力道沒控制好。",
  },
  {
    scene: "JokeScene4",
    file: "05-joke4.wav",
    segments: [
      { character: "shijie", text: "話說回來，師弟你的系統到底是哪裡來的？" },
      { character: "xiuxiu", text: "我也不知道，突然就綁定了。" },
      { character: "system", text: "既然你們問了，本座就自我介紹一下。" },
      { character: "xiuxiu", text: "本座？" },
      { character: "system", text: "我是封印在你體內的萬古劍仙——劍無痕。" },
      { character: "xiuxiu", text: "萬古劍仙？！" },
      { character: "shijie", text: "哦？有意思。" },
      { character: "system", text: "不過以你現在的靈力，只能用我百分之一的力量。" },
      { character: "xiuxiu", text: "百分之一就這麼厲害？那我什麼時候能用全部力量？" },
      { character: "system", text: "大概需要修煉三千年。" },
      { character: "xiuxiu", text: "人類的壽命才不到一百年啊！" },
      { character: "system", text: "所以加油吧，廢物。" },
      { character: "shijie", text: "三千年，我等你。" },
      { character: "xiuxiu", text: "師姐，妳的壽命也不是三千年的啊！" },
      { character: "system", text: "新任務：修煉三千年。開始倒數。三、二、一——" },
      { character: "xiuxiu", text: "等等等等！" },
    ],
    fullText: "話說回來，師弟你的系統到底是哪裡來的？我也不知道，突然就綁定了。既然你們問了，本座就自我介紹一下。本座？我是封印在你體內的萬古劍仙——劍無痕。萬古劍仙？！哦？有意思。不過以你現在的靈力，只能用我百分之一的力量。百分之一就這麼厲害？那我什麼時候能用全部力量？大概需要修煉三千年。人類的壽命才不到一百年啊！所以加油吧，廢物。三千年，我等你。師姐，妳的壽命也不是三千年的啊！新任務：修煉三千年。開始倒數。三、二、一——等等等等！",
  },
  {
    scene: "OutroScene",
    file: "06-outro.wav",
    segments: [
      { character: "narrator", text: "感謝收看系統文小說梗第二集，師姐的龜派氣功。" },
      { character: "narrator", text: "記住，修修的靈力永遠不夠用，師姐的龜派氣功是真的會炸掉考場，系統的真實身份是萬古劍仙。" },
      { character: "narrator", text: "下集預告：修修的第一次副本。我們下集見。" },
    ],
    fullText: "感謝收看系統文小說梗第二集，師姐的龜派氣功。記住，修修的靈力永遠不夠用，師姐的龜派氣功是真的會炸掉考場，系統的真實身份是萬古劍仙。下集預告：修修的第一次副本。我們下集見。",
  },
];
