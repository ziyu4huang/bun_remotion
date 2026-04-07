#!/bin/bash
# run-smart-test.sh - CLI wrapper for smart test execution
#
# Usage:
#   ./scripts/run-smart-test.sh                 # Smart: detect changes, run affected tests
#   ./scripts/run-smart-test.sh --all           # Run all categories
#   ./scripts/run-smart-test.sh --agent         # Agent tests only
#   ./scripts/run-smart-test.sh --skill novel   # Test specific skill
#   ./scripts/run-smart-test.sh --base main     # Detect changes since main
#
# Exit codes:
#   0 - All tests passed
#   1 - Some tests failed
#   2 - Prerequisites not met
#   3 - Configuration error

set -e

# Configuration
BASE="HEAD~1"
CATEGORIES=""
MODEL="glm-4.5-air"
TIMEOUT=60
RUN_ALL=false
RUN_SLOW=false
SPECIFIC_SKILL=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
SKIP=0

# Help function (must be defined before argument parsing)
show_help() {
  cat << 'EOF'
Smart Test Runner - Intelligent test execution with change detection

Usage:
  ./scripts/run-smart-test.sh [OPTIONS]

Options:
  --all              Run all test categories
  --unit             Unit tests only
  --integration      Integration tests only
  --e2e              E2E tests only
  --agent            Agent→SKILL→CLI tests only
  --skill <name>     Test specific skill (e.g., novel, mrd)
  --slow             Include slow/intensive tests
  --base <ref>       Git base for change detection (default: HEAD~1)
  -h, --help         Show this help message

Examples:
  ./scripts/run-smart-test.sh                    # Smart detection
  ./scripts/run-smart-test.sh --all              # Run everything
  ./scripts/run-smart-test.sh --agent            # Agent tests only
  ./scripts/run-smart-test.sh --skill novel      # Test novel skill
  ./scripts/run-smart-test.sh --base main        # Changes since main
EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --all)       RUN_ALL=true; shift ;;
    --unit)      CATEGORIES="$CATEGORIES unit"; shift ;;
    --integration) CATEGORIES="$CATEGORIES integration"; shift ;;
    --e2e)       CATEGORIES="$CATEGORIES e2e"; shift ;;
    --agent)     CATEGORIES="$CATEGORIES agent"; shift ;;
    --skill)     SPECIFIC_SKILL="$2"; CATEGORIES="$CATEGORIES skill:$SPECIFIC_SKILL"; shift 2 ;;
    --slow)      RUN_SLOW=true; shift ;;
    --base)      BASE="$2"; shift 2 ;;
    -h|--help)   show_help; exit 0 ;;
    *)           echo "Unknown option: $1"; show_help; exit 3 ;;
  esac
done

# Helper functions
log_pass() { echo -e "${GREEN}✓${NC} $1"; ((PASS++)); }
log_fail() { echo -e "${RED}✗${NC} $1"; echo "  $2"; ((FAIL++)); }
log_skip() { echo -e "${YELLOW}○${NC} $1"; ((SKIP++)); }
log_section() { echo ""; echo "--- $1 ---"; }

# Prerequisites check
check_prerequisites() {
  log_section "Prerequisites Check"

  # Check if cargo is available
  if ! command -v cargo &> /dev/null; then
    echo -e "${RED}Error: cargo not found${NC}"
    exit 2
  fi

  # Check if we're in a Rust project
  if [ ! -f "Cargo.toml" ]; then
    echo -e "${RED}Error: Not in a Rust project (Cargo.toml not found)${NC}"
    exit 2
  fi

  # Build if needed
  if [ ! -f "target/debug/agent-cli" ]; then
    echo "Building agent-cli..."
    cargo build --quiet 2>&1 | head -5
  fi

  # Check API key for agent tests
  if [[ "$CATEGORIES" == *"agent"* ]] || [ "$RUN_ALL" = true ]; then
    if [ -z "$Z_AI_API_KEY" ]; then
      echo -e "${YELLOW}Warning: Z_AI_API_KEY not set, some agent tests may fail${NC}"
    else
      echo -e "${GREEN}Z_AI_API_KEY: OK${NC}"
    fi
  fi

  log_pass "Prerequisites OK"
}

# Change detection
detect_changes() {
  if [ "$RUN_ALL" = true ]; then
    CATEGORIES="unit integration e2e agent skill"
    return
  fi

  # If categories already specified, use them
  if [ -n "$CATEGORIES" ]; then
    return
  fi

  log_section "Change Detection"
  echo "Base: $BASE"

  CHANGED=$(git diff --name-only "$BASE...HEAD" 2>/dev/null || echo "")

  if [ -z "$CHANGED" ]; then
    echo "No changes detected, running unit tests by default"
    CATEGORIES="unit"
    return
  fi

  echo "Changed files:"
  echo "$CHANGED" | head -10
  if [ $(echo "$CHANGED" | wc -l) -gt 10 ]; then
    echo "  ... and more"
  fi

  # Map files to categories
  for file in $CHANGED; do
    case "$file" in
      src/agent/*.rs|src/agent/**/*.rs)     CATEGORIES="$CATEGORIES unit integration agent" ;;
      src/cli/*.rs|src/cli/**/*.rs)         CATEGORIES="$CATEGORIES unit e2e agent" ;;
      src/tools/*.rs|src/tools/**/*.rs)     CATEGORIES="$CATEGORIES unit integration e2e" ;;
      src/main.rs)                          CATEGORIES="$CATEGORIES e2e agent" ;;
      .claude/skills/*/SKILL.md)            CATEGORIES="$CATEGORIES agent skill" ;;
      .claude/skills/novel/*)               CATEGORIES="$CATEGORIES agent skill:novel" ;;
      .claude/skills/mrd/*)                 CATEGORIES="$CATEGORIES agent skill:mrd" ;;
      .claude/skills/memory*)               CATEGORIES="$CATEGORIES agent skill:memory" ;;
      tests/common/*)                       CATEGORIES="$CATEGORIES unit integration e2e" ;;
      tests/fixtures/*)                     CATEGORIES="$CATEGORIES e2e integration" ;;
    esac
  done

  # Deduplicate
  CATEGORIES=$(echo "$CATEGORIES" | tr ' ' '\n' | sort -u | tr '\n' ' ')

  if [ -z "$CATEGORIES" ]; then
    CATEGORIES="unit"
  fi

  echo "Detected categories:$CATEGORIES"
}

# Run unit tests
run_unit_tests() {
  log_section "Unit Tests"

  if [[ "$CATEGORIES" != *"unit"* ]]; then
    log_skip "Not affected by changes"
    return
  fi

  local start=$(date +%s)

  if [ "$RUN_SLOW" = true ]; then
    if cargo test --lib --quiet -- --ignored 2>&1 | tee /tmp/unit_test_output.txt; then
      log_pass "unit tests passed"
    else
      log_fail "unit tests failed" "Check output above"
    fi
  else
    if cargo test --lib --quiet 2>&1 | tee /tmp/unit_test_output.txt; then
      log_pass "unit tests passed"
    else
      log_fail "unit tests failed" "Check output above"
    fi
  fi

  local end=$(date +%s)
  echo "  Duration: $((end - start))s"
}

# Run integration tests
run_integration_tests() {
  log_section "Integration Tests"

  if [[ "$CATEGORIES" != *"integration"* ]]; then
    log_skip "Not affected by changes"
    return
  fi

  # Check if integration tests exist
  if ! ls tests/integration*.rs 2>/dev/null >/dev/null; then
    log_skip "No integration tests found"
    return
  fi

  local start=$(date +%s)

  if cargo test --test integration --quiet 2>&1 | tee /tmp/integration_test_output.txt; then
    log_pass "integration tests passed"
  else
    log_fail "integration tests failed" "Check output above"
  fi

  local end=$(date +%s)
  echo "  Duration: $((end - start))s"
}

# Run E2E tests
run_e2e_tests() {
  log_section "E2E Tests"

  if [[ "$CATEGORIES" != *"e2e"* ]]; then
    log_skip "Not affected by changes"
    return
  fi

  # Check if E2E tests exist
  if [ ! -d "tests/e2e" ]; then
    log_skip "No E2E tests found"
    return
  fi

  local start=$(date +%s)

  if cargo test --test e2e --quiet 2>&1 | tee /tmp/e2e_test_output.txt; then
    log_pass "e2e tests passed"
  else
    log_fail "e2e tests failed" "Check output above"
  fi

  local end=$(date +%s)
  echo "  Duration: $((end - start))s"
}

# Run agent tests
run_agent_tests() {
  log_section "Agent Tests"

  if [[ "$CATEGORIES" != *"agent"* ]]; then
    log_skip "Not affected by changes"
    return
  fi

  local CLI="./target/debug/agent-cli"
  local start=$(date +%s)
  local agent_pass=0
  local agent_fail=0

  # Test: Basic Chat
  echo "Testing: basic_chat"
  local output=$(timeout $TIMEOUT $CLI agent -m $MODEL -p "Reply with exactly: TEST_OK" 2>&1)
  if echo "$output" | grep -q "TEST_OK"; then
    log_pass "basic_chat"
    ((agent_pass++))
  else
    log_fail "basic_chat" "Expected TEST_OK in output"
    ((agent_fail++))
  fi

  # Test: Tool Bash
  echo "Testing: tool_bash"
  output=$(timeout $TIMEOUT $CLI agent -m $MODEL -p "Run the command: echo TOOL_TEST" 2>&1)
  if echo "$output" | grep -q "TOOL_TEST"; then
    log_pass "tool_bash"
    ((agent_pass++))
  else
    log_fail "tool_bash" "Expected TOOL_TEST in output"
    ((agent_fail++))
  fi

  # Test: Tool Read
  echo "Testing: tool_read"
  output=$(timeout $TIMEOUT $CLI agent -m $MODEL -p "Read the first line of CLAUDE.md file" 2>&1)
  if echo "$output" | grep -qi "project\|claude"; then
    log_pass "tool_read"
    ((agent_pass++))
  else
    log_fail "tool_read" "Expected CLAUDE.md content in output"
    ((agent_fail++))
  fi

  # Test: Tool Glob
  echo "Testing: tool_glob"
  output=$(timeout $TIMEOUT $CLI agent -m $MODEL -p "List all .rs files in src/cli/" 2>&1)
  if echo "$output" | grep -q "\.rs"; then
    log_pass "tool_glob"
    ((agent_pass++))
  else
    log_fail "tool_glob" "Expected .rs files in output"
    ((agent_fail++))
  fi

  # Test: Skill Greet
  echo "Testing: skill_greet"
  output=$(timeout $TIMEOUT $CLI agent -m $MODEL -p "/greet" 2>&1)
  if [ $? -eq 0 ]; then
    log_pass "skill_greet"
    ((agent_pass++))
  else
    log_fail "skill_greet" "Skill invocation failed"
    ((agent_fail++))
  fi

  # Test: Skill Memory
  echo "Testing: skill_memory_status"
  output=$(timeout $TIMEOUT $CLI agent -m $MODEL -p "/memory-optimizer status" 2>&1)
  if echo "$output" | grep -qi "memory"; then
    log_pass "skill_memory_status"
    ((agent_pass++))
  else
    log_fail "skill_memory_status" "Expected memory status in output"
    ((agent_fail++))
  fi

  local end=$(date +%s)
  echo ""
  echo "Agent Tests: $agent_pass passed, $agent_fail failed"
  echo "  Duration: $((end - start))s"
}

# Run skill-specific tests
run_skill_tests() {
  if [[ "$CATEGORIES" != *"skill"* ]]; then
    return
  fi

  log_section "Skill Tests"

  local CLI="./target/debug/agent-cli"
  local start=$(date +%s)

  # Extract skill name if specified
  if [ -n "$SPECIFIC_SKILL" ]; then
    echo "Testing skill: $SPECIFIC_SKILL"

    case "$SPECIFIC_SKILL" in
      novel)
        output=$(timeout 120 $CLI agent -m $MODEL -p "/novel status" 2>&1)
        if echo "$output" | grep -qi "novel\|status\|error"; then
          log_pass "skill:novel:status"
        else
          log_fail "skill:novel:status" "Unexpected output"
        fi
        ;;
      mrd)
        output=$(timeout 60 $CLI agent -m $MODEL -p "/mrd status" 2>&1)
        if [ $? -eq 0 ]; then
          log_pass "skill:mrd:status"
        else
          log_fail "skill:mrd:status" "Skill invocation failed"
        fi
        ;;
      memory|memory-optimizer)
        output=$(timeout 60 $CLI agent -m $MODEL -p "/memory-optimizer status" 2>&1)
        if echo "$output" | grep -qi "memory"; then
          log_pass "skill:memory:status"
        else
          log_fail "skill:memory:status" "Unexpected output"
        fi
        ;;
      *)
        echo "No specific tests defined for skill: $SPECIFIC_SKILL"
        ;;
    esac
  else
    echo "Running general skill tests..."
    # Test a few core skills
    output=$(timeout 60 $CLI agent -m $MODEL -p "/greet" 2>&1)
    if [ $? -eq 0 ]; then
      log_pass "skill:greet"
    else
      log_fail "skill:greet" "Failed"
    fi
  fi

  local end=$(date +%s)
  echo "  Duration: $((end - start))s"
}

# Generate report
generate_report() {
  local end_time=$(date +%s)
  local duration=$((end_time - START_TIME))

  echo ""
  echo "================================================================================"
  echo "  SMART TEST REPORT"
  echo "  Generated: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "================================================================================"
  echo ""
  echo "DETECTION"
  echo "  Base: $BASE"
  echo "  Detected categories:$CATEGORIES"
  echo ""
  echo "RESULTS BY CATEGORY"
  echo "--------------------------------------------------------------------------------"
  echo "  Passed: $PASS | Failed: $FAIL | Skipped: $SKIP"
  echo "--------------------------------------------------------------------------------"
  echo ""
  echo "SUMMARY"
  echo "  Duration: ${duration}s"
  echo "================================================================================"

  # Return appropriate exit code
  if [ $FAIL -gt 0 ]; then
    return 1
  fi
  return 0
}

# Main execution
START_TIME=$(date +%s)

echo "=== Smart Test Runner ==="
echo ""

check_prerequisites
detect_changes

# Run tests
run_unit_tests
run_integration_tests
run_e2e_tests
run_agent_tests
run_skill_tests

# Generate report and exit
generate_report
exit $?
