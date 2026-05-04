export const jobsEn = {
  globalTitle: "Jobs",
  active: (n: number) => `${n} active`,
  recent: "Recent",
  systemHealthy: "All systems running",
  systemBusy: (n: number) => `Queue busy (${n} jobs)`,
  systemOffline: "Server unreachable",
} as const;

export const jobsZhTW = {
  globalTitle: "工作",
  active: (n: number) => `${n} 個進行中`,
  recent: "最近",
  systemHealthy: "系統正常運行",
  systemBusy: (n: number) => `佇列忙碌（${n} 個工作）`,
  systemOffline: "伺服器無法連線",
} as const;

export const advisorEn = {
  newChat: "New",
  clearChat: "Clear",
  ask: "Ask",
  attachFile: "Attach file",
  attachFiles: "Attach Files",
  selectSeries: "-- Select a series --",
  selectSeriesPrompt: "Select a series above to browse files",
  noFiles: "No files found",
  added: "Added",
  attach: "Attach",
  bridgeDown: "Agent bridge unavailable",
  noAgent: "No advisor agent found",
} as const;

export const advisorZhTW = {
  newChat: "新對話",
  clearChat: "清除",
  ask: "詢問",
  attachFile: "附加檔案",
  attachFiles: "附加檔案",
  selectSeries: "-- 選擇系列 --",
  selectSeriesPrompt: "請先選擇系列以瀏覽檔案",
  noFiles: "找不到檔案",
  added: "已附加",
  attach: "附加",
  bridgeDown: "代理橋接器無法使用",
  noAgent: "找不到顧問代理",
} as const;

export const onboardingTourEn = {
  welcome: { title: "Welcome to Remotion Studio", description: "Your all-in-one workspace for creating animated video series with AI. Let's take a quick tour!" },
  pipeline: { title: "Pipeline Wizard", description: "Track your production pipeline step by step. The Wizard shows what's done, what's next, and guides you to the right page." },
  ai: { title: "AI Assistants", description: "Every major page has an AI advisor panel. Ask questions about your story, characters, quality, or get production suggestions." },
  quickActions: { title: "Command Palette", description: "Press Cmd+K (Ctrl+K on Windows) to instantly search and jump to any page or action." },
  progress: { title: "Track Progress", description: "The floating badge in the bottom-right shows active jobs. Click it to see live progress and cancel running jobs." },
} as const;

export const onboardingTourZhTW = {
  welcome: { title: "歡迎使用 Remotion Studio", description: "您的一站式 AI 動畫影片製作工作區。讓我們快速導覽一下吧！" },
  pipeline: { title: "管線精靈", description: "逐步追蹤您的製作管線。精靈會顯示已完成和待處理的步驟，並引導您前往正確的頁面。" },
  ai: { title: "AI 助手", description: "每個主要頁面都有 AI 顧問面板。詢問關於故事、角色、品質的問題，或取得製作建議。" },
  quickActions: { title: "指令面板", description: "按下 Cmd+K（Windows 上為 Ctrl+K）快速搜尋並跳轉到任何頁面或操作。" },
  progress: { title: "追蹤進度", description: "右下角的浮動徽章顯示正在執行的工作。點擊可查看即時進度並取消進行中的工作。" },
} as const;
