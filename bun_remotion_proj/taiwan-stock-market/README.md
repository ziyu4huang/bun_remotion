# Taiwan Stock Market — Traditional Knowledge

AI-generated educational video explaining fundamental Taiwan stock market concepts, built with [Remotion](https://remotion.dev/) and [Bun](https://bun.sh/).

## Overview

A 56-second video (1920x1080, 30fps) covering 7 key topics:

| # | Scene | Content |
|---|-------|---------|
| 1 | TitleScene | Opening title — 台灣股市傳統知識 |
| 2 | KLineScene | Candlestick (K-line) fundamentals — 陽線/陰線, 影線 |
| 3 | PriceVolumeScene | Price–volume relationship — 價漲量增, 價跌量縮 |
| 4 | SupportResistanceScene | Support & resistance — 支撐線, 壓力線, 角色互換 |
| 5 | MovingAverageScene | Moving average system — 黃金交叉, 死亡交叉 |
| 6 | TradingHoursScene | TWSE trading hours — 盤前試撮, 收盤競價, 盤後交易 |
| 7 | LimitScene | Daily price limit ±10% — 漲停板, 跌停板, 鎖漲停 |

Each scene is 240 frames (8 seconds) with bilingual content (Traditional Chinese + English).

## TTS Narration

The video includes spoken narration in Traditional Chinese, generated via Gemini TTS.

### Generate Audio

```bash
# From repo root
bun run generate-tts:stock

# Or from the app directory
cd apps/taiwan-stock-market
bun run generate-tts
```

Audio files are saved to `public/audio/` and automatically embedded into the rendered video via Remotion's `<Audio>` component.

**Requirements:**
- `GOOGLE_API_KEY` environment variable (free key from [Google AI Studio](https://aistudio.google.com/apikey))
- Uses `gemini-2.5-flash-preview-tts` (free tier, 10 requests/day)

### Narration Scripts

Narration text is defined in `scripts/narration.ts`:

```typescript
export const narrations: NarrationScript[] = [
  { scene: "TitleScene", file: "01-title.wav", text: "歡迎來到台灣股市傳統知識。" },
  // ...one entry per scene
];
```

To modify narration, edit this file and re-run `bun run generate-tts`.

## Commands

All commands run from the **repo root**:

```bash
bun start:stock              # Open in Remotion Studio (preview)
bun run build:stock          # Render to MP4
bun run generate-tts:stock   # Generate TTS audio
```

## Project Structure

```
apps/taiwan-stock-market/
  src/
    index.ts                      # registerRoot()
    Root.tsx                      # Composition declaration
    TaiwanStockMarket.tsx         # Main composition (1680 frames, 56s)
    scenes/
      TitleScene.tsx              # Opening title
      KLineScene.tsx              # Candlestick chart fundamentals
      PriceVolumeScene.tsx        # Price–volume relationships
      SupportResistanceScene.tsx  # Support & resistance levels
      MovingAverageScene.tsx      # Moving average system
      TradingHoursScene.tsx       # TWSE trading hours
      LimitScene.tsx              # Daily price limits
  scripts/
    narration.ts                  # Narration text per scene
    generate-tts.ts               # TTS generation script (Gemini API)
  public/
    audio/
      .gitkeep                    # Directory placeholder (tracked)
      *.wav                       # Generated audio files (gitignored)
  out/
    taiwan-stock-market.mp4       # Rendered video (gitignored)
```

## Tech Stack

- [Remotion](https://remotion.dev/) v4.0.290 — React-based video framework
- [Bun](https://bun.sh/) — JavaScript runtime
- [Gemini TTS](https://ai.google.dev/) — Text-to-speech (free tier)
- Shared components from `@bun-remotion/shared` (`FadeText`, `CandleChart`)
