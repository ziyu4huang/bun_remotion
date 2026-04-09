/**
 * Narration scripts for Taiwan Stock Market video.
 *
 * Each scene is 240 frames (8 seconds at 30fps).
 * Narration text is written in natural spoken Traditional Chinese (Taiwan).
 * Aim for ~6-7 seconds of speech to fit the 8-second scene (~35-45 Chinese chars).
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
    text: "歡迎來到台灣股市傳統知識。本片將帶您了解K線、價量關係、支撐壓力與均線等核心概念。",
  },
  {
    scene: "KLineScene",
    file: "02-kline.wav",
    text: "K線由開盤、收盤、最高、最低四個價位組成。紅K代表收盤高於開盤，買方強勢；黑K則賣方佔優。上下影線反映當日高低點的壓力與支撐力道。",
  },
  {
    scene: "PriceVolumeScene",
    file: "03-price-volume.wav",
    text: "解讀量能是判斷趨勢的關鍵。價漲量增是多頭健康的訊號；價跌量增代表空頭力道加強；而價跌量縮，則暗示底部可能將近。量是價的先行指標。",
  },
  {
    scene: "SupportResistanceScene",
    file: "04-support-resistance.wav",
    text: "支撐線是買盤集中的價位，能止住下跌；壓力線是賣盤聚集的地方，阻擋上漲。價格在區間內反覆震盪，一旦突破壓力，舊壓即轉為新支撐。",
  },
  {
    scene: "MovingAverageScene",
    file: "05-moving-average.wav",
    text: "均線代表一段期間的平均持有成本，反映市場的共識價位。五日線與十日線出現黃金交叉是看多訊號；相反地，死亡交叉則提示行情轉空。",
  },
  {
    scene: "TradingHoursScene",
    file: "06-trading-hours.wav",
    text: "台股每天八點半進行盤前試撮，九點正式開盤，下午一點二十五分準備收盤集合競價，一點半結束交易。週一到週五為正常交易日。",
  },
  {
    scene: "LimitScene",
    file: "07-limit.wav",
    text: "台灣股市設有每日百分之十的漲跌幅限制，分別稱為漲停板與跌停板。大量委託掛在漲停而無法再上漲，稱為鎖漲停，代表強烈的多方信號。",
  },
];
