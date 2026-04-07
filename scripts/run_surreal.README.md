# SurrealDB — Download & Run Guide

Scripts in this directory start a SurrealDB server for local development.
Both scripts share the same defaults and flags; they auto-download the latest
**v3.x.x** binary the first time they run.

---

## Quick Start

### Unix-like (Linux / macOS) — `run_surreal.sh`

```bash
# Default start (SurrealKV, bind 0.0.0.0:8000, user root/root)
./scripts/run_surreal.sh

# Debug logging
./scripts/run_surreal.sh --debug

# Custom path + local-only bind
./scripts/run_surreal.sh -b 127.0.0.1:8000 --path /data/surrealdb
```

### Windows 11 — `run_surreal.ps1`

```powershell
# Default start
.\scripts\run_surreal.ps1

# Debug logging
.\scripts\run_surreal.ps1 -Debug

# Custom path + local-only bind
.\scripts\run_surreal.ps1 -Bind 127.0.0.1:8000 -Path D:\surrealdb
```

> **Execution policy** — if PowerShell blocks the script, run once:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

---

## Manual Binary Download

Both scripts auto-download to `dist/tools/surreal[.exe]` on first run.
If you prefer to download manually:

### Unix-like

```bash
# Find the latest release tag from GitHub, e.g. v3.0.5
VERSION=v3.0.5   # replace with actual latest

# Linux x86_64
curl -L "https://github.com/surrealdb/surrealdb/releases/download/${VERSION}/surreal-${VERSION}.linux-amd64" \
     -o dist/tools/surreal
chmod +x dist/tools/surreal

# macOS ARM (Apple Silicon)
curl -L "https://github.com/surrealdb/surrealdb/releases/download/${VERSION}/surreal-${VERSION}.darwin-arm64" \
     -o dist/tools/surreal
chmod +x dist/tools/surreal

# macOS x86_64
curl -L "https://github.com/surrealdb/surrealdb/releases/download/${VERSION}/surreal-${VERSION}.darwin-amd64" \
     -o dist/tools/surreal
chmod +x dist/tools/surreal
```

### Windows 11

```powershell
$VERSION = "v3.0.5"   # replace with actual latest
$Url     = "https://github.com/surrealdb/surrealdb/releases/download/$VERSION/surreal-$VERSION.windows-amd64.exe"
New-Item -ItemType Directory -Force dist\tools | Out-Null
Invoke-WebRequest -Uri $Url -OutFile dist\tools\surreal.exe
```

---

## Find the Latest 3.x Release

**GitHub Releases page:**
```
https://github.com/surrealdb/surrealdb/releases
```

**Via API (curl):**
```bash
curl -s https://api.github.com/repos/surrealdb/surrealdb/releases \
  | grep '"tag_name"' | grep '"v3\.' | head -5
```

**Via PowerShell:**
```powershell
(Invoke-RestMethod "https://api.github.com/repos/surrealdb/surrealdb/releases") |
  Where-Object { $_.tag_name -match '^v3\.' -and -not $_.prerelease } |
  Select-Object -First 3 -ExpandProperty tag_name
```

---

## All Options

Both scripts accept the same logical flags:

| Flag (sh / ps1)                       | Default          | Description                              |
|---------------------------------------|------------------|------------------------------------------|
| `-u`/`--user` / `-User`               | `root`           | SurrealDB username                       |
| `-p`/`--pass` / `-Pass`               | `root`           | SurrealDB password                       |
| `-b`/`--bind` / `-Bind`               | `0.0.0.0:8000`   | Listen address                           |
| `-t`/`--type` / `-Type`               | `surrealkv`      | Storage backend (see below)              |
| `-d`/`--db-name` / `-DbName`          | `mydatabase`     | Database name                            |
| `--path` / `-Path`                    | `kg_data`        | On-disk storage path                     |
| `-D`/`--debug` / `-Debug`             | —                | Set log level → `debug`                  |
| `--trace` / `-Trace`                  | —                | Set log level → `trace`                  |
| `--log-level LEVEL` / `-LogLevel`     | `info`           | `none\|error\|warn\|info\|debug\|trace`   |
| `--log-format FMT` / `-LogFormat`     | `text`           | `text` or `json`                         |
| `--log-file` / `-LogFile`             | —                | Enable file logging                      |
| `--log-file-path DIR` / `-LogFilePath`| `logs`           | Log file directory                       |
| `--no-download` / `-NoDownload`       | —                | Fail instead of auto-downloading         |
| `-h`/`--help` / `-Help`               | —                | Show help                                |

### Storage Backends

| Type        | Description                                                    |
|-------------|----------------------------------------------------------------|
| `surrealkv` | **Default.** Single-node, Rust-native, supports Time Travel.   |
| `rocksdb`   | High-performance SSD; no Time Travel.                          |
| `memory`    | Ephemeral — all data lost on stop. Great for CI/testing.       |
| `tikv`      | Distributed clusters spanning multiple servers.                |

---

## Binary Location

Scripts look for the binary in this order:

1. `<project_root>/dist/tools/surreal[.exe]` — project-local (preferred)
2. `/opt/surrealdb/surreal` — system-wide install (`.sh` only)
3. Auto-download → saved to `dist/tools/surreal[.exe]`

The downloaded binary is `.gitignore`-able; add `dist/tools/` to `.gitignore`
if it isn't already.
