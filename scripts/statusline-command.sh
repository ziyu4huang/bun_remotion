#!/bin/bash
# =============================================================================
# Claude Code Status Line Script
# =============================================================================
#
# WHAT IS THIS FILE?
# ------------------
# This script is used by Claude Code to render a custom status line at the
# bottom of the terminal. It reads a JSON payload (piped via stdin) from
# Claude Code's internal state and outputs a single formatted line.
#
# OUTPUT FORMAT:
#   Model | agent_builder | Ctx: 5.2% | Tokens: 12345
#
#   - Model:   Display name of the current LLM model
#   - Folder:  Name of the current working directory
#   - Ctx:     Percentage of the context window currently used
#   - Tokens:  Total accumulated tokens (input + output) in this session
#
# WHERE IS THE LIVE COPY?
# -----------------------
# The active copy Claude Code reads depends on the CLAUDE_CONFIG_DIR:
#
#   Default claude:          ~/.claude/statusline-command.sh
#   claude-glm variant:      ~/.claude-glm/statusline-command.sh
#   claude-deepseek variant: ~/.claude-deepseek/statusline-command.sh
#
# This file in ./scripts/ is a reference backup.
#
# HOW TO INSTALL / UPDATE?
# ------------------------
# Determine your config directory based on which Claude variant you use:
#
#   # For default claude
#   cp scripts/statusline-command.sh ~/.claude/statusline-command.sh
#   chmod +x ~/.claude/statusline-command.sh
#
#   # For claude-glm (see scripts/glm for config)
#   cp scripts/statusline-command.sh ~/.claude-glm/statusline-command.sh
#   chmod +x ~/.claude-glm/statusline-command.sh
#
#   # For claude-deepseek
#   cp scripts/statusline-command.sh ~/.claude-deepseek/statusline-command.sh
#   chmod +x ~/.claude-deepseek/statusline-command.sh
#
# HOW TO CONFIGURE CLAUDE TO USE THIS?
# -------------------------------------
# Claude Code reads statusline settings from the config directory's settings.json.
#
#   # For default claude (~/.claude/settings.json)
#   {
#     "statusLine": {
#       "type": "command",
#       "command": "bash ~/.claude/statusline-command.sh"
#     }
#   }
#
#   # For claude-glm (~/.claude-glm/settings.json)
#   {
#     "statusLine": {
#       "type": "command",
#       "command": "bash ~/.claude-glm/statusline-command.sh"
#     }
#   }
#
# TIP: Use /statusline skill to auto-detect and configure based on your environment.
#
# HOW IT WORKS (INPUT FORMAT):
# ----------------------------
# Claude Code pipes a JSON object to this script's stdin. Key fields used:
#
#   .model.display_name                → string, e.g. "Claude 3.5 Sonnet"
#   .context_window.used_percentage    → float, e.g. 5.2
#   .context_window.total_input_tokens → int
#   .context_window.total_output_tokens→ int
#   .workspace.current_dir             → string, absolute path
#
# =============================================================================

input=$(cat)

# Extract model display name
model=$(echo "$input" | jq -r '.model.display_name // empty')

# Extract context usage percentage
used=$(echo "$input" | jq -r '.context_window.used_percentage // empty')

# Extract current folder name
folder=$(echo "$input" | jq -r '.workspace.current_dir // empty' | xargs basename 2>/dev/null)

# Extract accumulated token usage
total_input=$(echo "$input" | jq -r '.context_window.total_input_tokens // 0')
total_output=$(echo "$input" | jq -r '.context_window.total_output_tokens // 0')
total_tokens=$((total_input + total_output))

# Build status parts
parts=()

# Add model name
if [ -n "$model" ]; then
    parts+=("$model")
fi

# Add folder name
if [ -n "$folder" ]; then
    parts+=("$folder")
fi

# Add context usage percentage (show 0 if not available)
parts+=("Ctx: ${used:-0}%")

# Add total tokens (show 0 if not available)
parts+=("Tokens: ${total_tokens}")

# Join with ' | ' separator and output (IFS trick only uses first char, use loop instead)
if [ ${#parts[@]} -gt 0 ]; then
    result="${parts[0]}"
    for part in "${parts[@]:1}"; do
        result+=" | $part"
    done
    printf "%s" "$result"
fi
