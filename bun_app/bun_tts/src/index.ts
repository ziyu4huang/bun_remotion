export { generateTTS, type TTSOptions, type TTSResult, type TTSSceneResult } from "./tts-pipeline";
export {
  wavDurationFrames,
  createWavHeader,
  concatenateWavs,
  generateViaMlxTts,
  generateViaGemini,
  SAMPLE_RATE,
  BYTE_RATE,
} from "./tts-engine";
