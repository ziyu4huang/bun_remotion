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
import { existsSync, watch, type FSWatcher } from "fs";
import { join, resolve } from "path";
import { getConfig } from "../config.js";

export type { Skill, LoadSkillsResult, LoadSkillsOptions, LoadSkillsFromDirOptions };

/** Extra skill directories to scan (in addition to pi defaults) */
const EXTRA_SKILL_DIRS = [".claude/skills", ".agent/skills"];

// --- Skills cache + hot-reload ---

let cachedResult: LoadSkillsResult | null = null;
let cachedCwd: string | null = null;
let watchers: FSWatcher[] = [];
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

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

/** Invalidate cache — next loadAgentSkills() call will reload from disk */
export function invalidateSkillsCache(): void {
  cachedResult = null;
  cachedCwd = null;
}

/** Load skills from bun_pi_agent config + .claude/skills + .agent/skills */
export function loadAgentSkills(options?: {
  cwd?: string;
  skillPaths?: string[];
}): LoadSkillsResult {
  const config = getConfig();
  const cwd = options?.cwd ?? config.workDir;

  if (cachedResult && cachedCwd === cwd && !options?.skillPaths) {
    return cachedResult;
  }

  const extraPaths = discoverExtraSkillPaths(cwd);
  const allPaths = [...extraPaths, ...(options?.skillPaths ?? [])];

  cachedResult = piLoadSkills({
    cwd,
    skillPaths: allPaths,
    includeDefaults: true,
  });
  cachedCwd = cwd;
  return cachedResult;
}

/** Format loaded skills into a system prompt section */
export function getSkillsPromptSection(skills: Skill[]): string {
  return formatSkillsForPrompt(skills);
}

/**
 * Start watching skill directories for changes.
 * On file change, invalidate cache so next agent creation picks up new skills.
 */
export function startSkillsWatcher(cwd?: string): void {
  stopSkillsWatcher();

  const config = getConfig();
  const watchCwd = cwd ?? config.workDir;

  for (const dir of EXTRA_SKILL_DIRS) {
    const full = resolve(watchCwd, dir);
    if (!existsSync(full)) continue;

    try {
      const watcher = watch(full, { recursive: true }, (event) => {
        // Debounce: rapid file saves trigger multiple events
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const skillCount = cachedResult?.skills.length ?? 0;
          invalidateSkillsCache();
          console.log(`[skills] Hot-reload: skills directory changed, cache invalidated (${skillCount} skills were cached)`);
        }, 500);
      });
      watchers.push(watcher);
    } catch {
      // watchSync not available or permission denied — non-fatal
    }
  }

  if (watchers.length > 0) {
    console.log(`[skills] Watching ${watchers.length} skill director${watchers.length === 1 ? 'y' : 'ies'} for changes`);
  }
}

/** Stop all skill directory watchers */
export function stopSkillsWatcher(): void {
  for (const w of watchers) {
    try { w.close(); } catch {}
  }
  watchers = [];
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

export { loadSkillsFromDir, formatSkillsForPrompt };
