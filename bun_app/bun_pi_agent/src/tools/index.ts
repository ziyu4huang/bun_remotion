import { createReadTool, createWriteTool, createBashTool, createGrepTool, createFindTool, createLsTool, createEditTool } from "@mariozechner/pi-coding-agent";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import { getConfig } from "../config.js";
import { createStorygraphTools } from "./storygraph-tools.js";
import { createSpawnTaskTool } from "./spawn-task.js";
import { createRemotionTools } from "./remotion-tools.js";
import { createScaffoldTools } from "./scaffold-tools.js";
import { createTtsTools } from "./tts-tools.js";
import { createRenderTools } from "./render-tools.js";
import { createImageTools } from "./image-tools.js";

export function createTools(): AgentTool<any>[] {
  const cwd = getConfig().workDir;
  return [
    createReadTool(cwd),
    createWriteTool(cwd),
    createBashTool(cwd),
    createGrepTool(cwd),
    createFindTool(cwd),
    createLsTool(cwd),
    createEditTool(cwd),
    ...createStorygraphTools(),
    createSpawnTaskTool(),
    ...createRemotionTools(),
    ...createScaffoldTools(),
    ...createTtsTools(),
    ...createRenderTools(),
    ...createImageTools(),
  ];
}
