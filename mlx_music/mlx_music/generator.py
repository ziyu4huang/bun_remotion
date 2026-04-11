"""
MLX Music Generator — wraps audiocraft_mlx MusicGen with a clean API.

Designed for M1/M2/M3/M4 Apple Silicon.
  - musicgen-small (300M):  ~1.2 GB, fastest, good quality
  - musicgen-medium (1.5B): ~3.2 GB, better quality, slower
  - musicgen-large (3.3B):  ~6.5 GB, best quality, slowest

Supports long-form generation via chunked generation + crossfade merging.
Supports compressed output formats (mp3, ogg, m4a) via ffmpeg.
"""

from __future__ import annotations

import shutil
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Optional

import mlx.core as mx
import numpy as np
import soundfile as sf

DEFAULT_MODEL = "facebook/musicgen-small"

# Max chunk duration that fits comfortably in M1 8GB RAM
CHUNK_DURATION = 8.0
# Crossfade overlap between chunks (seconds)
CROSSFADE_DURATION = 0.5

# Available MusicGen models
MODELS = {
    "small":         "facebook/musicgen-small",
    "medium":        "facebook/musicgen-medium",
    "large":         "facebook/musicgen-large",
    "stereo-small":  "facebook/musicgen-stereo-small",
    "stereo-medium": "facebook/musicgen-stereo-medium",
    "stereo-large":  "facebook/musicgen-stereo-large",
}

# Preset styles for common music types
PRESETS = {
    "lofi":       "a chill lo-fi beat with vinyl crackle and soft piano",
    "ambient":    "ambient atmospheric pad with gentle reverb",
    "orchestral": "epic orchestral cinematic soundtrack with strings and brass",
    "jazz":       "smooth jazz piano trio with brushes and upright bass",
    "rock":       "energetic rock guitar riff with drums and bass",
    "electronic": "upbeat electronic dance music with synth leads",
    "classical":  "classical piano sonata gentle and expressive",
    "hiphop":     "boom bap hip hop beat with deep bass and crisp drums",
    "acoustic":   "warm acoustic guitar fingerpicking with soft vocals",
    "cinematic":  "dramatic cinematic tension building with percussion",
}


# ------------------------------------------------------------------
# Audio utilities
# ------------------------------------------------------------------

def _crossfade(a: np.ndarray, b: np.ndarray, overlap: int) -> np.ndarray:
    """Linear crossfade between two audio arrays along last axis.

    a: [..., N]   b: [..., M]   overlap samples blended at the boundary.
    Returns [..., N + M - overlap]
    """
    if overlap <= 0:
        return np.concatenate([a, b], axis=-1)
    fade_out = np.linspace(1.0, 0.0, overlap, dtype=np.float32)
    fade_in = np.linspace(0.0, 1.0, overlap, dtype=np.float32)
    # shape: [channels, overlap] or just [overlap]
    if a.ndim == 2:
        fade_out = fade_out[np.newaxis, :]
        fade_in = fade_in[np.newaxis, :]

    tail_a = a[..., -overlap:] * fade_out
    head_b = b[..., :overlap] * fade_in
    blended = tail_a + head_b

    return np.concatenate([a[..., :-overlap], blended, b[..., overlap:]], axis=-1)


def _merge_chunks(chunks: list[np.ndarray], crossfade_samples: int) -> np.ndarray:
    """Merge a list of audio chunks with crossfading."""
    if not chunks:
        raise ValueError("No chunks to merge")
    result = chunks[0]
    for chunk in chunks[1:]:
        result = _crossfade(result, chunk, crossfade_samples)
    return result


def _has_ffmpeg() -> bool:
    return shutil.which("ffmpeg") is not None


def _convert_format(src: Path, dst: Path, bitrate: str = "128k"):
    """Convert audio file to a different format using ffmpeg."""
    cmd = [
        "ffmpeg", "-y", "-i", str(src),
        "-b:a", bitrate,
        str(dst),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr}")


# ------------------------------------------------------------------
# Generator
# ------------------------------------------------------------------

class MusicGenerator:
    """
    High-level music generator backed by MusicGen on Apple MLX.

    Supports chunked generation for long durations that exceed GPU memory.

    Usage:
        gen = MusicGenerator()

        # Short piece (single pass)
        gen.save("a chill lo-fi beat", "output.wav", duration=8)

        # Long piece (auto-chunked, crossfaded, compressed)
        gen.save("a chill lo-fi beat", "lofi_60s.mp3", duration=60)
    """

    def __init__(
        self,
        model_name: str = "small",
        verbose: bool = True,
        duration: float = 8.0,
        temperature: float = 1.0,
        top_k: int = 250,
        cfg_coef: float = 3.0,
        chunk_duration: float = CHUNK_DURATION,
        crossfade: float = CROSSFADE_DURATION,
    ):
        self.model_id = MODELS.get(model_name, model_name)
        self.verbose = verbose
        self.default_duration = duration
        self.default_temperature = temperature
        self.default_top_k = top_k
        self.default_cfg_coef = cfg_coef
        self.chunk_duration = chunk_duration
        self.crossfade = crossfade
        self._model = None
        self.sample_rate = 32000

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _load(self):
        if self._model is None:
            from audiocraft_mlx.models.musicgen import MusicGen

            if self.verbose:
                print(f"Loading model: {self.model_id}")
                print("(First run downloads model weights — subsequent runs are instant)\n")
            t0 = time.perf_counter()
            self._model = MusicGen.get_pretrained(self.model_id)
            self.sample_rate = self._model.sample_rate
            elapsed = time.perf_counter() - t0
            if self.verbose:
                print(f"Model ready in {elapsed:.1f}s  (sample_rate={self.sample_rate} Hz)\n")
        return self._model

    def _generate_chunk(
        self,
        prompt: str,
        duration: float,
        temperature: float,
        top_k: int,
        cfg_coef: float,
    ) -> np.ndarray:
        """Generate a single audio chunk. Returns audio array [channels, samples]."""
        model = self._load()
        model.set_generation_params(
            duration=duration,
            top_k=top_k,
            temperature=temperature,
            cfg_coef=cfg_coef,
        )

        audio = model.generate([prompt], progress=self.verbose)
        return np.array(audio[0])

    def _generate_long(
        self,
        prompt: str,
        duration: float,
        temperature: float,
        top_k: int,
        cfg_coef: float,
    ) -> tuple[np.ndarray, int]:
        """Generate long audio via chunked generation + crossfade merging."""
        sr = self.sample_rate
        chunk_dur = self.chunk_duration
        crossfade_samples = int(self.crossfade * sr)

        # Calculate how many chunks we need.
        # Each chunk produces chunk_dur seconds, but crossfade eats overlap.
        # effective per chunk = chunk_dur - crossfade (except the first)
        # total = chunk_dur + (n-1) * (chunk_dur - crossfade)
        # Solve: n = ceil((duration - chunk_dur) / (chunk_dur - crossfade)) + 1
        if duration <= chunk_dur:
            # No chunking needed
            return self._generate_audio(prompt, duration, temperature, top_k, cfg_coef)

        effective_per_chunk = chunk_dur - self.crossfade
        n_chunks = max(2, int(np.ceil((duration - chunk_dur) / effective_per_chunk)) + 1)

        if self.verbose:
            print(f"Chunked generation: {n_chunks} chunks x {chunk_dur:.0f}s")
            print(f"  Crossfade: {self.crossfade:.1f}s between chunks")
            print(f"  Target duration: {duration:.0f}s\n")

        chunks = []
        total_t0 = time.perf_counter()

        for i in range(n_chunks):
            if self.verbose:
                print(f"--- Chunk {i + 1}/{n_chunks} ---")
            t0 = time.perf_counter()

            wav = self._generate_chunk(prompt, chunk_dur, temperature, top_k, cfg_coef)
            chunk_dur_actual = wav.shape[-1] / sr
            chunks.append(wav)

            elapsed = time.perf_counter() - t0
            if self.verbose:
                print(f"  {chunk_dur_actual:.1f}s audio in {elapsed:.1f}s\n")

            # Free MLX cache between chunks
            mx.clear_cache()

        # Merge chunks with crossfade
        if self.verbose:
            print("Merging chunks with crossfade...")
        merged = _merge_chunks(chunks, crossfade_samples)

        # Trim to exact target duration
        target_samples = int(duration * sr)
        if merged.shape[-1] > target_samples:
            merged = merged[..., :target_samples]

        total_elapsed = time.perf_counter() - total_t0
        actual_dur = merged.shape[-1] / sr

        if self.verbose:
            speed = actual_dur / total_elapsed
            print(f"Done: {actual_dur:.1f}s merged audio in {total_elapsed:.1f}s ({speed:.2f}x realtime)\n")

        return merged, sr

    def _generate_audio(
        self,
        prompt: str,
        duration: float,
        temperature: float,
        top_k: int,
        cfg_coef: float,
    ) -> tuple[np.ndarray, int]:
        """Generate audio (single pass, no chunking). Returns (audio, sample_rate)."""
        if self.verbose:
            print(f"Generating {duration:.1f}s of music...")
            print(f"  Prompt: \"{prompt}\"")
            print(f"  temperature={temperature}, top_k={top_k}, cfg_coef={cfg_coef}")

        t0 = time.perf_counter()
        wav = self._generate_chunk(prompt, duration, temperature, top_k, cfg_coef)
        elapsed = time.perf_counter() - t0
        actual_dur = wav.shape[-1] / self.sample_rate

        if self.verbose:
            speed = actual_dur / elapsed if elapsed > 0 else 0
            print(f"Done: {actual_dur:.1f}s audio in {elapsed:.1f}s ({speed:.2f}x realtime)\n")

        return wav, self.sample_rate

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate(
        self,
        prompt: str,
        duration: Optional[float] = None,
        temperature: Optional[float] = None,
        top_k: Optional[int] = None,
        cfg_coef: Optional[float] = None,
    ) -> tuple[np.ndarray, int]:
        """
        Generate music from a text prompt.

        Automatically uses chunked generation for durations > chunk_duration.

        Returns:
            (audio_array, sample_rate) — audio shape: [channels, samples]
        """
        dur = duration or self.default_duration
        temp = temperature or self.default_temperature
        tk = top_k or self.default_top_k
        cfg = cfg_coef or self.default_cfg_coef

        if dur > self.chunk_duration:
            return self._generate_long(prompt, dur, temp, tk, cfg)
        return self._generate_audio(prompt, dur, temp, tk, cfg)

    def save(
        self,
        prompt: str,
        output_path: str | Path = "outputs/output.wav",
        duration: Optional[float] = None,
        temperature: Optional[float] = None,
        top_k: Optional[int] = None,
        cfg_coef: Optional[float] = None,
        bitrate: str = "128k",
    ) -> Path:
        """
        Generate music and save to file.

        Supports .wav, .mp3, .ogg, .m4a, .flac.
        Non-WAV formats are converted via ffmpeg (auto-detected).

        Args:
            prompt:      Text description of the music.
            output_path: Destination file path (extension determines format).
            duration:    Duration in seconds.
            temperature: Sampling temperature.
            top_k:       Top-k sampling parameter.
            cfg_coef:    Classifier-free guidance coefficient.
            bitrate:     Bitrate for lossy formats (default: "128k").

        Returns:
            Path to the saved audio file.
        """
        output_path = Path(output_path)
        ext = output_path.suffix.lower()
        if output_path.is_dir():
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            output_path = output_path / f"music_{timestamp}.wav"
            ext = ".wav"
        output_path.parent.mkdir(parents=True, exist_ok=True)

        wav, sr = self.generate(prompt, duration, temperature, top_k, cfg_coef)

        if ext == ".wav":
            sf.write(str(output_path), wav.T, sr)
        elif ext == ".flac":
            sf.write(str(output_path), wav.T, sr, format="FLAC")
        elif ext in (".mp3", ".ogg", ".m4a", ".aac"):
            # Write to temp WAV first, then convert with ffmpeg
            if not _has_ffmpeg():
                wav_path = output_path.with_suffix(".wav")
                sf.write(str(wav_path), wav.T, sr)
                print(f"WARNING: ffmpeg not found — saved as WAV: {wav_path}")
                return wav_path
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp_path = Path(tmp.name)
            try:
                sf.write(str(tmp_path), wav.T, sr)
                _convert_format(tmp_path, output_path, bitrate=bitrate)
            finally:
                tmp_path.unlink(missing_ok=True)
        else:
            # Unknown extension — save as WAV
            wav_path = output_path.with_suffix(".wav")
            sf.write(str(wav_path), wav.T, sr)
            if self.verbose:
                print(f"Unknown format '{ext}' — saved as WAV: {wav_path}")
            return wav_path

        if self.verbose:
            size_kb = output_path.stat().st_size / 1024
            print(f"Saved: {output_path} ({size_kb:.0f} KB)")

        return output_path

    def play(
        self,
        prompt: str,
        duration: Optional[float] = None,
        temperature: Optional[float] = None,
        top_k: Optional[int] = None,
        cfg_coef: Optional[float] = None,
    ):
        """Generate music and play through system speakers (blocking)."""
        import sounddevice as sd

        wav, sr = self.generate(prompt, duration, temperature, top_k, cfg_coef)
        audio_np = wav.T.astype(np.float32)

        if self.verbose:
            print("Playing audio...")
        sd.play(audio_np, samplerate=sr)
        sd.wait()

    def batch_save(
        self,
        prompts: list[str],
        output_dir: str | Path = "outputs",
        duration: Optional[float] = None,
        temperature: Optional[float] = None,
        top_k: Optional[int] = None,
        cfg_coef: Optional[float] = None,
        prefix: str = "music",
        bitrate: str = "128k",
    ) -> list[Path]:
        """
        Generate multiple music files from a list of prompts.

        Returns list of saved file paths.
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        paths = []
        for i, prompt in enumerate(prompts, start=1):
            out = output_dir / f"{prefix}_{i:03d}.mp3"
            saved = self.save(
                prompt, out,
                duration=duration, temperature=temperature,
                top_k=top_k, cfg_coef=cfg_coef, bitrate=bitrate,
            )
            paths.append(saved)
            mx.clear_cache()

        return paths

    def from_preset(
        self,
        preset: str,
        output_path: str | Path = "outputs/output.wav",
        duration: Optional[float] = None,
        bitrate: str = "128k",
    ) -> Path:
        """Generate music from a named preset (lofi, ambient, orchestral, etc.)."""
        if preset not in PRESETS:
            available = ", ".join(PRESETS.keys())
            raise ValueError(f"Unknown preset '{preset}'. Available: {available}")
        return self.save(PRESETS[preset], output_path, duration=duration, bitrate=bitrate)

    def unload(self):
        """Free the model from memory."""
        self._model = None
        mx.clear_cache()
        if self.verbose:
            print("Model unloaded.")

    @property
    def loaded(self) -> bool:
        return self._model is not None

    @property
    def model_info(self) -> dict:
        return {
            "model_id": self.model_id,
            "sample_rate": self.sample_rate,
            "default_duration": self.default_duration,
            "chunk_duration": self.chunk_duration,
            "crossfade": self.crossfade,
            "loaded": self.loaded,
        }
