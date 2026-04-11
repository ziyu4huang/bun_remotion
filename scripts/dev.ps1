<#
.SYNOPSIS
    Run Remotion commands for any workspace app without changing directory.

.DESCRIPTION
    Handles cd internally via Push-Location/Pop-Location so the caller's
    working directory is never modified. Safe for Claude Code agent usage.

.EXAMPLE
    pwsh scripts/dev.ps1 studio claude-code-intro
    pwsh scripts/dev.ps1 studio taiwan-stock-market
    pwsh scripts/dev.ps1 render claude-code-intro
    pwsh scripts/dev.ps1 render taiwan-stock-market
    pwsh scripts/dev.ps1 render-all
#>

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot

# Use system Chrome instead of per-app downloaded chrome-headless-shell
$env:REMOTION_CHROME_EXECUTABLE_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

$Apps = @{
    "claude-code-intro"    = @{ comp = "ClaudeCodeIntro";        out = "out/claude-code-intro.mp4" }
    "taiwan-stock-market"  = @{ comp = "TaiwanStockMarket";      out = "out/taiwan-stock-market.mp4" }
    "three-little-pigs"    = @{ comp = "ThreeLittlePigs";        out = "out/three-little-pigs.mp4" }
    "galgame-youth-jokes"  = @{ comp = "GalgameYouthJokes";      out = "out/galgame-youth-jokes.mp4" }
    "galgame-meme-theater" = @{ comp = "GalgameMemeTheater";     out = "out/galgame-meme-theater.mp4" }
    "galgame-meme-theater-ep2" = @{ comp = "GalgameMemeTheaterEp2"; out = "out/galgame-meme-theater-ep2.mp4" }
}

function Show-Usage {
    Write-Host "Usage: pwsh scripts/dev.ps1 <command> [app]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Cyan
    Write-Host "  studio <app>    Open Remotion Studio for an app"
    Write-Host "  render <app>    Render an app to MP4"
    Write-Host "  render-all      Render all apps"
    Write-Host ""
    Write-Host "Apps:" -ForegroundColor Cyan
    $Apps.Keys | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
}

function Invoke-App {
    param(
        [string]$AppName,
        [string]$Command
    )

    if (-not $Apps.ContainsKey($AppName)) {
        Write-Host "ERROR: Unknown app '$AppName'" -ForegroundColor Red
        Write-Host "Available: $($Apps.Keys -join ', ')" -ForegroundColor Yellow
        exit 1
    }

    $AppDir = Join-Path $RepoRoot "bun_remotion_proj" $AppName

    if (-not (Test-Path $AppDir)) {
        Write-Host "ERROR: App directory not found: $AppDir" -ForegroundColor Red
        exit 1
    }

    $App = $Apps[$AppName]

    Push-Location $AppDir
    try {
        switch ($Command) {
            "studio" {
                Write-Host "[$AppName] Opening Remotion Studio..." -ForegroundColor Cyan
                bun run start
            }
            "render" {
                Write-Host "[$AppName] Rendering $($App.comp) -> $($App.out)..." -ForegroundColor Cyan
                bun run build
            }
        }
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Command failed for $AppName" -ForegroundColor Red
            exit $LASTEXITCODE
        }
    } finally {
        Pop-Location
    }
}

# --- Main ---

if ($args.Count -eq 0) {
    Show-Usage
    exit 0
}

$Command = $args[0]

switch ($Command) {
    "studio" {
        if ($args.Count -lt 2) {
            Write-Host "ERROR: Specify an app name. e.g. studio claude-code-intro" -ForegroundColor Red
            exit 1
        }
        Invoke-App -AppName $args[1] -Command "studio"
    }
    "render" {
        if ($args.Count -lt 2) {
            Write-Host "ERROR: Specify an app name. e.g. render claude-code-intro" -ForegroundColor Red
            exit 1
        }
        Invoke-App -AppName $args[1] -Command "render"
    }
    "render-all" {
        foreach ($AppName in $Apps.Keys) {
            Invoke-App -AppName $AppName -Command "render"
            Write-Host ""
        }
        Write-Host "All renders complete." -ForegroundColor Green
    }
    default {
        Write-Host "ERROR: Unknown command '$Command'" -ForegroundColor Red
        Show-Usage
        exit 1
    }
}
