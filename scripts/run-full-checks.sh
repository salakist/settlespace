#!/usr/bin/env bash
# scripts/run-full-checks.sh
#
# Runs the full-base quality gates across the repository:
#   1. C# build + analyzers on the full solution
#   2. C# coverage on the full production codebase (threshold: 80%)
#   3. React/TS ESLint on the full frontend source tree
#   4. React/TS coverage on the full production frontend codebase (threshold: 80%)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COVERAGE_ROOT="$REPO_ROOT/artifacts/coverage/full"
CSHARP_COVERAGE_ROOT="$COVERAGE_ROOT/csharp"
FAILED=0

print_header() {
  echo ""
  echo "======================================================="
  echo "  $1"
  echo "======================================================="
}

invoke_csharp_coverage() {
  local project_path="$1"
  local output_prefix="$2"

  dotnet test "$project_path" \
    -p:CollectCoverage=true \
    -p:CoverletOutputFormat=json \
    -p:CoverletOutput="$output_prefix"
}

rm -rf "$COVERAGE_ROOT"
mkdir -p "$CSHARP_COVERAGE_ROOT/domain" "$CSHARP_COVERAGE_ROOT/infrastructure" "$CSHARP_COVERAGE_ROOT/application"

cd "$REPO_ROOT"

print_header "[1/4] C# full-base build + code-smell analysis"
if dotnet build FoTestApi.sln -t:Rebuild -p:TreatWarningsAsErrors=true; then
  echo "[PASS] Full-base C# build passed."
else
  echo ""
  echo "[FAIL] Full-base C# build has analyzer violations."
  FAILED=1
fi

print_header "[2/4] C# full-base coverage (threshold: 80%)"
if invoke_csharp_coverage "Tests/FoTestApi.Domain.Tests/FoTestApi.Domain.Tests.csproj" "$CSHARP_COVERAGE_ROOT/domain/coverage" \
  && invoke_csharp_coverage "Tests/FoTestApi.Infrastructure.Tests/FoTestApi.Infrastructure.Tests.csproj" "$CSHARP_COVERAGE_ROOT/infrastructure/coverage" \
  && invoke_csharp_coverage "Tests/FoTestApi.Application.Tests/FoTestApi.Application.Tests.csproj" "$CSHARP_COVERAGE_ROOT/application/coverage"; then
  if node ./scripts/check-coverage.mjs \
      --mode csharp \
      --scope full \
      --repo-root "$REPO_ROOT" \
      --threshold 80 \
      --report "$CSHARP_COVERAGE_ROOT/domain/coverage.json" \
      --report "$CSHARP_COVERAGE_ROOT/infrastructure/coverage.json" \
      --report "$CSHARP_COVERAGE_ROOT/application/coverage.json"; then
    echo "[PASS] Full-base C# coverage gate passed."
  else
    echo ""
    echo "[FAIL] Full-base C# coverage is below 80%."
    FAILED=1
  fi
else
  echo ""
  echo "[FAIL] One or more C# test projects failed before coverage evaluation."
  FAILED=1
fi

print_header "[3/4] React/TS full-base ESLint"
cd "$REPO_ROOT/fotest-react"
if npx eslint src --ext .ts,.tsx --max-warnings=0; then
  echo "[PASS] Full-base React/TS ESLint passed."
else
  echo ""
  echo "[FAIL] Full-base React/TS ESLint found violations."
  FAILED=1
fi

print_header "[4/4] React/TS full-base coverage (threshold: 80%)"
if CI=true npm test -- --coverage --coverageReporters=json-summary --watchAll=false --runInBand; then
  if node ../scripts/check-coverage.mjs \
      --mode react \
      --scope full \
      --repo-root "$REPO_ROOT" \
      --threshold 80 \
      --report "$REPO_ROOT/fotest-react/coverage/coverage-summary.json"; then
    echo "[PASS] Full-base React/TS coverage gate passed."
  else
    echo ""
    echo "[FAIL] Full-base React/TS coverage is below 80%."
    FAILED=1
  fi
else
  echo ""
  echo "[FAIL] React/TS tests failed before full-base coverage evaluation."
  FAILED=1
fi

cd "$REPO_ROOT"
echo ""

if [ "$FAILED" -eq 1 ]; then
  echo "======================================================="
  echo "  FULL-BASE CHECKS FAILED."
  echo "======================================================="
  exit 1
fi

echo "======================================================="
echo "  Full-base quality gates passed."
echo "======================================================="
exit 0
