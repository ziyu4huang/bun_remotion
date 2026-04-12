#!/usr/bin/env python3
"""
TTS Quality Verifier — Round-trip check: TTS audio → STT transcription → compare with original text.

Usage:
    # Verify a single audio file against original text
    python verify_tts.py --audio output.wav --text "原始文本"

    # Verify using a durations.json + narration mapping (batch mode)
    python verify_tts.py --project bun_remotion_proj/galgame-meme-theater-ep3

    # Choose STT model
    python verify_tts.py --audio output.wav --text "你好" --model qwen3-asr
    python verify_tts.py --audio output.wav --text "你好" --model whisper

Models:
    qwen3-asr  — Qwen3-ASR-0.6B-8bit (1 GB, native CJK, default)
    whisper    — whisper-large-v3-turbo (1.6 GB, 99+ languages)
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Optional

# Add project root for imports
sys.path.insert(0, str(Path(__file__).parent))

STT_MODELS = {
    "qwen3-asr": "mlx-community/Qwen3-ASR-0.6B-8bit",
    "whisper": "mlx-community/whisper-large-v3-turbo",
}


def load_stt_model(model_key: str = "qwen3-asr", verbose: bool = True):
    """Load an STT model. Returns (model, model_id)."""
    from mlx_audio.stt import load as stt_load

    model_id = STT_MODELS[model_key]
    if verbose:
        print(f"Loading STT model: {model_id}")

    t0 = time.perf_counter()
    model = stt_load(model_id)
    elapsed = time.perf_counter() - t0
    if verbose:
        print(f"STT model ready in {elapsed:.1f}s")
    return model, model_id


def transcribe(model, audio_path: str, language: str = "zh", verbose: bool = True) -> str:
    """Transcribe audio file using loaded STT model. Returns transcribed text."""
    if verbose:
        print(f"Transcribing: {audio_path}")

    t0 = time.perf_counter()
    result = model.generate(audio_path, language=language)
    elapsed = time.perf_counter() - t0

    # result may be a string, object with .text, or list
    text = ""
    if isinstance(result, str):
        text = result
    elif isinstance(result, list):
        text = " ".join(
            r.text if hasattr(r, "text") else str(r) for r in result
        )
    elif hasattr(result, "text"):
        text = result.text
    else:
        text = str(result)

    if verbose:
        print(f"STT completed in {elapsed:.1f}s")
    return text.strip()


def text_similarity(original: str, transcribed: str) -> dict:
    """
    Compare two Chinese text strings. Returns dict with:
      - char_accuracy: percentage of correct characters
      - cer: character error rate
      - missing: chars in original but not in transcribed
      - extra: chars in transcribed but not in original
      - original_clean: normalized original
      - transcribed_clean: normalized transcribed
    """
    # Normalize: strip whitespace, punctuation normalization
    import re

    def normalize(s: str) -> str:
        s = s.strip()
        # Remove common punctuation for comparison
        s = re.sub(r'[，。！？、；：""''（）【】《》\s,.!?;:\'"()\[\]{}<>]', "", s)
        return s

    orig = normalize(original)
    trans = normalize(transcribed)

    if not orig:
        return {
            "char_accuracy": 0.0,
            "cer": 1.0,
            "missing": trans,
            "extra": "",
            "original_clean": orig,
            "transcribed_clean": trans,
            "matched": "",
            "diff": "Original text is empty",
        }

    # Simple character-level comparison using longest common subsequence
    matched = _lcs(orig, trans)
    char_accuracy = len(matched) / len(orig) * 100 if orig else 0
    cer = 1 - (len(matched) / len(orig)) if orig else 1

    # Find missing and extra characters
    missing = _chars_diff(orig, matched)
    extra = _chars_diff(trans, matched)

    # Build visual diff
    diff = _build_diff(orig, trans)

    return {
        "char_accuracy": round(char_accuracy, 1),
        "cer": round(cer, 3),
        "missing": missing,
        "extra": extra,
        "original_clean": orig,
        "transcribed_clean": trans,
        "matched": matched,
        "diff": diff,
    }


def _lcs(a: str, b: str) -> str:
    """Longest common subsequence of two strings."""
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])

    # Backtrack
    result = []
    i, j = m, n
    while i > 0 and j > 0:
        if a[i - 1] == b[j - 1]:
            result.append(a[i - 1])
            i -= 1
            j -= 1
        elif dp[i - 1][j] > dp[i][j - 1]:
            i -= 1
        else:
            j -= 1
    return "".join(reversed(result))


def _chars_diff(full: str, subset: str) -> str:
    """Return characters in `full` that are not in `subset` (order preserved)."""
    from collections import Counter

    subset_count = Counter(subset)
    diff = []
    for ch in full:
        if subset_count.get(ch, 0) > 0:
            subset_count[ch] -= 1
        else:
            diff.append(ch)
    return "".join(diff)


def _build_diff(orig: str, trans: str) -> str:
    """Build a visual diff string. + extra, - missing."""
    import difflib

    sm = difflib.SequenceMatcher(None, orig, trans)
    parts = []
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            parts.append(orig[i1:i2])
        elif op == "replace":
            parts.append(f"[-{orig[i1:i2]}→+{trans[j1:j2]}]")
        elif op == "delete":
            parts.append(f"[-{orig[i1:i2]}]")
        elif op == "insert":
            parts.append(f"[+{trans[j1:j2]}]")
    return "".join(parts)


def verify_single(
    audio_path: str,
    original_text: str,
    model_key: str = "qwen3-asr",
    language: str = "zh",
    threshold: float = 80.0,
    verbose: bool = True,
) -> dict:
    """
    Verify a single TTS audio file against original text.

    Returns dict with: audio_path, original, transcribed, similarity, passed.
    """
    model, _ = load_stt_model(model_key, verbose=verbose)
    transcribed = transcribe(model, audio_path, language=language, verbose=verbose)
    similarity = text_similarity(original_text, transcribed)

    passed = similarity["char_accuracy"] >= threshold

    return {
        "audio_path": str(audio_path),
        "original": original_text,
        "transcribed": transcribed,
        "similarity": similarity,
        "passed": passed,
    }


def verify_project(
    project_dir: str,
    model_key: str = "qwen3-asr",
    language: str = "zh",
    threshold: float = 80.0,
):
    """
    Verify all audio in a Remotion project by reading durations.json
    and matching against scene narration scripts.

    Heuristic: reads narration.ts from scripts/ to extract dialog texts,
    reads audio files from public/audio/, and cross-references.
    """
    project_path = Path(project_dir)
    audio_dir = project_path / "public" / "audio"
    durations_file = audio_dir / "durations.json"

    if not durations_file.exists():
        print(f"Error: {durations_file} not found")
        return

    if not audio_dir.exists():
        print(f"Error: {audio_dir} not found")
        return

    # Load durations to find audio files
    with open(durations_file) as f:
        durations = json.load(f)

    # Try to load narration texts
    narration_file = project_path / "scripts" / "narration.ts"
    narrations = {}
    if narration_file.exists():
        narrations = _parse_narration_ts(narration_file)

    # Find all audio files
    audio_files = sorted(audio_dir.glob("*.wav")) + sorted(audio_dir.glob("*.mp3"))

    if not audio_files:
        print("No audio files found")
        return

    print(f"\nFound {len(audio_files)} audio files in {audio_dir}")
    print(f"Found {len(narrations)} narration entries")
    print(f"STT model: {model_key}")
    print(f"Threshold: {threshold}%\n")

    # Load model once
    model, _ = load_stt_model(model_key)

    results = []
    for audio_file in audio_files:
        stem = audio_file.stem  # e.g., "scene1_narration"
        # Try to find matching narration text
        original_text = narrations.get(stem, "")

        print(f"\n--- {audio_file.name} ---")
        if original_text:
            print(f"  Original: {original_text}")
        else:
            print(f"  (No matching narration text found — transcribing only)")

        transcribed = transcribe(model, str(audio_file), language=language)

        print(f"  STT:      {transcribed}")

        if original_text:
            sim = text_similarity(original_text, transcribed)
            passed = sim["char_accuracy"] >= threshold
            status = "PASS" if passed else "FAIL"
            print(f"  Accuracy: {sim['char_accuracy']}% [{status}]")
            if not passed:
                print(f"  Diff:     {sim['diff']}")
            if sim["missing"]:
                print(f"  Missing:  {sim['missing']}")
            if sim["extra"]:
                print(f"  Extra:    {sim['extra']}")
            results.append({
                "file": audio_file.name,
                "accuracy": sim["char_accuracy"],
                "passed": passed,
            })
        else:
            print(f"  (No comparison available)")
            results.append({
                "file": audio_file.name,
                "accuracy": None,
                "passed": None,
            })

    # Summary
    verified = [r for r in results if r["accuracy"] is not None]
    failed = [r for r in verified if not r["passed"]]
    print(f"\n{'='*50}")
    print(f"Summary: {len(verified)}/{len(audio_files)} verified")
    if verified:
        avg_acc = sum(r["accuracy"] for r in verified) / len(verified)
        print(f"Average accuracy: {avg_acc:.1f}%")
    if failed:
        print(f"\nFailed ({len(failed)}):")
        for r in failed:
            print(f"  - {r['file']}: {r['accuracy']}%")


def _parse_narration_ts(path: Path) -> dict[str, str]:
    """Extract narration key→text pairs from narration.ts."""
    import re

    content = path.read_text()
    narrations = {}

    # Match patterns like: key: "text" or key: `text`
    # Also match: { text: "..." } blocks
    for m in re.finditer(r'(\w+)\s*:\s*["`\'`]([^"`\'`]+)["`\'`]', content):
        narrations[m.group(1)] = m.group(2)

    # Also try array-of-objects pattern: { text: "..." }
    for m in re.finditer(r'text\s*:\s*["`\'`](.+?)["`\'`]', content):
        # Use index-based keys
        idx = len(narrations)
        narrations[f"narration_{idx}"] = m.group(1)

    return narrations


def main():
    parser = argparse.ArgumentParser(
        description="TTS Quality Verifier — round-trip audio check via STT"
    )
    parser.add_argument(
        "--audio",
        help="Path to audio file (WAV/MP3) to verify",
    )
    parser.add_argument(
        "--text",
        help="Original text that was synthesized into the audio",
    )
    parser.add_argument(
        "--project",
        help="Remotion project directory for batch verification",
    )
    parser.add_argument(
        "--model",
        choices=list(STT_MODELS.keys()),
        default="qwen3-asr",
        help="STT model to use (default: qwen3-asr)",
    )
    parser.add_argument(
        "--language",
        default="zh",
        help="Language code for STT (default: zh)",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=80.0,
        help="Pass threshold in %% accuracy (default: 80)",
    )

    args = parser.parse_args()

    if args.project:
        verify_project(
            args.project,
            model_key=args.model,
            language=args.language,
            threshold=args.threshold,
        )
    elif args.audio and args.text:
        result = verify_single(
            args.audio,
            args.text,
            model_key=args.model,
            language=args.language,
            threshold=args.threshold,
        )
        sim = result["similarity"]
        status = "PASS" if result["passed"] else "FAIL"

        print(f"\n{'='*50}")
        print(f"Original:    {result['original']}")
        print(f"Transcribed: {result['transcribed']}")
        print(f"Accuracy:    {sim['char_accuracy']}% [{status}]")
        print(f"CER:         {sim['cer']}")
        print(f"Diff:        {sim['diff']}")
        if sim["missing"]:
            print(f"Missing:     {sim['missing']}")
        if sim["extra"]:
            print(f"Extra:       {sim['extra']}")

        if not result["passed"]:
            print(f"\nBelow {args.threshold}% threshold!")
            sys.exit(1)
    else:
        parser.print_help()
        print("\nExamples:")
        print('  python verify_tts.py --audio output.wav --text "你好世界"')
        print("  python verify_tts.py --project ../bun_remotion_proj/galgame-meme-theater-ep3")
        print("  python verify_tts.py --audio output.wav --text 'hello' --model whisper --language en")
        sys.exit(1)


if __name__ == "__main__":
    main()
