/**
 * Extract the real image URL from a Next.js `_next/image?url=<encoded>` proxy src.
 */
export function extractImageUrl(proxySrc: string): string {
  const match = proxySrc.match(/url=([^&]+)/);
  if (!match) throw new Error(`No url= parameter found in proxy src: ${proxySrc.slice(0, 100)}`);
  return decodeURIComponent(match[1]);
}

/**
 * Sanitize a filename for safe filesystem use, ensuring it ends with .png.
 */
export function sanitizeFilename(name: string): string {
  let safe = name.replace(/[/\\?%*:|"<>]/g, "-").replace(/\s+/g, "-").replace(/-+/g, "-");
  if (!safe.endsWith(".png") && !safe.endsWith(".jpg") && !safe.endsWith(".jpeg")) {
    safe += ".png";
  }
  return safe;
}

export interface CharacterPromptOptions {
  facing?: "LEFT" | "RIGHT";
  style?: string;
}

/**
 * Build a character image prompt with z.ai conventions:
 * - Facing LEFT (repeated 3x for emphasis)
 * - Solid magenta background for rembg
 * - Upper body / portrait framing
 */
export function buildCharacterPrompt(description: string, opts?: CharacterPromptOptions): string {
  const facing = opts?.facing ?? "LEFT";
  const style = opts?.style ? `, ${opts.style}` : "";

  return [
    description,
    `facing ${facing}, character facing ${facing} side, looking to the ${facing} side`,
    "upper body portrait, solid magenta #FF00FF background",
    `anime style illustration${style}`,
  ].join(", ");
}

export interface BackgroundPromptOptions {
  style?: string;
}

/**
 * Build a background image prompt with z.ai conventions:
 * - 16:9 cinematic wide shot
 * - No text, no watermark, no characters
 */
export function buildBackgroundPrompt(description: string, opts?: BackgroundPromptOptions): string {
  const style = opts?.style ? `, ${opts.style}` : "";

  return [
    description,
    "no text, no watermark, no characters, no people",
    "cinematic wide shot, detailed background",
    `digital art${style}`,
  ].join(", ");
}
