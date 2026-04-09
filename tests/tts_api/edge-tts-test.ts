/**
 * Edge TTS test (Microsoft Edge — completely free, no API key)
 * Run: bun tests/tts_api/edge-tts-test.ts
 *
 * ── Prerequisites ──────────────────────────────────────────────
 * pip install edge-tts          (Python 3.8+)
 *
 * ── Free Tier Status ────────────────────────────────────────────
 * - No API key needed — uses the same engine as Microsoft Edge browser
 * - Rate limit: ~3 requests/second (unofficial, be polite)
 * - No monthly quota — effectively unlimited for personal use
 *
 * ── Windows compatibility ───────────────────────────────────────
 * - Outputs MP3 directly — playable anywhere on Windows
 * - Uses Python subprocess (no WebSocket plumbing needed)
 * - Audio quality comparable to Azure Neural TTS (same backend)
 *
 * ── zh-TW voices ───────────────────────────────────────────────
 * - zh-TW-HsiaoChenNeural   female, warm  ✅ recommended
 * - zh-TW-YunJheNeural      male, clear   ✅
 * - zh-TW-HsiaoYuNeural     female, bright✅
 *
 * ── Other notable voices ────────────────────────────────────────
 * - en-US-AriaNeural        English female
 * - zh-CN-XiaoxiaoNeural    Mandarin female
 *
 * ── List all voices ────────────────────────────────────────────
 * python -m edge_tts --list-voices
 * ──────────────────────────────────────────────────────────────
 */

import { mkdirSync, existsSync, statSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";

const OUTPUT_DIR = join(import.meta.dirname ?? __dirname, "output");
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

// Check edge-tts is installed
const checkResult = spawnSync("python", ["-m", "edge_tts", "--version"], { encoding: "utf-8" });
if (checkResult.status !== 0) {
  console.error("edge-tts not found. Install with: pip install edge-tts");
  process.exit(1);
}
console.log(`edge-tts: ${checkResult.stdout.trim()}`);

interface TestCase {
  voice: string;
  text: string;
  outputFile: string;
  rate?: string;   // e.g. "+10%", "-20%"
  pitch?: string;  // e.g. "+0Hz"
}

const TESTS: TestCase[] = [
  {
    voice: "zh-TW-HsiaoChenNeural",
    text: "從前，在一座被雲霧環繞的高山上，住著一隻名叫小橘的貓咪。",
    outputFile: "edge_zhTW_HsiaoChen_story.mp3",
  },
  {
    voice: "zh-TW-YunJheNeural",
    text: "台灣股市今日以漲勢收盤，加權指數上漲一百二十點。",
    outputFile: "edge_zhTW_YunJhe_stock.mp3",
  },
  {
    voice: "en-US-AriaNeural",
    text: "Hello! This is Microsoft Edge TTS, a free text-to-speech service with high-quality neural voices.",
    outputFile: "edge_enUS_Aria.mp3",
    rate: "+5%",
  },
];

function synthesize(test: TestCase): { ok: boolean; file?: string; error?: string } {
  const outPath = join(OUTPUT_DIR, test.outputFile);
  const args = [
    "-m", "edge_tts",
    "--voice", test.voice,
    "--text", test.text,
    "--write-media", outPath,
  ];
  if (test.rate) { args.push("--rate", test.rate); }
  if (test.pitch) { args.push("--pitch", test.pitch); }

  const t0 = Date.now();
  const result = spawnSync("python", args, { encoding: "utf-8", timeout: 30_000 });

  if (result.status !== 0) {
    return { ok: false, error: result.stderr || result.stdout || `exit ${result.status}` };
  }

  const size = statSync(outPath).size;
  return { ok: true, file: `${outPath} (${(size / 1024).toFixed(1)}KB, ${Date.now() - t0}ms)` };
}

// ── Run tests ──

console.log("\n=== Edge TTS Free Tier Test ===\n");

for (const test of TESTS) {
  process.stdout.write(`[${test.voice}] "${test.text.slice(0, 40)}..." → `);
  const r = synthesize(test);
  if (r.ok) {
    console.log(`OK  ${r.file}`);
  } else {
    console.log(`FAIL  ${r.error}`);
  }
}

console.log(`\nOutput files saved to: ${OUTPUT_DIR}`);
console.log("To play on Windows: start <file.mp3>");
