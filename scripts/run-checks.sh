#!/usr/bin/env bash
# scripts/run-checks.sh
#
# Runs the changed-code quality gates used by agents and git hooks.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTIFACTS_ROOT="$REPO_ROOT/artifacts"
CHANGED_LIST_PATH="$ARTIFACTS_ROOT/changed-files.txt"
COVERAGE_ROOT="$ARTIFACTS_ROOT/coverage/changed"
FAILED=0
CHANGE_SCOPE=""
SEPARATOR="======================================================="

if [[ $# -gt 0 ]]; then
  echo "ERROR: scripts/run-checks.sh does not accept arguments." >&2
  exit 2
fi

print_header() {
  local title="$1"
  echo ""
  echo "$SEPARATOR"
  echo "  $title"
  echo "$SEPARATOR"
  return 0
}

get_changed_files() {
  local staged=()
  mapfile -t staged < <(git diff --cached --name-only --diff-filter=ACMR | awk 'NF' | sort -u)
  if [[ "${#staged[@]}" -gt 0 ]]; then
    CHANGE_SCOPE="staged changes"
    CHANGED_FILES=("${staged[@]}")
    return
  fi

  local working=()
  local untracked=()
  mapfile -t working < <(git diff --name-only --diff-filter=ACMR HEAD 2>/dev/null | awk 'NF' | sort -u)
  mapfile -t untracked < <(git ls-files --others --exclude-standard | awk 'NF' | sort -u)
  if [[ "${#working[@]}" -gt 0 ]] || [[ "${#untracked[@]}" -gt 0 ]]; then
    CHANGE_SCOPE="working tree changes"
    mapfile -t CHANGED_FILES < <(printf '%s\n' "${working[@]}" "${untracked[@]}" | awk 'NF' | sort -u)
    return
  fi

  if git rev-parse --abbrev-ref --symbolic-full-name "@{upstream}" >/dev/null 2>&1; then
    local upstream
    upstream="$(git rev-parse --abbrev-ref --symbolic-full-name "@{upstream}")"
    CHANGE_SCOPE="changes since $upstream"
    mapfile -t CHANGED_FILES < <(git diff --name-only --diff-filter=ACMR "$upstream...HEAD" | awk 'NF' | sort -u)
    return
  fi

  if git rev-parse --verify HEAD~1 >/dev/null 2>&1; then
    CHANGE_SCOPE="last commit"
    mapfile -t CHANGED_FILES < <(git diff --name-only --diff-filter=ACMR HEAD~1..HEAD | awk 'NF' | sort -u)
    return
  fi

  CHANGE_SCOPE="tracked files"
  mapfile -t CHANGED_FILES < <(git ls-files | awk 'NF' | sort -u)
  return 0
}

is_production_csharp_file() {
  local file_path="$1"
  [[ "$file_path" =~ ^FoTestApi\.(Application|Domain|Infrastructure)/.*\.cs$ ]] && [[ ! "$file_path" =~ /Program\.cs$ ]]
  return $?
}

is_react_file() {
  local file_path="$1"
  [[ "$file_path" =~ ^fotest-react/src/.*\.(ts|tsx)$ ]]
  return $?
}

is_production_react_file() {
  local file_path="$1"
  is_react_file "$file_path" \
    && [[ ! "$file_path" =~ \.test\.(ts|tsx)$ ]] \
    && [[ ! "$file_path" =~ /setupTests\.ts$ ]] \
    && [[ ! "$file_path" =~ /index\.tsx$ ]] \
    && [[ ! "$file_path" =~ /reportWebVitals\.ts$ ]] \
    && [[ ! "$file_path" =~ /react-app-env\.d\.ts$ ]]
  return $?
}

invoke_csharp_coverage() {
  local project_path="$1"
  local output_prefix="$2"

  dotnet test "$project_path" \
    -p:CollectCoverage=true \
    -p:CoverletOutputFormat=json \
    -p:CoverletOutput="$output_prefix"

  return $?
}

cd "$REPO_ROOT"
mkdir -p "$ARTIFACTS_ROOT"

echo "[mandatory] changed-code gate: run before every commit"

declare -a CHANGED_FILES=()
get_changed_files

print_header "Changed-code analysis target"
echo "Scope: $CHANGE_SCOPE"
if [[ "${#CHANGED_FILES[@]}" -eq 0 ]]; then
  echo "No changed files detected. Skipping changed-code gates."
  exit 0
fi

printf '%s\n' "${CHANGED_FILES[@]}" > "$CHANGED_LIST_PATH"
printf '%s\n' "${CHANGED_FILES[@]}" | head -n 20 | sed 's/^/  /'
if [[ "${#CHANGED_FILES[@]}" -gt 20 ]]; then
  echo "  ... and $((${#CHANGED_FILES[@]} - 20)) more file(s)."
fi

declare -a CHANGED_CSHARP_FILES=()
declare -a CHANGED_PRODUCTION_CSHARP_FILES=()
declare -a CHANGED_REACT_FILES=()
declare -a CHANGED_PRODUCTION_REACT_FILES=()

for file in "${CHANGED_FILES[@]}"; do
  if [[ "$file" =~ \.cs$ ]]; then
    CHANGED_CSHARP_FILES+=("$file")
  fi

  if is_production_csharp_file "$file"; then
    CHANGED_PRODUCTION_CSHARP_FILES+=("$file")
  fi

  if is_react_file "$file"; then
    CHANGED_REACT_FILES+=("$file")
  fi

  if is_production_react_file "$file"; then
    CHANGED_PRODUCTION_REACT_FILES+=("$file")
  fi
done

print_header "[1/4] C# changed-file analyzer gate"
if [[ "${#CHANGED_CSHARP_FILES[@]}" -eq 0 ]]; then
  echo "[SKIP] No changed C# files."
else
  BUILD_LOG="$ARTIFACTS_ROOT/csharp-build.log"
  # Use Rebuild so analyzer diagnostics are emitted even when incremental build would skip compilation.
  if dotnet build FoTestApi.sln -t:Rebuild > "$BUILD_LOG" 2>&1; then
    BUILD_EXIT=0
  else
    BUILD_EXIT=$?
  fi

  mapfile -t CHANGED_DIAGNOSTICS < <(
    { grep -Ei ': (warning|error) [A-Za-z]{2,}[0-9]+:' "$BUILD_LOG" || true; } | while IFS= read -r line; do
      lower_line="$(printf '%s' "$line" | tr '[:upper:]' '[:lower:]')"
      for file in "${CHANGED_CSHARP_FILES[@]}"; do
        rel_needle="$(printf '%s' "$file" | tr '/' '\\' | tr '[:upper:]' '[:lower:]')"
        abs_needle="$(printf '%s' "$REPO_ROOT/$file" | sed 's#/#\\#g' | tr '[:upper:]' '[:lower:]')"
        if [[ "$lower_line" == *"$rel_needle"* ]] || [[ "$lower_line" == *"$abs_needle"* ]]; then
          printf '%s\n' "$line"
          break
        fi
      done
    done | awk 'NF' | sort -u
  )

  if [[ "${#CHANGED_DIAGNOSTICS[@]}" -gt 0 ]]; then
    printf '%s\n' "${CHANGED_DIAGNOSTICS[@]}"
    echo ""
    echo "[FAIL] Changed C# files introduced analyzer or compiler violations."
    FAILED=1
  elif [[ "$BUILD_EXIT" -ne 0 ]]; then
    echo "[FAIL] Solution build failed outside the changed-file filter. Commit is blocked until the repository builds cleanly."
    FAILED=1
  else
    echo "[PASS] No analyzer/compiler violations in changed C# files."
  fi
fi

print_header "[2/4] C# changed-file coverage gate (threshold: 80%)"
if [[ "${#CHANGED_PRODUCTION_CSHARP_FILES[@]}" -eq 0 ]]; then
  echo "[SKIP] No changed production C# files."
else
  rm -rf "$COVERAGE_ROOT"
  mkdir -p "$COVERAGE_ROOT/csharp/domain" "$COVERAGE_ROOT/csharp/infrastructure" "$COVERAGE_ROOT/csharp/application"

  if invoke_csharp_coverage "Tests/FoTestApi.Domain.Tests/FoTestApi.Domain.Tests.csproj" "$COVERAGE_ROOT/csharp/domain/coverage" \
    && invoke_csharp_coverage "Tests/FoTestApi.Infrastructure.Tests/FoTestApi.Infrastructure.Tests.csproj" "$COVERAGE_ROOT/csharp/infrastructure/coverage" \
    && invoke_csharp_coverage "Tests/FoTestApi.Application.Tests/FoTestApi.Application.Tests.csproj" "$COVERAGE_ROOT/csharp/application/coverage"; then
    if node ./scripts/check-coverage.mjs \
        --mode csharp \
        --scope changed \
        --repo-root "$REPO_ROOT" \
        --threshold 80 \
        --changed-list "$CHANGED_LIST_PATH" \
        --report "$COVERAGE_ROOT/csharp/domain/coverage.json" \
        --report "$COVERAGE_ROOT/csharp/infrastructure/coverage.json" \
        --report "$COVERAGE_ROOT/csharp/application/coverage.json"; then
      echo "[PASS] Changed production C# coverage gate passed."
    else
      echo "[FAIL] Changed production C# files are below 80% coverage."
      FAILED=1
    fi
  else
    echo "[FAIL] One or more C# test projects failed before coverage evaluation."
    FAILED=1
  fi
fi

print_header "[3/4] React/TS changed-file ESLint gate"
if [[ "${#CHANGED_REACT_FILES[@]}" -eq 0 ]]; then
  echo "[SKIP] No changed React/TS files."
else
  cd "$REPO_ROOT/fotest-react"
  declare -a ESLINT_TARGETS=()
  for file in "${CHANGED_REACT_FILES[@]}"; do
    ESLINT_TARGETS+=("${file#fotest-react/}")
  done

  if npx eslint --max-warnings=0 "${ESLINT_TARGETS[@]}"; then
    echo "[PASS] No ESLint violations in changed React/TS files."
  else
    echo "[FAIL] ESLint found violations in changed React/TS files."
    FAILED=1
  fi
fi

print_header "[4/4] React/TS changed-file coverage gate (threshold: 80%)"
if [[ "${#CHANGED_PRODUCTION_REACT_FILES[@]}" -eq 0 ]]; then
  echo "[SKIP] No changed production React/TS files."
else
  cd "$REPO_ROOT/fotest-react"
  rm -rf coverage

  declare -a REACT_COVERAGE_TARGETS=()
  for file in "${CHANGED_PRODUCTION_REACT_FILES[@]}"; do
    REACT_COVERAGE_TARGETS+=("${file#fotest-react/}")
  done

  if CI=true npm test -- --coverage --coverageReporters=json-summary --watchAll=false --runInBand --findRelatedTests "${REACT_COVERAGE_TARGETS[@]}"; then
    if node ../scripts/check-coverage.mjs \
        --mode react \
        --scope changed \
        --repo-root "$REPO_ROOT" \
        --threshold 80 \
        --changed-list "$CHANGED_LIST_PATH" \
        --report "$REPO_ROOT/fotest-react/coverage/coverage-summary.json"; then
      echo "[PASS] Changed production React/TS coverage gate passed."
    else
      echo "[FAIL] Changed production React/TS files are below 80% coverage."
      FAILED=1
    fi
  else
    echo "[FAIL] React/TS tests failed before changed-file coverage evaluation."
    FAILED=1
  fi
fi

cd "$REPO_ROOT"
echo ""

if [[ "$FAILED" -eq 1 ]]; then
  echo "$SEPARATOR"
  echo "  CHANGED-CODE CHECKS FAILED. Commit is blocked."
  echo "  Resolve the issues above, then re-run sh scripts/run-checks.sh"
  echo "$SEPARATOR"
  exit 1
fi

echo "$SEPARATOR"
echo "  Changed-code quality gates passed."
echo "$SEPARATOR"
exit 0