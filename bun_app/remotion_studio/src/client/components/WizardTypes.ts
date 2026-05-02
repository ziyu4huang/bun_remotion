import type { EpisodeStepProgress } from "../../shared/types";

export interface WizardStep {
  key: keyof EpisodeStepProgress;
  pageId: PageId;
  icon: string;
  estimatedTime: string;
}

type PageId = "storyEditor" | "projects" | "storygraph" | "image" | "tts" | "render" | "agentChat";

export const STEPS: WizardStep[] = [
  { key: "scaffold", pageId: "projects", icon: "\u{1F4E6}", estimatedTime: "~5s" },
  { key: "pipeline", pageId: "storygraph", icon: "\u{1F578}", estimatedTime: "~10s" },
  { key: "check", pageId: "storygraph", icon: "\u{1F6E1}", estimatedTime: "~3s" },
  { key: "score", pageId: "storygraph", icon: "\u{2B50}", estimatedTime: "~5s" },
  { key: "image", pageId: "image", icon: "\u{1F3A8}", estimatedTime: "~30s/img" },
  { key: "tts", pageId: "tts", icon: "\u{1F50A}", estimatedTime: "~20s/ep" },
  { key: "render", pageId: "render", icon: "\u{25B6}", estimatedTime: "~60s/ep" },
];

export interface WizardStepStatus {
  done: number;
  total: number;
}

export interface SeriesProgress {
  seriesId: string;
  seriesName: string;
  steps: Record<keyof EpisodeStepProgress, WizardStepStatus>;
  completedEpisodes: number;
  totalEpisodes: number;
}

export function findCurrentStep(episodes: { completedSteps: number; totalSteps: number; steps: EpisodeStepProgress }[]): keyof EpisodeStepProgress | null {
  const stepKeys: (keyof EpisodeStepProgress)[] = ["scaffold", "pipeline", "check", "score", "image", "tts", "render"];
  const counts: Partial<Record<keyof EpisodeStepProgress, number>> = {};

  for (const ep of episodes) {
    if (ep.completedSteps === ep.totalSteps) continue;
    for (const key of stepKeys) {
      if (!ep.steps[key]) {
        counts[key] = (counts[key] ?? 0) + 1;
        break;
      }
    }
  }

  const sorted = (Object.entries(counts) as [keyof EpisodeStepProgress, number][])
    .sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}
