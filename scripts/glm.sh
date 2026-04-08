#!/usr/bin/env bash
########################################
# GLM AI Assistant Wrapper Script
#
# This script provides a wrapper function 'glm' that interfaces with the GLM AI model
# through an Anthropic-compatible API endpoint.
# See official Site : https://docs.z.ai/devpack/tool/claude
#
# USAGE:
#   1. Source this script in your shell:
#      source /opt/spec2rtl_bmad/glm.sh
#
#   2. Set your API key:
#      export Z_AI_API_KEY="your_actual_api_key_here"
#
#   3. Use the glm command:
#      glm "your prompt here"
#      glm --help  # for claude help
#
# FEATURES:
# - Runs in subshell to avoid side effects on your shell environment
# - Validates API key before execution
# - Provides clear error messages for missing configuration
# - Uses default models if not overridden
#
# CUSTOMIZATION:
# Override these environment variables if needed:
#   Z_AI_MODEL_DEFAULT="glm-5-turbo"   # Default model to use
#   Z_AI_MODEL_ALTERNATIVE="glm-4.5v" # Alternative model
#   Z_AI_MODE="ZAI"                  # API mode
########################################

# Default values (only set if not already defined)
: "${Z_AI_MODE:="ZAI"}"
: "${Z_AI_MODEL_OPUS:="glm-5.1"}"
: "${Z_AI_MODEL_DEFAULT:="glm-5.1"}"
: "${Z_AI_MODEL_AIR:="glm-4.5-air"}"
: "${Z_AI_MODEL_ALTERNATIVE:="glm-5.1"}"

glm()
{
  # Check if Z_AI_API_KEY is defined
  if [ -z "${Z_AI_API_KEY:-}" ]; then
    echo "Error: Z_AI_API_KEY is not defined. Please set it before running glm." >&2
    echo "Example: export Z_AI_API_KEY=\"your_api_key_here\"" >&2
    return 1
  fi

  # Run in subshell to avoid side effects
  (
    # Set environment variables for this command only
    # export ANTHROPIC_AUTH_TOKEN="${Z_AI_API_KEY}"
    export ANTHROPIC_AUTH_TOKEN="${Z_AI_API_KEY}"
    export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"
    export ANTHROPIC_MODEL="${Z_AI_MODEL_DEFAULT}"
    export ANTHROPIC_DEFAULT_HAIKU_MODEL="${Z_AI_MODEL_AIR}"
    export ANTHROPIC_DEFAULT_SONNET_MODEL="${Z_AI_MODEL_DEFAULT}"
    export ANTHROPIC_DEFAULT_OPUS_MODEL="${Z_AI_MODEL_OPUS}"
    echo "Using model: ${ANTHROPIC_MODEL}"
    export API_TIMEOUT_MS=30000000
    export BASH_DEFAULT_TIMEOUT_MS=3000000
    export BASH_MAX_TIMEOUT_MS=3000000
    export MAX_MCP_OUTPUT_TOKENS=50000
    export DISABLE_COST_WARNINGS=1
    export CLAUDE_CONFIG_DIR="${HOME}/.claude-glm"
    # Set the starting working directory for Claude Code
    export CLAUDE_START_CWD="${PWD}"

    exec claude "$@" --dangerously-skip-permissions
    #exec claude "$@"
  )
}

# Auto-run when executed directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    glm "$@"
fi
