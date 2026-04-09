/**
 * Gemini TTS - Chinese (zh_TW) short story
 * Run: bun tests/tts_api/zh-tw-test.ts
 */
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) { console.error("GOOGLE_API_KEY not set"); process.exit(1); }

const OUTPUT_DIR = join(import.meta.dirname ?? __dirname, "output");
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

const MODEL = "gemini-2.5-flash-preview-tts";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const STORY = `從前，在一座被雲霧環繞的高山上，住著一隻名叫小橘的貓咪。小橘有一身金橘色的毛，眼睛像兩顆綠寶石。每天早晨，牠都會坐在山頂的岩石上，看著日出，聽著風聲，享受著屬於自己的寧靜時光。有一天，一隻迷路的小鳥飛到了小橘身邊。小鳥的翅膀受了傷，無法飛行。小橘決定照顧這隻小鳥，每天為牠找食物，陪牠聊天。就這樣，一貓一鳥，成為了最好的朋友。`;

const body = {
  contents: [{ role: "user", parts: [{ text: `請用繁體中文台灣口音朗讀以下故事：\n${STORY}` }] }],
  generationConfig: { responseModalities: ["AUDIO"] },
};

console.log("Generating zh_TW short story...\n");

const t0 = Date.now();
const res = await fetch(URL, {
  method: "POST",
  headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

if (!res.ok) {
  const err = await res.text();
  console.error(`Error ${res.status}: ${err}`);
  process.exit(1);
}

const data = await res.json();
const audioPart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

if (!audioPart?.inlineData) {
  console.error("No audio in response:", JSON.stringify(data, null, 2));
  process.exit(1);
}

const { mimeType, data: b64 } = audioPart.inlineData;
const pcm = Buffer.from(b64, "base64");

// Gemini returns raw PCM (24000 Hz, 16-bit, mono) — wrap with WAV RIFF header
// so it can be opened directly on Windows without FFmpeg.
function pcmToWav(pcmData: Buffer, sampleRate = 24000, channels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmData.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);           // PCM chunk size
  header.writeUInt16LE(1, 20);            // AudioFormat = PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmData.length, 40);
  return Buffer.concat([header, pcmData]);
}

const wav = pcmToWav(pcm);
const filepath = join(OUTPUT_DIR, "zh_tw_story.wav");
writeFileSync(filepath, wav);

// Also save raw PCM for reference
writeFileSync(join(OUTPUT_DIR, "zh_tw_story.pcm"), pcm);

console.log(`Saved: ${filepath} (${(wav.length / 1024).toFixed(1)}KB, ${Date.now() - t0}ms)`);
console.log(`Mime type: ${mimeType}`);
console.log("\nTo play on Windows: start " + filepath);
console.log("To play with FFmpeg: ffplay -f s16le -ar 24000 -ac 1 " + join(OUTPUT_DIR, "zh_tw_story.pcm"));
