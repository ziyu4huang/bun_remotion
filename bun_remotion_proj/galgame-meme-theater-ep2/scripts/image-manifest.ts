/**
 * Image Generation Manifest for 美少女梗圖劇場 第二集 (EP2)
 *
 * Character sprites are reused from EP1 (xiaoxue.png, xiaoyue.png, xiaoying.png).
 * This file defines only the NEW background images needed for EP2.
 *
 * HOW TO USE:
 * 1. Open the Gemini AI Studio image generation page
 * 2. For each entry below, copy the prompt and generate the image
 * 3. Save to public/images/ with the specified filename
 *
 * CRITICAL RULES:
 * - Character sprites: Reuse from EP1 (already in public/images/)
 * - Backgrounds: Full scene, anime style, no characters
 * - Resolution: 1920x1080 for backgrounds
 */

export interface ImageEntry {
  file: string;
  type: "background";
  prompt: string;
  notes: string;
}

export const images: ImageEntry[] = [
  // ─── Backgrounds ───────────────────────────────────────────────────────────

  {
    file: "bedroom-night.png",
    type: "background",
    prompt: [
      "anime style cozy Japanese girl's bedroom at night,",
      "soft blue moonlight through window, dark room with glowing computer monitor,",
      "messy bed with plushies, string lights, posters on wall,",
      "snack wrappers and drink cans on desk, phone charging cable,",
      "warm glow from monitor illuminating the room, cozy otaku atmosphere,",
      "no characters, empty room, wide shot,",
      "high quality anime background art, soft night lighting, detailed interior"
    ].join(" "),
    notes: "臥室夜晚 — 讀書會變開黑局場景，深夜房間，電腦螢幕光",
  },

  {
    file: "gaming-setup.png",
    type: "background",
    prompt: [
      "anime style gaming room interior,",
      "large desk with dual monitors showing game store sales page,",
      "RGB keyboard and mouse, gaming headset on desk, figurines on shelf,",
      "LED strip lighting in purple and blue, poster of anime characters on wall,",
      "Steam sales notification on screen, cozy gamer room atmosphere,",
      "no characters, empty room, wide shot,",
      "high quality anime background art, vibrant RGB lighting, detailed setup"
    ].join(" "),
    notes: "遊戲房 — 打折永遠買不完場景，RGB電競房，Steam特賣",
  },

  {
    file: "bedroom-dawn.png",
    type: "background",
    prompt: [
      "anime style Japanese girl's bedroom at dawn, early morning light,",
      "pale orange and pink sunrise through curtains,",
      "girl still at computer desk, empty energy drink cans scattered,",
      "clock showing 5:47 AM, half-eaten snacks,",
      "warm dawn light mixing with monitor glow, slightly messy room,",
      "no characters, empty room, wide shot,",
      "high quality anime background art, dramatic dawn lighting, Makoto Shinkai style"
    ].join(" "),
    notes: "臥室黎明 — 再一局就睡場景，天亮了但還在打遊戲",
  },

  {
    file: "gaming-room.png",
    type: "background",
    prompt: [
      "anime style gaming room, intense gaming session atmosphere,",
      "large gaming monitor with competitive game on screen, dramatic lighting,",
      "red and purple LED ambient lighting, game controller on desk,",
      "frustration crumpled paper balls on floor, empty energy drinks,",
      "dark room with dramatic monitor glow, intense atmosphere,",
      "no characters, empty room, wide shot,",
      "high quality anime background art, dramatic gaming atmosphere, high contrast"
    ].join(" "),
    notes: "遊戲房 — 排位連敗甩鍋場景，紅光電競房，緊張氣氛",
  },
];
