/**
 * Shared TTS generator for 我的核心是大佬 series.
 *
 * Run from an episode directory via:
 *   bun run ../../assets/scripts/generate-tts.ts
 *
 * Voice configuration is centralized in assets/voice-config.json.
 * Episode narration.ts only needs to export: narrations, NARRATOR_LANG
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync, unlinkSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Voice config — single source of truth
const VOICE_CONFIG_PATH = join(__dirname, "..", "voice-config.json");
const voiceConfig = JSON.parse(readFileSync(VOICE_CONFIG_PATH, "utf-8")) as {
  language: string;
  defaultEngine: string;
  defaultTtsModel: string;
  speed: number;
  sampleRate: number;
  engines: Record<string, {
    model: string;
    models?: Record<string, { id: string; memory: string; voices: string[]; notes: string }>;
    voices: string[];
  }>;
  characters: Record<string, {
    name: string;
    role: string;
    gender: string;
    description: string;
    voices: Record<string, string>;
  }>;
};

// APP_DIR is the episode root (e.g., my-core-is-boss-ch1-ep1/)
const APP_DIR = process.cwd();
const EP_NAME = basename(APP_DIR).replace("my-core-is-boss-", ""); // e.g., "ch1-ep1"
// REPO_ROOT is 3 levels up from episode: episode -> my-core-is-boss -> bun_remotion_proj -> repo root
const REPO_ROOT = join(APP_DIR, "..", "..", "..");
// .wav + JSON output: episode/audio/ (loaded via require(), not staticFile)
const EP_AUDIO_DIR = join(APP_DIR, "audio");
const SEGMENTS_DIR = join(EP_AUDIO_DIR, "_segments");

const MLX_TTS_ROOT = join(REPO_ROOT, "mlx_tts");
const MLX_PYTHON = join(MLX_TTS_ROOT, ".venv", "bin", "python");
const MLX_SPEED = String(voiceConfig.speed);
const MLX_LANG = "zh";

const GEMINI_MODEL = voiceConfig.engines.gemini?.model ?? "gemini-2.5-flash-preview-tts";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const SAMPLE_RATE = voiceConfig.sampleRate;
const BYTE_RATE = SAMPLE_RATE * 2;

const args = process.argv.slice(2);
const skipExisting = args.includes("--skip-existing");
const sceneFilter = (() => {
  const idx = args.indexOf("--scene");
  return idx !== -1 ? (args[idx + 1] ?? null) : null;
})();

function wavDurationFrames(filePath: string, fps: number): number {
  const buf = readFileSync(filePath);
  const byteRate = buf.readUInt32LE(28);
  const dataSize = buf.readUInt32LE(40);
  return Math.ceil((dataSize / byteRate) * fps) + 15;
}

/** Raw audio duration in seconds (no padding). */
function wavDurationSec(filePath: string): number {
  const buf = readFileSync(filePath);
  const byteRate = buf.readUInt32LE(28);
  const dataSize = buf.readUInt32LE(40);
  return dataSize / byteRate;
}

function createWavHeader(dataSize: number): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(dataSize + 36, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(BYTE_RATE, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return header;
}

function getVoice(characterId: string): string {
  const char = voiceConfig.characters[characterId];
  if (!char) throw new Error(`Unknown character "${characterId}". Available: ${Object.keys(voiceConfig.characters).join(", ")}`);

  const engine = process.platform === "darwin" ? "mlx_tts" : "gemini";
  const voice = char.voices[engine];
  if (!voice) throw new Error(`No voice defined for character "${characterId}" with engine "${engine}"`);
  return voice;
}

function generateViaMlxTts(text: string, outputPath: string, voice: string): void {
  if (!existsSync(MLX_PYTHON)) {
    throw new Error(
      `mlx_tts venv not found at ${MLX_PYTHON}\n` +
      `Setup: cd mlx_tts && python3.11 -m venv .venv && ` +
      `.venv/bin/pip install mlx-audio mlx-lm einops soundfile sounddevice`
    );
  }
  execFileSync(MLX_PYTHON, [
    "-m", "mlx_tts", "save",
    text,
    "-o", outputPath,
    "--voice", voice,
    "--speed", MLX_SPEED,
    "--lang", MLX_LANG,
  ], {
    cwd: MLX_TTS_ROOT,
    stdio: ["ignore", "inherit", "inherit"],
  });
}

async function generateViaGemini(text: string, voice: string, narratorLang: string, retries = 3): Promise<Buffer> {
  const API_KEY = process.env.GOOGLE_API_KEY;
  if (!API_KEY) {
    throw new Error("GOOGLE_API_KEY not set.");
  }
  const prompt = narratorLang === "zh-TW"
    ? `請用標準中文普通話朗讀以下內容：\n${text}`
    : `请用标准中文普通话朗读以下内容：\n${text}`;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": API_KEY },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const audioPart = data.candidates?.[0]?.content?.parts?.find(
        (p: { inlineData?: { mimeType?: string; data?: string } }) =>
          p.inlineData?.mimeType?.startsWith("audio/")
      );
      if (!audioPart?.inlineData?.data) {
        throw new Error("No audio in API response:\n" + JSON.stringify(data, null, 2));
      }
      return Buffer.from(audioPart.inlineData.data, "base64");
    }
    if (res.status === 429 && attempt < retries) {
      const body = await res.text();
      const match = body.match(/retry in ([\d.]+)s/);
      const delaySec = match ? parseFloat(match[1]) + 2 : 35;
      console.log(`  Rate limited. Waiting ${delaySec.toFixed(0)}s (attempt ${attempt + 1}/${retries})...`);
      await new Promise((r) => setTimeout(r, delaySec * 1000));
      continue;
    }
    throw new Error(`Gemini API error ${res.status}: ${await res.text()}`);
  }
  throw new Error("Max retries exceeded");
}

function concatenateWavs(segmentPaths: string[], outputPath: string): void {
  if (segmentPaths.length === 1) {
    const buf = readFileSync(segmentPaths[0]);
    writeFileSync(outputPath, buf);
    try { unlinkSync(segmentPaths[0]); } catch { /* ignore */ }
    return;
  }

  const pcmChunks: Buffer[] = [];
  let totalDataSize = 0;
  const sampleRate = SAMPLE_RATE;

  for (const p of segmentPaths) {
    const buf = readFileSync(p);
    let dataOffset = 12;
    while (dataOffset < buf.length - 8) {
      const chunkId = buf.toString('ascii', dataOffset, dataOffset + 4);
      const chunkSize = buf.readUInt32LE(dataOffset + 4);
      if (chunkId === 'data') {
        const pcmData = buf.slice(dataOffset + 8, dataOffset + 8 + chunkSize);
        pcmChunks.push(pcmData);
        totalDataSize += pcmData.length;
        break;
      }
      dataOffset += 8 + chunkSize;
    }
    try { unlinkSync(p); } catch { /* ignore */ }
  }

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(totalDataSize + 36, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(totalDataSize, 40);

  writeFileSync(outputPath, Buffer.concat([header, ...pcmChunks]));
}

async function main() {
  // Dynamically import episode-specific narration
  const narrationPath = join(APP_DIR, "scripts", "narration.ts");
  if (!existsSync(narrationPath)) {
    console.error(`ERROR: narration.ts not found at ${narrationPath}`);
    console.error(`Make sure to run this script from an episode directory.`);
    process.exit(1);
  }

  const narrationModule = await import(narrationPath);
  const { narrations, NARRATOR_LANG = voiceConfig.language } = narrationModule;

  mkdirSync(EP_AUDIO_DIR, { recursive: true });
  mkdirSync(SEGMENTS_DIR, { recursive: true });

  const useMlxTts = process.platform === "darwin";
  const engine = useMlxTts ? "mlx_tts" : "gemini";

  const filtered = sceneFilter
    ? narrations.filter((n: { scene: string }) => n.scene === sceneFilter)
    : narrations;

  if (filtered.length === 0) {
    console.error(`No scenes found${sceneFilter ? ` matching "${sceneFilter}"` : ""}.`);
    process.exit(1);
  }

  // Collect all character IDs used in this episode
  const usedChars = new Set<string>();
  for (const n of filtered) {
    for (const seg of n.segments) {
      usedChars.add(seg.character);
    }
  }

  console.log(`Backend: ${engine} (model: ${voiceConfig.engines[engine]?.model ?? voiceConfig.defaultTtsModel})`);
  console.log(`Narrator lang: ${NARRATOR_LANG}`);
  console.log(`TTS model: ${voiceConfig.defaultTtsModel}`);
  console.log(`Voice mapping (from voice-config.json):`);
  for (const charId of usedChars) {
    const char = voiceConfig.characters[charId];
    if (!char) {
      console.error(`  WARNING: character "${charId}" not found in voice-config.json`);
      continue;
    }
    const voice = char.voices[engine] || "???";
    console.log(`  ${charId} (${char.name}) → ${voice} (${char.gender}, ${char.description})`);
  }
  console.log(`\nGenerating TTS for ${filtered.length} scene(s)...\n`);

  let generated = 0;
  let skipped = 0;

  // Per-scene raw segment durations (seconds) for dialog sync
  const sceneSegmentDurations: Record<string, number[]> = {};

  for (let i = 0; i < filtered.length; i++) {
    const { scene, file, segments } = filtered[i];
    const outputPath = join(EP_AUDIO_DIR, file);

    if (skipExisting && existsSync(outputPath)) {
      console.log(`[${i + 1}/${filtered.length}] ${scene} — skipped (exists)`);
      skipped++;
      continue;
    }

    console.log(`[${i + 1}/${filtered.length}] ${scene} (${segments.length} segments)`);

    try {
      const segmentPaths: string[] = [];
      const segDurations: number[] = [];

      for (let s = 0; s < segments.length; s++) {
        const seg = segments[s];
        const voice = getVoice(seg.character);
        const segPath = join(SEGMENTS_DIR, `${scene}-${s}-${voice}.wav`);

        console.log(`  segment ${s + 1}/${segments.length}: ${seg.character} (${voice}) — "${seg.text.slice(0, 30)}..."`);

        if (useMlxTts) {
          generateViaMlxTts(seg.text, segPath, voice);
        } else {
          const pcm = await generateViaGemini(seg.text, voice, NARRATOR_LANG);
          writeFileSync(segPath, Buffer.concat([createWavHeader(pcm.length), pcm]));
        }

        segmentPaths.push(segPath);
        segDurations.push(wavDurationSec(segPath));

        if (useMlxTts && s < segments.length - 1) {
          await new Promise((r) => setTimeout(r, 1500));
        }
        if (!useMlxTts && s < segments.length - 1) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }

      concatenateWavs(segmentPaths, outputPath);
      sceneSegmentDurations[scene] = segDurations;
      console.log(`  → ${file} (${segments.length} segments concatenated)`);
      generated++;
    } catch (err) {
      console.error(`  FAILED: ${err}`);
      process.exit(1);
    }
  }

  const durationsJson = filtered.map(({ file }: { file: string }) => {
    const p = join(EP_AUDIO_DIR, file);
    return existsSync(p) ? wavDurationFrames(p, 30) : 240;
  });
  writeFileSync(join(EP_AUDIO_DIR, "durations.json"), JSON.stringify(durationsJson, null, 2) + "\n");

  // Write per-scene raw segment durations (seconds) for dialog sync
  writeFileSync(join(EP_AUDIO_DIR, "segment-durations.json"), JSON.stringify(sceneSegmentDurations, null, 2) + "\n");

  // Write voice manifest with centralized config data
  const manifest = filtered.map((n: { scene: string; file: string; segments: Array<{ character: string; text: string }> }) => ({
    scene: n.scene,
    file: n.file,
    segments: n.segments.map(s => {
      const char = voiceConfig.characters[s.character];
      return {
        character: s.character,
        voice: getVoice(s.character),
        voiceDescription: char ? {
          voice: getVoice(s.character),
          gender: char.gender,
          accent: char.description,
        } : { voice: "unknown", gender: "unknown", accent: "unknown" },
        text: s.text,
      };
    }),
  }));
  writeFileSync(join(EP_AUDIO_DIR, "voice-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  try {
    const remaining = readdirSync(SEGMENTS_DIR);
    if (remaining.length === 0) {
      unlinkSync(SEGMENTS_DIR);
    }
  } catch { /* ignore */ }

  console.log(`\nDone. Generated: ${generated}, Skipped: ${skipped}`);
  console.log(`Audio files:   ${EP_AUDIO_DIR}`);
  console.log(`Audio config:  ${EP_AUDIO_DIR}`);
  console.log(`Voice config:  ${VOICE_CONFIG_PATH}`);
  console.log(`durations.json written (reload Remotion Studio to pick up new timings)`);
}

main();
