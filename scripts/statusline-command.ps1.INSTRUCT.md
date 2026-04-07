# Statusline Setup Instructions (Windows PowerShell)

## Overview

The `statusline-command.ps1` script renders a custom status line at the bottom of the Claude Code terminal on Windows, displaying:

```
Model | folder_name | Ctx: 5.2% | Tokens: 12345
```

## Claude Config Directory (Windows)

| Variant | Config Directory |
|---------|-----------------|
| `claude` (default) | `C:\Users\<user>\.claude` |

## Setup Process

### 1. Copy the script

```powershell
Copy-Item scripts\statusline-command.ps1 "$env:USERPROFILE\.claude\statusline-command.ps1"
```

### 2. Update settings.json

`C:\Users\<user>\.claude\settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "pwsh -NoProfile -ExecutionPolicy Bypass -File C:/Users/<user>/.claude/statusline-command.ps1"
  }
}
```

### 3. Restart Claude Code

The statusline config is read at startup — a full restart is required.

## Critical Notes (Lessons Learned)

### Do NOT use `cmd /c pwsh ...`

```json
// WRONG - cmd.exe injects "Microsoft Windows [Version...]" into statusline output
"command": "cmd /c pwsh -NoProfile -File C:/.../.claude/statusline-command.ps1"

// CORRECT - invoke pwsh directly
"command": "pwsh -NoProfile -ExecutionPolicy Bypass -File C:/.../.claude/statusline-command.ps1"
```

### Always use `-ExecutionPolicy Bypass`

Without it, Windows may block the unsigned script when Claude Code (Node.js) invokes it as an external process, even if your interactive PowerShell session already has a permissive policy.

### Use forward slashes in the path

```json
// WRONG
"command": "pwsh ... -File C:\\Users\\...\\statusline-command.ps1"

// CORRECT
"command": "pwsh ... -File C:/Users/.../.claude/statusline-command.ps1"
```

## Testing the Script

Verify the script works before restarting Claude Code:

```powershell
'{"model":{"display_name":"Claude Sonnet 4.6"},"context_window":{"used_percentage":5.2,"total_input_tokens":100,"total_output_tokens":50},"workspace":{"current_dir":"C:/Users/ziyu4/proj/dev_game"}}' | pwsh -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\statusline-command.ps1"
```

Expected output:
```
Claude Sonnet 4.6 | dev_game | Ctx: 5.2% | Tokens: 150
```

## Input JSON Fields

| Field | Description |
|-------|-------------|
| `.model.display_name` | Model name (e.g., "Claude Sonnet 4.6") |
| `.workspace.current_dir` | Current working directory path |
| `.context_window.used_percentage` | Context window usage percentage |
| `.context_window.total_input_tokens` | Total input tokens |
| `.context_window.total_output_tokens` | Total output tokens |

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Shows "Microsoft Windows [Vers…" | `cmd /c` wrapper used | Remove `cmd /c`, use `pwsh` directly |
| Statusline empty / not showing | Script blocked by execution policy | Add `-ExecutionPolicy Bypass` |
| Wrong path error | Backslashes in JSON path | Use forward slashes in the command path |
| Statusline not updating after config change | Claude Code caches settings at startup | Fully restart Claude Code |

## Related

- Use `/statusline` skill to trigger auto-configuration
- Source script: `scripts/statusline-command.ps1`
- Bash equivalent: `scripts/statusline-command.sh` + `scripts/statusline-command.sh.INSTRUCT.md`
