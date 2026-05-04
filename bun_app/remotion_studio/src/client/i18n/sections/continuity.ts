// ── Continuity Check ──

export const continuityEn = {
  continuityTab: "Continuity",
  continuityDesc: "Cross-episode consistency check for the selected series",
  runCheck: "Run Check",
  checking: "Checking...",
  noData: "No storygraph data found. Run Storygraph extraction first.",
  episodeCount: "Episodes analyzed",
  issueCount: "Issues found",
  noIssues: "No continuity issues detected!",
  selectSeries: "Select a series to check",
  kindLabels: {
    character_name: "Character Name",
    trait_inconsistency: "Trait Inconsistency",
    missing_character: "Missing Character",
    gag_gap: "Running Gag Gap",
    theme_gap: "Theme Gap",
  } as Record<string, string>,
  severityLabels: {
    error: "Error",
    warning: "Warning",
    info: "Info",
  } as Record<string, string>,
  affectedEpisodes: "Affected episodes",
  suggestion: "Suggestion",
};

export const continuityZhTW = {
  continuityTab: "連續性檢查",
  continuityDesc: "檢查選定系列中跨集數的一致性",
  runCheck: "執行檢查",
  checking: "檢查中...",
  noData: "未找到故事圖譜資料。請先執行 Storygraph 擷取。",
  episodeCount: "已分析的集數",
  issueCount: "發現的問題",
  noIssues: "未偵測到連續性問題！",
  selectSeries: "選擇一個系列進行檢查",
  kindLabels: {
    character_name: "角色名稱",
    trait_inconsistency: "特質不一致",
    missing_character: "缺失角色",
    gag_gap: "笑話間斷",
    theme_gap: "主題間斷",
  } as Record<string, string>,
  severityLabels: {
    error: "錯誤",
    warning: "警告",
    info: "提示",
  } as Record<string, string>,
  affectedEpisodes: "受影響的集數",
  suggestion: "建議",
};
