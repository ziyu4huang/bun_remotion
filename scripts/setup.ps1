<#
.SYNOPSIS
    Install all dependencies for bun-remotion workspace monorepo.

.DESCRIPTION
    Run this after cloning the repo. Checks for Bun and FFmpeg, then installs
    all workspace dependencies via `bun install`.

.EXAMPLE
    .\setup.ps1
#>

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot

Write-Host "=== bun-remotion setup ===" -ForegroundColor Cyan

# Check Bun
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Bun is not installed." -ForegroundColor Red
    Write-Host "Install from https://bun.sh/ then re-run this script." -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Bun $(bun --version)" -ForegroundColor Green

# Check FFmpeg
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Host "WARNING: FFmpeg not found in PATH. Rendering will fail." -ForegroundColor Yellow
    Write-Host "Install FFmpeg: https://ffmpeg.org/download.html" -ForegroundColor Yellow
} else {
    Write-Host "[OK] FFmpeg $(ffmpeg -version 2>&1 | Select-Object -First 1)" -ForegroundColor Green
}

# Install workspace dependencies
Write-Host ""
Write-Host "Installing workspace dependencies..." -ForegroundColor Cyan
Push-Location $RepoRoot
try {
    bun install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: bun install failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Dependencies installed" -ForegroundColor Green
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "=== Setup complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Available commands:" -ForegroundColor Yellow
Write-Host "  bun start          # ClaudeCodeIntro Studio" -ForegroundColor White
Write-Host "  bun start:stock    # TaiwanStockMarket Studio" -ForegroundColor White
Write-Host "  bun run build      # Render ClaudeCodeIntro" -ForegroundColor White
Write-Host "  bun run build:stock # Render TaiwanStockMarket" -ForegroundColor White
