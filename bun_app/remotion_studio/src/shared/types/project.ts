import type { VideoCategoryId } from "remotion_types";

// ── Project / Episode ──

export interface Project {
  id: string;
  name: string;
  seriesId: string;
  category: VideoCategoryId;
  path: string;
  episodes: Episode[];
  gateScore?: number;
  blendedScore?: number;
  hasPlan?: boolean;
  episodeCount: number;
  scaffoldedCount: number;
}

export interface Episode {
  id: string;
  chapter?: number;
  episode: number;
  path: string;
  hasScaffold: boolean;
  hasTTS: boolean;
  hasRender: boolean;
  gateScore?: number;
  blendedScore?: number;
}

// ── Episode Progress ──

export interface EpisodeStepProgress {
  scaffold: boolean;
  pipeline: boolean;
  check: boolean;
  score: boolean;
  image: boolean;
  tts: boolean;
  render: boolean;
}

export interface EpisodeProgress {
  seriesId: string;
  seriesName: string;
  category: string;
  episodeId: string;
  chapter?: number;
  episode?: number;
  steps: EpisodeStepProgress;
  completedSteps: number;
  totalSteps: number;
  gateScore?: number;
  blendedScore?: number;
}

export interface EpisodeProgressSummary {
  totalEpisodes: number;
  completedEpisodes: number;
  avgCompletion: number;
  byStep: Record<keyof EpisodeStepProgress, { done: number; total: number }>;
}

// ── Export / Import ──

export interface ProjectExport {
  version: 1;
  exportedAt: string;
  series: {
    id: string;
    name: string;
    category: VideoCategoryId;
    genre?: string;
    path: string;
  };
  planMd?: string;
  todoMd?: string;
  episodes: EpisodeExport[];
  quality?: {
    gateScore?: number;
    blendedScore?: number;
    decision?: string;
  };
  automationRules: AutomationRuleExport[];
}

export interface EpisodeExport {
  id: string;
  chapter?: number;
  episode?: number;
  planMd?: string;
  hasScaffold: boolean;
  hasTTS: boolean;
  hasRender: boolean;
}

export interface AutomationRuleExport {
  name: string;
  trigger: string;
  templateId: string;
  enabled: boolean;
  cooldownMs: number;
}
