export const appEn = {
  title: "Remotion Studio",
  toggleNav: "Toggle navigation",
  switchTheme: (mode: string) => `Switch to ${mode === "light" ? "dark" : "light"} mode`,
} as const;

export const appZhTW = {
  title: "Remotion Studio",
  toggleNav: "切換導航",
  switchTheme: (mode: string) => mode === "light" ? "切換至深色模式" : "切換至淺色模式",
} as const;

export const navEn = {
  overview: "Overview",
  production: "Production",
  analysis: "Analysis",
  ai: "AI",
  assets: "Assets",
} as const;

export const navZhTW = {
  overview: "總覽",
  production: "製作",
  analysis: "分析",
  ai: "AI",
  assets: "素材",
} as const;

export const pagesEn = {
  dashboard: "Dashboard",
  monitoring: "Monitoring",
  progress: "Progress",
  kanban: "Kanban",
  projects: "Projects",
  storyEditor: "Story Editor",
  workflows: "Workflows",
  storygraph: "Storygraph",
  quality: "Quality",
  benchmark: "Benchmark",
  agentChat: "Agent Chat",
  assets: "Assets",
  tts: "TTS",
  render: "Render",
  image: "Image",
  settings: "Settings",
  wizard: "Wizard",
  seriesOverview: "Series Overview",
} as const;

export const pagesZhTW = {
  dashboard: "儀表板",
  monitoring: "監控",
  progress: "進度",
  kanban: "看板",
  projects: "專案",
  storyEditor: "故事編輯器",
  workflows: "工作流",
  storygraph: "故事圖譜",
  quality: "品質",
  benchmark: "基準測試",
  agentChat: "AI 對話",
  assets: "素材庫",
  tts: "語音合成",
  render: "渲染",
  image: "圖片生成",
  settings: "設定",
  wizard: "精靈",
  seriesOverview: "系列總覽",
} as const;

export const errorEn = {
  title: "Something went wrong",
  message: "An unexpected error occurred.",
  reload: "Reload Page",
} as const;

export const errorZhTW = {
  title: "發生錯誤",
  message: "發生未預期的錯誤。",
  reload: "重新載入頁面",
} as const;

export const commonEn = {
  loading: "Loading...",
  error: "Error",
  success: "Success",
  close: "Close",
  cancel: "Cancel",
  delete: "Delete",
  save: "Save",
  edit: "Edit",
  back: "Back",
  next: "Next",
  search: "Search",
  noResults: "No results",
  comingSoon: (name: string) => `${name} — coming soon`,
} as const;

export const commonZhTW = {
  loading: "載入中...",
  error: "錯誤",
  success: "成功",
  close: "關閉",
  cancel: "取消",
  delete: "刪除",
  save: "儲存",
  edit: "編輯",
  back: "返回",
  next: "下一步",
  search: "搜尋",
  noResults: "無結果",
  comingSoon: (name: string) => `${name} — 即將推出`,
} as const;
