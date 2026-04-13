import type { Emotion, ComicEffect } from "./types";

/**
 * Resolve character image filename from emotion.
 * emotion undefined → {character}.png (base image)
 * emotion "default" → {character}.png (base image)
 * emotion specified  → {character}-{emotion}.png
 */
export function resolveCharacterImage(
  character: string,
  emotion?: Emotion,
): string {
  if (emotion && emotion !== "default") return `${character}-${emotion}.png`;
  return `${character}.png`;
}

/**
 * Maps a ComicEffect to its representative emoji.
 */
export function effectToEmoji(
  effect: ComicEffect | ComicEffect[] | undefined,
): string {
  if (!effect) return "";
  const single = Array.isArray(effect) ? effect[0] : effect;
  const map: Record<ComicEffect, string> = {
    surprise: "😳",
    shock: "😱",
    sweat: "💦",
    sparkle: "✨",
    heart: "❤️",
    anger: "💢",
    dots: "💭",
    cry: "😢",
    laugh: "😆",
    fire: "🔥",
    shake: "😤",
    gloating: "😏",
  };
  return map[single] ?? "";
}
