export type Page =
  | "dashboard" | "monitoring" | "pipelineProgress" | "kanban" | "wizard" | "seriesOverview"
  | "projects" | "storyEditor" | "storygraph" | "quality" | "benchmark"
  | "agentChat" | "assets" | "tts" | "render" | "workflows" | "image" | "settings";

export interface NavItem {
  id: Page;
  labelKey: string;
  icon: string;
}

export interface NavSection {
  labelKey: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    labelKey: "overview",
    items: [
      { id: "wizard", labelKey: "wizard", icon: "\u{1F52E}" },
      { id: "dashboard", labelKey: "dashboard", icon: "■" },
      { id: "seriesOverview", labelKey: "seriesOverview", icon: "\u{1F4CA}" },
      { id: "monitoring", labelKey: "monitoring", icon: "●" },
      { id: "pipelineProgress", labelKey: "progress", icon: "▣" },
      { id: "kanban", labelKey: "kanban", icon: "▦" },
    ],
  },
  {
    labelKey: "production",
    items: [
      { id: "projects", labelKey: "projects", icon: "\u{1F4C1}" },
      { id: "storyEditor", labelKey: "storyEditor", icon: "✍" },
      { id: "workflows", labelKey: "workflows", icon: "⚙" },
    ],
  },
  {
    labelKey: "analysis",
    items: [
      { id: "storygraph", labelKey: "storygraph", icon: "\u{1F578}" },
      { id: "quality", labelKey: "quality", icon: "✔" },
      { id: "benchmark", labelKey: "benchmark", icon: "\u{1F4CA}" },
    ],
  },
  {
    labelKey: "ai",
    items: [
      { id: "agentChat", labelKey: "agentChat", icon: "\u{1F916}" },
    ],
  },
  {
    labelKey: "assets",
    items: [
      { id: "assets", labelKey: "assets", icon: "\u{1F5BC}" },
      { id: "tts", labelKey: "tts", icon: "\u{1F50A}" },
      { id: "render", labelKey: "render", icon: "▶" },
      { id: "image", labelKey: "image", icon: "\u{1F3A8}" },
    ],
  },
];

const preloadedPages = new Set<string>();

export function preloadPage(pageId: string) {
  if (preloadedPages.has(pageId)) return;
  preloadedPages.add(pageId);
  switch (pageId) {
    case "wizard": import("../pages/PipelineWizard"); break;
    case "dashboard": import("../pages/Dashboard"); break;
    case "seriesOverview": import("../pages/SeriesOverview"); break;
    case "monitoring": import("../pages/Monitoring"); break;
    case "pipelineProgress": import("../pages/PipelineProgress"); break;
    case "kanban": import("../pages/EpisodeKanban"); break;
    case "projects": import("../pages/Projects"); break;
    case "storyEditor": import("../pages/StoryEditor"); break;
    case "storygraph": import("../pages/Storygraph"); break;
    case "quality": import("../pages/Quality"); break;
    case "benchmark": import("../pages/Benchmark"); break;
    case "agentChat": import("../pages/AgentChat"); break;
    case "assets": import("../pages/Assets"); break;
    case "tts": import("../pages/TTS"); break;
    case "render": import("../pages/Render"); break;
    case "image": import("../pages/ImageGen"); break;
    case "workflows": import("../pages/Workflows"); break;
    case "settings": import("../pages/Settings"); break;
  }
}
