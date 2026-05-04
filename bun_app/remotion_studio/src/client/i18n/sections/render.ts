export const renderEn = {
  title: "Render",
  description: "Render episodes to MP4 video",
  infoText: "Output: MP4, 1920x1080, 30fps via FFmpeg. Ensure TTS and images are generated before rendering. Estimated file size: 20-80 MB per 3-min episode.",
  selectEpisode: "Select episode...",
  renderMp4: "Render MP4",
  rendered: "Rendered",
  notRendered: "Not rendered",
  failedStart: "Failed to start render",
  selectSeries: "Select a series",
  selectSeriesDesc: "Choose a series to render episodes.",
} as const;

export const renderZhTW = {
  title: "渲染",
  description: "將集數渲染為 MP4 影片",
  infoText: "輸出：MP4、1920x1080、30fps，使用 FFmpeg。請確認語音和圖片已生成後再渲染。預估檔案大小：每 3 分鐘集數 20-80 MB。",
  selectEpisode: "選擇集數...",
  renderMp4: "渲染 MP4",
  rendered: "已渲染",
  notRendered: "未渲染",
  failedStart: "渲染啟動失敗",
  selectSeries: "選擇系列",
  selectSeriesDesc: "選擇系列以渲染集數。",
} as const;
