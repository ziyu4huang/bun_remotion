/**
 * Narration scripts for 我的核心是大佬 第一章第三集：Bug 利用
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
      { character: "narrator", text: "蒼穹大陸，天道宗。一年一度的宗門大比今日開幕。無數弟子閉關三年，磨劍三年，只為這一刻。而林逸——蹲在比武台旁邊，用手戳牆壁。" },
    ],
    fullText: "蒼穹大陸，天道宗。一年一度的宗門大比今日開幕。無數弟子閉關三年，磨劍三年，只為這一刻。而林逸——蹲在比武台旁邊，用手戳牆壁。",
  },

  // ─── ContentScene1: Lin Yi accidentally discovers collision bug ────────
  {
    scene: "ContentScene1",
    file: "02-content1.wav",
    segments: [
      { character: "narrator", text: "宗門大比正式開始。擂台之上，弟子們各展所長，劍氣縱橫。" },
      { character: "xiaoelder", text: "林逸！第一場對手是你！上場！" },
      { character: "linyi", text: "哦，來了。" },
      { character: "narrator", text: "林逸的對手是一位煉氣期九層的師兄，靈力外放，氣勢驚人。" },
      { character: "linyi", text: "這攻擊前搖也太長了吧……等等他在衝過來了！" },
      { character: "linyi", text: "閃閃閃——！" },
      { character: "narrator", text: "林逸慌忙後退，一腳踩進了比武台的角落——然後，穿過了牆壁。" },
      { character: "linyi", text: "……我怎麼卡進來了？" },
      { character: "linyi", text: "等等，這個碰撞體有問題！牆壁的判定有縫隙！" },
      { character: "linyi", text: "咦，對手也追過來了……他也卡住了？" },
      { character: "linyi", text: "哦——NPC 的尋路邏輯有缺陷，碰到邊界就會卡住不動。這不就是經典的「卡牆 Bug」嗎？" },
    ],
    fullText: "宗門大比正式開始。擂台之上，弟子們各展所長，劍氣縱橫。林逸！第一場對手是你！上場！哦，來了。林逸的對手是一位煉氣期九層的師兄，靈力外放，氣勢驚人。這攻擊前搖也太長了吧……等等他在衝過來了！閃閃閃——！林逸慌忙後退，一腳踩進了比武台的角落——然後，穿過了牆壁。……我怎麼卡進來了？等等，這個碰撞體有問題！牆壁的判定有縫隙！咦，對手也追過來了……他也卡住了？哦——NPC 的尋路邏輯有缺陷，碰到邊界就會卡住不動。這不就是經典的「卡牆 Bug」嗎？",
  },

  // ─── ContentScene2: Lin Yi exploits bug to win all matches ─────────────
  {
    scene: "ContentScene2",
    file: "03-content2.wav",
    segments: [
      { character: "narrator", text: "林逸發現，只要把對手引到比武台的邊界縫隙，他們就會被卡住，無法移動，無法出招。" },
      { character: "linyi", text: "好，下一個。來來來，跟我到這裡來。" },
      { character: "linyi", text: "再過來一點……好，卡住了。" },
      { character: "narrator", text: "第二位對手被卡在了比武台邊緣，掙扎不已。" },
      { character: "linyi", text: "第三個……這個精一點，不肯靠牆。" },
      { character: "linyi", text: "沒關係，右邊還有個縫隙。繞一下……好，也卡住了。" },
      { character: "xiaoelder", text: "這……這怎麼可能！他連手都沒抬！對手怎麼全動不了了！" },
      { character: "linyi", text: "碰撞判定失效，他們現在是無敵狀態但也動不了。不過 HP 歸零判定還在……慢慢磨就行了。" },
    ],
    fullText: "林逸發現，只要把對手引到比武台的邊界縫隙，他們就會被卡住，無法移動，無法出招。好，下一個。來來來，跟我到這裡來。再過來一點……好，卡住了。第二位對手被卡在了比武台邊緣，掙扎不已。第三個……這個精一點，不肯靠牆。沒關係，右邊還有個縫隙。繞一下……好，也卡住了。這……這怎麼可能！他連手都沒抬！對手怎麼全動不了了！碰撞判定失效，他們現在是無敵狀態但也動不了。不過 HP 歸零判定還在……慢慢磨就行了。",
  },

  // ─── ContentScene3: Over-interpretation + Elder's notes ────────────────
  {
    scene: "ContentScene3",
    file: "04-content3.wav",
    segments: [
      { character: "zhaoxiaoqi", text: "我看到了！師兄根本不需要出手！他只需站在那裡，對手就被「空間禁錮」了！" },
      { character: "xiaoelder", text: "空……空間禁錮？" },
      { character: "zhaoxiaoqi", text: "這一定是上古失傳的「空間禁錮之術」！以自身氣場扭曲周圍空間，將敵人封鎖在特定區域無法動彈！" },
      { character: "xiaoelder", text: "那不是傳說中渡劫期以上才能施展的禁術嗎……？" },
      { character: "zhaoxiaoqi", text: "蕭長老你看！師兄連續用了好幾次，每次位置都不同！說明他能精確控制空間扭曲的座標！" },
      { character: "xiaoelder", text: "（偷偷拿出筆記本）「卡……卡模型……」不對，這名字太俗了……「空間禁錮……以氣場扭曲空間……需找到特定的節點……」" },
      { character: "linyi", text: "什麼節點？我就是看哪裡有縫隙而已。" },
      { character: "zhaoxiaoqi", text: "師兄說的「縫隙」就是空間的裂縫！他能直接看到空間結構的弱點！" },
    ],
    fullText: "我看到了！師兄根本不需要出手！他只需站在那裡，對手就被「空間禁錮」了！空……空間禁錮？這一定是上古失傳的「空間禁錮之術」！以自身氣場扭曲周圍空間，將敵人封鎖在特定區域無法動彈！那不是傳說中渡劫期以上才能施展的禁術嗎……？蕭長老你看！師兄連續用了好幾次，每次位置都不同！說明他能精確控制空間扭曲的座標！（偷偷拿出筆記本）「卡……卡模型……」不對，這名字太俗了……「空間禁錮……以氣場扭曲空間……需找到特定的節點……」什麼節點？我就是看哪裡有縫隙而已。師兄說的「縫隙」就是空間的裂縫！他能直接看到空間結構的弱點！",
  },

  // ─── OutroScene ───────────────────────────────────────────────────────
  {
    scene: "OutroScene",
    file: "05-outro.wav",
    segments: [
      { character: "narrator", text: "林逸用比武台的碰撞體 Bug，不費吹灰之力贏得了宗門大比。趙小七更新了第三篇語錄：「真正的空間法則，在於找到世界的縫隙。」蕭長老的修煉筆記裡多了一行字：「尋找空間節點，嘗試復現禁錮之術。」" },
      { character: "narrator", text: "大比結束後，林逸回到自己的洞府打坐，卻意外觸發了系統面板上的一個新按鈕——「自動修煉腳本」。我的核心是大佬，第二章第一集：掛機修仙。" },
    ],
    fullText: "林逸用比武台的碰撞體 Bug，不費吹灰之力贏得了宗門大比。趙小七更新了第三篇語錄：「真正的空間法則，在於找到世界的縫隙。」蕭長老的修煉筆記裡多了一行字：「尋找空間節點，嘗試復現禁錮之術。」大比結束後，林逸回到自己的洞府打坐，卻意外觸發了系統面板上的一個新按鈕——「自動修煉腳本」。我的核心是大佬，第二章第一集：掛機修仙。",
  },
];
