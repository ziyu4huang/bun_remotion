// ── Quality / Gate ──

export interface GateResult {
  score: number;
  decision: "PASS" | "WARN" | "FAIL";
  checks: GateCheck[];
  blendedScore?: number;
}

export interface GateCheck {
  name: string;
  status: "PASS" | "WARN" | "FAIL" | "SKIP";
  scoreImpact: number;
  fixSuggestionZhTW?: string;
}

// ── Pipeline ──

export interface PipelineRequest {
  seriesId: string;
  episodeIds?: string[];
  mode?: "regex" | "ai" | "hybrid";
}

export interface PipelineResult {
  nodes: number;
  edges: number;
  communities: number;
  gateScore: number;
  blendedScore?: number;
  durationMs: number;
}
