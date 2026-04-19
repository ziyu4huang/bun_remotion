// Shared type definitions for graphify-bun
// These must match the Python graphify output format exactly

export type FileType = 'code' | 'document' | 'paper' | 'image';

export type Confidence = 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS';

export interface DetectResult {
  files: Record<FileType, string[]>;
  total_files: number;
  total_words: number;
  skipped_sensitive: number;
  skipped_binary: number;
  graphifyignore_patterns: number;
}

export interface GraphNode {
  id: string;
  label: string;
  file_type: FileType;
  source_file: string;
  source_location: string | null;
  community?: number;
  type?: string;
  properties?: Record<string, string>;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
  confidence: Confidence;
  confidence_score: number;
  source_file: string;
  source_location: string | null;
  weight: number;
  _src?: string;
  _tgt?: string;
  type?: string;
  properties?: Record<string, string>;
}

export interface Hyperedge {
  id: string;
  type?: string;
  rel_type?: string;
  properties?: Record<string, string>;
  nodes: string[];
  relation?: string;
  confidence?: Confidence;
  confidence_score?: number;
  source_file?: string;
  label?: string;
}

export interface ExtractionResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  hyperedges: Hyperedge[];
  input_tokens: number;
  output_tokens: number;
}

export interface GraphJSON {
  directed: boolean;
  multigraph: boolean;
  graph: { hyperedges: Hyperedge[] };
  nodes: GraphNode[];
  links: GraphEdge[];
}

export type CommunityMap = Record<number, string[]>;

export interface CacheEntry {
  nodes: GraphNode[];
  edges: GraphEdge[];
  hyperedges: Hyperedge[];
}

// ─── Phase 24-C: Foreshadowing Tracker ───

export interface Foreshadow {
  id: string;
  planted_episode: string;
  paid_off: boolean;
  description: string;
  payoff_episode?: string;
  payoff_description?: string;
}

// ─── Phase 24-B: Plot Arc Analysis ───

export type PlotBeatType =
  | "inciting_incident"
  | "rising_action"
  | "climax"
  | "falling_action"
  | "resolution";

export interface PlotBeat {
  id: string;
  episode_id: string;
  beat_type: PlotBeatType;
  scene: string;
  tension: number;
  description: string;
}

// ─── Phase 23: AI Cross-Link Discovery ───

export type CrossLinkType =
  | "character_theme_affinity"
  | "gag_character_synergy"
  | "narrative_cluster"
  | "story_anti_pattern";

export interface StoryCrossLink {
  from: string;
  to: string;
  link_type: CrossLinkType;
  confidence: number;
  evidence: string[];
  generated_by: "ai" | "algorithm";
  rationale: string;
}

// ─── Leiden-Inspired Community Analysis ───

/** Per-community analysis result */
export interface CommunityAnalysis {
  id: number;
  label: string;
  size: number;
  cohesion: number;
  modularityContribution: number;
  isConnected: boolean;
  dominantTypes: string[];
  episodes: string[];
  bridgeNodes: string[];
}

/** Node-level community metadata */
export interface NodeCommunityInfo {
  nodeId: string;
  communityId: number;
  isBridge: boolean;
  isGodNode: boolean;
  isIsolated: boolean;
}

/** Cross-community edge (surprising connection) */
export interface SurprisingConnection {
  source: string;
  sourceLabel: string;
  sourceCommunity: number;
  target: string;
  targetLabel: string;
  targetCommunity: number;
  relation: string;
}

/** Full community analysis report for a graph */
export interface CommunityReport {
  communities: CommunityAnalysis[];
  nodes: NodeCommunityInfo[];
  surprisingConnections: SurprisingConnection[];
  globalModularity: number;
  totalCommunities: number;
  averageCohesion: number;
  refinementSplits: number;
}
