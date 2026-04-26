# Legacy: Google AI Studio (FALLBACK)

Only use if image.z.ai is down or user requests it.

1. Open: `playwright-cli open https://aistudio.google.com/prompts/new_chat`
2. Select "Image Generation" → "Nano Banana" (free)
3. Use `run-code`: fill textbox → click Run → wait "Response ready." → click image → Download
4. Selectors: textbox `{ name: 'Enter a prompt' }`, Run button `has-text('Run')`, img `{ name: /Generated Image/ }`
5. Always press Escape after download to dismiss overlay

See git history (v3.0.0) for full Nano Banana workflow details.
