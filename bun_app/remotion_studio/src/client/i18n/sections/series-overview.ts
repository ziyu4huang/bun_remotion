export const seriesOverviewEn = {
  seriesOverview: {
    title: "Series Overview",
    description: "High-level view of all series progress and health",
    totalSeries: "Total Series",
    totalEpisodes: "Total Episodes",
    scaffoldRate: "Scaffold Rate",
    searchPlaceholder: "Search series...",
    allCategories: "All",
    noSeries: "No series found",
    noSeriesDesc: "No series match your current filters. Try adjusting your search or category filter.",
    scaffolded: (done: number, total: number) => `${done}/${total} scaffolded`,
    gateScore: "Gate",
    blendedScore: "Blended",
    hasPlan: "Has Plan",
  },
};

export const seriesOverviewZhTW = {
  seriesOverview: {
    title: "系列總覽",
    description: "所有系列的進度與健康狀態總覽",
    totalSeries: "系列總數",
    totalEpisodes: "集數總計",
    scaffoldRate: "鷹架完成率",
    searchPlaceholder: "搜尋系列...",
    allCategories: "全部",
    noSeries: "找不到系列",
    noSeriesDesc: "目前的篩選條件沒有符合的系列。請調整搜尋或分類篩選。",
    scaffolded: (done: number, total: number) => `${done}/${total} 已鷹架`,
    gateScore: "品質閘",
    blendedScore: "綜合分",
    hasPlan: "有計畫",
  },
};
