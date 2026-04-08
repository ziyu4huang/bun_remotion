"""
Playwright E2E tests for MLX TTS Story Studio.

Install:
    cd mlx_tts
    .venv/bin/pip install pytest playwright
    .venv/bin/playwright install chromium

Run:
    .venv/bin/pytest test_story_studio.py -v
"""

import json
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

import pytest
from playwright.sync_api import Page, sync_playwright

STORY_STUDIO_URL = "http://localhost:7861"
STORIES_DIR = Path(__file__).parent / "stories"
SERVER_SCRIPT = Path(__file__).parent / "story_studio.py"

SAMPLE_STORY = {
    "version": "1.0",
    "title": "Test Story",
    "silence_ms": 300,
    "output_format": "wav",
    "metadata": {
        "source": "test",
        "created": "2026-04-06T00:00:00",
        "author": "test",
        "language": "en",
    },
    "segments": [
        {
            "id": "seg_1",
            "character": "Narrator",
            "text": "Once upon a time, in a land far away.",
            "voice": "bm_george",
            "lang": "en-gb",
            "emotion": "storytelling",
            "speed": 1.0,
        },
        {
            "id": "seg_2",
            "character": "Alice",
            "text": "Where am I? This place is strange and wonderful.",
            "voice": "af_heart",
            "lang": "en-us",
            "emotion": "neutral",
            "speed": 1.0,
        },
        {
            "id": "seg_3",
            "character": "Narrator",
            "text": "And so the adventure began.",
            "voice": "bm_george",
            "lang": "en-gb",
            "emotion": "calm",
            "speed": 0.95,
        },
    ],
}


# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest.fixture(scope="session")
def server():
    """Start story_studio.py as a subprocess for the test session."""
    proc = subprocess.Popen(
        [sys.executable, str(SERVER_SCRIPT)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    # Wait for server ready
    for _ in range(30):
        try:
            urllib.request.urlopen(f"{STORY_STUDIO_URL}/api/voices")
            break
        except Exception:
            time.sleep(1)
    else:
        proc.terminate()
        raise RuntimeError("Server did not start within 30s")

    yield proc

    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()


@pytest.fixture(scope="session")
def browser_context(server):
    """Create a Playwright browser context."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        yield context
        context.close()
        browser.close()


@pytest.fixture
def page(browser_context):
    """Create a new page for each test."""
    pg = browser_context.new_page()
    pg.goto(STORY_STUDIO_URL)
    pg.wait_for_load_state("networkidle")
    yield pg
    pg.close()


# ── Helpers ────────────────────────────────────────────────────────────────────


def wait_for_seg_count(page: Page, n: int, timeout: int = 5000):
    """Wait until .seg-card count equals n."""
    page.wait_for_function(
        f"document.querySelectorAll('.seg-card').length === {n}",
        timeout=timeout,
    )


def import_story_file(page: Page, file_path: str):
    """Set files on the hidden import input."""
    page.locator("#importInput").set_input_files(file_path)


# ── Test: Page loads ──────────────────────────────────────────────────────────


def test_page_loads(page: Page):
    """Story Studio page loads with correct title and elements."""
    assert "Story Studio" in page.title()
    assert page.locator("#produceBtn").is_visible()
    assert page.locator("#storyTitle").is_visible()


def test_default_segments_loaded(page: Page):
    """Page boots with 3 default seed segments."""
    wait_for_seg_count(page, 3)
    assert page.locator(".seg-card").count() == 3


def test_header_controls_present(page: Page):
    """Import and settings controls exist."""
    assert page.locator("#importInput").count() == 1
    assert page.locator("#silenceInput").is_visible()
    assert page.locator("#formatSelect").is_visible()


# ── Test: Add / Remove segments ───────────────────────────────────────────────


def test_add_segment(page: Page):
    """Clicking 'Add Section' creates a new segment card."""
    initial = page.locator(".seg-card").count()
    page.locator(".btn-add").click()
    wait_for_seg_count(page, initial + 1)


def test_remove_segment(page: Page):
    """Clicking remove on a segment removes it."""
    initial = page.locator(".seg-card").count()
    page.locator(".btn-danger").first.click()
    wait_for_seg_count(page, initial - 1)


# ── Test: Import ──────────────────────────────────────────────────────────────


def test_import_story_json(page: Page, tmp_path: Path):
    """Importing a .story.json clears existing segments and loads new ones."""
    story_file = tmp_path / "test.story.json"
    story_file.write_text(json.dumps(SAMPLE_STORY))

    import_story_file(page, str(story_file))
    wait_for_seg_count(page, 3)

    # Verify title changed
    assert page.locator("#storyTitle").input_value() == "Test Story"

    # Verify first segment character name
    first_char = page.locator(".char-name").first
    assert first_char.input_value() == "Narrator"

    # Verify first segment text
    first_text = page.locator(".seg-text textarea").first
    assert "Once upon a time" in first_text.input_value()


def test_import_preserves_settings(page: Page, tmp_path: Path):
    """Importing updates silence_ms and output_format controls."""
    story_file = tmp_path / "settings.story.json"
    story_file.write_text(json.dumps(SAMPLE_STORY))

    import_story_file(page, str(story_file))
    wait_for_seg_count(page, 3)
    assert page.locator("#silenceInput").input_value() == "300"
    assert page.locator("#formatSelect").input_value() == "wav"


# ── Test: Export ───────────────────────────────────────────────────────────────


def test_export_story_json(page: Page, tmp_path: Path):
    """Exporting creates a downloadable .story.json file."""
    # First import to have known state
    story_file = tmp_path / "pre.story.json"
    story_file.write_text(json.dumps(SAMPLE_STORY))
    import_story_file(page, str(story_file))
    wait_for_seg_count(page, 3)

    # Export and capture the download
    with page.expect_download() as download_info:
        page.locator("text=Export").click()

    download = download_info.value
    data = json.loads(Path(download.path()).read_text())

    assert data["version"] == "1.0"
    assert data["title"] == "Test Story"
    assert len(data["segments"]) == 3
    assert data["segments"][0]["character"] == "Narrator"
    assert data["segments"][0]["voice"] == "bm_george"
    assert data["silence_ms"] == 300
    assert data["output_format"] == "wav"


# ── Test: Sample story files ──────────────────────────────────────────────────


def test_import_lighthouse_keeper(page: Page):
    """The sample lighthouse_keeper.story.json can be imported."""
    story_file = STORIES_DIR / "lighthouse_keeper.story.json"
    if not story_file.exists():
        pytest.skip("lighthouse_keeper.story.json not found")

    import_story_file(page, str(story_file))
    wait_for_seg_count(page, 16)
    assert "Lighthouse" in page.locator("#storyTitle").input_value()
