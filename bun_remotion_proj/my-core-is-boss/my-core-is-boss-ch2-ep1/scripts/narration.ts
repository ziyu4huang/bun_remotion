/**
 * Narration scripts for 我的核心是大佬 第二章第一集：掛機修仙
 *
 * Voice mapping is centralized in assets/voice-config.json.
 * Characters: linyi, zhaoxiaoqi, xiaoelder, narrator
 */

export type VoiceCharacter = "linyi" | "zhaoxiaoqi" | "xiaoelder" | "narrator";

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

export const narrations: NarrationScript[] = [
  // ─── TitleScene ────────────────────────────────────────────────────────
  {
    scene: "TitleScene",
    file: "01-title.wav",
    segments: [
      { character: "narrator", text: "蒼穹大陸，天道宗修煉場。大比剛結束，弟子們紛紛回洞府閉關。林逸也回了洞府——然後躺下了。" },
    ],
    fullText: "蒼穹大陸，天道宗修煉場。大比剛結束，弟子們紛紛回洞府閉關。林逸也回了洞府——然後躺下了。",
  },

  // ─── ContentScene1: Discover auto-cultivation + Zhao Xiaoqi misinterpretation ──
  {
    scene: "ContentScene1",
    file: "02-content1.wav",
    segments: [
      { character: "narrator", text: "大比結束後，林逸回到洞府，盤腿打坐。這是他第一次認真嘗試修煉。趙小七正好路過。" },
      { character: "linyi", text: "好，來試試這個世界的修煉是怎麼回事……等等，系統面板上怎麼多了一個按鈕？" },
      { character: "linyi", text: "「自動修煉腳本」？這什麼？" },
      { character: "linyi", text: "哦——打坐就等於掛機啊！那我不需要自己操作？" },
      { character: "linyi", text: "按下去試試……嗯，靈力開始自動運轉了。太好了，本來就不想動。" },
      { character: "zhaoxiaoqi", text: "師兄！你剛才說「不想動」——這是「以不動應萬動」的境界嗎？！" },
      { character: "linyi", text: "不是，我就是懶。" },
      { character: "zhaoxiaoqi", text: "師兄太謙虛了！您一定是在進入深層修煉狀態！我來替師兄守門，絕不讓任何人打擾！" },
      { character: "linyi", text: "隨便你，我先睡了。" },
      { character: "narrator", text: "林逸設定好自動修煉腳本，靈力開始以不可思議的速度自動運轉。然後——他躺下睡覺了。" },
    ],
    fullText: "大比結束後，林逸回到洞府，盤腿打坐。這是他第一次認真嘗試修煉。趙小七正好路過。好，來試試這個世界的修煉是怎麼回事……等等，系統面板上怎麼多了一個按鈕？「自動修煉腳本」？這什麼？哦——打坐就等於掛機啊！那我不需要自己操作？按下去試試……嗯，靈力開始自動運轉了。太好了，本來就不想動。師兄！你剛才說「不想動」——這是「以不動應萬動」的境界嗎？！不是，我就是懶。師兄太謙虛了！您一定是在進入深層修煉狀態！我來替師兄守門，絕不讓任何人打擾！隨便你，我先睡了。林逸設定好自動修煉腳本，靈力開始以不可思議的速度自動運轉。然後——他躺下睡覺了。",
  },

  // ─── ContentScene2: Wake up 50 levels higher + Xiaoelder reaction ──────
  {
    scene: "ContentScene2",
    file: "03-content2.wav",
    segments: [
      { character: "narrator", text: "三天後。" },
      { character: "linyi", text: "睡得真舒服……嗯？系統通知？" },
      { character: "linyi", text: "「恭喜升級！當前等級：Lv.52」……什麼？！我睡一覺升了五十級？！" },
      { character: "xiaoelder", text: "林逸！老夫來看看你的修煉進——" },
      { character: "xiaoelder", text: "這……這股靈壓！你、你突破了金丹期？！" },
      { character: "linyi", text: "哦，蕭長老。對啊，掛機三天就升了五十級。效率還行吧。" },
      { character: "xiaoelder", text: "掛……掛機三天……升了……五十……級……？！" },
      { character: "linyi", text: "對啊，照這個速度，我睡個幾個月不就全服第一了嗎？" },
      { character: "xiaoelder", text: "全……全服……？！" },
      { character: "narrator", text: "蕭長老雙腿發軟，扶著門框勉強站穩。林逸並不知道，這個「隱藏加成」的數值，已經超越了大陸所有修行者的總和。" },
    ],
    fullText: "三天後。睡得真舒服……嗯？系統通知？「恭喜升級！當前等級：Lv.52」……什麼？！我睡一覺升了五十級？！林逸！老夫來看看你的修煉進——這……這股靈壓！你、你突破了金丹期？！哦，蕭長老。對啊，掛機三天就升了五十級。效率還行吧。掛……掛機三天……升了……五十……級……？！對啊，照這個速度，我睡個幾個月不就全服第一了嗎？全……全服……？！蕭長老雙腿發軟，扶著門框勉強站穩。林逸並不知道，這個「隱藏加成」的數值，已經超越了大陸所有修行者的總和。",
  },

  // ─── ContentScene3: Zhao Xiaoqi diary + Elder burns manual ────────────
  {
    scene: "ContentScene3",
    file: "04-content3.wav",
    segments: [
      { character: "zhaoxiaoqi", text: "三天！我在師兄洞府外守了三天三夜！" },
      { character: "zhaoxiaoqi", text: "師兄臨入定前說了——「隨便你，我先睡了」。" },
      { character: "zhaoxiaoqi", text: "這是何等境界！「先睡」——指的是先讓肉身沉寂，讓元神獨自運轉天道！「隨便你」——是說凡間之事已不值得他操心！" },
      { character: "xiaoelder", text: "老夫親眼所見……三天，他就從鍛體期到了金丹期……" },
      { character: "zhaoxiaoqi", text: "我的觀察日記已經超過十萬字了。標題是《林逸師兄閉關悟道全紀錄——論天道與呼吸的關係》。" },
      { character: "xiaoelder", text: "十……十萬字？！" },
      { character: "zhaoxiaoqi", text: "蕭長老，你剛才也看到了吧？師兄親口說「掛機三天，效率還行」。" },
      { character: "zhaoxiaoqi", text: "「效率」——師兄用一個詞就概括了修煉的本質！天道運轉，本就是最高效的法則！" },
      { character: "xiaoelder", text: "不可能！老夫修行三百年才到元嬰期！他三天就……" },
      { character: "narrator", text: "蕭長老臉色鐵青，渾身顫抖。當晚，他回到自己的洞府，翻出了修行三十年的功法筆記。" },
      { character: "xiaoelder", text: "老夫這三十年的功法……在林逸面前，不過是廢紙。" },
      { character: "narrator", text: "然後，他把功法燒了。" },
    ],
    fullText: "三天！我在師兄洞府外守了三天三夜！師兄臨入定前說了——「隨便你，我先睡了」。這是何等境界！「先睡」——指的是先讓肉身沉寂，讓元神獨自運轉天道！「隨便你」——是說凡間之事已不值得他操心！老夫親眼所見……三天，他就從鍛體期到了金丹期……我的觀察日記已經超過十萬字了。標題是《林逸師兄閉關悟道全紀錄——論天道與呼吸的關係》。十……十萬字？！蕭長老，你剛才也看到了吧？師兄親口說「掛機三天，效率還行」。「效率」——師兄用一個詞就概括了修煉的本質！天道運轉，本就是最高效的法則！不可能！老夫修行三百年才到元嬰期！他三天就……蕭長老臉色鐵青，渾身顫抖。當晚，他回到自己的洞府，翻出了修行三十年的功法筆記。老夫這三十年的功法……在林逸面前，不過是廢紙。然後，他把功法燒了。",
  },

  // ─── OutroScene ───────────────────────────────────────────────────────
  {
    scene: "OutroScene",
    file: "05-outro.wav",
    segments: [
      { character: "narrator", text: "林逸掛機三天，連升五十級。趙小七寫下十萬字觀察日記，正式將語錄升級為「觀察報告」系列。蕭長老燒毀三十年功法，從此不再堅持傳統修煉方式。" },
      { character: "narrator", text: "但林逸的「自動修煉」只是開始。當他發現靈獸洞窟可以定點刷怪升級時，一場「經驗值農場」的傳說即將開始。我的核心是大佬，第二章第二集：經驗值農場。" },
    ],
    fullText: "林逸掛機三天，連升五十級。趙小七寫下十萬字觀察日記，正式將語錄升級為「觀察報告」系列。蕭長老燒毀三十年功法，從此不再堅持傳統修煉方式。但林逸的「自動修煉」只是開始。當他發現靈獸洞窟可以定點刷怪升級時，一場「經驗值農場」的傳說即將開始。我的核心是大佬，第二章第二集：經驗值農場。",
  },
];
