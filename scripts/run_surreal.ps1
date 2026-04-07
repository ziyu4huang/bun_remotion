# SurrealDB Server Start Script (PowerShell / Windows)
# Mirrors scripts/run_surreal.sh — auto-downloads the latest 3.x binary if needed

param(
    [Alias("u")][string]$User      = $env:SURREAL_USER ?? "root",
    [Alias("p")][string]$Pass      = $env:PASS         ?? "root",
    [Alias("b")][string]$Bind      = $env:BIND         ?? "0.0.0.0:8000",
    [Alias("t")][string]$Type      = $env:DB_TYPE      ?? "surrealkv",
    [Alias("d")][string]$DbName    = $env:DB_NAME      ?? "mydatabase",
    [string]$Path                  = $env:DB_PATH      ?? "kg_data",
    [string]$LogLevel              = $env:LOG_LEVEL    ?? "info",
    [string]$LogFormat             = $env:LOG_FORMAT   ?? "text",
    [switch]$Debug,
    [switch]$Trace,
    [switch]$LogFile,
    [string]$LogFilePath           = "",
    [switch]$Help,
    [switch]$NoDownload
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Paths ──────────────────────────────────────────────────────────────────────
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$LocalBin    = Join-Path $ProjectRoot "bin\surreal.exe"
$ReadmePath  = Join-Path $ScriptDir  "run_surreal.README.md"

# ── Help ───────────────────────────────────────────────────────────────────────
function Show-Help {
    Write-Host @"
SurrealDB Server Start Script (PowerShell)
==========================================

Usage: .\run_surreal.ps1 [OPTIONS]

Options:
  -User, -u USER        Username (default: root)
  -Pass, -p PASS        Password (default: root)
  -Bind, -b ADDR        Bind address (default: 0.0.0.0:8000)
                          Use 127.0.0.1:8000 for local-only
  -Type, -t TYPE        Storage backend:
                          surrealkv  - default, Rust-native, Time Travel
                          rocksdb    - high-performance SSD
                          memory     - ephemeral (testing)
                          tikv       - distributed clusters
  -DbName, -d NAME      Database name (default: mydatabase)
  -Path PATH            Storage path   (default: kg_data)

Logging:
  -Debug                Set log level to debug
  -Trace                Set log level to trace (most verbose)
  -LogLevel LEVEL       none | error | warn | info | debug | trace
  -LogFormat FMT        text | json  (default: text)
  -LogFile              Enable file logging
  -LogFilePath DIR      Directory for log file  (default: logs)

Misc:
  -NoDownload           Do not auto-download; fail if binary missing
  -Help                 Show this help

Examples:
  .\run_surreal.ps1
  .\run_surreal.ps1 -Debug
  .\run_surreal.ps1 -Trace -LogFile -LogFilePath C:\logs\surrealdb
  .\run_surreal.ps1 -Bind 127.0.0.1:8000 -User admin -Pass secret -Path D:\db
  .\run_surreal.ps1 -Type rocksdb -Path D:\surrealdb
  .\run_surreal.ps1 -Type memory

Storage Types:
  surrealkv   Most users. Single-node persistence, Rust-native, Time Travel.
  rocksdb     High-performance SSD workloads where Time Travel isn't needed.
  memory      Testing/Development. Data is lost when the server stops.
  tikv        Huge, distributed clusters spanning multiple servers.
"@
}

if ($Help) { Show-Help; exit 0 }

# ── Log-level shortcuts ────────────────────────────────────────────────────────
if ($Trace)  { $LogLevel = "trace" }
if ($Debug)  { $LogLevel = "debug" }

# ── Auto-download ──────────────────────────────────────────────────────────────
function Get-LatestSurrealVersion {
    <#  Queries GitHub releases API and returns the highest v3.x.x tag. #>
    $apiUrl  = "https://api.github.com/repos/surrealdb/surrealdb/releases"
    $headers = @{ "User-Agent" = "run_surreal.ps1"; "Accept" = "application/vnd.github+json" }
    try {
        $releases = Invoke-RestMethod -Uri $apiUrl -Headers $headers -TimeoutSec 15
    } catch {
        throw "Failed to query GitHub releases API: $_"
    }
    $version = $releases |
        Where-Object { $_.tag_name -match '^v3\.\d+\.\d+$' -and -not $_.prerelease } |
        ForEach-Object { [version]($_.tag_name.TrimStart('v')) } |
        Sort-Object -Descending |
        Select-Object -First 1
    if (-not $version) { throw "No stable v3.x.x release found on GitHub." }
    return "v$version"
}

function Install-SurrealBin ([string]$Destination) {
    # ── Agent / user notice ────────────────────────────────────────────────────
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════╗"
    Write-Host "║  SURREAL BINARY MISSING                                      ║"
    Write-Host "║                                                              ║"
    Write-Host "║  Agent: read scripts/run_surreal.README.md for full          ║"
    Write-Host "║  download instructions, then place the binary at:            ║"
    Write-Host "║    $Destination"
    Write-Host "║                                                              ║"
    Write-Host "║  Attempting auto-download now...                             ║"
    Write-Host "╚══════════════════════════════════════════════════════════════╝"
    Write-Host ""

    $tag      = Get-LatestSurrealVersion
    $fileName = "surreal-$tag.windows-amd64.exe"
    $url      = "https://github.com/surrealdb/surrealdb/releases/download/$tag/$fileName"

    $destDir  = Split-Path -Parent $Destination
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }

    Write-Host "  Version : $tag"
    Write-Host "  URL     : $url"
    Write-Host "  Target  : $Destination"

    $tmp = [System.IO.Path]::GetTempFileName() + ".exe"
    try {
        Invoke-WebRequest -Uri $url -OutFile $tmp -UseBasicParsing
        Move-Item -Path $tmp -Destination $Destination -Force
        Write-Host "  Done."
    } catch {
        if (Test-Path $tmp) { Remove-Item $tmp -Force }
        Write-Host ""
        Write-Host "Download failed. Agent: read '$ReadmePath' for manual download steps."
        throw "Download failed: $_"
    }
}

# ── Resolve binary ─────────────────────────────────────────────────────────────
if (-not (Test-Path $LocalBin)) {
    if ($NoDownload) {
        Write-Host ""
        Write-Host "ERROR: SurrealDB binary not found at '$LocalBin'."
        Write-Host "Agent: read '$ReadmePath' for download instructions."
        exit 1
    }
    Install-SurrealBin $LocalBin
}

$SurrealBin = $LocalBin

# ── Validate storage type ──────────────────────────────────────────────────────
switch ($Type) {
    { $_ -in "surrealkv","rocksdb","tikv" } { $StorageEndpoint = "${Type}://${Path}" }
    "memory"                                { $StorageEndpoint = "memory" }
    default {
        Write-Error "Invalid storage type '$Type'. Use: surrealkv, rocksdb, memory, or tikv"
        exit 1
    }
}

# ── Print summary ──────────────────────────────────────────────────────────────
$maskedPass = "*" * $Pass.Length
Write-Host ""
Write-Host "Starting SurrealDB..."
Write-Host "  Binary   : $SurrealBin"
Write-Host "  Bind     : $Bind"
Write-Host "  User     : $User"
Write-Host "  Password : $maskedPass"
Write-Host "  Storage  : $StorageEndpoint"
Write-Host "  LogLevel : $LogLevel"
if ($Type -ne "memory") { Write-Host "  DB Path  : $Path" }
if ($LogFile)           { Write-Host "  Log File : $(if ($LogFilePath) { $LogFilePath } else { 'logs' })\surrealdb.log" }
Write-Host ""

# ── Build argument list ────────────────────────────────────────────────────────
$args_list = @(
    "start",
    "--user",       $User,
    "--pass",       $Pass,
    "--bind",       $Bind,
    "--log",        $LogLevel,
    "--log-format", $LogFormat
)

if ($LogFile) {
    $args_list += "--log-file-enabled"
    if ($LogFilePath) { $args_list += @("--log-file-path", $LogFilePath) }
}

$args_list += $StorageEndpoint

# ── Run ────────────────────────────────────────────────────────────────────────
& $SurrealBin @args_list
