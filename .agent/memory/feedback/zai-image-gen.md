---
name: zai-image-gen
description: z.ai image generation workflow via playwright-cli with persistent profile
type: feedback
---

## z.ai Image Generation (https://image.z.ai)

**Rule:** Always use `playwright-cli open --headed --persistent` to avoid re-login every session.

**Why:** z.ai requires OAuth login via chat.z.ai. Without `--persistent`, cookies are lost between browser sessions, forcing re-login each time. The user found this very annoying.

**How to apply:**
- Always open with: `playwright-cli open --headed --persistent https://image.z.ai/create`
- The `--persistent` flag stores the browser profile (cookies, localStorage) so auth persists
- Use `--headed` so user can see the browser and interact if needed

## z.ai Interface

- **URL:** https://image.z.ai (home/gallery), https://image.z.ai/create (creation page)
- **Textarea:** "描述你想要生成的图片..." — fill with prompt
- **Aspect ratios:** 1:1, 3:4, 4:3, 16:9, 9:16, 21:9, 9:21 (via combobox)
- **Resolutions:** 1K, 2K (via combobox)
- **"去水印" checkbox:** watermark removal (checked by default)
- **"开始生成" button:** starts generation
- **Generation result:** appears inline with "Generated" alt text on the image
- **Download:** extract actual image URL from the Next.js image proxy `/_next/image?url=<encoded_url>` and download via curl

## Download Workflow (reliable)

1. Wait for `img[alt="Generated"]` to appear
2. Extract `src` attribute → decode the `url=` parameter
3. The actual URL points to `z-ai-audio.oss-cn-hongkong.aliyuncs.com/z_image/<id>.png`
4. Download with curl (signed URL, expires in 604800s = 7 days)

## Character Images
- Use **1:1** aspect ratio, **2K** resolution
- Include "solid magenta #FF00FF background" in prompt for rembg
- Include "facing LEFT" per project convention

## Background Images
- Use **16:9** aspect ratio, **2K** resolution
- Include "no text no watermark" in prompt

## Known Issues
- The `page.goto()` during generation can cause redirects — generate and extract URL quickly
- Browser may close unexpectedly in headed mode — use single-image generation with fresh `page.goto('/create')` per image
- The generate button shows "生成中..." while processing, changes back to "开始生成" when done
