/**
 * Generate TTS audio for all scenes in the Taiwan Stock Market video.
 *
 * Usage:
 *   bun run scripts/generate-tts.ts              # generate all scenes
 *   bun run scripts/generate-tts.ts --skip-existing  # skip already-generated files
 *   bun run scripts/generate-tts.ts --scene TitleScene  # generate specific scene
 *
 * Requires: GOOGLE_API_KEY environment variable
 * Output:   public/audio/*.wav
 */

import { narrations } from "./narration";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(__dirname, "..");
const AUDIO_DIR = join(APP_DIR, "public", "audio");

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error("Error: GOOGLE_API_KEY environment variable is not set.");
  console.error("Get a free key at: https://aistudio.google.com/apikey");
  process.exit(1);
}

const MODEL = "gemini-2.5-flash-preview-tts";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const VOICE = "Kore";
const SAMPLE_RATE = 24000;
const BITS_PER_SAMPLE = 16;
const NUM_CHANNELS = 1;
const BYTE_RATE = SAMPLE_RATE * NUM_CHANNELS * (BITS_PER_SAMPLE / 8);
const BLOCK_ALIGN = NUM_CHANNELS * (BITS_PER_SAMPLE / 8);

const args = process.argv.slice(2);
const skipExisting = args.includes("--skip-existing");
const sceneFilter = (() => {
  const idx = args.indexOf("--scene");
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
})();

function createWavHeader(dataSize: number): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(dataSize + 36, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(NUM_CHANNELS, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(BYTE_RATE, 28);
  header.writeUInt16LE(BLOCK_ALIGN, 32);
  header.writeUInt16LE(BITS_PER_SAMPLE, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return header;
}

async function generateTts(text: string, retries = 3): Promise<Buffer> {
  const prompt = `請用繁體中文台灣口音朗讀以下內容：\n${text}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const audioPart = data.candidates?.[0]?.content?.parts?.find(
        (p: { inlineData?: { mimeType?: string; data?: string } }) =>
          p.inlineData?.mimeType?.startsWith("audio/")
      );

      if (!audioPart?.inlineData?.data) {
        throw new Error("No audio in API response. Full response:\n" + JSON.stringify(data, null, 2));
      }

      return Buffer.from(audioPart.inlineData.data, "base64");
    }

    if (response.status === 429 && attempt < retries) {
      const body = await response.text();
      // Extract retry delay from error message
      const match = body.match(/retry in ([\d.]+)s/);
      const delaySec = match ? parseFloat(match[1]) + 2 : 35;
      console.log(`  Rate limited. Waiting ${delaySec.toFixed(0)}s before retry (${attempt + 1}/${retries})...`);
      await new Promise((r) => setTimeout(r, delaySec * 1000));
      continue;
    }

    const body = await response.text();
    throw new Error(`API error ${response.status}: ${body}`);
  }

  throw new Error("Max retries exceeded");
}

async function main() {
  if (!existsSync(AUDIO_DIR)) {
    mkdirSync(AUDIO_DIR, { recursive: true });
  }

  const filtered = sceneFilter
    ? narrations.filter((n) => n.scene === sceneFilter)
    : narrations;

  if (filtered.length === 0) {
    console.error(`No scenes found${sceneFilter ? ` matching "${sceneFilter}"` : ""}.`);
    process.exit(1);
  }

  console.log(`Generating TTS for ${filtered.length} scene(s)...`);
  if (skipExisting) console.log("  (--skip-existing: skipping already-generated files)\n");

  let generated = 0;
  let skipped = 0;

  for (let i = 0; i < filtered.length; i++) {
    const { scene, file, text } = filtered.length === 1
      ? filtered[0]
      : filtered[i];
    const outputPath = join(AUDIO_DIR, file);

    if (skipExisting && existsSync(outputPath)) {
      console.log(`[${i + 1}/${filtered.length}] ${scene} — skipped (exists)`);
      skipped++;
      continue;
    }

    console.log(`[${i + 1}/${filtered.length}] ${scene}`);
    console.log(`  Text: ${text}`);
    console.log(`  Voice: ${VOICE}`);

    try {
      const pcmData = await generateTts(text);
      const wavHeader = createWavHeader(pcmData.length);
      const wavBuffer = Buffer.concat([wavHeader, pcmData]);
      writeFileSync(outputPath, wavBuffer);

      const durationSecs = pcmData.length / BYTE_RATE;
      const sizeKB = (wavBuffer.length / 1024).toFixed(1);
      console.log(`  Output: ${file} (${sizeKB} KB, ${durationSecs.toFixed(1)}s)`);
      generated++;
    } catch (err) {
      console.error(`  FAILED: ${err}`);
      process.exit(1);
    }

    // Small delay between requests to avoid rate limiting
    if (i < filtered.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(`\nDone! Generated: ${generated}, Skipped: ${skipped}`);
  console.log(`Audio files in: ${AUDIO_DIR}`);
}

main();
