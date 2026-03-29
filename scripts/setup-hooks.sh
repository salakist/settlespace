#!/usr/bin/env bash
# scripts/setup-hooks.sh
#
# Installs the git hooks from scripts/hooks/ into .git/hooks/.
# Run once after cloning:
#   sh scripts/setup-hooks.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GIT_HOOKS_DIR="$REPO_ROOT/.git/hooks"

if [ ! -d "$GIT_HOOKS_DIR" ]; then
  echo "ERROR: .git/hooks directory not found."
  echo "  Make sure you are running this from inside the fo-test git repository."
  exit 1
fi

echo "Installing git hooks..."

cp "$REPO_ROOT/scripts/hooks/pre-commit" "$GIT_HOOKS_DIR/pre-commit"
chmod +x "$GIT_HOOKS_DIR/pre-commit"

cp "$REPO_ROOT/scripts/hooks/pre-push" "$GIT_HOOKS_DIR/pre-push"
chmod +x "$GIT_HOOKS_DIR/pre-push"

echo "  [OK] pre-commit hook installed"
echo "  [OK] pre-push hook installed"
echo ""
echo "Changed-code quality gates will now run automatically before every commit and push."
echo "To run changed-code checks manually:"
echo "  sh scripts/run-checks.sh"
echo "To run full-base checks manually:"
echo "  sh scripts/run-full-checks.sh"
