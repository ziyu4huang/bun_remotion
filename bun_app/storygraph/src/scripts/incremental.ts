import { resolve } from "node:path";
import { existsSync, statSync } from "node:fs";

/** Check if episode extraction is up-to-date (graph.json newer than narration.ts). */
export function isUpToDate(episodeDir: string): boolean {
  const narration = resolve(episodeDir, "scripts", "narration.ts");
  const graph = resolve(episodeDir, "storygraph_out", "graph.json");
  if (!existsSync(narration) || !existsSync(graph)) return false;
  return statSync(graph).mtimeMs >= statSync(narration).mtimeMs;
}
