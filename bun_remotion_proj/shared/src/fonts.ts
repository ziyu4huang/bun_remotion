import { loadFont } from "@remotion/google-fonts/NotoSansTC";
import { loadFont as loadMaShanZheng } from "@remotion/google-fonts/MaShanZheng";
import { loadFont as loadZCOOLKuaiLe } from "@remotion/google-fonts/ZCOOLKuaiLe";
import { loadFont as loadZhiMangXing } from "@remotion/google-fonts/ZhiMangXing";

export const { fontFamily: notoSansTC } = loadFont("normal", {
  weights: ["400", "700"],
});

// 馬善政 — brush calligraphy, best for manga SFX
export const { fontFamily: maShanZheng } = loadMaShanZheng();

// 站酷快樂體 — playful rounded handwritten, for comedic moments
export const { fontFamily: zcoolKuaiLe } = loadZCOOLKuaiLe();

// 志芒行 — quick-brush calligraphy, dynamic, for action SFX
export const { fontFamily: zhiMangXing } = loadZhiMangXing();

export function sfxFont(font?: "brush" | "playful" | "action"): string {
  switch (font) {
    case "brush": return maShanZheng;
    case "playful": return zcoolKuaiLe;
    case "action": return zhiMangXing;
    default: return maShanZheng;
  }
}
