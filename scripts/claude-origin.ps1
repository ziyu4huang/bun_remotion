<#
.SYNOPSIS
    Claude Original Wrapper Script (PowerShell)

.DESCRIPTION
    Runs the original Claude CLI with a clean environment,
    resetting all GLM-related variables to ensure 100% original Claude behavior.

    Environment changes are isolated — original values are restored after the call.

.EXAMPLE
    . .\claude-origin.ps1
    claude-origin

.EXAMPLE
    .\claude-origin.ps1 --help

.NOTES
    - Saves and restores all modified env vars (no permanent side effects)
    - Resets CLAUDE_CONFIG_DIR to default ~/.claude
    - Equivalent to the bash claude-origin.sh
#>

function claude-origin {
    param()

    # Variables to unset for clean Claude environment
    $varsToUnset = @(
        # GLM API configuration
        'ANTHROPIC_AUTH_TOKEN',
        'ANTHROPIC_BASE_URL',
        'ANTHROPIC_MODEL',
        'ANTHROPIC_DEFAULT_HAIKU_MODEL',
        'ANTHROPIC_DEFAULT_SONNET_MODEL',
        'ANTHROPIC_DEFAULT_OPUS_MODEL',
        # Timeout settings
        'API_TIMEOUT_MS',
        'BASH_DEFAULT_TIMEOUT_MS',
        'BASH_MAX_TIMEOUT_MS',
        'MAX_MCP_OUTPUT_TOKENS',
        'DISABLE_COST_WARNINGS',
        # Claude config
        'CLAUDE_CONFIG_DIR',
        # Claude Team variables
        'CLAUDE_START_CWD',
        'CLAUDE_TEAM',
        'CLAUDE_USE_TEAM',
        'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS',
        # GLM API key (was missing — this is the critical one)
        'Z_AI_API_KEY',
        # GLM model defaults
        'Z_AI_MODE',
        'Z_AI_MODEL_OPUS',
        'Z_AI_MODEL_DEFAULT',
        'Z_AI_MODEL_AIR',
        'Z_AI_MODEL_ALTERNATIVE',
        # Team-specific config
        'CLAUDE_TEAM_ID',
        'CLAUDE_TEAM_MEMORY',
        # Other GLM-related variables
        'Z_AI_BASE_URL',
        'GLM_MODE'
    )

    # Save current values and unset
    $saved = @{}
    foreach ($var in $varsToUnset) {
        $saved[$var] = [System.Environment]::GetEnvironmentVariable($var, 'Process')
        [System.Environment]::SetEnvironmentVariable($var, $null, 'Process')
    }

    # Explicitly point to the original ~/.claude config, not ~/.claude-glm
    $savedConfigDir = [System.Environment]::GetEnvironmentVariable('CLAUDE_CONFIG_DIR', 'Process')
    $defaultConfigDir = [System.IO.Path]::Combine($env:USERPROFILE, '.claude')
    [System.Environment]::SetEnvironmentVariable('CLAUDE_CONFIG_DIR', $defaultConfigDir, 'Process')

    try {
        Write-Host "Running original Claude with clean environment..."
        Write-Host "  Config dir: $defaultConfigDir"
        & claude @args --dangerously-skip-permissions
    }
    finally {
        # Restore original values
        foreach ($var in $saved.Keys) {
            [System.Environment]::SetEnvironmentVariable($var, $saved[$var], 'Process')
        }
        # Restore CLAUDE_CONFIG_DIR (may have been null if unset)
        [System.Environment]::SetEnvironmentVariable('CLAUDE_CONFIG_DIR', $savedConfigDir, 'Process')
    }
}

# Auto-run when executed directly (not dot-sourced)
if ($MyInvocation.InvocationName -ne '.') {
    claude-origin @args
}
