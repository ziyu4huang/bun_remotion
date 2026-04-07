#!/usr/bin/env bash
########################################
# DeepSeek AI Assistant Wrapper Script
#
# This script provides a wrapper function 'deepseek' that interfaces with the DeepSeek AI model
# through an Anthropic-compatible API endpoint.
# See official Site : https://api-docs.deepseek.com/guides/anthropic_api
#
# USAGE:
#   1. Source this script in your shell:
#      source /path/to/deepseek-cc.sh
#
#   2. Set your API key:
#      export DEEPSEEK_API_KEY="your_actual_api_key_here"
#
#   3. Use the deepseek command:
#      deepseek "your prompt here"
#      deepseek --help  # for claude help
#
# FEATURES:
# - Runs in subshell to avoid side effects on your shell environment
# - Validates API key before execution
# - Provides clear error messages for missing configuration
# - Uses default models if not overridden
#
# CUSTOMIZATION:
# Override these environment variables if needed:
#   DEEPSEEK_MODEL_DEFAULT="deepseek-chat"      # Default model to use
#   DEEPSEEK_MODEL_REASONER="deepseek-reasoner" # Reasoning/Opus-equivalent model
#   DEEPSEEK_MODEL_AIR="deepseek-chat"          # Fast/Haiku-equivalent model
########################################

# Default values (only set if not already defined)
: "${DEEPSEEK_MODEL_DEFAULT:="deepseek-chat"}"
: "${DEEPSEEK_MODEL_REASONER:="deepseek-reasoner"}"
: "${DEEPSEEK_MODEL_AIR:="deepseek-chat"}"

deepseek()
{
  # Check if DEEPSEEK_API_KEY is defined
  if [ -z "${DEEPSEEK_API_KEY:-}" ]; then
    echo "Error: DEEPSEEK_API_KEY is not defined. Please set it before running deepseek." >&2
    echo "Example: export DEEPSEEK_API_KEY=\"your_api_key_here\"" >&2
    return 1
  fi

  # Run in subshell to avoid side effects
  (
    # Set environment variables for this command only
    export ANTHROPIC_AUTH_TOKEN="${DEEPSEEK_API_KEY}"
    export ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic"
    export ANTHROPIC_MODEL="${DEEPSEEK_MODEL_DEFAULT}"
    export ANTHROPIC_DEFAULT_HAIKU_MODEL="${DEEPSEEK_MODEL_AIR}"
    export ANTHROPIC_DEFAULT_SONNET_MODEL="${DEEPSEEK_MODEL_DEFAULT}"
    export ANTHROPIC_DEFAULT_OPUS_MODEL="${DEEPSEEK_MODEL_REASONER}"
    echo "Using model: ${ANTHROPIC_MODEL}"
    export API_TIMEOUT_MS=600000
    export BASH_DEFAULT_TIMEOUT_MS=600000
    export BASH_MAX_TIMEOUT_MS=600000
    export MAX_MCP_OUTPUT_TOKENS=50000
    export DISABLE_COST_WARNINGS=1
    export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
    export CLAUDE_CONFIG_DIR="${HOME}/.claude-deepseek"
    # Set the starting working directory for Claude Code
    export CLAUDE_START_CWD="${PWD}"

    exec claude "$@" --dangerously-skip-permissions
  )
}

# Auto-run when executed directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    deepseek "$@"
fi
