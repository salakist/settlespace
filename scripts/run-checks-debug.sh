#!/usr/bin/env bash
# scripts/run-checks-debug.sh
#
# Wrapper for scripts/run-checks.sh that always captures output to a timestamped log.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$REPO_ROOT/artifacts/logs"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
LOG_PATH="$LOG_DIR/run-checks-$TIMESTAMP.log"

mkdir -p "$LOG_DIR"

echo "[info] Running changed-code gate with log capture..."
echo "[info] Log file: $LOG_PATH"

set +e
sh "$REPO_ROOT/scripts/run-checks.sh" 2>&1 | tee "$LOG_PATH"
EXIT_CODE=${PIPESTATUS[0]}
set -e

if [[ "$EXIT_CODE" -ne 0 ]]; then
  echo "[fail] Changed-code gate failed. See log: $LOG_PATH"
else
  echo "[pass] Changed-code gate passed. Log: $LOG_PATH"
fi

exit "$EXIT_CODE"
