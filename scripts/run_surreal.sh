#!/bin/bash
# SurrealDB Server Start Script

# Check for SurrealDB in local tools directory first, then system path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOCAL_SURREAL="$PROJECT_ROOT/dist/tools/surreal"
SYSTEM_SURREAL="/opt/surrealdb/surreal"

if [[ -f "$LOCAL_SURREAL" ]]; then
    SURREAL_BIN="$LOCAL_SURREAL"
elif [[ -f "$SYSTEM_SURREAL" ]]; then
    SURREAL_BIN="$SYSTEM_SURREAL"
else
    SURREAL_BIN=""  # Will trigger error below
fi
NO_DOWNLOAD=false

DEFAULT_USER="root"
DEFAULT_PASS="root"
DEFAULT_BIND="0.0.0.0:8000"
DEFAULT_DB_TYPE="surrealkv"
DEFAULT_DB_NAME="mydatabase"
DEFAULT_DB_PATH="kg_data"
DEFAULT_LOG_LEVEL="info"
DEFAULT_LOG_FORMAT="text"

SURREAL_USER="${SURREAL_USER:-$DEFAULT_USER}"
PASS="${PASS:-$DEFAULT_PASS}"
BIND="${BIND:-$DEFAULT_BIND}"
DB_TYPE="${DB_TYPE:-$DEFAULT_DB_TYPE}"
DB_NAME="${DB_NAME:-$DEFAULT_DB_NAME}"
DB_PATH="${DB_PATH:-$DEFAULT_DB_PATH}"
LOG_LEVEL="${LOG_LEVEL:-$DEFAULT_LOG_LEVEL}"
LOG_FORMAT="${LOG_FORMAT:-$DEFAULT_LOG_FORMAT}"
LOG_FILE_ENABLED=false
LOG_FILE_PATH=""

show_help() {
    cat << HELPEOF
SurrealDB Server Start Script
==============================

Usage: $0 [OPTIONS]

Options:
    -u, --user USER      Username (default: root)
    -p, --pass PASS      Password (default: root)
    -b, --bind ADDR      Bind address (default: 0.0.0.0:8000)
                        Use 127.0.0.1:8000 for local only
                        Use 0.0.0.0:8000 for remote access
    -t, --type TYPE      Database storage type:
                        surrealkv  - SurrealKV (default, recommended)
                        rocksdb    - RocksDB (high-performance SSD)
                        memory     - In-Memory (testing/development)
                        tikv       - TiKV (distributed clusters)
    -d, --db-name NAME   Database name (default: mydatabase)
    --path PATH          Custom database storage path
                        (default: kg_data)

Debug/Logging Options:
    -D, --debug          Enable debug logging (equivalent to --log-level debug)
    --trace              Enable trace logging (most verbose)
    --log-level LEVEL    Set log level: none, error, warn, info, debug, trace
                        (default: info)
    --log-format FMT     Log format: text or json (default: text)
    --log-file           Enable file logging for crash debugging
    --log-file-path DIR  Directory for log files (default: logs)

    -h, --help           Show this help message

Examples:
    # Start with defaults (SurrealKV, path: kg_data, bind 0.0.0.0:8000)
    $0

    # Start with debug logging for troubleshooting
    $0 --debug

    # Most verbose logging with file output for crash debugging
    $0 --trace --log-file --log-file-path /var/log/surrealdb

    # Custom database path
    $0 --path /mnt/ssd/surrealdb

    # Local only with custom credentials and path
    $0 -b 127.0.0.1:8000 -u admin -p secretpass --path /data/db

    # Use RocksDB with custom path
    $0 -t rocksdb --path /var/lib/surrealdb

    # In-memory for testing (path not used)
    $0 -t memory

Storage Types:
HELPEOF

    printf "  %-15s %s\n" "surrealkv" "SurrealKV - Most users. Single-node persistence, Rust-native, and Time Travel."
    printf "  %-15s %s\n" "rocksdb" "RocksDB - High-performance SSD workloads where Time Travel isn't needed."
    printf "  %-15s %s\n" "memory" "In-Memory - Testing/Development. Super fast, but all data is lost when you stop."
    printf "  %-15s %s\n" "tikv" "TiKV - Huge, distributed clusters spanning multiple servers."

    echo ""
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--user)
            SURREAL_USER="$2"
            shift 2
            ;;
        -p|--pass)
            PASS="$2"
            shift 2
            ;;
        -b|--bind)
            BIND="$2"
            shift 2
            ;;
        -t|--type)
            DB_TYPE="$2"
            shift 2
            ;;
        -d|--db-name)
            DB_NAME="$2"
            shift 2
            ;;
        --path)
            DB_PATH="$2"
            shift 2
            ;;
        -D|--debug)
            LOG_LEVEL="debug"
            shift
            ;;
        --trace)
            LOG_LEVEL="trace"
            shift
            ;;
        --log-level)
            LOG_LEVEL="$2"
            shift 2
            ;;
        --log-format)
            LOG_FORMAT="$2"
            shift 2
            ;;
        --log-file)
            LOG_FILE_ENABLED=true
            shift
            ;;
        --log-file-path)
            LOG_FILE_PATH="$2"
            LOG_FILE_ENABLED=true
            shift 2
            ;;
        --no-download)
            NO_DOWNLOAD=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

get_latest_surreal_version() {
    # Returns the highest stable v3.x.x tag from GitHub releases API
    curl -fsSL -H "Accept: application/vnd.github+json" \
        "https://api.github.com/repos/surrealdb/surrealdb/releases" \
        | grep '"tag_name"' \
        | grep '"v3\.' \
        | head -20 \
        | sed 's/.*"tag_name": "\(v[^"]*\)".*/\1/' \
        | sort -V -r \
        | head -1
}

install_surreal_bin() {
    local dest="$1"
    echo "SurrealDB binary not found — fetching latest 3.x.x from GitHub..."

    local tag
    tag=$(get_latest_surreal_version) || { echo "Error: could not query GitHub releases API"; exit 1; }
    [[ -z "$tag" ]] && { echo "Error: no stable v3.x.x release found"; exit 1; }

    local os arch filename
    os=$(uname -s | tr '[:upper:]' '[:lower:]')
    arch=$(uname -m)
    case "$os" in
        linux)  os="linux" ;;
        darwin) os="darwin" ;;
        *)      echo "Error: unsupported OS '$os'"; exit 1 ;;
    esac
    case "$arch" in
        x86_64)  arch="amd64" ;;
        aarch64|arm64) arch="arm64" ;;
        *)       echo "Error: unsupported arch '$arch'"; exit 1 ;;
    esac

    filename="surreal-${tag}.${os}-${arch}"
    local url="https://github.com/surrealdb/surrealdb/releases/download/${tag}/${filename}"

    echo "  Version : $tag"
    echo "  URL     : $url"
    echo "  Target  : $dest"

    mkdir -p "$(dirname "$dest")"
    curl -fsSL --progress-bar "$url" -o "$dest"
    chmod +x "$dest"
    echo "  Done."
}

if [[ ! -f "$SURREAL_BIN" ]]; then
    if [[ "$NO_DOWNLOAD" == "true" ]]; then
        echo "Error: SurrealDB binary not found. Remove --no-download to enable auto-download."
        exit 1
    fi
    install_surreal_bin "$LOCAL_SURREAL"
    SURREAL_BIN="$LOCAL_SURREAL"
fi

case "$DB_TYPE" in
    surrealkv|rocksdb|tikv)
        STORAGE_ENDPOINT="${DB_TYPE}://${DB_PATH}"
        ;;
    memory)
        STORAGE_ENDPOINT="memory"
        ;;
    *)
        echo "Error: Invalid storage type '$DB_TYPE'. Use: surrealkv, rocksdb, memory, or tikv"
        exit 1
        ;;
esac

echo "Starting SurrealDB..."
echo "  Binary:     $SURREAL_BIN"
echo "  Bind:       $BIND"
echo "  User:       $SURREAL_USER"
echo "  Password:   $(echo "$PASS" | sed 's/./*/g')"
echo "  Storage:    $STORAGE_ENDPOINT"
echo "  Log Level:  $LOG_LEVEL"

if [[ "$DB_TYPE" != "memory" ]]; then
    echo "  DB Path:    $DB_PATH"
fi

if [[ "$LOG_FILE_ENABLED" == "true" ]]; then
    echo "  Log File:   ${LOG_FILE_PATH:-logs}/surrealdb.log"
fi
echo ""

# Build the command with logging options
CMD=("$SURREAL_BIN" start --user "$SURREAL_USER" --pass "$PASS" --bind "$BIND" --log "$LOG_LEVEL" --log-format "$LOG_FORMAT")

if [[ "$LOG_FILE_ENABLED" == "true" ]]; then
    CMD+=(--log-file-enabled)
    if [[ -n "$LOG_FILE_PATH" ]]; then
        CMD+=(--log-file-path "$LOG_FILE_PATH")
    fi
fi

CMD+=("$STORAGE_ENDPOINT")

exec "${CMD[@]}"
