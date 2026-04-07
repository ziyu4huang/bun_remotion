# Statusline Setup Instructions

## Overview

The `statusline-command.sh` script renders a custom status line at the bottom of the Claude Code terminal, displaying:

```
Model | folder_name | Ctx: 5.2% | Tokens: 12345
```

## Claude Config Directories

Different Claude variants use different `CLAUDE_CONFIG_DIR` paths:

| Variant | Config Directory |
|---------|------------------|
| `claude` (default) | `~/.claude` |
| `claude-glm` | `~/.claude-glm` |
| `claude-deepseek` | `~/.claude-deepseek` |

## Setup Process

For each config directory, you need to:

1. **Copy the script** to the config directory
2. **Make it executable**
3. **Update settings.json** to reference the correct path

### Automated Setup Commands

```bash
# List of known config directories
CONFIG_DIRS=(
  "$HOME/.claude"
  "$HOME/.claude-glm"
  "$HOME/.claude-deepseek"
)

# Source script location
SOURCE_SCRIPT="/opt/ziyu_ws/atm/agent_team_maker__db/scripts/statusline-command.sh"

for config_dir in "${CONFIG_DIRS[@]}"; do
  # Create directory if needed
  mkdir -p "$config_dir"

  # Copy and make executable
  cp "$SOURCE_SCRIPT" "$config_dir/statusline-command.sh"
  chmod +x "$config_dir/statusline-command.sh"

  echo "Installed to $config_dir"
done
```

### settings.json Configuration

Each config directory needs a `settings.json` with the statusline entry pointing to its own script:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash ~/.claude/statusline-command.sh"
  }
}
```

**Important**: The `command` path must match the config directory:
- `~/.claude` → `"command": "bash ~/.claude/statusline-command.sh"`
- `~/.claude-glm` → `"command": "bash ~/.claude-glm/statusline-command.sh"`
- `~/.claude-deepseek` → `"command": "bash ~/.claude-deepseek/statusline-command.sh"`

## Agent Prompt Template

When asked to configure statusline, use this prompt pattern:

```
Configure statusline for all Claude config directories.

1. Read scripts/statusline-command.sh to understand the script
2. Detect existing Claude config directories (~/.claude*, ~/.claude-*)
3. For each config directory:
   - Copy the statusline script
   - Make it executable
   - Update settings.json to use the correct path for that directory
4. Verify all installations
```

## Input JSON Fields

The script receives JSON via stdin with these fields:

| Field | Description |
|-------|-------------|
| `.model.display_name` | Model name (e.g., "glm-5", "Claude 3.5 Sonnet") |
| `.workspace.current_dir` | Current working directory path |
| `.context_window.used_percentage` | Context window usage percentage |
| `.context_window.total_input_tokens` | Total input tokens |
| `.context_window.total_output_tokens` | Total output tokens |

## Troubleshooting

1. **Statusline not showing**: Ensure `jq` is installed (required for JSON parsing)
2. **Wrong path in settings**: Each config dir must reference its own script copy
3. **Script not executable**: Run `chmod +x ~/.claude*/statusline-command.sh`

## Related

- Use `/statusline` skill to trigger auto-configuration
- Source script: `scripts/statusline-command.sh`
