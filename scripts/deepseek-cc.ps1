<#
.SYNOPSIS
    DeepSeek AI Assistant Wrapper Script (PowerShell)

.DESCRIPTION
    Provides a wrapper function 'deepseek' that interfaces with the DeepSeek AI model
    through an Anthropic-compatible API endpoint.
    See official site: https://api-docs.deepseek.com/guides/anthropic_api

.EXAMPLE
    . .\deepseek-cc.ps1
    $env:DEEPSEEK_API_KEY = "your_api_key_here"
    deepseek "your prompt here"

.EXAMPLE
    .\deepseek-cc.ps1 --help

.NOTES
    Set DEEPSEEK_API_KEY before use.
    Environment changes are isolated — original values are restored after the call.
#>

# Default values (always override to ensure consistency)
$env:DEEPSEEK_MODEL_DEFAULT   = 'deepseek-v4-pro[1m]'
$env:DEEPSEEK_MODEL_REASONER  = 'deepseek-v4-pro[1m]'
$env:DEEPSEEK_MODEL_AIR       = 'deepseek-v4-flash'

function deepseek {
    param()

    # Validate API key
    if (-not $env:DEEPSEEK_API_KEY) {
        Write-Error "Error: DEEPSEEK_API_KEY is not defined. Please set it before running deepseek."
        Write-Error 'Example: $env:DEEPSEEK_API_KEY = "your_api_key_here"'
        return 1
    }

    # Variables to set for this invocation
    $toSet = @{
        'ANTHROPIC_AUTH_TOKEN'                    = $env:DEEPSEEK_API_KEY
        'ANTHROPIC_BASE_URL'                      = 'https://api.deepseek.com/anthropic'
        'ANTHROPIC_MODEL'                         = $env:DEEPSEEK_MODEL_DEFAULT
        'ANTHROPIC_DEFAULT_OPUS_MODEL'            = $env:DEEPSEEK_MODEL_REASONER
        'ANTHROPIC_DEFAULT_SONNET_MODEL'          = $env:DEEPSEEK_MODEL_DEFAULT
        'ANTHROPIC_DEFAULT_HAIKU_MODEL'           = $env:DEEPSEEK_MODEL_AIR
        'CLAUDE_CODE_SUBAGENT_MODEL'              = $env:DEEPSEEK_MODEL_AIR
        'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC' = '1'
        'CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK' = '1'
        'CLAUDE_CODE_EFFORT_LEVEL'                = 'max'
        'API_TIMEOUT_MS'                          = '600000'
        'BASH_DEFAULT_TIMEOUT_MS'                 = '600000'
        'BASH_MAX_TIMEOUT_MS'                     = '600000'
        'MAX_MCP_OUTPUT_TOKENS'                   = '50000'
        'DISABLE_COST_WARNINGS'                   = '1'
        'CLAUDE_CONFIG_DIR'                       = "$HOME\.claude-deepseek"
        'CLAUDE_START_CWD'                        = (Get-Location).Path
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
    deepseek @args
}
