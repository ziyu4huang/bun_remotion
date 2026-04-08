"""
Book manager — multi-chapter book CRUD for the story-to-voice pipeline.

Directory layout:
    books/<book-name>/
      book.json                  # book metadata + character→voice registry
      chapters/
        chapter-001.txt          # raw chapter text
        chapter-001.story.json   # parsed segments
        chapter-001.flac         # generated audio

Usage:
    from book_manager import BookManager
    bm = BookManager()
    bm.init_book("my_novel", title="My Novel", language="zh")
"""

from __future__ import annotations

import json
import re
import time
from pathlib import Path
from typing import Optional

# ── Voice pools (language-aware) ──────────────────────────────────────────────

VOICE_POOLS = {
    "zh": {
        "male": ["zm_yunxi", "zm_yunjian"],
        "female": ["zf_xiaobei", "zf_xiaoni"],
        "narrator": ("zm_yunjian", "zh"),
    },
    "en-us": {
        "male": ["am_adam", "am_michael", "am_echo", "am_liam", "bm_lewis", "bm_daniel"],
        "female": ["af_heart", "af_sarah", "af_bella", "af_sky", "bf_emma", "bf_isabella"],
        "narrator": ("bm_george", "en-gb"),
    },
    "en-gb": {
        "male": ["bm_lewis", "bm_daniel", "bm_george"],
        "female": ["bf_emma", "bf_isabella"],
        "narrator": ("bm_george", "en-gb"),
    },
    "ja": {
        "male": ["jm_kumo"],
        "female": ["jf_alpha", "jf_gongitsune"],
        "narrator": ("jm_kumo", "ja"),
    },
}


class BookManager:
    """CRUD operations for multi-chapter book projects."""

    def __init__(self, books_dir: str | Path = "books"):
        self.books_dir = Path(books_dir)

    # ── Book CRUD ─────────────────────────────────────────────────────────────

    def list_books(self) -> list[dict]:
        """Return summary for each book in books/ directory."""
        if not self.books_dir.exists():
            return []
        books = []
        for d in sorted(self.books_dir.iterdir()):
            if d.is_dir() and (d / "book.json").exists():
                data = self._load_json(d / "book.json")
                chapters = data.get("chapters", [])
                produced = sum(1 for c in chapters if c.get("status") == "produced")
                total_dur = sum(c.get("duration_s") or 0 for c in chapters)
                books.append({
                    "name": d.name,
                    "title": data.get("title", d.name),
                    "author": data.get("author", ""),
                    "language": data.get("language", ""),
                    "genre": data.get("genre", ""),
                    "chapters": len(chapters),
                    "produced": produced,
                    "total_duration_s": round(total_dur, 1),
                })
        return books

    def get_book(self, name: str) -> Optional[dict]:
        """Load full book.json. Returns None if not found."""
        p = self.books_dir / name / "book.json"
        if not p.exists():
            return None
        return self._load_json(p)

    def save_book(self, name: str, data: dict) -> Path:
        """Write book.json atomically."""
        p = self.books_dir / name / "book.json"
        p.parent.mkdir(parents=True, exist_ok=True)
        data["modified"] = time.strftime("%Y-%m-%dT%H:%M:%S")
        p.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        return p

    def init_book(self, name: str, title: str = "", language: str = "zh",
                  author: str = "", genre: str = "",
                  **kwargs) -> Path:
        """Create a new book project with scaffold book.json."""
        book_dir = self.books_dir / name
        chapters_dir = book_dir / "chapters"
        chapters_dir.mkdir(parents=True, exist_ok=True)

        # Scan for existing chapter-*.txt files
        chapters = self._scan_chapter_files(chapters_dir)

        pool = VOICE_POOLS.get(language, VOICE_POOLS["en-us"])
        narrator_voice, narrator_lang = pool["narrator"]

        book_data = {
            "version": "1.0",
            "title": title or name,
            "author": author,
            "language": language,
            "genre": genre,
            "created": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "modified": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "settings": {
                "silence_ms": 500,
                "output_format": "flac",
            },
            "characters": {
                "Narrator": {
                    "gender": "male",
                    "voice": narrator_voice,
                    "lang": narrator_lang,
                    "role": "narrator",
                },
            },
            "chapters": chapters,
        }
        return self.save_book(name, book_data)

    # ── Chapter operations ────────────────────────────────────────────────────

    def scan_chapters(self, name: str) -> list[dict]:
        """Re-scan chapters/ dir and update book.json."""
        chapters_dir = self.books_dir / name / "chapters"
        if not chapters_dir.exists():
            return []
        chapters = self._scan_chapter_files(chapters_dir)
        book = self.get_book(name)
        if book:
            book["chapters"] = chapters
            self.save_book(name, book)
        return chapters

    def get_chapter(self, name: str, number: int) -> Optional[dict]:
        """Load a chapter's .story.json. Returns None if not parsed yet."""
        p = self._chapter_story_path(name, number)
        if not p.exists():
            return None
        return self._load_json(p)

    def save_chapter_story(self, name: str, number: int, story_data: dict) -> Path:
        """Write .story.json for a chapter and update book.json status."""
        p = self._chapter_story_path(name, number)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(story_data, indent=2, ensure_ascii=False), encoding="utf-8")

        # Update book.json
        book = self.get_book(name)
        if book:
            for ch in book.get("chapters", []):
                if ch["number"] == number:
                    ch["status"] = "parsed"
                    ch["story_json"] = p.name
                    ch["segments"] = len(story_data.get("segments", []))
                    break
            self.save_book(name, book)
        return p

    def update_chapter_status(self, name: str, number: int, status: str,
                              duration_s: float = None, audio_filename: str = None) -> None:
        """Update chapter status in book.json after production."""
        book = self.get_book(name)
        if not book:
            return
        for ch in book.get("chapters", []):
            if ch["number"] == number:
                ch["status"] = status
                if duration_s is not None:
                    ch["duration_s"] = round(duration_s, 1)
                if audio_filename is not None:
                    ch["audio"] = audio_filename
                break
        self.save_book(name, book)

    # ── Character operations ──────────────────────────────────────────────────

    def resolve_characters(self, name: str, segments: list[dict]) -> dict:
        """Given segments from a new chapter, return updated characters dict.

        Existing characters keep their voices. New characters get assigned
        from the language-appropriate voice pool.
        """
        book = self.get_book(name)
        if not book:
            return {}

        existing = dict(book.get("characters", {}))
        lang = book.get("language", "zh")
        pool = VOICE_POOLS.get(lang, VOICE_POOLS["en-us"])

        # Track which voices are already used
        used_male = {c["voice"] for c in existing.values() if c.get("gender") == "male"}
        used_female = {c["voice"] for c in existing.values() if c.get("gender") == "female"}

        male_pool = [v for v in pool["male"] if v not in used_male]
        female_pool = [v for v in pool["female"] if v not in used_female]

        # Default gender assignment for unknown characters
        # (the LLM skill should set gender, but fallback to male)
        for seg in segments:
            char_name = seg.get("character", "")
            if not char_name or char_name == "Narrator" or char_name in existing:
                continue

            # New character — assign voice
            gender = seg.get("gender", "male")
            if gender == "female" and female_pool:
                voice = female_pool.pop(0)
            elif male_pool:
                voice = male_pool.pop(0)
            elif female_pool:
                voice = female_pool.pop(0)
            else:
                # All pool exhausted, reuse from start
                voice = pool[gender][0] if pool.get(gender) else pool["male"][0]

            existing[char_name] = {
                "gender": gender,
                "voice": voice,
                "lang": lang if lang != "en-us" and lang != "en-gb" else "en-us",
                "role": seg.get("role", "supporting"),
            }

        return existing

    def update_characters(self, name: str, characters: dict) -> None:
        """Replace character registry in book.json."""
        book = self.get_book(name)
        if not book:
            return
        book["characters"] = characters
        self.save_book(name, book)

    def save_chapter_story(self, name: str, number: int, story_data: dict) -> Path:
        """Write .story.json for a chapter and update book.json status."""
        p = self._chapter_path(name, number, ".story.json")
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(story_data, indent=2, ensure_ascii=False), encoding="utf-8")

        # Update book.json
        book = self.get_book(name)
        if book:
            for ch in book.get("chapters", []):
                if ch["number"] == number:
                    ch["status"] = "parsed"
                    ch["story_json"] = p.name
                    ch["segments"] = len(story_data.get("segments", []))
                    break
            self.save_book(name, book)
        return p

    def update_chapter_status(self, name: str, number: int, status: str,
                              duration_s: float = None, audio_filename: str = None) -> None:
        """Update chapter status in book.json after production."""
        book = self.get_book(name)
        if not book:
            return
        for ch in book.get("chapters", []):
            if ch["number"] == number:
                ch["status"] = status
                if duration_s is not None:
                    ch["duration_s"] = round(duration_s, 1)
                if audio_filename is not None:
                    ch["audio"] = audio_filename
                break
        self.save_book(name, book)

    def get_chapter_story_path(self, name: str, number: int) -> Path:
        """Return path to chapter .story.json file."""
        return self._chapter_path(name, number, ".story.json")

    def get_chapter_audio_path(self, name: str, number: int) -> Path:
        """Return path to chapter audio file."""
        return self._chapter_path(name, number, ".flac")

    # ── Path helpers ──────────────────────────────────────────────────────────

    def get_book_dir(self, name: str) -> Path:
        return self.books_dir / name

    def get_chapter_txt_path(self, name: str, number: int) -> Path:
        return self._chapter_path(name, number, ".txt")

    def get_chapter_story_path_legacy(self, name: str, number: int) -> Path:
        return self._chapter_path(name, number, ".story.json")

    def get_chapter_audio_path_legacy(self, name: str, number: int) -> Path:
        return self._chapter_path(name, number, ".flac")

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _chapter_path(self, name: str, number: int, suffix: str) -> Path:
        num = f"{number:03d}"
        return self.books_dir / name / "chapters" / f"chapter-{num}{suffix}"

    def _chapter_story_path(self, name: str, number: int) -> Path:
        return self._chapter_path(name, number, ".story.json")

    def _scan_chapter_files(self, chapters_dir: Path) -> list[dict]:
        """Discover chapter-*.txt files and return chapter entries."""
        chapters = []
        for f in sorted(chapters_dir.glob("chapter-*.txt")):
            m = re.match(r"chapter-(\d+)\.txt", f.name)
            if not m:
                continue
            num = int(m.group(1))
            story_json = f.with_suffix(".story.json")
            audio = f.with_suffix(".flac")
            status = "pending"
            if story_json.exists():
                status = "parsed" if not audio.exists() else "produced"

            chapters.append({
                "number": num,
                "title": f"Chapter {num}",
                "source": f.name,
                "story_json": story_json.name if story_json.exists() else None,
                "audio": audio.name if audio.exists() else None,
                "status": status,
                "segments": 0,
                "duration_s": None,
            })
        return chapters

    @staticmethod
    def _load_json(path: Path) -> dict:
        return json.loads(path.read_text(encoding="utf-8"))
