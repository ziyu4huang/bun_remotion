"""
story-to-voice: Convert plain text stories into Story Studio JSON projects.

Usage:
    cd mlx_tts
    python story_to_voice.py story.txt
    python story_to_voice.py story.txt -o my_story.story.json --lang en

Pipeline:
    story.txt → .story.json → Import in Story Studio GUI → Produce → FLAC/WAV
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path
from typing import Optional

# ── Voice assignment tables ────────────────────────────────────────────────────

NARRATOR_VOICE = "bm_george"
NARRATOR_LANG = "en-gb"

# Voices assigned to speaking characters in order of appearance
MALE_VOICES = ["am_adam", "am_michael", "am_echo", "am_liam", "bm_lewis", "bm_daniel"]
FEMALE_VOICES = ["af_heart", "af_sarah", "af_bella", "af_sky", "bf_emma", "bf_isabella"]

# ── Emotion heuristics ─────────────────────────────────────────────────────────

URGENCY_WORDS = {"lost", "emergency", "warning", "danger", "help", "hurry", "quick",
                 "screamed", "burned", "crackled", "storm", "fog"}
CALM_WORDS = {"safe", "calm", "quiet", "peaceful", "silence", "still", "gentle",
              "cup of tea", "sat", "sitting", "relief", "finally"}
SAD_WORDS = {"alone", "shaking", "cold", "dark", "empty", "gone", "lost", "died",
             "never", "last", "final"}


def _guess_emotion(text: str, is_dialogue: bool, is_short: bool) -> str:
    """Heuristic emotion assignment based on text content."""
    lower = text.lower()

    if is_dialogue:
        # Questions → serious
        if "?" in text:
            return "serious"
        # Exclamations → excited or serious
        if text.count("!") >= 2:
            return "excited"
        if "!" in text:
            return "serious"
        # Short dialogue → whispery or calm
        if is_short:
            return "whispery"
        return "calm"

    # Narration
    if any(w in lower for w in URGENCY_WORDS):
        return "serious"
    if any(w in lower for w in SAD_WORDS):
        return "calm"
    if is_short:
        return "serious"
    return "storytelling"


def _guess_speed(emotion: str, is_short: bool) -> float:
    """Speed multiplier based on emotion and segment length."""
    base = {
        "storytelling": 0.97,
        "serious": 0.95,
        "calm": 0.92,
        "whispery": 0.88,
        "excited": 1.05,
        "sad": 0.88,
        "happy": 1.0,
        "neutral": 1.0,
    }
    s = base.get(emotion, 1.0)
    if is_short and emotion in ("serious", "calm", "whispery"):
        s -= 0.05
    return max(0.5, round(s, 2))


# ── Text parsing ───────────────────────────────────────────────────────────────

# Matches quoted dialogue: "text" or 「text」
DIALOGUE_RE = re.compile(r'\u201c([^\u201d]*)\u201d|"([^"]*)"|\u300c([^\u300d]*)\u300d')

SPEECH_VERBS = (
    "said|replied|whispered|shouted|called|asked|answered|murmured|"
    "cried|exclaimed|added|continued|snapped|barked|growled|offered|"
    "remarked|stated|declared|told|noted|observed|called out|yelled|"
    "寫道|說道|笑著說|問道|答道|嘆道|叫道|喊道|說|問|答|嘆|叫|喊"
)

# Chinese attribution: 「text，」他說 / 「text，」她說 / 「text，」Name說
ZH_ATTRIBUTION_RE = re.compile(
    r'^(?:他|她|它)(?:在[^的]*的?(?:信|書|紙|日記)[中裡]?|(?:笑|嘆|輕|低|大|急)著?)?(?:寫道|說道|問道|答道|說|問|答|嘆|喊)'
)
# Chinese name + speech verb: Name + 說/問 (NOT starting with pronouns or punctuation)
# Names are 2-3 chars max (surname + 1-2 given name chars)
ZH_NAME_ATTRIBUTION_RE = re.compile(
    r'^([\u4e00-\u9fff]{2,3})(?:笑著|輕聲|低聲|大聲|急著)?(?:寫道|說道|問道|答道|說|問|答)'
)

# Post-dialogue attribution: "text," the Name said / "text," Name said
POST_ATTRIBUTION_RE = re.compile(
    r'^(?:the\s+)?([A-Z][a-zA-Z]+)(?:\s+(?:' + SPEECH_VERBS + r'))',
)
# Pre-dialogue attribution: Name said, "text"
PRE_ATTRIBUTION_RE = re.compile(
    r'([A-Z][a-zA-Z]+)\s+(?:' + SPEECH_VERBS + r')[,:]\s*$'
)

# Words that are NOT character names
NON_NAMES = frozenset({
    "The", "A", "An", "But", "And", "Or", "So", "He", "She", "It", "They",
    "We", "His", "Her", "Its", "Their", "This", "That", "There", "Then",
    "At", "In", "On", "When", "After", "Before", "Every", "His", "What",
    "How", "Why", "Where", "Who", "Which", "No", "Not", "Yes", "Just",
    "Only", "Even", "Still", "Already", "Never", "Always", "Now", "Here",
})


def _is_attribution_only(text: str) -> bool:
    """Check if a narration fragment is just speaker attribution."""
    stripped = text.strip().rstrip(".")

    # English: "the captain said" / "Daniel said softly"
    if re.match(
        rf'^(?:the\s+)?[A-Za-z][a-zA-Z]+\s+(?:{SPEECH_VERBS})(?:\s+(?:softly|loudly|quietly|calmly|gently|slowly|quickly|urgently))?$',
        stripped,
    ):
        return True

    # Chinese: 他說 / 她說 / 陳懷遠說 / 書店老闆笑著說
    if ZH_ATTRIBUTION_RE.match(stripped):
        return True
    if ZH_NAME_ATTRIBUTION_RE.match(stripped):
        return True

    return False


def _extract_name_from_attribution(text: str, last_narration: str = "") -> Optional[str]:
    """Extract a character name from an attribution fragment.

    Handles "Daniel said", "the captain said", and Chinese patterns.
    """
    stripped = text.strip().rstrip(".")

    # English: "the captain said" → return Title-cased name
    m = re.match(rf'^the\s+([a-z][a-zA-Z]+)\s+(?:{SPEECH_VERBS})', stripped)
    if m:
        return m.group(1).capitalize()

    # English: "Daniel said"
    m = re.match(rf'^([A-Z][a-zA-Z]+)', stripped)
    if m and m.group(1) not in NON_NAMES:
        return m.group(1)

    # Chinese: 他說 → look at last narration for male name
    if re.match(r'^他(?:在[^的]*的?(?:信|書)[中裡]?)?(?:寫道|說道|說)', stripped):
        return _find_last_name(last_narration, gender="male")

    # Chinese: 她說 → look at last narration for female name
    if re.match(r'^她(?:輕聲|低聲)?(?:說道|說|問)', stripped):
        return _find_last_name(last_narration, gender="female")

    # Chinese: Name + 說 (e.g., 書店老闆笑著說)
    m = ZH_NAME_ATTRIBUTION_RE.match(stripped)
    if m:
        return m.group(1)

    return None


# Common Chinese surnames for name boundary detection
ZH_SURNAMES = set(
    "陳林王張李劉趙黃周吳徐孫胡朱高何郭馬羅梁宋鄭謝韓唐馮于董蕭程曹袁鄧許"
    "傅沈曾彭呂蘇盧蔣蔡賈丁魏薛葉閻余潘杜戴夏鍾汪田任姜方石姚譚廖鄒熊金"
    "陸郝孔白崔康毛邱秦江史顧侯邵孟龍萬段雷錢湯尹黎易常武喬賀賴龔文"
)


def _extract_zh_names(text: str) -> list[str]:
    """Extract Chinese names from text using surname boundary detection.

    Uses a whitelist of 2-char names for accuracy. Falls back to
    boundary-based detection for unknown names.
    """
    # ── Hard-coded common names from this story series ──
    # This avoids mis-parsing names in running text
    KNOWN_NAMES = {"全叔", "張哲", "阿娥", "林秀蓮", "陳太太", "老王", "許文琪",
                   "老張", "阿公", "小哲", "秀蓮", "阿嬤"}

    names = []
    # First pass: find exact known names
    for name in KNOWN_NAMES:
        if name in text:
            names.append(name)

    if names:
        return names

    # Fallback: boundary-based detection for unknown names
    # Characters that can follow a name (word boundaries)
    BOUNDARY = set(
        "的說問答站坐走跑看望握拿蹲修寄去在笑嘆低大急著是了過來到被把讓給也與和及"
        "，。！？、：；「」『』（）—…\n "
        "就走站坐看聽說問想記發買賣帶幫叫送收打吃煮炒切洗會能要"
        "這那裡外前後上下中旁邊側"
        "回放下轉拿起走跑站坐看聽說寫讀想記打開關推拉提背端拿"
    )
    for m in re.finditer(r'[\u4e00-\u9fff]+', text):
        chunk = m.group(0)
        for i, ch in enumerate(chunk):
            if ch in ZH_SURNAMES and i + 1 < len(chunk):
                # Try 2-char name first (most common)
                name_2 = chunk[i:i+2]
                after_2 = chunk[i+2] if i+2 < len(chunk) else ""
                if not after_2 or after_2 in BOUNDARY:
                    names.append(name_2)
                    break
                # Try 3-char name
                name_3 = chunk[i:i+3]
                after_3 = chunk[i+3] if i+3 < len(chunk) else ""
                if not after_3 or after_3 in BOUNDARY:
                    names.append(name_3)
                    break
    return names


def _find_last_name(narration: str, gender: str = None):
    """Find the most recently mentioned Chinese name in narration text."""
    if not narration:
        return None
    names = _extract_zh_names(narration)
    if not names:
        return None
    return names[-1]


def _extract_dialogue_segments(paragraph: str) -> list[tuple[str, bool, bool]]:
    """Split a paragraph into (text, is_dialogue, is_attribution) tuples.

    Returns alternating narration and dialogue chunks.
    Third element indicates if this trailing narration is just attribution.
    """
    parts: list[tuple[str, bool, bool]] = []
    last_end = 0

    for m in DIALOGUE_RE.finditer(paragraph):
        # Narration before this dialogue
        narration = paragraph[last_end:m.start()].strip()
        # Strip trailing attribution connector like "Name said:" or "—" or "："
        narration = re.sub(r'[:,：，—–-]\s*$', '', narration).strip()

        if narration:
            # Check if inter-dialogue narration is just attribution
            is_attr = _is_attribution_only(narration)
            parts.append((narration, False, is_attr))

        # The dialogue text (group 1=curly "", group 2=straight "", group 3=「」)
        dialogue = (m.group(1) or m.group(2) or m.group(3) or "").strip()
        # Strip trailing comma/semicolon (from patterns like "text," he said or 「text，」他說)
        dialogue = dialogue.rstrip(",;，；")
        if dialogue:
            parts.append((dialogue, True, False))

        last_end = m.end()

    # Trailing narration — check if it's just attribution
    trailing = paragraph[last_end:].strip()
    if trailing:
        is_attr = _is_attribution_only(trailing)
        parts.append((trailing, False, is_attr))

    return parts


def _detect_speaker(text_before: str, text_after: str, text_after_is_attr: bool,
                    last_speaker: str, last_last_speaker: str,
                    prev_narration: str, known_chars: set[str]) -> str:
    """Identify the speaker for a dialogue segment.

    Uses attribution patterns, context from surrounding narration, and
    conversation turn-taking as fallback.
    """
    # 1. Post-attribution: "text," the Name said / the captain said / 他說
    if text_after:
        name = _extract_name_from_attribution(text_after, prev_narration)
        if name:
            return name

    # 2. Pre-attribution: Name said, "text" or Name grabbed... "text"
    if text_before:
        m = PRE_ATTRIBUTION_RE.search(text_before)
        if m:
            return m.group(1)
        # Name at start of narration before dialogue
        m = re.match(r'^([A-Z][a-zA-Z]+)\s', text_before)
        if m and m.group(1) not in NON_NAMES:
            return m.group(1)
        # Chinese: Name + 說/笑著說 before 「 (name must be at start of sentence)
        m = re.match(r'^([\u4e00-\u9fff][\u4e00-\u9fff]{1,2})(?:笑著|輕聲|低聲|大聲|急著)?(?:寫道|說道|問道|答道|說|問)[：:]?$', text_before)
        if m:
            return m.group(1)
        # Chinese: look for name at start of narration (「妳不能去，」他說 → 他 in between)
        # Actually this is handled by the attribution check above

    # 3. Check preceding narration for character mention
    #    "Daniel looked up and gave the only reply..." → Daniel is about to speak
    if prev_narration:
        for name in known_chars:
            if name == "Narrator" or name.startswith("Speaker "):
                continue
            if name in prev_narration:
                return name

    # 4. Conversation turn-taking: alternate between last two speakers
    if last_speaker and last_last_speaker and last_speaker != last_last_speaker:
        return last_last_speaker

    return last_speaker


# ── Character voice assignment ─────────────────────────────────────────────────

class VoiceAssigner:
    """Assign unique voices to characters in order of first dialogue."""

    def __init__(self, male_voices: list[str] = None, female_voices: list[str] = None,
                 initial: dict[str, str] = None):
        self._char_voice: dict[str, str] = dict(initial) if initial else {}
        self._male = male_voices or MALE_VOICES
        self._female = female_voices or FEMALE_VOICES
        self._idx = len(self._char_voice)

    def assign(self, character: str) -> str:
        if character in self._char_voice:
            return self._char_voice[character]

        voice = self._male[self._idx % len(self._male)]
        self._idx += 1
        self._char_voice[character] = voice
        return voice


# ── Main parser ────────────────────────────────────────────────────────────────

def parse_story(text: str, lang: str = "en", source_file: str = "",
                initial_voices: dict[str, str] = None) -> dict:
    """Parse plain text story into Story Studio JSON project.

    Args:
        initial_voices: Pre-seeded character→voice mapping (e.g. from book.json).
                        Characters already in this dict keep their assigned voice.
    """
    lines = text.split("\n")

    # Extract title from first non-empty line
    title = "Untitled Story"
    body_start = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped and not stripped.startswith('"') and not stripped.startswith("\u201c"):
            title = stripped
            body_start = i + 1
            break
        elif stripped:
            # First line is dialogue — no title
            body_start = i
            break

    # Split remaining text into paragraphs (separated by blank lines)
    paragraphs: list[str] = []
    current: list[str] = []
    for line in lines[body_start:]:
        stripped = line.strip()
        if stripped:
            current.append(stripped)
        else:
            if current:
                paragraphs.append(" ".join(current))
                current = []
    if current:
        paragraphs.append(" ".join(current))

    # Parse each paragraph into segments
    # Language-aware voice pools
    if lang == "zh":
        _male = ["zm_yunjian", "zm_yunxi"]
        _female = ["zf_xiaobei", "zf_xiaoni"]
    elif lang == "ja":
        _male = ["jm_kumo"]
        _female = ["jf_alpha", "jf_gongitsune"]
    else:
        _male = MALE_VOICES
        _female = FEMALE_VOICES

    # Pre-seed voices from book.json (exclude Narrator — handled separately)
    seed = {k: v for k, v in (initial_voices or {}).items() if k != "Narrator"} if initial_voices else None
    assigner = VoiceAssigner(_male, _female, initial=seed)
    segments: list[dict] = []
    seg_counter = 0
    last_speaker = ""       # most recent dialogue speaker
    prev_speaker = ""       # speaker before last (for turn-taking)
    speaker_counter = 0    # for generating fallback names
    last_narration = ""    # text of most recent narration segment
    known_chars: set[str] = set(seed.keys()) if seed else set()

    # Language-aware narrator voice
    narr_voice, narr_lang = _narrator_for_lang(lang)

    for para in paragraphs:
        parts = _extract_dialogue_segments(para)

        # If no dialogue found, it's pure narration
        if not parts:
            last_narration = para
            seg_counter += 1
            is_short = len(para) < 60
            emotion = _guess_emotion(para, False, is_short)
            segments.append(_make_segment(
                seg_counter, "Narrator", para, narr_voice,
                narr_lang, emotion, _guess_speed(emotion, is_short),
            ))
            continue

        # If the paragraph is entirely one dialogue quote
        if len(parts) == 1 and parts[0][1]:
            text, _, _ = parts[0]
            speaker = _detect_speaker("", "", False, last_speaker, prev_speaker, last_narration, known_chars)
            if not speaker:
                speaker_counter += 1
                speaker = f"Speaker {speaker_counter}"
            known_chars.add(speaker)
            seg_counter += 1
            is_short = len(text) < 60
            emotion = _guess_emotion(text, True, is_short)
            prev_speaker, last_speaker = last_speaker, speaker
            segments.append(_make_segment(
                seg_counter, speaker, text, assigner.assign(speaker),
                _char_lang(lang), emotion, _guess_speed(emotion, is_short),
            ))
            last_narration = ""
            continue

        # Mixed paragraph — process each part
        for j, (text, is_dialogue, is_attribution) in enumerate(parts):
            if not text.strip():
                continue

            # Skip attribution-only fragments ("the captain said." / 他說)
            if is_attribution:
                name = _extract_name_from_attribution(text, last_narration)
                if name:
                    if segments and segments[-1]["character"].startswith("Speaker "):
                        segments[-1]["character"] = name
                        assigner.assign(name)
                    known_chars.add(name)
                    last_speaker = name
                continue

            seg_counter += 1

            if is_dialogue:
                # Look backward for narration context, skipping attribution-only parts
                before = ""
                for k in range(j - 1, -1, -1):
                    if not parts[k][2]:  # not attribution-only
                        before = parts[k][0]
                        break
                # Look ahead for attribution (skip attribution-only parts)
                after = ""
                for k in range(j + 1, len(parts)):
                    if not parts[k][1]:  # narration
                        if not parts[k][2]:  # not attribution-only
                            after = parts[k][0]
                        break
                speaker = _detect_speaker(before, after, False, last_speaker, prev_speaker, last_narration, known_chars)
                if not speaker:
                    speaker_counter += 1
                    speaker = f"Speaker {speaker_counter}"
                known_chars.add(speaker)
                is_short = len(text) < 60
                emotion = _guess_emotion(text, True, is_short)
                prev_speaker, last_speaker = last_speaker, speaker
                segments.append(_make_segment(
                    seg_counter, speaker, text, assigner.assign(speaker),
                    _char_lang(lang), emotion, _guess_speed(emotion, is_short),
                ))
                last_narration = ""
            else:
                is_short = len(text) < 60
                emotion = _guess_emotion(text, False, is_short)
                segments.append(_make_segment(
                    seg_counter, "Narrator", text, narr_voice,
                    narr_lang, emotion, _guess_speed(emotion, is_short),
                ))
                last_narration = text

    return {
        "version": "1.0",
        "title": title,
        "silence_ms": 500,
        "output_format": "flac",
        "metadata": {
            "source": source_file,
            "created": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "author": "",
            "language": lang,
        },
        "segments": segments,
    }


def _char_lang(lang: str) -> str:
    """Map language code to Story Studio lang code."""
    mapping = {"en": "en-gb", "zh": "zh", "ja": "ja", "es": "es",
               "fr": "fr", "de": "de"}
    return mapping.get(lang, "en-gb")


def _narrator_for_lang(lang: str) -> tuple[str, str]:
    """Get (voice, lang_code) for narrator based on story language."""
    narrators = {
        "en": ("bm_george", "en-gb"),
        "zh": ("zm_yunjian", "zh"),
        "ja": ("jm_kumo", "ja"),
    }
    return narrators.get(lang, ("bm_george", "en-gb"))


def _make_segment(idx: int, character: str, text: str, voice: str,
                  lang: str, emotion: str, speed: float) -> dict:
    return {
        "id": f"seg_{idx}",
        "character": character,
        "text": text,
        "voice": voice,
        "lang": lang,
        "emotion": emotion,
        "speed": speed,
    }


# ── Produce (CLI audio generation) ─────────────────────────────────────────────

def produce(story_json_path: str, output_path: str = None):
    """Read a .story.json file and generate audio directly (no web server needed)."""
    import numpy as np
    import soundfile as sf
    import mlx.core as mx

    sys.path.insert(0, str(Path(__file__).parent))
    from mlx_tts.generator import TTSGenerator
    from mlx_tts.voices import LANGUAGES, EMOTIONS, emotion_speed

    SAMPLE_RATE = 24000

    src = Path(story_json_path)
    if not src.exists():
        print(f"Error: {src} not found", file=sys.stderr)
        sys.exit(1)

    project = json.loads(src.read_text(encoding="utf-8"))
    segments = project.get("segments", [])
    title = project.get("title", "Untitled")
    silence_ms = project.get("silence_ms", 500)
    output_format = project.get("output_format", "flac")
    n = len(segments)

    if not segments:
        print("Error: no segments found", file=sys.stderr)
        sys.exit(1)

    print(f"Story: {title}")
    print(f"Segments: {n}")
    print(f"Loading model...")

    gen = TTSGenerator(verbose=False)
    gen._load()

    silence = np.zeros(int(SAMPLE_RATE * silence_ms / 1000), dtype=np.float32)
    audio_parts = []
    total_audio_s = 0.0
    t_wall = time.perf_counter()

    for idx, seg in enumerate(segments):
        text = seg["text"]
        voice = seg.get("voice", "af_heart")
        lang = seg.get("lang", "en-us")
        emotion = seg.get("emotion", "neutral")
        speed = seg.get("speed", 1.0)
        character = seg.get("character", "?")

        lang_info = LANGUAGES.get(lang)
        if not lang_info:
            print(f"  Warning: unknown language '{lang}', defaulting to en-us")
            lang_code = "en-us"
        else:
            lang_code = lang_info["code"]

        eff_speed = emotion_speed(speed, emotion)
        preview = text[:50] + ("..." if len(text) > 50 else "")
        print(f"  [{idx+1:2d}/{n}] {character}: {preview}")

        t0 = time.perf_counter()
        chunks = []
        sr = SAMPLE_RATE
        for result in gen._model.generate(
            text=text, voice=voice, speed=eff_speed, lang_code=lang_code,
        ):
            arr = np.array(result.audio, copy=False).flatten().astype(np.float32)
            chunks.append(arr)
            sr = result.sample_rate

        mx.clear_cache()
        if not chunks:
            print(f"    Warning: no audio generated for segment {idx+1}")
            continue

        audio_np = np.concatenate(chunks) if len(chunks) > 1 else chunks[0]
        dur = len(audio_np) / sr
        elapsed = time.perf_counter() - t0
        total_audio_s += dur
        print(f"          {dur:.1f}s (rtf {elapsed/dur:.2f}x)")

        audio_parts.append(audio_np)
        if idx < n - 1:
            audio_parts.append(silence)

    wall = time.perf_counter() - t_wall
    combined = np.concatenate(audio_parts)

    # Write output
    if output_path:
        out_path = Path(output_path)
        out_path.parent.mkdir(parents=True, exist_ok=True)
    else:
        ts = time.strftime("%Y%m%d_%H%M%S")
        slug = title.lower().replace(" ", "_")[:30]
        out_dir = Path("outputs/story_studio")
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"{slug}_{ts}.{output_format}"

    sf.write(
        str(out_path), combined, sr,
        format="FLAC" if output_format == "flac" else "WAV",
        subtype="PCM_24" if output_format == "flac" else "PCM_16",
    )

    file_kb = out_path.stat().st_size / 1024
    print(f"\n{'─'*50}")
    print(f"Title      : {title}")
    print(f"Duration   : {total_audio_s:.1f}s ({total_audio_s/60:.1f} min)")
    print(f"Wall time  : {wall:.1f}s")
    print(f"RTF        : {wall/total_audio_s:.2f}x")
    print(f"Segments   : {n}")
    print(f"Format     : {output_format}")
    print(f"Size       : {file_kb:.0f} KB")
    print(f"\nSaved: {out_path}")
    print(f"Open:  open {out_path}")

    return {"path": str(out_path), "duration_s": total_audio_s, "segments": n,
            "format": output_format, "size_kb": file_kb}


# ── Book CLI helpers ────────────────────────────────────────────────────────────

def _run_init_book(name: str, title: str, lang: str, author: str, genre: str):
    """Create a new book project scaffold."""
    from book_manager import BookManager
    bm = BookManager()
    bm.init_book(name, title=title or name, language=lang, author=author, genre=genre)
    book_dir = bm.get_book_dir(name)
    print(f"  Created: {book_dir}/")
    print(f"  Config:  {book_dir / 'book.json'}")
    print(f"  Chapters: {book_dir / 'chapters'}/")
    print(f"\nNext steps:")
    print(f"  1. Place chapter files: {book_dir}/chapters/chapter-001.txt")
    print(f"  2. Parse: python story_to_voice.py parse-chapter {book_dir}/")
    print(f"  3. Produce: python story_to_voice.py produce-book {book_dir}")


def _run_parse_chapter(book_dir: str, chapter_num: Optional[int] = None):
    """Parse chapter .txt → .story.json using book.json character registry."""
    from book_manager import BookManager
    bm = BookManager()
    book_path = Path(book_dir)

    # Resolve book name
    if book_path.is_dir() and (book_path / "book.json").exists():
        name = book_path.name
    else:
        name = book_dir.rstrip("/")
        if not (bm.books_dir / name / "book.json").exists():
            print(f"Error: book not found at {book_dir}", file=sys.stderr)
            sys.exit(1)

    book = bm.get_book(name)
    if not book:
        print(f"Error: could not load book '{name}'", file=sys.stderr)
        sys.exit(1)

    lang = book.get("language", "zh")
    characters = book.get("characters", {})

    # Build initial voice map from book.json characters
    initial_voices = {}
    for char_name, char_info in characters.items():
        if char_name != "Narrator":
            initial_voices[char_name] = char_info.get("voice", "")

    # Determine which chapters to parse
    if chapter_num is not None:
        targets = [c for c in book.get("chapters", []) if c["number"] == chapter_num]
        if not targets:
            print(f"Error: chapter {chapter_num:03d} not found in book.json", file=sys.stderr)
            sys.exit(1)
    else:
        # Parse all chapters that have .txt but no .story.json (or status=pending)
        targets = [c for c in book.get("chapters", []) if c.get("status") in ("pending", None)]
        if not targets:
            # Also check for .txt files not yet in book.json
            targets = []

    if not targets:
        # Scan for any un-parsed .txt files
        chapters_dir = bm.books_dir / name / "chapters"
        if chapters_dir.exists():
            for f in sorted(chapters_dir.glob("chapter-*.txt")):
                m = re.match(r"chapter-(\d+)\.txt", f.name)
                if not m:
                    continue
                num = int(m.group(1))
                story_json = f.with_suffix(".story.json")
                if not story_json.exists() or chapter_num == num:
                    targets.append({"number": num, "source": f.name})

    if not targets:
        print("  No chapters to parse. All chapters already have .story.json files.")
        return

    print(f"Book: {book.get('title', name)}")
    print(f"Language: {lang}")
    print(f"Existing characters: {', '.join(characters.keys())}")
    print(f"Chapters to parse: {len(targets)}")

    for ch in targets:
        num = ch["number"]
        txt_path = bm.get_chapter_txt_path(name, num)
        if not txt_path.exists():
            print(f"\n  Chapter {num:03d}: SKIPPED (no .txt file)")
            continue

        text = txt_path.read_text(encoding="utf-8")
        initial_voices_copy = dict(initial_voices)  # copy so each chapter starts clean

        story_data = parse_story(text, lang=lang, source_file=txt_path.name,
                                 initial_voices=initial_voices_copy)

        # Override narrator voice from book.json if available
        if "Narrator" in characters:
            narr_voice = characters["Narrator"].get("voice", "")
            narr_lang = characters["Narrator"].get("lang", lang)
            if narr_voice:
                for seg in story_data["segments"]:
                    if seg["character"] == "Narrator":
                        seg["voice"] = narr_voice
                        seg["lang"] = narr_lang

        # Override known character voices from book.json
        for seg in story_data["segments"]:
            char = seg["character"]
            if char in characters:
                seg["voice"] = characters[char].get("voice", seg["voice"])
                seg["lang"] = characters[char].get("lang", seg["lang"])

        # Save .story.json
        bm.save_chapter_story(name, num, story_data)

        # Detect new characters and update book.json
        seg_chars = {s["character"] for s in story_data["segments"]}
        new_chars = seg_chars - set(characters.keys())
        if new_chars:
            # Use book_manager to resolve new characters
            new_char_data = []
            for char in new_chars:
                new_char_data.append({
                    "character": char,
                    "voice": next((s["voice"] for s in story_data["segments"] if s["character"] == char), ""),
                    "lang": next((s["lang"] for s in story_data["segments"] if s["character"] == char), lang),
                    "gender": _guess_gender(char),
                    "role": "minor",
                })
            updated_chars = bm.resolve_characters(name, new_char_data)
            bm.update_characters(name, updated_chars)
            characters = updated_chars  # refresh for next chapter
            initial_voices = {k: v.get("voice", "") for k, v in characters.items() if k != "Narrator"}

        n_segs = len(story_data["segments"])
        char_list = sorted({s["character"] for s in story_data["segments"]})
        print(f"\n  Chapter {num:03d}: {n_segs} segments, {len(char_list)} characters: {', '.join(char_list)}")
        if new_chars:
            print(f"    New characters: {', '.join(new_chars)}")

    print(f"\n{'─'*50}")
    print(f"Parsed {len(targets)} chapter(s)")
    print(f"Characters in book: {', '.join(characters.keys())}")
    print(f"\nProduce audio:")
    print(f"  python story_to_voice.py produce-book books/{name}/")


def _guess_gender(char_name: str) -> str:
    """Guess gender from Chinese character name heuristics."""
    if char_name == "Narrator":
        return "male"
    # Common female name characters
    female_chars = set("妹姐姑婆娘嬸阿姨媽蓮瑤芳珠娥琪婷")
    # Check last character (most indicative)
    if char_name and char_name[-1] in female_chars:
        return "female"
    return "male"


def _run_produce_book(book_dir: str, chapter_num: Optional[int] = None, force: bool = False):
    """Produce audio for book chapters."""
    from book_manager import BookManager
    bm = BookManager()
    book_path = Path(book_dir)

    # Resolve book name from directory
    if book_path.is_dir() and (book_path / "book.json").exists():
        name = book_path.name
    else:
        # Try as a book name
        name = book_dir.rstrip("/")
        if not (bm.books_dir / name / "book.json").exists():
            print(f"Error: book not found at {book_dir}", file=sys.stderr)
            sys.exit(1)

    book = bm.get_book(name)
    if not book:
        print(f"Error: could not load book '{name}'", file=sys.stderr)
        sys.exit(1)

    chapters = book.get("chapters", [])
    title = book.get("title", name)
    print(f"Book: {title}")

    # Filter chapters to produce
    if chapter_num is not None:
        targets = [c for c in chapters if c["number"] == chapter_num]
        if not targets:
            print(f"Error: chapter {chapter_num:03d} not found", file=sys.stderr)
            sys.exit(1)
    else:
        targets = [c for c in chapters if force or c.get("status") != "produced"]

    if not targets:
        print("  All chapters already produced. Use --force to re-produce.")
        return

    print(f"  Chapters to produce: {len(targets)}")

    for ch in targets:
        num = ch["number"]
        story_path = bm.get_chapter_story_path(name, num)
        audio_path = bm.get_chapter_audio_path(name, num)

        if not story_path.exists():
            print(f"\n  Chapter {num:03d}: SKIPPED (no .story.json)")
            continue

        print(f"\n{'─'*50}")
        print(f"  Chapter {num:03d}")
        result = produce(str(story_path), output_path=str(audio_path))
        bm.update_chapter_status(name, num, "produced",
                                  duration_s=result["duration_s"],
                                  audio_filename=audio_path.name)

    print(f"\n{'='*50}")
    print(f"Book production complete: {title}")
    produced = [c for c in bm.get_book(name).get("chapters", []) if c.get("status") == "produced"]
    total_dur = sum(c.get("duration_s") or 0 for c in produced)
    print(f"  Produced: {len(produced)}/{len(chapters)} chapters")
    print(f"  Total duration: {total_dur:.1f}s ({total_dur/60:.1f} min)")


# ── CLI ────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Story-to-voice pipeline: text → .story.json → audio",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Commands:
  parse         Convert plain text story → .story.json
  produce       Generate audio from .story.json (no web server needed)
  init-book     Create a new multi-chapter book project
  produce-book  Generate audio for all/specific chapters in a book

Examples:
  python story_to_voice.py parse story.txt --lang zh
  python story_to_voice.py produce stories/my_story.story.json
  python story_to_voice.py init-book my_novel --lang zh --title "我的小說"
  python story_to_voice.py produce-book books/my_novel/
  python story_to_voice.py produce-book books/my_novel/ --chapter 003
        """,
    )
    sub = parser.add_subparsers(dest="command")

    # parse subcommand
    p_parse = sub.add_parser("parse", help="Convert text → .story.json")
    p_parse.add_argument("input", help="Plain text story file")
    p_parse.add_argument("-o", "--output", help="Output path (default: <stem>.story.json)")
    p_parse.add_argument("--lang", default="en", help="Language code (default: en)")

    # produce subcommand
    p_prod = sub.add_parser("produce", help="Generate audio from .story.json")
    p_prod.add_argument("input", help="Path to .story.json file")
    p_prod.add_argument("-o", "--output", default=None, help="Output audio path")

    # init-book subcommand
    p_init = sub.add_parser("init-book", help="Create a new multi-chapter book project")
    p_init.add_argument("name", help="Book name (directory name)")
    p_init.add_argument("--title", default="", help="Book title")
    p_init.add_argument("--lang", default="zh", help="Language code (default: zh)")
    p_init.add_argument("--author", default="", help="Author name")
    p_init.add_argument("--genre", default="", help="Genre")

    # produce-book subcommand
    p_book = sub.add_parser("produce-book", help="Generate audio for book chapters")
    p_book.add_argument("book_dir", help="Path to book directory (e.g. books/my_novel/)")
    p_book.add_argument("--chapter", type=int, default=None, help="Produce specific chapter number only")
    p_book.add_argument("--force", action="store_true", help="Re-produce even if already produced")

    # parse-chapter subcommand
    p_pch = sub.add_parser("parse-chapter", help="Parse chapter .txt → .story.json using book.json characters")
    p_pch.add_argument("book_dir", help="Path to book directory (e.g. books/my_novel/)")
    p_pch.add_argument("--chapter", type=int, default=None, help="Specific chapter number (default: all un-parsed)")

    # backward compat: bare positional arg defaults to parse
    parser.add_argument("input_legacy", nargs="?", help=argparse.SUPPRESS)

    args = parser.parse_args()

    if args.command == "produce":
        produce(args.input, output_path=args.output)
    elif args.command == "parse":
        _run_parse(args.input, args.output, args.lang)
    elif args.command == "init-book":
        _run_init_book(args.name, args.title, args.lang, args.author, args.genre)
    elif args.command == "produce-book":
        _run_produce_book(args.book_dir, args.chapter, args.force)
    elif args.command == "parse-chapter":
        _run_parse_chapter(args.book_dir, args.chapter)
    else:
        # Backward compat: bare "story_to_voice.py story.txt"
        if args.input_legacy:
            _run_parse(args.input_legacy, None, "en")
        else:
            parser.print_help()


def _run_parse(input_path: str, output_path: Optional[str], lang: str):
    src = Path(input_path)
    if not src.exists():
        print(f"Error: {src} not found", file=sys.stderr)
        sys.exit(1)

    text = src.read_text()
    project = parse_story(text, lang=lang, source_file=src.name)

    out = Path(output_path) if output_path else src.with_suffix(".story.json")
    out.write_text(json.dumps(project, indent=2, ensure_ascii=False))

    n_segs = len(project["segments"])
    chars = sorted({s["character"] for s in project["segments"]})
    print(f"  {src.name} → {out.name}")
    print(f"  {n_segs} segments, {len(chars)} characters: {', '.join(chars)}")
    print(f"\nProduce audio:")
    print(f"  python story_to_voice.py produce {out}")


if __name__ == "__main__":
    main()
