/**
 * Series-specific configuration for the story KG pipeline.
 *
 * Each series defines its own characters, trait patterns, tech terms, and gag sources.
 * The pipeline auto-detects the series from directory name and loads the matching config.
 */

import { basename } from "node:path";

// ─── Type ───

export interface SeriesConfig {
  /** Substring to match in series directory name */
  seriesId: string;
  /** Human-readable series name */
  displayName: string;
  /** Character ID → display name (zh_TW) */
  charNames: Record<string, string>;
  /** Per-character trait detection regex patterns */
  traitPatterns: Record<string, { pattern: RegExp; trait: string }[]>;
  /** Tech term regex patterns */
  techPatterns: RegExp[];
  /** Where running gag data lives */
  gagSource: "plan_md" | "plot_lines_md";
  /** Path to gag file relative to series dir (when gagSource is plot_lines_md) */
  gagFilePath?: string;
  /** Episode directory basename pattern (must capture ch/ep numbers) */
  episodeDirPattern: RegExp;
}

// ─── Weapon Forger (誰讓他煉器的) ───

export const weaponForgerConfig: SeriesConfig = {
  seriesId: "weapon-forger",
  displayName: "誰讓他煉器的",
  charNames: {
    zhoumo: "周墨",
    examiner: "考官",
    elder: "長老",
    luyang: "陸陽",
    mengjingzhou: "孟景舟",
    soul: "滄溟子",
    narrator: "旁白",
    yunzhi: "雲芝",
  },
  traitPatterns: {
    zhoumo: [
      { pattern: /模組化|模块化|設計|设计|使用者|用户|體驗|体验|邏輯|逻辑|閉環|闭环/, trait: "科技工程術語" },
      { pattern: /忘加|忘記加|忘记加|沒加|没加/, trait: "忘加按鈕/功能" },
      { pattern: /效率|演算法|算法|模組|模块|系統|系统/, trait: "工程師思維" },
      { pattern: /技術上來說|技术上来说|準確地說|准确地说|從.*角度/, trait: "用邏輯包裝荒謬" },
      { pattern: /升級|優化|优化|維護|维护|修復|修复/, trait: "萬物皆可修" },
    ],
    examiner: [
      { pattern: /你知不知道|還敢|管.*叫|破.*收/, trait: "崩潰吐槽" },
      { pattern: /入宗|考試|考试|通過|通过|不合格/, trait: "權威考官" },
    ],
    elder: [
      { pattern: /有意思|創新|创新|不錯|不错/, trait: "欣賞創新" },
      { pattern: /警告|不許|不许|小心/, trait: "毒舌警告" },
      { pattern: /恰恰|正是|需要/, trait: "認可但擔憂" },
    ],
    luyang: [
      { pattern: /投降|認輸|认输|別打了|對不起/, trait: "投降反射" },
      { pattern: /投降表|投降劍法/, trait: "隨時備好投降表" },
      { pattern: /好像|似乎|比喻/, trait: "天真神比喻" },
    ],
    mengjingzhou: [
      { pattern: /論文|论文|研究|數據|数据|統計|统计/, trait: "研究狂" },
      { pattern: /單身|女朋友|絕緣/, trait: "單身光環" },
      { pattern: /記錄|记录|採集|采集|第.*篇/, trait: "一切皆為數據" },
    ],
    soul: [
      { pattern: /吾乃|上古|三千/, trait: "上古大能口吻" },
      { pattern: /忘記|忘加|忘/, trait: "家族遺傳忘性" },
    ],
  },
  techPatterns: [
    /模組化設計/g, /模块化设计/g,
    /使用者體驗/g, /用户体验/g,
    /底層邏輯閉環/g, /底层逻辑闭环/g,
    /指紋識別/g, /指纹识别/g,
    /自動格式化/g, /自动格式化/g,
    /自動尋路/g, /自动寻路/g,
    /核心算法/g,
    /演算法/g, /算法/g,
    /情感交互界面/g,
    /系統升級/g, /系统升级/g,
    /情緒管理系統/g, /情绪管理系统/g,
    /語音控制/g, /语音控制/g,
    /定時休眠/g, /定时休眠/g,
    /壓力釋放模組/g, /压力释放模块/g,
    /被動技能/g, /被动技能/g,
    /離線終端/g, /离线终端/g,
    /自動防禦系統/g, /自动防御系统/g,
    /密碼重設/g, /密码重设/g,
    /記憶區段/g, /记忆区段/g,
    /人工智慧/g, /人工智能/g,
    /常規維護/g, /常规维护/g,
    /認可系統/g, /认可系统/g,
    /自動評價系統/g, /自动评价系统/g,
    /評價標準/g, /评价标准/g,
    /資訊系統/g, /信息系统/g,
    /雷射切割/g, /激光切割/g,
    /冗餘設計/g, /冗余设计/g,
    /備份系統/g, /备份系统/g,
    /自動防禦協議/g, /自动防御协议/g,
    /演算法思維/g, /算法思维/g,
  ],
  gagSource: "plan_md",
  episodeDirPattern: /^weapon-forger-ch(\d+)-ep(\d+)$/,
};

// ─── My Core Is Boss (我的核心是大佬) ───

export const myCoreIsBossConfig: SeriesConfig = {
  seriesId: "my-core-is-boss",
  displayName: "我的核心是大佬",
  charNames: {
    linyi: "林逸",
    zhaoxiaoqi: "趙小七",
    xiaoelder: "蕭長老",
    chenmo: "陳默",
    narrator: "旁白",
  },
  traitPatterns: {
    linyi: [
      { pattern: /bug/i, trait: "萬物皆有Bug" },
      { pattern: /跳過|跳過對話|全部跳過/, trait: "跳過強迫症" },
      { pattern: /載入中|載入.*慢/, trait: "永遠載入中" },
      { pattern: /NPC|建模|UI|系統面板|任務面板|新手教程/, trait: "遊戲化世界觀" },
      { pattern: /捷徑|三秒通關|速通/, trait: "速通玩家" },
      { pattern: /這也有|怎麼.*bug|又有bug/, trait: "吐槽遊戲設計" },
      { pattern: /為什麼.*跪|跪什麼|在跪/, trait: "困惑被崇拜" },
    ],
    zhaoxiaoqi: [
      { pattern: /太深奧|天地至理|蘊含/, trait: "過度解讀" },
      { pattern: /師兄的意思|師兄是說/, trait: "主動腦補" },
      { pattern: /語錄|記下來|我要記/, trait: "語錄記錄狂" },
      { pattern: /追隨|頭號/, trait: "死忠粉絲" },
      { pattern: /師兄又在謙虛|謙虛/, trait: "選擇性聽力" },
    ],
    xiaoelder: [
      { pattern: /這小子|小子.*放肆|哪來的小子/, trait: "嚴肅長老表面" },
      { pattern: /老夫修行|修行.*年/, trait: "老資格自居" },
      { pattern: /不可能|這.*不可能/, trait: "三觀崩塌中" },
      { pattern: /跪|腿軟|膝蓋/, trait: "崩潰屈服" },
      { pattern: /隱藏等級|大乘期|超越/, trait: "過度解讀實力" },
    ],
    chenmo: [
      { pattern: /邏輯.*問題|問題.*邏輯|底層代碼/, trait: "程式師思維" },
      { pattern: /系統.*作弊|作弊.*系統/, trait: "系統分析" },
    ],
  },
  techPatterns: [
    /跳過/g, /載入中/g, /卡模型/g, /noclip/gi,
    /查看代碼/g, /自動尋路/g, /掛機/g, /bug/gi,
    /NPC/g, /UI/gi, /建模/g, /碰撞體/g,
    /尋路/g, /系統面板/g, /任務面板/g, /新手教程/g,
    /經驗值/g, /寶箱/g, /通關/g, /組隊/g,
    /排位/g, /New Game\+/g,
    /系統升級/g, /Lv[\.\d]*/g, /等級/g,
    /過場動畫/g, /自動修煉/g, /段位/g,
  ],
  gagSource: "plot_lines_md",
  gagFilePath: "assets/story/plot-lines.md",
  episodeDirPattern: /^my-core-is-boss-ch(\d+)-ep(\d+)$/,
};

// ─── Auto-detection ───

const SERIES_CONFIGS: SeriesConfig[] = [weaponForgerConfig, myCoreIsBossConfig];

/** Detect series config from series directory path */
export function detectSeries(seriesDir: string): SeriesConfig | null {
  const dirName = basename(seriesDir);
  return SERIES_CONFIGS.find(c => dirName.includes(c.seriesId)) ?? null;
}

/** Get series config or throw */
export function getSeriesConfigOrThrow(seriesDir: string): SeriesConfig {
  const config = detectSeries(seriesDir);
  if (!config) throw new Error(`Unknown series: ${basename(seriesDir)}. Expected one of: ${SERIES_CONFIGS.map(c => c.seriesId).join(", ")}`);
  return config;
}

/** Generic episode directory pattern (fallback when no series config matched) */
export const GENERIC_EPISODE_PATTERN = /-ch(\d+)-ep(\d+)$/i;
