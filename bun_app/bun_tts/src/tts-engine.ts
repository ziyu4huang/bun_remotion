import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";

export const SAMPLE_RATE = 24000;
export const BYTE_RATE = SAMPLE_RATE * 2;

export function wavDurationFrames(filePath: string, fps: number): number {
  const buf = readFileSync(filePath);
  const byteRate = buf.readUInt32LE(28);
  const dataSize = buf.readUInt32LE(40);
  return Math.ceil((dataSize / byteRate) * fps) + 15;
}

export function createWavHeader(dataSize: number): Buffer {
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

export function concatenateWavs(segmentPaths: string[], outputPath: string): void {
  if (segmentPaths.length === 1) {
    const buf = readFileSync(segmentPaths[0]);
    writeFileSync(outputPath, buf);
    return;
  }

  const pcmChunks: Buffer[] = [];
  let totalDataSize = 0;

  for (const p of segmentPaths) {
    const buf = readFileSync(p);
    let dataOffset = 12;
    while (dataOffset < buf.length - 8) {
      const chunkId = buf.toString("ascii", dataOffset, dataOffset + 4);
      const chunkSize = buf.readUInt32LE(dataOffset + 4);
      if (chunkId === "data") {
        const pcmData = buf.slice(dataOffset + 8, dataOffset + 8 + chunkSize);
        pcmChunks.push(pcmData);
        totalDataSize += pcmData.length;
        break;
      }
      dataOffset += 8 + chunkSize;
    }
  }

  writeFileSync(outputPath, Buffer.concat([createWavHeader(totalDataSize), ...pcmChunks]));
}

export interface MlxTtsOptions {
  mlxRoot: string;
  speed?: string;
  lang?: string;
}

export function generateViaMlxTts(
  text: string,
  outputPath: string,
  voice: string,
  opts: MlxTtsOptions,
): void {
  const python = join(opts.mlxRoot, ".venv", "bin", "python");
  if (!existsSync(python)) {
    throw new Error(
      `mlx_tts venv not found at ${python}\nSetup: cd mlx_tts && python3.11 -m venv .venv && .venv/bin/pip install mlx-audio mlx-lm einops soundfile sounddevice`,
    );
  }
  execFileSync(
    python,
    ["-m", "mlx_tts", "save", text, "-o", outputPath, "--voice", voice, "--speed", opts.speed ?? "0.97", "--lang", opts.lang ?? "zh"],
    { cwd: opts.mlxRoot, stdio: ["ignore", "pipe", "pipe"] },
  );
}

const GEMINI_MODEL = "gemini-2.5-flash-preview-tts";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function generateViaGemini(
  text: string,
  voice: string,
  narratorLang: string,
  retries = 3,
): Promise<Buffer> {
  const API_KEY = process.env.GOOGLE_API_KEY;
  if (!API_KEY) throw new Error("GOOGLE_API_KEY not set.");

  const prompt =
    narratorLang === "zh-TW"
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
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const audioPart = data.candidates?.[0]?.content?.parts?.find(
        (p: { inlineData?: { mimeType?: string; data?: string } }) => p.inlineData?.mimeType?.startsWith("audio/"),
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
      await new Promise((r) => setTimeout(r, delaySec * 1000));
      continue;
    }

    throw new Error(`Gemini API error ${res.status}: ${await res.text()}`);
  }
  throw new Error("Max retries exceeded");
}
