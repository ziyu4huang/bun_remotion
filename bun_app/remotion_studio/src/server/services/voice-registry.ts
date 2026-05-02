import type { VoiceInfo } from "../../shared/types";

const VOICES: VoiceInfo[] = [
  // MLX voices (local, requires mlx_tts venv)
  {
    id: "uncle_fu",
    name: "Uncle Fu (傅叔)",
    gender: "male",
    engine: "mlx",
    language: "zh-TW",
    description: "Male, engineering nerd tone — standard Mandarin",
  },
  {
    id: "serena",
    name: "Serena",
    gender: "female",
    engine: "mlx",
    language: "zh-TW",
    description: "Female, authoritative — standard Mandarin",
  },
  // Gemini voices (cloud, requires GOOGLE_API_KEY)
  {
    id: "Aoede",
    name: "Aoede",
    gender: "female",
    engine: "gemini",
    language: "zh-TW",
  },
  {
    id: "Charon",
    name: "Charon",
    gender: "male",
    engine: "gemini",
    language: "zh-TW",
  },
  {
    id: "Puck",
    name: "Puck",
    gender: "male",
    engine: "gemini",
    language: "zh-TW",
  },
  {
    id: "Kore",
    name: "Kore",
    gender: "female",
    engine: "gemini",
    language: "zh-TW",
  },
  {
    id: "Fenrir",
    name: "Fenrir",
    gender: "male",
    engine: "gemini",
    language: "zh-TW",
  },
  {
    id: "Leda",
    name: "Leda",
    gender: "female",
    engine: "gemini",
    language: "zh-TW",
  },
  {
    id: "Orus",
    name: "Orus",
    gender: "male",
    engine: "gemini",
    language: "zh-TW",
  },
  {
    id: "Zephyr",
    name: "Zephyr",
    gender: "female",
    engine: "gemini",
    language: "zh-TW",
  },
];

export function listVoices(engine?: "mlx" | "gemini"): VoiceInfo[] {
  if (engine) return VOICES.filter((v) => v.engine === engine);
  return [...VOICES];
}
