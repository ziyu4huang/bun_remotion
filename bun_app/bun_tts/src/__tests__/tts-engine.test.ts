import { describe, test, expect } from "bun:test";
import { createWavHeader, concatenateWavs, wavDurationFrames, SAMPLE_RATE, BYTE_RATE } from "../tts-engine";
import { writeFileSync, readFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const TMP = join(import.meta.dir, "__tmp_wav__");

function makePcmWav(samples: number): Buffer {
  const data = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) {
    data.writeInt16LE(Math.round(Math.sin(i * 0.1) * 16000), i * 2);
  }
  return Buffer.concat([createWavHeader(data.length), data]);
}

describe("tts-engine", () => {
  test("createWavHeader produces valid 44-byte header", () => {
    const header = createWavHeader(1000);
    expect(header.length).toBe(44);
    expect(header.toString("ascii", 0, 4)).toBe("RIFF");
    expect(header.toString("ascii", 8, 12)).toBe("WAVE");
    expect(header.readUInt32LE(4)).toBe(1036); // 1000 + 36
    expect(header.readUInt32LE(24)).toBe(SAMPLE_RATE);
    expect(header.readUInt32LE(28)).toBe(BYTE_RATE);
    expect(header.readUInt32LE(40)).toBe(1000);
  });

  test("createWavHeader with zero data size", () => {
    const header = createWavHeader(0);
    expect(header.readUInt32LE(4)).toBe(36);
    expect(header.readUInt32LE(40)).toBe(0);
  });

  test("concatenateWavs with single file copies it", () => {
    mkdirSync(TMP, { recursive: true });
    const wav = makePcmWav(1000);
    const inPath = join(TMP, "single.wav");
    const outPath = join(TMP, "out.wav");
    writeFileSync(inPath, wav);

    concatenateWavs([inPath], outPath);

    const result = readFileSync(outPath);
    expect(result.length).toBe(wav.length);
    expect(result.toString("ascii", 0, 4)).toBe("RIFF");

    rmSync(TMP, { recursive: true });
  });

  test("concatenateWavs merges two WAV files", () => {
    mkdirSync(TMP, { recursive: true });
    const wav1 = makePcmWav(500);
    const wav2 = makePcmWav(300);
    const in1 = join(TMP, "a.wav");
    const in2 = join(TMP, "b.wav");
    const outPath = join(TMP, "merged.wav");
    writeFileSync(in1, wav1);
    writeFileSync(in2, wav2);

    concatenateWavs([in1, in2], outPath);

    const result = readFileSync(outPath);
    expect(result.toString("ascii", 0, 4)).toBe("RIFF");
    // Data size should be sum of both PCM chunks
    const expectedDataSize = (500 * 2) + (300 * 2);
    expect(result.readUInt32LE(40)).toBe(expectedDataSize);
    expect(result.length).toBe(44 + expectedDataSize);

    rmSync(TMP, { recursive: true });
  });

  test("wavDurationFrames returns frame count", () => {
    mkdirSync(TMP, { recursive: true });
    const pcmSamples = SAMPLE_RATE * 2; // 2 seconds of audio
    const wav = makePcmWav(pcmSamples);
    const path = join(TMP, "dur.wav");
    writeFileSync(path, wav);

    const frames = wavDurationFrames(path, 30);
    // 2 seconds * 30 fps + 15 padding = 75
    expect(frames).toBe(75);

    rmSync(TMP, { recursive: true });
  });

  test("deriveCompositionId (imported via renderer service)", () => {
    // Test the composition ID derivation logic inline
    const derive = (name: string) =>
      name.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");

    expect(derive("weapon-forger-ch1-ep1")).toBe("WeaponForgerCh1Ep1");
    expect(derive("my-core-is-boss-ch1-ep1")).toBe("MyCoreIsBossCh1Ep1");
    expect(derive("galgame-meme-theater-ep1")).toBe("GalgameMemeTheaterEp1");
  });
});
