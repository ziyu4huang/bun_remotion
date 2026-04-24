import { writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import {
  wavDurationFrames,
  createWavHeader,
  concatenateWavs,
  generateViaMlxTts,
  generateViaGemini,
} from "./tts-engine";

export interface TTSOptions {
  episodePath: string;
  repoRoot: string;
  sceneFilter?: string;
  skipExisting?: boolean;
  engine?: "mlx" | "gemini";
  onProgress?: (message: string) => void;
}

export interface TTSSceneResult {
  scene: string;
  file: string;
  segmentCount: number;
  durationFrames: number;
}

export interface TTSResult {
  generated: number;
  skipped: number;
  scenes: TTSSceneResult[];
  audioDir: string;
}

interface NarrationSegment {
  character: string;
  text: string;
}

interface NarrationScript {
  scene: string;
  file: string;
  segments: NarrationSegment[];
  fullText: string;
}

export async function generateTTS(options: TTSOptions): Promise<TTSResult> {
  const { episodePath, repoRoot, sceneFilter, skipExisting, engine, onProgress } = options;

  const narrationPath = join(episodePath, "scripts", "narration.ts");
  if (!existsSync(narrationPath)) {
    throw new Error(`narration.ts not found at ${narrationPath}`);
  }

  const narrationModule = await import(narrationPath);
  const { narrations, VOICE_MAP, VOICE_DESCRIPTION, NARRATOR_LANG = "zh-CN" } = narrationModule;
  type VoiceCharacter = keyof typeof VOICE_MAP;

  const audioDir = join(episodePath, "public", "audio");
  const segmentsDir = join(audioDir, "_segments");
  mkdirSync(audioDir, { recursive: true });
  mkdirSync(segmentsDir, { recursive: true });

  const useMlx = (engine ?? (process.platform === "darwin" ? "mlx" : "gemini")) === "mlx";
  const log = onProgress ?? (() => {});

  const filtered = sceneFilter
    ? narrations.filter((n: NarrationScript) => n.scene === sceneFilter)
    : narrations;

  if (filtered.length === 0) {
    throw new Error(`No scenes found${sceneFilter ? ` matching "${sceneFilter}"` : ""}`);
  }

  log(`Backend: ${useMlx ? "mlx_tts" : "Gemini TTS"} | ${filtered.length} scene(s)`);

  let generated = 0;
  let skipped = 0;
  const sceneResults: TTSSceneResult[] = [];
  const sceneSegmentDurations: Array<{ scene: string; file: string; segmentDurations: number[] }> = [];

  for (let i = 0; i < filtered.length; i++) {
    const { scene, file, segments }: NarrationScript = filtered[i];
    const outputPath = join(audioDir, file);

    if (skipExisting && existsSync(outputPath)) {
      log(`[${i + 1}/${filtered.length}] ${scene} — skipped`);
      skipped++;
      continue;
    }

    log(`[${i + 1}/${filtered.length}] ${scene} (${segments.length} segments)`);
    const segmentPaths: string[] = [];
    const segmentDurations: number[] = [];

    for (let s = 0; s < segments.length; s++) {
      const seg = segments[s];
      const voice = VOICE_MAP[seg.character as VoiceCharacter];
      const segPath = join(segmentsDir, `${scene}-${s}-${voice}.wav`);

      if (useMlx) {
        generateViaMlxTts(seg.text, segPath, voice, { mlxRoot: join(repoRoot, "mlx_tts") });
      } else {
        const pcm = await generateViaGemini(seg.text, voice, NARRATOR_LANG);
        writeFileSync(segPath, Buffer.concat([createWavHeader(pcm.length), pcm]));
      }

      segmentPaths.push(segPath);
      segmentDurations.push(wavDurationFrames(segPath, 30));

      // Throttle between segments
      if (s < segments.length - 1) {
        await new Promise((r) => setTimeout(r, useMlx ? 1500 : 2000));
      }
    }

    concatenateWavs(segmentPaths, outputPath);
    generated++;
    sceneSegmentDurations.push({ scene, file, segmentDurations });

    const durationFrames = wavDurationFrames(outputPath, 30);
    sceneResults.push({ scene, file, segmentCount: segments.length, durationFrames });
  }

  // Write metadata files
  const durationsJson = filtered.map(({ file }: NarrationScript) => {
    const p = join(audioDir, file);
    return existsSync(p) ? wavDurationFrames(p, 30) : 240;
  });
  writeFileSync(join(audioDir, "durations.json"), JSON.stringify(durationsJson, null, 2) + "\n");
  writeFileSync(join(audioDir, "segment-durations.json"), JSON.stringify(sceneSegmentDurations, null, 2) + "\n");

  const manifest = filtered.map((n: NarrationScript) => ({
    scene: n.scene,
    file: n.file,
    segments: n.segments.map((s: NarrationSegment) => ({
      character: s.character,
      voice: VOICE_MAP[s.character as VoiceCharacter],
      voiceDescription: VOICE_DESCRIPTION?.[s.character as VoiceCharacter],
      text: s.text,
    })),
  }));
  writeFileSync(join(audioDir, "voice-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  // Clean up segments dir if empty
  try {
    const remaining = readdirSync(segmentsDir);
    if (remaining.length === 0) unlinkSync(segmentsDir);
  } catch { /* ignore */ }

  log(`Done. Generated: ${generated}, Skipped: ${skipped}`);
  return { generated, skipped, scenes: sceneResults, audioDir };
}
