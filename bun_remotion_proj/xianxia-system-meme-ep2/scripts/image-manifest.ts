/**
 * Image generation manifest for 系統文小說梗 第一集.
 *
 * Characters:
 *   修修 (Xiuxiu) — 廢柴修仙者男角色, blue theme
 *   師姐 (Shijie) — 高冷師姐, pink theme
 *   系統 (System) — 無單獨角色圖 (system is shown as UI overlay only)
 *
 * IMPORTANT CONVENTION: ALL character images face LEFT by default.
 *   - side="left"  → scaleX(-1) flip to face RIGHT toward partner
 *   - side="right" → no flip, already facing LEFT toward partner
 *
 * IMPORTANT: Nano Banana doesn't support true transparent backgrounds.
 * Strategy: Generate images with SOLID MAGENTA (#FF00FF) background,
 * then use rembg to remove the background afterwards.
 *
 * For each character we need:
 *   1. Half-body sprite (normal mode) — waist up
 *   2. Chibi/Q版 sprite (battle mode) — cute super-deformed style
 *
 * Run: bun bun_remotion_proj/xianxia-system-meme-ep1/scripts/image-manifest.ts
 * This writes public/images/manifest.json for AI readability.
 */

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(__dirname, "..");

export interface ImageManifest {
  file: string;
  type: "normal" | "chibi";
  character: string;
  facing: "LEFT";
  prompt: string;
  backgroundStrategy: "solid magenta #FF00FF, remove with rembg";
  postProcess: "rembg background removal → verify transparency";
}

export const images: ImageManifest[] = [
  // ─── 修修 (Xiuxiu) — Male cultivator ────────────────────────────────
  {
    file: "xiuxiu.png",
    type: "normal",
    character: "xiuxiu",
    facing: "LEFT",
    prompt: `anime style male cultivator character, young man age 18-20, messy dark blue hair with a small ponytail, bright blue eyes, wearing white and blue Chinese cultivation robes with cloud patterns, thin build, slightly nervous expression, half-body portrait from waist up, facing LEFT, solid magenta #FF00FF background, clean edges, no background detail, high quality anime illustration`,
    backgroundStrategy: "solid magenta #FF00FF, remove with rembg",
    postProcess: "rembg background removal → verify transparency",
  },
  {
    file: "xiuxiu-chibi.png",
    type: "chibi",
    character: "xiuxiu",
    facing: "LEFT",
    prompt: `chibi SD super deformed anime style male cultivator, young man, messy dark blue hair with small ponytail, big sparkly blue eyes, wearing cute white and blue Chinese cultivation robes, facing LEFT, very round head, tiny body, adorable panicked expression, chibi proportions (head 2/3 of body), half-body portrait, solid magenta #FF00FF background, clean edges, no background detail, high quality chibi anime illustration`,
    backgroundStrategy: "solid magenta #FF00FF, remove with rembg",
    postProcess: "rembg background removal → verify transparency",
  },
  // ─── 師姐 (Shijie) — Senior sister ──────────────────────────────────
  {
    file: "shijie.png",
    type: "normal",
    character: "shijie",
    facing: "LEFT",
    prompt: `anime style female cultivator character, beautiful young woman age 20-22, long flowing pink hair with hair ornaments, elegant red eyes, wearing elegant red and white Chinese cultivation robes with flower patterns, mature and calm expression, slight mysterious smile, half-body portrait from waist up, facing LEFT, solid magenta #FF00FF background, clean edges, no background detail, high quality anime illustration`,
    backgroundStrategy: "solid magenta #FF00FF, remove with rembg",
    postProcess: "rembg background removal → verify transparency",
  },
  {
    file: "shijie-chibi.png",
    type: "chibi",
    character: "shijie",
    facing: "LEFT",
    prompt: `chibi SD super deformed anime style female cultivator, beautiful young woman, long flowing pink hair with hair ornaments, big elegant red eyes, wearing cute red and white Chinese cultivation robes, facing LEFT, very round head, tiny body, serene confident smile, chibi proportions (head 2/3 of body), half-body portrait, solid magenta #FF00FF background, clean edges, no background detail, high quality chibi anime illustration`,
    backgroundStrategy: "solid magenta #FF00FF, remove with rembg",
    postProcess: "rembg background removal → verify transparency",
  },
];

// ─── Write manifest.json ─────────────────────────────────────────
const outPath = join(APP_DIR, "public", "images", "manifest.json");
writeFileSync(outPath, JSON.stringify(images, null, 2) + "\n");
console.log(`Image manifest written: ${outPath}`);
console.log(`Images: ${images.length} entries`);
