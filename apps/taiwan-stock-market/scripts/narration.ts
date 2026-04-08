/**
 * Narration scripts for Taiwan Stock Market video.
 *
 * Each scene is 240 frames (8 seconds at 30fps).
 * Narration text is written in natural spoken Traditional Chinese (Taiwan).
 * Keep each script concise — aim for ~6-7 seconds of speech (~15-18 chars).
 *
 * To regenerate audio: bun run scripts/generate-tts.ts
 */

export interface NarrationScript {
  /** Scene component name (matches scenes/<Name>.tsx) */
  scene: string;
  /** Output filename in public/audio/ */
  file: string;
  /** Narration text in Traditional Chinese */
  text: string;
}

export const narrations: NarrationScript[] = [
  {
    scene: "TitleScene",
    file: "01-title.wav",
    text: "歡迎來到台灣股市傳統知識。",
  },
  {
    scene: "KLineScene",
    file: "02-kline.wav",
    text: "紅K代表買方強勢，黑K代表賣方強勢。影線則反映當日高低點的壓力與支撐。",
  },
  {
    scene: "PriceVolumeScene",
    file: "03-price-volume.wav",
    text: "價漲量增，多頭健康；價跌量縮，底部將近。這就是價量關係。",
  },
  {
    scene: "SupportResistanceScene",
    file: "04-support-resistance.wav",
    text: "支撐線止跌，壓力線阻漲。突破壓力，舊壓變新撐。",
  },
  {
    scene: "MovingAverageScene",
    file: "05-moving-average.wav",
    text: "均線是市場平均成本。黃金交叉看多，死亡交叉看空。",
  },
  {
    scene: "TradingHoursScene",
    file: "06-trading-hours.wav",
    text: "台股早上九點開盤，下午一點半收盤，週一到週五。",
  },
  {
    scene: "LimitScene",
    file: "07-limit.wav",
    text: "台股每日漲跌幅限制為百分之十。鎖漲停代表強烈看多。",
  },
];
