import { spawnSync, execSync } from "child_process";
import { statSync, mkdirSync, existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { narrations } from "./narration";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..", "..");
const AUDIO_DIR = join(__dirname, "..", "public", "audio");
const VOICE = "en-US-GuyNeural";
const FPS = 30;

// Use system ffprobe (Homebrew-installed)
const FFPROBE = "ffprobe";

function synthesize(text: string, outPath: string) {
  const result = spawnSync(
    "python3",
    ["-m", "edge_tts", "--voice", VOICE, "--text", text, "--write-media", outPath],
    { encoding: "utf-8", timeout: 30_000 },
  );
  if (result.error) throw new Error(result.error.message);
  if (result.status !== 0) throw new Error(result.stderr || `exit ${result.status}`);
}

function durationFrames(filePath: string): number {
  try {
    const out = execSync(
      `"${FFPROBE}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { encoding: "utf-8" },
    ).trim();
    return Math.ceil(parseFloat(out) * FPS) + 15; // +15 trailing buffer
  } catch {
    return 210;
  }
}

async function main() {
  mkdirSync(AUDIO_DIR, { recursive: true });
  const skipExisting = process.argv.includes("--skip-existing");

  for (let i = 0; i < narrations.length; i++) {
    const { scene, file, text } = narrations[i];
    const outPath = join(AUDIO_DIR, file);
    if (skipExisting && existsSync(outPath)) {
      console.log(`[${i + 1}] ${scene} — skipped`);
      continue;
    }
    console.log(`[${i + 1}/${narrations.length}] ${scene}...`);
    synthesize(text, outPath);
    console.log(`  → ${file} (${(statSync(outPath).size / 1024).toFixed(1)}KB)`);
    if (i < narrations.length - 1) await new Promise((r) => setTimeout(r, 300));
  }

  // Write durations.json — Root.tsx reads this; avoids Node.js imports in webpack
  const durations = narrations.map(({ file }) => {
    const p = join(AUDIO_DIR, file);
    return existsSync(p) ? durationFrames(p) : 210;
  });
  writeFileSync(join(AUDIO_DIR, "durations.json"), JSON.stringify(durations, null, 2) + "\n");
  console.log(`\ndurations.json: ${JSON.stringify(durations)}`);
}

main();
