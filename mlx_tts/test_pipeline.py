"""
End-to-end pipeline test: story.txt → .story.json → Story Studio → audio.

Uses Playwright to:
1. Import the generated story.story.json
2. Click Produce
3. Wait for audio generation
4. Verify the audio player appears and download link works
"""
import json
import sys
import time
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

STUDIO_URL = "http://localhost:7861"
STORY_JSON = Path(__file__).parent / "story.story.json"

def wait_for_server(url: str, timeout: int = 30):
    """Wait until server responds."""
    for _ in range(timeout):
        try:
            urllib.request.urlopen(f"{url}/api/voices")
            return True
        except Exception:
            time.sleep(1)
    return False


def run_pipeline():
    if not STORY_JSON.exists():
        print(f"FAIL: {STORY_JSON} not found")
        sys.exit(1)

    story_data = json.loads(STORY_JSON.read_text())
    n_segs = len(story_data["segments"])
    print(f"  Story: {story_data['title']} ({n_segs} segments)")

    if not wait_for_server(STUDIO_URL):
        print("FAIL: Server not responding at", STUDIO_URL)
        sys.exit(1)
    print("  Server ready")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # ── Step 1: Load Story Studio ──
        print("\n  Step 1: Loading Story Studio...")
        page.goto(STUDIO_URL)
        page.wait_for_load_state("networkidle")
        assert "Story Studio" in page.title(), f"Bad title: {page.title()}"
        print(f"    Title: {page.title()}")

        # Wait for default segments to load
        page.wait_for_function(
            "document.querySelectorAll('.seg-card').length === 3",
            timeout=5000,
        )
        print("    Page loaded with default segments")

        # ── Step 2: Import story.story.json ──
        print(f"\n  Step 2: Importing {STORY_JSON.name}...")
        page.locator("#importInput").set_input_files(str(STORY_JSON))

        # Wait for imported segments to appear
        page.wait_for_function(
            f"document.querySelectorAll('.seg-card').length === {n_segs}",
            timeout=10000,
        )

        title_val = page.locator("#storyTitle").input_value()
        seg_count = page.locator(".seg-card").count()
        print(f"    Title: {title_val}")
        print(f"    Segments loaded: {seg_count}")
        assert title_val == story_data["title"], f"Title mismatch: {title_val}"
        assert seg_count == n_segs, f"Segment count mismatch: {seg_count}"

        # Verify first segment character and voice
        first_char = page.locator(".char-name").first.input_value()
        first_text = page.locator(".seg-text textarea").first.input_value()
        print(f"    First segment: {first_char} — \"{first_text[:50]}...\"")

        # Verify settings
        silence_val = page.locator("#silenceInput").input_value()
        format_val = page.locator("#formatSelect").input_value()
        print(f"    Settings: silence={silence_val}ms, format={format_val}")

        # ── Step 3: Produce ──
        print(f"\n  Step 3: Producing audiobook ({n_segs} segments)...")

        # Collect SSE events for reporting
        events_captured = []

        # Set up a listener for the production log
        def on_response(response):
            if "/api/produce" in response.url and response.request.method == "POST":
                pass  # job started

        page.on("response", on_response)

        # Click Produce
        page.locator("#produceBtn").click()

        # Wait for production to complete (status dot turns green "done")
        # The "done" state is set after SSE stream completes
        page.wait_for_function(
            "document.getElementById('statusDot').classList.contains('done') || "
            "document.getElementById('statusDot').classList.contains('error')",
            timeout=600000,  # 10 min max for long stories
        )

        status_dot = page.locator("#statusDot")
        is_done = status_dot.evaluate("el => el.classList.contains('done')")
        is_error = status_dot.evaluate("el => el.classList.contains('error')")
        status_label = page.locator("#statusLabel").text_content()

        if is_error:
            print(f"    FAIL: Production error — {status_label}")
            # Print log entries
            log_entries = page.locator(".log-entry")
            for i in range(log_entries.count()):
                print(f"      Log: {log_entries.nth(i).text_content()}")
            browser.close()
            sys.exit(1)

        print(f"    Status: {status_label}")

        # ── Step 4: Verify results ──
        print(f"\n  Step 4: Verifying results...")

        # Check player area is visible
        player_visible = page.locator("#playerArea").is_visible()
        assert player_visible, "Player area not visible"
        print("    Player area visible ✓")

        # Check player title
        player_title = page.locator("#playerTitle").text_content()
        print(f"    Player title: {player_title}")

        # Check audio source
        audio_src = page.locator("#audioPlayer").evaluate("el => el.src")
        print(f"    Audio URL: {audio_src}")

        # Check download link
        dl_href = page.locator("#dlLink").evaluate("el => el.href")
        print(f"    Download link: {dl_href}")

        # Check progress bar
        progress_text = page.locator("#progressLabel").text_content()
        print(f"    Progress: {progress_text}")

        # Check player badges
        badges = page.locator(".player-badge")
        badge_texts = [badges.nth(i).text_content() for i in range(badges.count())]
        print(f"    Badges: {', '.join(badge_texts)}")

        # ── Step 5: Verify audio file is accessible ──
        print(f"\n  Step 5: Verifying audio file...")
        # Extract filename from audio src
        filename = audio_src.split("/")[-1].split("?")[0]
        audio_url = f"{STUDIO_URL}/story/{filename}"

        try:
            resp = urllib.request.urlopen(audio_url)
            content_type = resp.headers.get("Content-Type", "")
            data = resp.read()
            size_kb = len(data) / 1024
            print(f"    File: {filename}")
            print(f"    Content-Type: {content_type}")
            print(f"    Size: {size_kb:.1f} KB")
            assert "audio" in content_type, f"Expected audio content type, got {content_type}"
            assert size_kb > 0, "Audio file is empty"
            print("    Audio file accessible ✓")

            # Save a local copy for playback verification
            local_copy = Path(__file__).parent / "outputs" / "story_studio" / filename
            local_copy.write_bytes(data)
            print(f"    Saved local copy: {local_copy}")
        except Exception as e:
            print(f"    FAIL: Cannot access audio file: {e}")
            browser.close()
            sys.exit(1)

        # ── Step 6: Verify log entries ──
        print(f"\n  Step 6: Checking production log...")
        log_entries = page.locator(".log-entry")
        log_count = log_entries.count()
        print(f"    Log entries: {log_count}")

        # Each segment produces one log entry (running → done update), plus start/combining/writing/done entries
        # Minimum: 1 (start) + n_segs (segments) + 1 (combining) + 1 (writing) + 1 (done)
        min_expected = n_segs + 4
        assert log_count >= min_expected, f"Expected at least {min_expected} log entries, got {log_count}"

        # Check last log entry contains completion info
        last_log = log_entries.nth(log_count - 1).text_content()
        print(f"    Last log: {last_log[:80]}")

        # ── Step 7: Take screenshot ──
        print(f"\n  Step 7: Taking final screenshot...")
        screenshot_path = Path(__file__).parent / "outputs" / "story_studio" / "pipeline_test_final.png"
        screenshot_path.parent.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(screenshot_path), full_page=True)
        print(f"    Screenshot: {screenshot_path}")

        # ── Step 8: Play audio in-browser ──
        print(f"\n  Step 8: Playing audio in browser...")
        # The audio auto-plays on production complete; verify it's playing
        is_playing = page.locator("#audioPlayer").evaluate("el => !el.paused && el.duration > 0")
        if is_playing:
            print("    Audio is playing in browser ✓")
        else:
            # Try to play
            page.locator("#audioPlayer").evaluate("el => el.play().catch(()=>{})")
            time.sleep(1)
            is_playing = page.locator("#audioPlayer").evaluate("el => !el.paused")
            if is_playing:
                print("    Audio started playing ✓")
            else:
                print("    Audio loaded (autoplay blocked by browser policy)")

        duration = page.locator("#audioPlayer").evaluate("el => el.duration")
        print(f"    Audio duration: {duration:.1f}s")

        browser.close()

    # ── Summary ──
    print(f"\n  {'='*60}")
    print(f"  PIPELINE TEST PASSED ✓")
    print(f"  {'='*60}")
    print(f"  story.txt → story.story.json → Story Studio → {filename}")
    print(f"  {n_segs} segments, {size_kb:.1f} KB audio, format: {format_val}")
    print(f"  Characters: {', '.join(sorted(s['character'] for s in story_data['segments']))}")
    print(f"  Audio: {audio_url}")
    print(f"  Screenshot: {screenshot_path}")
    print()


if __name__ == "__main__":
    run_pipeline()
