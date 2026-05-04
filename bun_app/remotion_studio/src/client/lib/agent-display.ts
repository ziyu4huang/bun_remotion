/**
 * Friendly display names and categories for agent cards/dropdown.
 * Categories control the grouping order in AgentDirectory.
 */

export type AgentCategory = "production" | "quality" | "story" | "tools" | "general";

interface AgentDisplay {
  displayName: string;
  category: AgentCategory;
}

const AGENT_DISPLAY: Record<string, AgentDisplay> = {
  // Production pipeline
  "studio-coordinator": { displayName: "Production Coordinator", category: "production" },
  "studio-scaffold":    { displayName: "Episode Scaffold",      category: "production" },
  "studio-render":      { displayName: "Video Render",          category: "production" },
  "studio-tts":         { displayName: "Voice Synthesis",       category: "production" },
  "studio-image":       { displayName: "Image Generation",      category: "production" },
  // Quality & review
  "studio-reviewer":    { displayName: "Quality Reviewer",      category: "quality" },
  "sg-quality-gate":    { displayName: "Quality Gate",          category: "quality" },
  "sg-benchmark-runner":{ displayName: "Benchmark Runner",      category: "quality" },
  "test-reviewer":      { displayName: "Test Reviewer",         category: "quality" },
  "sg-dual-reviewer":   { displayName: "Dual Reviewer",        category: "quality" },
  // Story & content
  "sg-story-advisor":   { displayName: "Story Advisor",         category: "story" },
  "studio-advisor":     { displayName: "Content Advisor",       category: "story" },
  "rm-content-analyst": { displayName: "Content Analyst",       category: "story" },
  // General tools
  "pi-developer":       { displayName: "Coding Assistant",      category: "tools" },
};

const DEFAULT_DISPLAY: AgentDisplay = { displayName: "", category: "general" };

export function getAgentDisplay(agentName: string): AgentDisplay {
  return AGENT_DISPLAY[agentName] ?? DEFAULT_DISPLAY;
}

export function getAgentDisplayName(agentName: string): string {
  return AGENT_DISPLAY[agentName]?.displayName || agentName;
}

export const CATEGORY_ORDER: AgentCategory[] = ["production", "quality", "story", "tools", "general"];

export const CATEGORY_LABELS: Record<AgentCategory, { en: string; zh_TW: string }> = {
  production: { en: "Production Pipeline", zh_TW: "製作管線" },
  quality:    { en: "Quality & Review",    zh_TW: "品質審查" },
  story:      { en: "Story & Content",     zh_TW: "故事內容" },
  tools:      { en: "Tools & Dev",         zh_TW: "開發工具" },
  general:    { en: "Other Agents",        zh_TW: "其他代理" },
};

export const CATEGORY_ICONS: Record<AgentCategory, string> = {
  production: "⚙️",
  quality:    "✅",
  story:      "\u{1F4DD}",
  tools:      "\u{1F6E0}️",
  general:    "\u{1F916}",
};

export const CATEGORY_COLORS: Record<AgentCategory, { border: string; bg: string; text: string }> = {
  production: { border: "#1976d2", bg: "#e3f2fd", text: "#0d47a1" },
  quality:    { border: "#2e7d32", bg: "#e8f5e9", text: "#1b5e20" },
  story:      { border: "#7b1fa2", bg: "#f3e5f5", text: "#4a148c" },
  tools:      { border: "#f57c00", bg: "#fff3e0", text: "#e65100" },
  general:    { border: "#757575", bg: "#f5f5f5", text: "#424242" },
};
