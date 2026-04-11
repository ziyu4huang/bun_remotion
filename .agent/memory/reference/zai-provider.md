---
name: zai-provider
description: z.ai API provider setup — env var naming, model IDs, compatibility notes
type: reference
---

# z.ai Provider (pi-ai)

## Env Var
- Actual key: `Z_AI_API_KEY` (with underscore between Z and AI)
- pi-ai expects: `ZAI_API_KEY` (no underscore)
- **Solution**: `export ZAI_API_KEY=$Z_AI_API_KEY` added to `~/.zshrc`

## Provider Name in pi-ai
`"zai"` — used in `getModel("zai", "glm-4.6")` and `getEnvApiKey("zai")`

## Model IDs
- `glm-4.5` — reasoning, text only
- `glm-4.5-air` — reasoning, text only (lighter)
- `glm-4.5-flash` — reasoning, text only (fastest)
- `glm-4.5v` — reasoning, text + image
- `glm-4.6` — reasoning, text only, supports tool streaming (`zaiToolStream: true`)
- `glm-4.6v` — reasoning, text + image, supports tool streaming

## API Details
- Uses `openai-completions` API
- `thinkingFormat: "zai"` (top-level `enable_thinking: true`)
- `supportsDeveloperRole: false`
- `supportsStrictMode: true` (default)

## How to Apply
When using pi-ai with z.ai models, always:
1. Ensure `ZAI_API_KEY` is set (aliased from `Z_AI_API_KEY`)
2. Use `"zai"` as provider name
3. Use exact model IDs from the list above
