"""
MLX TTS Generator — wraps mlx-audio Kokoro model with a clean API.

Designed for M1/M2/M3/M5 Apple Silicon.  Kokoro-82M fits in ~400 MB so it
runs comfortably even on the 8 GB M1.
"""

from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Optional

import mlx.core as mx

from mlx_audio.tts import load as load_tts
from mlx_audio.audio_io import write as audio_write

from .voices import DEFAULT_VOICE, KOKORO_VOICES

# Default model (small, high-quality, M1-safe)
DEFAULT_MODEL = "mlx-community/Kokoro-82M-bf16"


class TTSGenerator:
    """
    High-level TTS generator backed by Kokoro-82M (or any mlx-audio model).

    Usage:
        gen = TTSGenerator()           # downloads ~350 MB on first run
        gen.speak("Hello world!")      # plays through speakers
        gen.save("Hello world!", "out.wav")
    """

    def __init__(
        self,
        model_id: str = DEFAULT_MODEL,
        default_voice: str = DEFAULT_VOICE,
        default_speed: float = 1.0,
        verbose: bool = True,
    ):
        self.model_id = model_id
        self.default_voice = default_voice
        self.default_speed = default_speed
        self.verbose = verbose
        self._model = None

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _load(self):
        if self._model is None:
            if self.verbose:
                print(f"Loading model: {self.model_id}")
                print("(First run downloads ~350 MB — subsequent runs are instant)\n")
            t0 = time.perf_counter()
            self._model = load_tts(self.model_id)
            elapsed = time.perf_counter() - t0
            if self.verbose:
                print(f"Model ready in {elapsed:.1f}s\n")
        return self._model

    # Map user-friendly lang codes to Kokoro's single-char codes
    _LANG_MAP = {
        "en-us": "a",  # American English
        "en-gb": "b",  # British English
        "en":    "a",
        "a":     "a",
        "b":     "b",
    }

    def _generate_audio(
        self,
        text: str,
        voice: str,
        speed: float,
        lang_code: str = "en-us",
    ) -> tuple[mx.array, int]:
        """Return (audio_array, sample_rate) by consuming the generator."""
        model = self._load()

        # Kokoro uses single-char lang codes: "a" = American, "b" = British.
        # Auto-detect from voice prefix (bm_*/bf_* → British) unless overridden.
        if voice.startswith("b") and lang_code in ("en-us", "en", "a"):
            kokoro_lang = "b"
        else:
            kokoro_lang = self._LANG_MAP.get(lang_code, lang_code)

        t0 = time.perf_counter()
        chunks = []
        sr = model.sample_rate
        total_duration = 0.0

        for result in model.generate(text=text, voice=voice, speed=speed, lang_code=kokoro_lang):
            chunks.append(result.audio)
            sr = result.sample_rate
            total_duration += result.samples / sr
            if self.verbose:
                print(
                    f"  segment {result.segment_idx}: {result.audio_duration}  "
                    f"RTF {result.real_time_factor}x  "
                    f"peak mem {result.peak_memory_usage:.2f} GB"
                )

        elapsed = time.perf_counter() - t0
        if not chunks:
            raise RuntimeError("No audio generated — check model and voice ID.")

        audio = mx.concatenate(chunks, axis=0) if len(chunks) > 1 else chunks[0]

        if self.verbose:
            rtf = elapsed / total_duration if total_duration > 0 else 0
            print(f"Total: {total_duration:.1f}s audio in {elapsed:.2f}s (RTF {rtf:.2f}x)")

        return audio, sr

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def save(
        self,
        text: str,
        output_path: str | Path = "output.wav",
        voice: Optional[str] = None,
        speed: Optional[float] = None,
        lang_code: str = "en-us",
        audio_format: str = "wav",
    ) -> Path:
        """
        Generate speech and save to a file.

        Args:
            text:        Input text to synthesize.
            output_path: Destination file path (directory or full path).
            voice:       Kokoro voice ID (default: af_heart).
            speed:       Playback speed multiplier (default: 1.0).
            lang_code:   Language code hint for tokenizer.
            audio_format: "wav" or "flac".

        Returns:
            Path to the saved audio file.
        """
        voice = voice or self.default_voice
        speed = speed if speed is not None else self.default_speed

        output_path = Path(output_path)
        if output_path.is_dir():
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            output_path = output_path / f"tts_{timestamp}.{audio_format}"
        output_path.parent.mkdir(parents=True, exist_ok=True)

        audio, sr = self._generate_audio(text, voice, speed, lang_code)
        audio_write(str(output_path), audio, sr, format=audio_format)

        if self.verbose:
            print(f"Saved: {output_path}")

        return output_path

    def speak(
        self,
        text: str,
        voice: Optional[str] = None,
        speed: Optional[float] = None,
        lang_code: str = "en-us",
    ):
        """Generate speech and play it through system speakers (blocking)."""
        import sounddevice as sd
        import numpy as np

        voice = voice or self.default_voice
        speed = speed if speed is not None else self.default_speed

        audio, sr = self._generate_audio(text, voice, speed, lang_code)
        audio_np = np.array(audio, copy=False).flatten()

        if self.verbose:
            print("Playing audio...")
        sd.play(audio_np, samplerate=sr)
        sd.wait()

    def batch_save(
        self,
        texts: list[str],
        output_dir: str | Path = "outputs",
        voice: Optional[str] = None,
        speed: Optional[float] = None,
        lang_code: str = "en-us",
        audio_format: str = "wav",
        prefix: str = "tts",
    ) -> list[Path]:
        """
        Generate multiple audio files from a list of texts.

        Returns list of saved file paths.
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        paths = []
        for i, text in enumerate(texts, start=1):
            out = output_dir / f"{prefix}_{i:03d}.{audio_format}"
            saved = self.save(text, out, voice=voice, speed=speed, lang_code=lang_code, audio_format=audio_format)
            paths.append(saved)
            # Free MLX cache between generations to stay within 8 GB
            mx.clear_cache()

        return paths

    def unload(self):
        """Free the model from memory."""
        self._model = None
        mx.clear_cache()
        if self.verbose:
            print("Model unloaded.")

    @property
    def loaded(self) -> bool:
        return self._model is not None
