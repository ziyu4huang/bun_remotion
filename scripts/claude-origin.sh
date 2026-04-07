#!/usr/bin/env bash
########################################
# Claude Original Wrapper Script
#
# This script runs the original Claude CLI with a clean environment,
# resetting all GLM-related variables to ensure 100% original Claude behavior.
#
# USAGE:
#   1. Source and run directly:
#      source /home/ziyu4huang/agent_builder/scripts/claude-origin.sh
#
#   2. Or run as a command:
#      bash /home/ziyu4huang/agent_builder/scripts/claude-origin.sh [claude args...]
#
# FEATURES:
# - Runs in subshell to avoid side effects on current shell
# - Unsets all GLM/Team-related environment variables
# - Resets CLAUDE_CONFIG_DIR to default ~/.claude/
# - Does NOT modify current shell environment
########################################

claude-origin()
{
  # Run in subshell to avoid side effects on current environment
  (
    # --- Unset GLM API configuration ---
    unset ANTHROPIC_AUTH_TOKEN
    unset ANTHROPIC_BASE_URL
    unset ANTHROPIC_MODEL
    unset ANTHROPIC_DEFAULT_HAIKU_MODEL
    unset ANTHROPIC_DEFAULT_SONNET_MODEL
    unset ANTHROPIC_DEFAULT_OPUS_MODEL

    # --- Unset timeout settings ---
    unset API_TIMEOUT_MS
    unset BASH_DEFAULT_TIMEOUT_MS
    unset BASH_MAX_TIMEOUT_MS
    unset MAX_MCP_OUTPUT_TOKENS
    unset DISABLE_COST_WARNINGS

    # --- Reset Claude config directory to default ---
    unset CLAUDE_CONFIG_DIR
    # Explicitly set to default if needed
    #export CLAUDE_CONFIG_DIR="${HOME}/.claude"

    # --- Unset Claude Team variables ---
    unset CLAUDE_START_CWD
    unset CLAUDE_TEAM
    unset CLAUDE_USE_TEAM
    unset CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS

    # --- Unset GLM model defaults ---
    unset Z_AI_MODE
    unset Z_AI_MODEL_OPUS
    unset Z_AI_MODEL_DEFAULT
    unset Z_AI_MODEL_AIR
    unset Z_AI_MODEL_ALTERNATIVE

    # --- Unset Team-specific config ---
    unset CLAUDE_TEAM_ID
    unset CLAUDE_TEAM_MEMORY

    # --- Unset any other GLM-related variables ---
    unset Z_AI_BASE_URL
    unset GLM_MODE

    echo "Running original Claude with clean environment..."
    #exec claude "$@"
    exec claude "$@" --dangerously-skip-permissions
  )
}

# Auto-run when executed directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    claude-origin "$@"
fi
