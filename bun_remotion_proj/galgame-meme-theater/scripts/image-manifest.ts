/**
 * Image Generation Manifest for 美少女梗圖劇場
 *
 * This file defines all images needed for the video with detailed prompts
 * optimized for galgame-style character sprites and backgrounds.
 *
 * HOW TO USE:
 * 1. Open the Gemini AI Studio image generation page
 * 2. For each entry below, copy the prompt and generate the image
 * 3. Save to public/images/ with the specified filename
 *
 * CRITICAL RULES:
 * - Character sprites: ALWAYS use "transparent background (PNG with alpha)"
 * - Character sprites: ALWAYS use "half-body portrait (waist up)"
 * - Backgrounds: Full scene, anime style, no characters
 * - Resolution: 1024px wide for sprites, 1920x1080 for backgrounds
 */

// ─── Character Sprites ────────────────────────────────────────────────────────
// These are half-body portraits with transparent backgrounds.
// Each character has a base sprite used across all scenes.

export interface ImageEntry {
  file: string;
  type: "character" | "background";
  prompt: string;
  notes: string;
}

export const images: ImageEntry[] = [
  // ─── Characters ────────────────────────────────────────────────────────────

  {
    file: "xiaoxue.png",
    type: "character",
    prompt: [
      "anime style beautiful girl character portrait,",
      "16-17 years old, energetic genki girl archetype,",
      "long pink hair in twin tails with red ribbon hair ties,",
      "large sparkling pink eyes, cheerful confident smile showing teeth,",
      "wearing Japanese high school sailor uniform, white blouse with blue collar, red ribbon necktie,",
      "half-body portrait from waist up, facing viewer slightly angled left,",
      "transparent PNG background with clean alpha edges, no background,",
      "high quality anime illustration, Kyoto Animation style,",
      "soft cel shading, vibrant colors, detailed hair rendering",
    ].join(" "),
    notes: "小雪 — 元氣系美少女，粉紅雙馬尾，表情開朗自信",
  },

  {
    file: "xiaoyue.png",
    type: "character",
    prompt: [
      "anime style beautiful girl character portrait,",
      "17-18 years old, cool beauty kuudere archetype,",
      "long straight black hair reaching waist, sharp blue-gray eyes,",
      "slight confident smirk, elegant composed expression,",
      "wearing Japanese high school uniform, white blouse, dark navy blazer, gold button, red ribbon tie loosely worn,",
      "half-body portrait from waist up, facing viewer slightly angled right,",
      "transparent PNG background with clean alpha edges, no background,",
      "high quality anime illustration, Kyoto Animation style,",
      "soft cel shading, cool color palette, detailed hair rendering",
    ].join(" "),
    notes: "小月 — 高冷系美少女，黑長直，三無毒舌，自信冷笑",
  },

  {
    file: "xiaoying.png",
    type: "character",
    prompt: [
      "anime style beautiful girl character portrait,",
      "15-16 years old, cute airhead ditzy archetype,",
      "short messy orange-brown hair with ahoge (antenna hair) on top,",
      "large round golden-brown eyes, innocent slightly confused expression, soft blush on cheeks,",
      "wearing Japanese high school uniform, white blouse slightly oversized, pink cardigan,",
      "half-body portrait from waist up, facing viewer straight on,",
      "transparent PNG background with clean alpha edges, no background,",
      "high quality anime illustration, Kyoto Animation style,",
      "soft cel shading, warm color palette, detailed hair rendering",
    ].join(" "),
    notes: "小樱 — 天然呆美少女，橘色短髮呆毛，無辜困惑表情",
  },

  // ─── Backgrounds ───────────────────────────────────────────────────────────

  {
    file: "classroom-morning.png",
    type: "background",
    prompt: [
      "anime style Japanese high school classroom interior, morning scene,",
      "sunlight streaming through large windows on the left side, warm golden light,",
      "rows of wooden desks and chairs, green chalkboard in the background,",
      "cherry blossom petals visible through windows, dust motes in sunlight,",
      "soft pastel color palette, warm morning atmosphere,",
      "no characters, empty classroom, wide shot,",
      "high quality anime background art, Makoto Shinkai style lighting",
    ].join(" "),
    notes: "教室早晨 — 早八場景，暖色調晨光，櫻花",
  },

  {
    file: "cafe.png",
    type: "background",
    prompt: [
      "anime style cute Japanese cafe interior,",
      "warm cozy atmosphere, pastel pink and cream color scheme,",
      "wooden tables with checkered tablecloths, display case with cakes and pastries,",
      "string lights and fairy lights, large window showing afternoon street,",
      "menu board on wall, cute decorative plants, soft bokeh background,",
      "no characters, empty cafe, wide shot,",
      "high quality anime background art, soft warm lighting",
    ].join(" "),
    notes: "咖啡廳 — 減肥場景，可愛粉色系咖啡廳",
  },

  {
    file: "school-corridor.png",
    type: "background",
    prompt: [
      "anime style Japanese high school corridor hallway,",
      "late afternoon golden hour lighting through windows,",
      "clean hallway with shoe lockers along the wall, bulletin board with flyers,",
      "warm orange and amber light, long shadows,",
      "cherry blossom tree visible through corridor window,",
      "no characters, empty corridor, perspective shot,",
      "high quality anime background art, Makoto Shinkai style",
    ].join(" "),
    notes: "學校走廊 — 成績揭曉場景，夕陽金光",
  },

  {
    file: "school-gate.png",
    type: "background",
    prompt: [
      "anime style Japanese high school entrance gate,",
      "bright daytime scene, blue sky with fluffy white clouds,",
      "red torii-style school gate, stone pathway, cherry blossom trees in full bloom,",
      "students' bicycles parked nearby, green hedges,",
      "cheerful bright atmosphere, clear day, vivid colors,",
      "no characters, wide establishing shot,",
      "high quality anime background art, Makoto Shinkai style sky",
    ].join(" "),
    notes: "校門口 — 社死場景，晴朗藍天櫻花盛開",
  },
];

// ─── Batch Generation Script (for browser_run_code) ──────────────────────────
// Copy this into browser_run_code when using /generate-image skill:
//
// async (page) => {
//   const imageList = [
//     { file: 'xiaoxue.png', prompt: '...' },
//     { file: 'xiaoyue.png', prompt: '...' },
//     { file: 'xiaoying.png', prompt: '...' },
//     { file: 'classroom-morning.png', prompt: '...' },
//     { file: 'cafe.png', prompt: '...' },
//     { file: 'school-corridor.png', prompt: '...' },
//     { file: 'school-gate.png', prompt: '...' },
//   ];
//
//   for (const { file, prompt } of imageList) {
//     // Navigate to AI Studio and generate each image
//     // Download to public/images/{file}
//   }
// }
