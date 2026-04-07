---
name: generate-image
description: >
  Use when: "generate image", "create image", "AI image", "aistudio image",
  "gemini image", "imagen", "/generate-image", "nano banana".
  Triggers on: image generation, AI Studio, gemini image gen.
metadata:
  version: 1.2.0
---

# /generate-image — AI Image Generation via Google AI Studio

Generate images using Google's Nano Banana (Gemini) model through the Google AI Studio web interface, automated via Playwright.

---

## Usage

```
/generate-image <prompt> [options]
```

**Arguments:**
- `<prompt>` — Image description (required). What you want to generate.
- `free` — Use free tier (Nano Banana / gemini-2.5-flash-image). Default.
- `pro` — Use paid tier (Nano Banana Pro).
- `pro2` — Use paid tier (Nano Banana 2, newest).

**Examples:**
```
/generate-image a cute cat wearing a hat
/generate-image cyberpunk cityscape pro
/generate-image fantasy dragon free
```

---

## Models

| Model | Tier | Flag | Description |
|-------|------|------|-------------|
| Nano Banana | Free | `free` (default) | gemini-2.5-flash-image, state-of-the-art image gen |
| Nano Banana 2 | Paid | `pro2` | Pro-level visual intelligence, Flash-speed |
| Nano Banana Pro | Paid | `pro` | State-of-the-art image generation and editing |

---

## Execution Steps

Follow these steps **in order**. Each step uses Playwright MCP tools.

### Step 1: Check browser state
- If no browser is open or not on Google AI Studio, navigate to: `https://aistudio.google.com/prompts/new_chat`
- If user is not logged in, **STOP** and tell the user to log in first. Wait for them to confirm login.

### Step 2: Select model
1. Take a snapshot to see current page state
2. Look for "Image Generation" category button — click it
3. Wait for the model list to appear, take another snapshot
4. Select the appropriate model based on the tier flag:
   - `free`: Click button with heading "Nano Banana" that does NOT have a "Paid" badge nearby
   - `pro`: Click button with heading "Nano Banana Pro" (has "Paid" badge)
   - `pro2`: Click button with heading "Nano Banana 2" (has "Paid" badge)
5. Dismiss the "Selected Nano Banana" confirmation toast if it appears (click "Dismiss")
6. Verify the URL contains the correct model parameter

### Step 3: Enter prompt and generate
1. Dismiss any dialogs (guided tour, terms of service, confirmation toasts) by clicking their close/dismiss buttons
2. Find the prompt textbox (`textbox "Enter a prompt"`)
3. Type the user's prompt into the textbox using `browser_type`
4. Press `Alt+Enter` to append the prompt to the chat (there is no "Add" button)
5. Take a snapshot to confirm the prompt appears in the chat area as a user message
6. Click "Run the prompt" button — use the button ref directly, not a container ref. If first click doesn't trigger, take a new snapshot and try again
7. Wait for "Response ready." text using `browser_wait_for` with `text: "Response ready."` (up to 30s). If timeout, take a snapshot to check for errors

### Step 4: Download the image
1. Right-click on the generated image (`img "Generated Image..."`)
2. This reveals overlay controls including a "Download" button — take a snapshot to confirm
3. Click the "Download" button
4. The file downloads to `.playwright-mcp/`. Note: colons in the original filename are replaced with underscores (e.g., `Generated-Image-April-08-2026---5-31AM.png`). Use `ls -t .playwright-mcp/*.png | head -1` to find the most recent download

### Step 5: Save to output folder
1. Ensure `./output/` directory exists: `mkdir -p ./output`
2. Copy the downloaded file from `.playwright-mcp/` to `./output/` with a descriptive name
3. Naming convention: `./output/<descriptive-slug>.png` (e.g., `cute-cat-hat.png`)
4. Generate the slug from the prompt: lowercase, spaces to hyphens, max 5 words

### Step 6: Confirm and show result
1. Verify the file exists in `./output/`
2. Read/display the image to the user
3. Report: filename, file size, and the prompt used

---

## Output

- Default output directory: `./output/`
- `output/` is in `.gitignore` (won't be committed)
- Image format: PNG

---

## Error Handling

| Situation | Action |
|-----------|--------|
| User not logged in | Stop and ask user to log in |
| Model button not found | Take screenshot, ask user to verify page state |
| Run button disabled | Check if prompt was entered correctly |
| Image generation fails | Check for error messages in the response, retry once |
| Download not triggered | Try right-clicking the image again |
| Playwright not connected | Tell user to ensure Playwright MCP plugin is running |

---

## Prerequisites

- Playwright MCP plugin must be running
- User must have a Google account logged in
- For paid tiers, user must have billing configured in Google AI Studio

---

## Tips

- **Snapshot refs are ephemeral** — always take a fresh snapshot before clicking if the page may have changed. Never reuse a ref from a previous snapshot.
- **Prefer button names over refs** — use descriptive button text (e.g., `"Run the prompt"`) when clicking, not raw refs like `e277`, to avoid targeting container elements instead of actual buttons.
- **Google UI changes frequently** — if button text doesn't match, take a screenshot and ask the user to verify.
