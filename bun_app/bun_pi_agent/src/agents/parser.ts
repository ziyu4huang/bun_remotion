import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import { resolve, join } from "path";
import type { AgentDefinition } from "./types.js";

/**
 * Parse an agent definition from a markdown file with YAML frontmatter.
 *
 * Format:
 *   ---
 *   name: story-advisor
 *   description: Story continuity advisor
 *   tools: sg_suggest, sg_health, Read, Grep
 *   model: zai/glm-5
 *   skills: storygraph-benchmark
 *   ---
 *   Agent-specific system prompt body...
 */
export function parseAgentDef(filePath: string): AgentDefinition {
  const content = readFileSync(filePath, "utf-8");

  // Extract frontmatter between --- delimiters
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!fmMatch) {
    throw new Error(`Agent definition file missing YAML frontmatter: ${filePath}`);
  }

  const [, frontmatter, body] = fmMatch;

  // Parse frontmatter fields
  const fields = parseFrontmatter(frontmatter);

  const name = fields.name;
  if (!name) {
    throw new Error(`Agent definition missing required "name" field: ${filePath}`);
  }

  const description = fields.description ?? "";

  // Parse comma-separated lists
  const tools = fields.tools
    ? fields.tools.split(",").map((s: string) => s.trim()).filter(Boolean)
    : undefined;

  const skills = fields.skills
    ? fields.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
    : undefined;

  return {
    name,
    description,
    tools: tools?.length ? tools : undefined,
    model: fields.model || undefined,
    skills: skills?.length ? skills : undefined,
    prompt: body.trim(),
    filePath,
  };
}

/** Simple YAML-like frontmatter parser (key: value pairs, no nesting) */
function parseFrontmatter(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const match = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (match) {
      result[match[1]] = match[2].trim();
    }
  }
  return result;
}

/**
 * Discover agent definitions from directories.
 * Scans project-level .agent/agents/ and user-level ~/.agent/agents/.
 */
export function discoverAgents(workDir: string): AgentDefinition[] {
  const dirs = [
    resolve(workDir, ".agent/agents"),
    resolve(process.env.HOME ?? "~", ".agent/agents"),
  ];

  const agents: AgentDefinition[] = [];
  const seen = new Set<string>();

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;

    const entries = readdirSync(dir).filter(e => e.endsWith(".md"));
    for (const entry of entries) {
      const filePath = join(dir, entry);
      try {
        const def = parseAgentDef(filePath);
        if (!seen.has(def.name)) {
          seen.add(def.name);
          agents.push(def);
        }
      } catch (e: any) {
        console.error(`[agents] Failed to parse ${filePath}: ${e.message}`);
      }
    }
  }

  return agents;
}
