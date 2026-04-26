import {
  loadSkills as piLoadSkills,
  loadSkillsFromDir,
  formatSkillsForPrompt,
} from "@mariozechner/pi-coding-agent";
import type {
  Skill,
  LoadSkillsResult,
  LoadSkillsOptions,
  LoadSkillsFromDirOptions,
} from "@mariozechner/pi-coding-agent";
import { existsSync } from "fs";
import { join, resolve } from "path";
import { getConfig } from "../config.js";

export type { Skill, LoadSkillsResult, LoadSkillsOptions, LoadSkillsFromDirOptions };

/** Extra skill directories to scan (in addition to pi defaults) */
const EXTRA_SKILL_DIRS = [".claude/skills", ".agent/skills"];

/** Discover skill directories that exist under cwd */
function discoverExtraSkillPaths(cwd: string): string[] {
  const paths: string[] = [];
  for (const dir of EXTRA_SKILL_DIRS) {
    const full = resolve(cwd, dir);
    if (existsSync(full)) {
      paths.push(full);
    }
  }
  return paths;
}

/** Load skills from bun_pi_agent config + .claude/skills + .agent/skills */
export function loadAgentSkills(options?: {
  cwd?: string;
  skillPaths?: string[];
}): LoadSkillsResult {
  const config = getConfig();
  const cwd = options?.cwd ?? config.workDir;
  const extraPaths = discoverExtraSkillPaths(cwd);
  const allPaths = [...extraPaths, ...(options?.skillPaths ?? [])];

  return piLoadSkills({
    cwd,
    skillPaths: allPaths,
    includeDefaults: true,
  });
}

/** Format loaded skills into a system prompt section */
export function getSkillsPromptSection(skills: Skill[]): string {
  return formatSkillsForPrompt(skills);
}

export { loadSkillsFromDir, formatSkillsForPrompt };
