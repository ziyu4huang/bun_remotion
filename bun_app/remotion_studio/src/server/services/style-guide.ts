import { resolve } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import type { StyleGuide } from "../../shared/types";

const DATA_DIR = resolve(import.meta.dir, "../../../data/style-guides");

function guidePath(seriesId: string): string {
  return resolve(DATA_DIR, `${seriesId}.json`);
}

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

export function getStyleGuide(seriesId: string): StyleGuide | null {
  const path = guidePath(seriesId);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as StyleGuide;
  } catch {
    return null;
  }
}

const EMPTY_GUIDE: Omit<StyleGuide, "seriesId" | "updatedAt"> = {
  artStyle: "",
  colorPalette: "",
  mood: "",
  recurringElements: "",
  additionalNotes: "",
};

export function saveStyleGuide(seriesId: string, data: Partial<Omit<StyleGuide, "seriesId" | "updatedAt">>): StyleGuide {
  ensureDir();
  const existing = getStyleGuide(seriesId);
  const guide: StyleGuide = {
    ...EMPTY_GUIDE,
    ...(existing ? { artStyle: existing.artStyle, colorPalette: existing.colorPalette, mood: existing.mood, recurringElements: existing.recurringElements, additionalNotes: existing.additionalNotes } : {}),
    ...data,
    seriesId,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(guidePath(seriesId), JSON.stringify(guide, null, 2));
  return guide;
}

export function deleteStyleGuide(seriesId: string): boolean {
  const path = guidePath(seriesId);
  if (!existsSync(path)) return false;
  unlinkSync(path);
  return true;
}

export function styleGuideToPromptPrefix(guide: StyleGuide): string {
  const parts: string[] = [];
  if (guide.artStyle) parts.push(`art style: ${guide.artStyle}`);
  if (guide.colorPalette) parts.push(`colors: ${guide.colorPalette}`);
  if (guide.mood) parts.push(`mood: ${guide.mood}`);
  if (guide.recurringElements) parts.push(`elements: ${guide.recurringElements}`);
  return parts.join(", ");
}
