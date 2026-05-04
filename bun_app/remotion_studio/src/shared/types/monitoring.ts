// ── Monitoring ──

export interface SeriesHealth {
  seriesId: string;
  name: string;
  category: string;
  episodeCount: number;
  scaffoldedCount: number;
  ttsCount: number;
  renderedCount: number;
  completionRate: number;
  gateScore: number | null;
  blendedScore: number | null;
  qualityDecision: string | null;
  nodeCount: number;
  edgeCount: number;
  communityCount: number;
  trend: "improving" | "stable" | "declining" | "new";
}

export interface MonitoringOverview {
  totalSeries: number;
  totalEpisodes: number;
  totalScaffolded: number;
  totalRendered: number;
  overallCompletionRate: number;
  avgGateScore: number | null;
  avgBlendedScore: number | null;
  seriesHealth: SeriesHealth[];
  recentActivity: ActivityEntry[];
}

export interface ActivityEntry {
  timestamp: string;
  seriesId: string;
  type: "pipeline" | "render" | "scaffold";
  detail: string;
}

// ── Quality Comparison ──

export interface SeriesQualitySnapshot {
  seriesId: string;
  gateScore: number | null;
  blendedScore: number | null;
  decision: string | null;
  previousScore: number | null;
  scoreDelta: number | null;
  trend: "improving" | "stable" | "declining" | "new";
  nodeCount: number;
  edgeCount: number;
  communityCount: number;
  aiDimensions: Record<string, number> | null;
  aiOverall: number | null;
  breakdown: Record<string, number | null> | null;
  generatorMode: string | null;
  genre: string | null;
}

export interface RegressionAlert {
  seriesId: string;
  metric: string;
  baseline: number;
  current: number;
  delta: number;
  deltaPercent: number;
  isRegression: boolean;
}

export interface ScoreHistoryPoint {
  date: string;
  gateScore: number;
  blendedScore: number | null;
  aiOverall: number | null;
}

// ── Benchmark ──

export interface BenchmarkResult {
  seriesId: string;
  pipelineOk: boolean;
  gateScore: number;
  gateDecision: string;
  blendedScore: number | null;
  blendedDecision: string | null;
  regressionStatus: "OK" | "REGRESSION" | "NO_BASELINE" | "NO_GATE";
  baselineScore: number | null;
  scoreDelta: number | null;
  checkDeltas?: string[];
  agentReport?: string;
}

export interface BaselineInfo {
  seriesId: string;
  hasBaseline: boolean;
  baselineScore: number | null;
  baselineDate: string | null;
  currentScore: number | null;
  delta: number | null;
}

export interface RegressionSeriesStatus {
  seriesId: string;
  hasBaseline: boolean;
  baselineScore: number | null;
  baselineDate: string | null;
  currentScore: number | null;
  scoreDelta: number | null;
  regressionStatus: "OK" | "REGRESSION" | "NO_BASELINE" | "NO_GATE";
  checkDeltas?: string[];
}

// ── Continuity ──

export type ContinuityIssueKind =
  | "character_name"
  | "trait_inconsistency"
  | "missing_character"
  | "gag_gap"
  | "theme_gap";

export type Severity = "error" | "warning" | "info";

export interface ContinuityIssue {
  kind: ContinuityIssueKind;
  severity: Severity;
  subject: string;
  episodes: string[];
  detail: string;
  suggestion: string;
}

export interface ContinuityReport {
  seriesId: string;
  episodeCount: number;
  issues: ContinuityIssue[];
  checkedAt: string;
}
