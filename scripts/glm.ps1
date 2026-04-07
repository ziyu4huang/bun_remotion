<#
.SYNOPSIS
    GLM AI Assistant Wrapper Script (PowerShell)

.DESCRIPTION
    Provides a wrapper function 'glm' that interfaces with the GLM AI model
    through an Anthropic-compatible API endpoint.
    See official site: https://docs.z.ai/devpack/tool/claude

.EXAMPLE
    . .\glm.ps1
    $env:Z_AI_API_KEY = "your_api_key_here"
    glm "your prompt here"

.EXAMPLE
    .\glm.ps1 --help

.NOTES
    Set Z_AI_API_KEY before use.
    Override these env vars to customize behavior:
      Z_AI_MODEL_DEFAULT     - Default model (default: glm-5)
      Z_AI_MODEL_ALTERNATIVE - Alternative model (default: glm-5)
      Z_AI_MODE              - API mode (default: ZAI)
    Environment changes are isolated — original values are restored after the call.
#>

# Default values (always override to ensure consistency)
$env:Z_AI_MODE              = 'ZAI'
$env:Z_AI_MODEL_OPUS        = 'glm-5.1'
$env:Z_AI_MODEL_DEFAULT     = 'glm-5.1'
$env:Z_AI_MODEL_AIR         = 'glm-4.5-air'
$env:Z_AI_MODEL_ALTERNATIVE = 'glm-5.1'

function glm {
    param()

    # Validate API key
    if (-not $env:Z_AI_API_KEY) {
        Write-Error "Error: Z_AI_API_KEY is not defined. Please set it before running glm."
        Write-Error 'Example: $env:Z_AI_API_KEY = "your_api_key_here"'
        return 1
    }

    # Variables to set for this invocation
    $toSet = @{
        'ANTHROPIC_AUTH_TOKEN'           = $env:Z_AI_API_KEY
        'ANTHROPIC_BASE_URL'             = 'https://api.z.ai/api/anthropic'
        'ANTHROPIC_MODEL'                = $env:Z_AI_MODEL_DEFAULT
        'ANTHROPIC_DEFAULT_HAIKU_MODEL'  = $env:Z_AI_MODEL_AIR
        'ANTHROPIC_DEFAULT_SONNET_MODEL' = $env:Z_AI_MODEL_DEFAULT
        'ANTHROPIC_DEFAULT_OPUS_MODEL'   = $env:Z_AI_MODEL_OPUS
        'API_TIMEOUT_MS'                 = '30000000'
        'BASH_DEFAULT_TIMEOUT_MS'        = '3000000'
        'BASH_MAX_TIMEOUT_MS'            = '3000000'
        'MAX_MCP_OUTPUT_TOKENS'          = '50000'
        'DISABLE_COST_WARNINGS'          = '1'
        'CLAUDE_CONFIG_DIR'              = "$HOME\.claude-glm"
        'CLAUDE_START_CWD'               = (Get-Location).Path
    }

    # Save current values and apply new ones
    $saved = @{}
    foreach ($key in $toSet.Keys) {
        $saved[$key] = [System.Environment]::GetEnvironmentVariable($key, 'Process')
        [System.Environment]::SetEnvironmentVariable($key, $toSet[$key], 'Process')
    }

    try {
        Write-Host "Using model: $($env:ANTHROPIC_MODEL)"
        & claude @args --dangerously-skip-permissions
    }
    finally {
        # Restore original values
        foreach ($key in $saved.Keys) {
            [System.Environment]::SetEnvironmentVariable($key, $saved[$key], 'Process')
        }
    }
}

# Auto-run when executed directly (not dot-sourced)
if ($MyInvocation.InvocationName -ne '.') {
    glm @args
}
