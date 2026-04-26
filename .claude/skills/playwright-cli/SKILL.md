---
name: playwright-cli
description: Automate browser interactions, test web pages and work with Playwright tests.
allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(npm:*)
---

# Browser Automation with playwright-cli

## Quick start

```bash
playwright-cli open
playwright-cli goto https://playwright.dev
playwright-cli click e15
playwright-cli type "page.click"
playwright-cli press Enter
playwright-cli snapshot
playwright-cli close
```

## Installation

```bash
npx --no-install playwright-cli --version  # check local
npm install -g @playwright/cli@latest       # install if missing
# Use npx playwright-cli for all commands if not global
```

## Command Reference

Read [`references/commands.md`](references/commands.md) for full command syntax: core, navigation, keyboard, mouse, tabs, storage, network, DevTools, raw output, sessions, targeting, snapshots.

## Specific Topics

| Topic | File |
|-------|------|
| Playwright tests | [references/playwright-tests.md](references/playwright-tests.md) |
| Request mocking | [references/request-mocking.md](references/request-mocking.md) |
| Running code | [references/running-code.md](references/running-code.md) |
| Session management | [references/session-management.md](references/session-management.md) |
| Storage state | [references/storage-state.md](references/storage-state.md) |
| Test generation | [references/test-generation.md](references/test-generation.md) |
| Tracing | [references/tracing.md](references/tracing.md) |
| Video recording | [references/video-recording.md](references/video-recording.md) |
| Element attributes | [references/element-attributes.md](references/element-attributes.md) |

## Examples

**Form submission:**
```bash
playwright-cli open https://example.com/form
playwright-cli snapshot
playwright-cli fill e1 "user@example.com"
playwright-cli fill e2 "password123"
playwright-cli click e3
playwright-cli snapshot
playwright-cli close
```

**Debugging:**
```bash
playwright-cli open https://example.com
playwright-cli click e4
playwright-cli console
playwright-cli network
playwright-cli close
```
