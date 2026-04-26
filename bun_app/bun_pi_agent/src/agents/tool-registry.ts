import type { AgentTool } from "@mariozechner/pi-agent-core";
import {
  createReadTool,
  createWriteTool,
  createBashTool,
  createGrepTool,
  createFindTool,
  createLsTool,
  createEditTool,
} from "@mariozechner/pi-coding-agent";
import {
  createStorygraphPipelineTool,
  createStorygraphCheckTool,
  createStorygraphScoreTool,
  createStorygraphStatusTool,
  createStorygraphRegressionTool,
  createStorygraphBaselineUpdateTool,
  createStorygraphBaselineListTool,
  createStorygraphSuggestTool,
  createStorygraphHealthTool,
} from "../tools/storygraph-tools.js";
import { createSpawnTaskTool } from "../tools/spawn-task.js";
import {
  createRemotionAnalyzeTool,
  createRemotionSuggestTool,
  createRemotionLintTool,
} from "../tools/remotion-tools.js";
import {
  createScaffoldTool,
  createSeriesListTool,
  createEpisodeListTool,
} from "../tools/scaffold-tools.js";
import {
  createTtsGenerateTool,
  createTtsVoicesTool,
  createTtsStatusTool,
} from "../tools/tts-tools.js";
import {
  createRenderEpisodeTool,
  createRenderStatusTool,
  createRenderListTool,
} from "../tools/render-tools.js";
import {
  createImageGenerateTool,
  createImageStatusTool,
  createImageCharactersTool,
} from "../tools/image-tools.js";
import { getConfig } from "../config.js";

/** Map of tool name → factory function (no-arg, uses config for cwd) */
const TOOL_FACTORIES: Record<string, () => AgentTool<any>> = {
  // Coding tools
  Read:   () => createReadTool(getConfig().workDir),
  Write:  () => createWriteTool(getConfig().workDir),
  Bash:   () => createBashTool(getConfig().workDir),
  Grep:   () => createGrepTool(getConfig().workDir),
  Find:   () => createFindTool(getConfig().workDir),
  Ls:     () => createLsTool(getConfig().workDir),
  Edit:   () => createEditTool(getConfig().workDir),
  // Storygraph tools
  sg_pipeline:         () => createStorygraphPipelineTool(),
  sg_check:            () => createStorygraphCheckTool(),
  sg_score:            () => createStorygraphScoreTool(),
  sg_status:           () => createStorygraphStatusTool(),
  sg_regression:       () => createStorygraphRegressionTool(),
  sg_baseline_update:  () => createStorygraphBaselineUpdateTool(),
  sg_baseline_list:    () => createStorygraphBaselineListTool(),
  sg_suggest:          () => createStorygraphSuggestTool(),
  sg_health:           () => createStorygraphHealthTool(),
  // Subagent
  spawn_task:          () => createSpawnTaskTool(),
  // Remotion content analysis
  rm_analyze:          () => createRemotionAnalyzeTool(),
  rm_suggest:          () => createRemotionSuggestTool(),
  rm_lint:             () => createRemotionLintTool(),
  // Scaffold tools
  sc_scaffold:         () => createScaffoldTool(),
  sc_series_list:      () => createSeriesListTool(),
  sc_episode_list:     () => createEpisodeListTool(),
  // TTS tools
  tts_generate:        () => createTtsGenerateTool(),
  tts_voices:          () => createTtsVoicesTool(),
  tts_status:          () => createTtsStatusTool(),
  // Render tools
  render_episode:      () => createRenderEpisodeTool(),
  render_status:       () => createRenderStatusTool(),
  render_list:         () => createRenderListTool(),
  // Image tools
  image_generate:      () => createImageGenerateTool(),
  image_status:        () => createImageStatusTool(),
  image_characters:    () => createImageCharactersTool(),
};

/** All known tool names */
export const ALL_TOOL_NAMES = Object.keys(TOOL_FACTORIES);

/** Create a single tool by name. Returns undefined if name is unknown. */
export function createToolByName(name: string): AgentTool<any> | undefined {
  const factory = TOOL_FACTORIES[name];
  return factory ? factory() : undefined;
}

/** Create tools by name whitelist. Unknown names are skipped with a warning. */
export function createToolsByNames(names: string[]): {
  tools: AgentTool<any>[];
  warnings: string[];
} {
  const tools: AgentTool<any>[] = [];
  const warnings: string[] = [];

  for (const name of names) {
    const tool = createToolByName(name);
    if (tool) {
      tools.push(tool);
    } else {
      warnings.push(`Unknown tool "${name}" — skipped`);
    }
  }

  return { tools, warnings };
}

/** Create all available tools (default agent behavior). */
export function createAllTools(): AgentTool<any>[] {
  return ALL_TOOL_NAMES.map(name => createToolByName(name)!);
}
