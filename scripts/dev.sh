#!/usr/bin/env bash
# Run Remotion commands for any workspace app without changing directory.
# Handles cd internally via subshell so the caller's CWD is never modified.
# Safe for Claude Code agent usage. Compatible with macOS bash 3.2.
#
# Usage:
#   bash scripts/dev.sh studio <app>
#   bash scripts/dev.sh render <app>
#   bash scripts/dev.sh render-all

set -eo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Use system Chrome instead of per-app downloaded chrome-headless-shell
export REMOTION_CHROME_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

ALL_APPS="claude-code-intro taiwan-stock-market three-little-pigs galgame-youth-jokes galgame-meme-theater galgame-meme-theater-ep2 galgame-meme-theater-ep3 galgame-meme-theater-ep4 xianxia-system-meme-ep1 xianxia-system-meme-ep2 weapon-forger-ch1-ep1 weapon-forger-ch1-ep2"

# Resolve composition ID from app directory name
get_comp_id() {
    case "$1" in
        claude-code-intro)        echo "ClaudeCodeIntro" ;;
        taiwan-stock-market)      echo "TaiwanStockMarket" ;;
        three-little-pigs)        echo "ThreeLittlePigs" ;;
        galgame-youth-jokes)      echo "GalgameYouthJokes" ;;
        galgame-meme-theater)     echo "GalgameMemeTheater" ;;
        galgame-meme-theater-ep2) echo "GalgameMemeTheaterEp2" ;;
        galgame-meme-theater-ep3) echo "GalgameMemeTheaterEp3" ;;
        galgame-meme-theater-ep4) echo "GalgameMemeTheaterEp4" ;;
        xianxia-system-meme-ep1) echo "XianxiaSystemMemeEp1" ;;
        xianxia-system-meme-ep2) echo "XianxiaSystemMemeEp2" ;;
        weapon-forger-ch1-ep1)    echo "WeaponForgerCh1Ep1" ;;
        weapon-forger-ch1-ep2)    echo "WeaponForgerCh1Ep2" ;;
        *) return 1 ;;
    esac
}

show_usage() {
    echo "Usage: bash scripts/dev.sh <command> [app]"
    echo ""
    echo "Commands:"
    echo "  studio <app>    Open Remotion Studio for an app"
    echo "  render <app>    Render an app to MP4"
    echo "  render-all      Render all apps"
    echo ""
    echo "Apps:"
    for app in $ALL_APPS; do
        echo "  $app"
    done
}

invoke_app() {
    local app_name="$1"
    local command="$2"

    local comp_id
    comp_id="$(get_comp_id "$app_name")" || {
        echo "ERROR: Unknown app '$app_name'" >&2
        echo "Available: $ALL_APPS" >&2
        return 1
    }

    local app_dir="$REPO_ROOT/bun_remotion_proj/$app_name"

    if [[ ! -d "$app_dir" ]]; then
        echo "ERROR: App directory not found: $app_dir" >&2
        return 1
    fi

    # Run in subshell to avoid CWD pollution
    (
        cd "$app_dir"
        case "$command" in
            studio)
                echo "[$app_name] Opening Remotion Studio..."
                bun run start
                ;;
            render)
                echo "[$app_name] Rendering $comp_id..."
                bun run build
                ;;
        esac
    )
}

# --- Main ---

if [[ $# -eq 0 ]]; then
    show_usage
    exit 0
fi

COMMAND="$1"

case "$COMMAND" in
    studio)
        if [[ $# -lt 2 ]]; then
            echo "ERROR: Specify an app name. e.g. studio claude-code-intro" >&2
            exit 1
        fi
        invoke_app "$2" "studio"
        ;;
    render)
        if [[ $# -lt 2 ]]; then
            echo "ERROR: Specify an app name. e.g. render claude-code-intro" >&2
            exit 1
        fi
        invoke_app "$2" "render"
        ;;
    render-all)
        for app in $ALL_APPS; do
            invoke_app "$app" "render"
            echo ""
        done
        echo "All renders complete."
        ;;
    *)
        echo "ERROR: Unknown command '$COMMAND'" >&2
        show_usage
        exit 1
        ;;
esac
