/**
 * Generate TTS audio for ClaudeCodeIntro using edge-tts (Microsoft Neural, free, no API key).
 * Output: public/audio/<n>-<scene>.mp3  +  public/audio/durations.json
 * Engine: en-US-AriaNeural (natural, conversational female voice)
 *
 * Usage:
 *   bun run scripts/generate-tts.ts
 *   bun run scripts/generate-tts.ts --skip-existing
 */

import { spawnSync, execSync } from "child_process";
import { statSync, mkdirSync, existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { narrations } from "./narration";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..", "..");
const AUDIO_DIR = join(__dirname, "..", "public", "audio");
const VOICE = "en-US-AriaNeural";
const RATE = "+0%";
const FPS = 30;

// Use Remotion's bundled ffprobe (works cross-platform without extra install)
const FFPROBE = join(
  REPO_ROOT, "node_modules", "@remotion",
  `compositor-${process.platform}-${process.arch}-${process.platform === "win32" ? "msvc" : "gnu"}`,
  process.platform === "win32" ? "ffprobe.exe" : "ffprobe"
);

function synthesize(text: string, outPath: string): number {
  const args = [
    "-m", "edge_tts",
    "--voice", VOICE,
    "--text", text,
    "--rate", RATE,
    "--write-media", outPath,
  ];
  const result = spawnSync("python", args, { encoding: "utf-8", timeout: 30_000 });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `exit ${result.status}`);
  }
  return statSync(outPath).size;
}

function mp3DurationFrames(filePath: string): number {
  try {
    const out = execSync(
      `"${FFPROBE}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { encoding: "utf-8" }
    ).trim();
    return Math.ceil(parseFloat(out) * FPS) + 15; // +15 frame trailing buffer
  } catch {
    return 210; // fallback
  }
}

async function main() {
  mkdirSync(AUDIO_DIR, { recursive: true });
  const skipExisting = process.argv.includes("--skip-existing");
  console.log(`Generating TTS for ${narrations.length} scene(s)  [voice: ${VOICE}]`);

  for (let i = 0; i < narrations.length; i++) {
    const { scene, file, text } = narrations[i];
    const outPath = join(AUDIO_DIR, file);

    if (skipExisting && existsSync(outPath)) {
      console.log(`[${i + 1}/${narrations.length}] ${scene} — skipped (exists)`);
      continue;
    }

    process.stdout.write(`[${i + 1}/${narrations.length}] ${scene}: "${text.slice(0, 50)}..."  `);
    try {
      const size = synthesize(text, outPath);
      console.log(`→ ${file} (${(size / 1024).toFixed(1)}KB)`);
    } catch (err: any) {
      console.error(`\n  ERROR: ${err.message}`);
      process.exit(1);
    }

    if (i < narrations.length - 1) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  // Write durations.json — Root.tsx reads this via require() to avoid Node.js imports in webpack
  const durations = narrations.map(({ file }) => {
    const p = join(AUDIO_DIR, file);
    return existsSync(p) ? mp3DurationFrames(p) : 210;
  });
  writeFileSync(
    join(AUDIO_DIR, "durations.json"),
    JSON.stringify(durations, null, 2) + "\n"
  );

  console.log(`\nDone. Files saved to: ${AUDIO_DIR}`);
  console.log(`durations.json: ${JSON.stringify(durations)}`);
  console.log(`Total: ${durations.reduce((s, d) => s + d, 0)} frames  (${(durations.reduce((s, d) => s + d, 0) / FPS).toFixed(1)}s)`);
}

main();
