import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CharacterProfile, CharacterImageVariant } from "../../shared/types";

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");
const SERIES_DIR = (id: string) => resolve(REPO_ROOT, "bun_remotion_proj", id);

export function getCharacterProfiles(seriesId: string): CharacterProfile[] {
  const seriesDir = SERIES_DIR(seriesId);
  if (!existsSync(seriesDir)) return [];

  const manifestMap = scanManifests(seriesId);
  const mdMap = parseCharactersMd(seriesId);
  const tsMap = parseCharactersTs(seriesId);

  const allIds = new Set([...tsMap.keys(), ...manifestMap.keys(), ...mdMap.keys()]);
  const profiles: CharacterProfile[] = [];

  for (const id of allIds) {
    if (id === "narrator") continue;
    const ts = tsMap.get(id);
    const md = mdMap.get(id);
    const variants = manifestMap.get(id) ?? [];

    const normalVariant = variants.find(
      (v) => v.type === "normal" || v.type === "emotion"
    );
    const defaultVariant = normalVariant?.emotion === "default" ? normalVariant : normalVariant;

    profiles.push({
      id,
      name: ts?.name ?? md?.name ?? id,
      color: ts?.color ?? "#888",
      bgColor: ts?.bgColor ?? "rgba(136,136,136,0.25)",
      position: ts?.position ?? "left",
      voice: ts?.voice ?? "",
      appearance: md?.appearance ?? null,
      basePrompt: defaultVariant?.prompt ?? null,
      variants,
      emotions: ts?.emotions ?? [],
    });
  }

  return profiles.sort((a, b) => a.id.localeCompare(b.id));
}

function scanManifests(seriesId: string): Map<string, CharacterImageVariant[]> {
  const dir = resolve(SERIES_DIR(seriesId), "assets", "characters");
  const map = new Map<string, CharacterImageVariant[]>();
  if (!existsSync(dir)) return map;

  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".json")) continue;
    try {
      const raw = JSON.parse(readFileSync(resolve(dir, f), "utf-8"));
      if (!raw.character || !raw.prompt) continue;
      const variant: CharacterImageVariant = {
        file: raw.file ?? f.replace(/\.json$/, ".png"),
        type: raw.type ?? "normal",
        character: raw.character,
        facing: raw.facing ?? "LEFT",
        prompt: raw.prompt,
        emotion: raw.emotion,
        description: raw.description,
      };
      const arr = map.get(raw.character) ?? [];
      arr.push(variant);
      map.set(raw.character, arr);
    } catch { /* skip malformed */ }
  }
  return map;
}

interface MdCharData { name: string; appearance: string | null }

function parseCharactersMd(seriesId: string): Map<string, MdCharData> {
  const map = new Map<string, MdCharData>();
  const path = resolve(SERIES_DIR(seriesId), "assets", "story", "characters.md");
  if (!existsSync(path)) return map;

  const text = readFileSync(path, "utf-8");
  const sections = text.split(/^### /m).slice(1);

  for (const section of sections) {
    const headerLine = section.split("\n")[0] ?? "";
    const idMatch = headerLine.match(/\(([^)]+)\)/);
    if (!idMatch) continue;
    const id = idMatch[1].toLowerCase();
    const name = headerLine.split("(")[0].trim();

    let appearance: string | null = null;
    for (const line of section.split("\n")) {
      const appearanceMatch = line.match(/\*?\*?外型[：:]\*?\*?\s*(.+)/);
      if (appearanceMatch) {
        appearance = appearanceMatch[1].replace(/\*\*/g, "").trim();
        break;
      }
    }

    map.set(id, { name, appearance });
  }
  return map;
}

interface TsCharData {
  name: string;
  color: string;
  bgColor: string;
  position: string;
  voice: string;
  emotions: string[];
}

function parseCharactersTs(seriesId: string): Map<string, TsCharData> {
  const map = new Map<string, TsCharData>();
  const path = resolve(SERIES_DIR(seriesId), "assets", "characters.ts");
  if (!existsSync(path)) return map;

  const text = readFileSync(path, "utf-8");

  const charBlockMatch = text.match(/CHARACTERS\s*:\s*Record<[^>]+>\s*=\s*\{([\s\S]*?)\n\};/);
  if (!charBlockMatch) return map;

  const block = charBlockMatch[1];
  const entryRegex = /(\w+)\s*:\s*\{([^}]*)\}/g;
  let m: RegExpExecArray | null;

  while ((m = entryRegex.exec(block)) !== null) {
    const id = m[1];
    const body = m[2];
    const str = (field: string) => {
      const fm = body.match(new RegExp(`${field}\\s*:\\s*"([^"]*)"`));
      return fm?.[1] ?? "";
    };
    map.set(id, {
      name: str("name"),
      color: str("color"),
      bgColor: str("bgColor"),
      position: str("position") || "left",
      voice: str("voice"),
      emotions: [],
    });
  }

  const posesMatch = text.match(/CHARACTER_POSES\s*:\s*Partial<Record<[^>]+>>\s*=\s*\{([\s\S]*?)\n\};/);
  if (posesMatch) {
    const poseBlock = posesMatch[1];
    const poseEntry = /(\w+)\s*:\s*\[([^\]]*)\]/g;
    let pm: RegExpExecArray | null;
    while ((pm = poseEntry.exec(poseBlock)) !== null) {
      const id = pm[1];
      const poses = pm[2].match(/"([^"]+)"/g)?.map((s) => s.replace(/"/g, "")) ?? [];
      const existing = map.get(id);
      if (existing) existing.emotions = poses;
    }
  }

  return map;
}
