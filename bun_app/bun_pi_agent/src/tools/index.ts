import { createReadTool, createWriteTool, createBashTool, createGrepTool, createFindTool, createLsTool, createEditTool } from "@mariozechner/pi-coding-agent";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import { getConfig } from "../config.js";

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
  ];
}
