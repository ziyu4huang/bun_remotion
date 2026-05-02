import { describe, test, expect } from "bun:test";
import { listVoices } from "../server/services/voice-registry";

describe("voice-registry", () => {
  test("listVoices returns all voices", () => {
    const voices = listVoices();
    expect(voices.length).toBeGreaterThanOrEqual(8);
    for (const v of voices) {
      expect(v.id).toBeTruthy();
      expect(v.name).toBeTruthy();
      expect(["male", "female"]).toContain(v.gender);
      expect(["mlx", "gemini"]).toContain(v.engine);
      expect(v.language).toBe("zh-TW");
    }
  });

  test("listVoices filters by engine", () => {
    const mlx = listVoices("mlx");
    const gemini = listVoices("gemini");
    expect(mlx.length).toBe(2);
    expect(gemini.length).toBeGreaterThanOrEqual(6);
    expect(mlx.every((v) => v.engine === "mlx")).toBe(true);
    expect(gemini.every((v) => v.engine === "gemini")).toBe(true);
  });

  test("MLX voices have descriptions", () => {
    const mlx = listVoices("mlx");
    for (const v of mlx) {
      expect(v.description).toBeTruthy();
    }
  });

  test("uncle_fu is male, serena is female", () => {
    const voices = listVoices();
    const uncleFu = voices.find((v) => v.id === "uncle_fu");
    const serena = voices.find((v) => v.id === "serena");
    expect(uncleFu?.gender).toBe("male");
    expect(serena?.gender).toBe("female");
  });

  test("returns a copy (not mutable)", () => {
    const a = listVoices();
    const b = listVoices();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});
