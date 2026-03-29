#!/usr/bin/env bash
# scripts/setup-hooks.sh
#
# Installs the git hooks from scripts/hooks/ into .git/hooks/.
# Run once after cloning:
#   sh scripts/setup-hooks.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GIT_HOOKS_DIR="$REPO_ROOT/.git/hooks"

verify_hook() {
  local source_path="$1"
  local installed_path="$2"
  local hook_name="$3"

  if [ ! -f "$installed_path" ]; then
    echo "  [FAIL] $hook_name hook not found after install"
    return 1
  fi

  if ! cmp -s "$source_path" "$installed_path"; then
    echo "  [FAIL] $hook_name hook content does not match scripts/hooks/$hook_name"
    return 1
  fi

  if [ ! -x "$installed_path" ]; then
    echo "  [FAIL] $hook_name hook is not executable"
    return 1
  fi

  echo "  [OK] $hook_name hook installed and verified"
  return 0
}

if [ ! -d "$GIT_HOOKS_DIR" ]; then
  echo "ERROR: .git/hooks directory not found."
  echo "  Make sure you are running this from inside the fo-test git repository."
  exit 1
fi

echo "Installing git hooks..."

cp "$REPO_ROOT/scripts/hooks/pre-commit" "$GIT_HOOKS_DIR/pre-commit"
chmod +x "$GIT_HOOKS_DIR/pre-commit"

VERIFY_FAILED=0
verify_hook "$REPO_ROOT/scripts/hooks/pre-commit" "$GIT_HOOKS_DIR/pre-commit" "pre-commit" || VERIFY_FAILED=1

if [ "$VERIFY_FAILED" -ne 0 ]; then
  echo ""
  echo "Hook installation verification failed. Fix the issues above and rerun setup-hooks."
  exit 1
fi

echo ""
echo "Changed-code quality gates will now run automatically before every commit."
echo "To run changed-code checks manually:"
echo "  sh scripts/run-checks.sh"
echo "To run full-base checks manually:"
echo "  sh scripts/run-full-checks.sh"
