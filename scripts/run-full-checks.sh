#!/usr/bin/env bash
# scripts/run-full-checks.sh
#
# Runs the full-base quality gates across the repository:
#   1. C# build + analyzers on the full solution
#   2. C# coverage on the full production codebase (threshold: 80%)
#   3. React/TS ESLint on the full frontend source tree
#   4. Repo JS/MJS ESLint on the full scripts tree
#   5. React/TS coverage on the full production frontend codebase (threshold: 80%)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COVERAGE_ROOT="$REPO_ROOT/artifacts/coverage/full"

# Load .env from repo root if present.
# Values in .env are only applied when the corresponding env var is not already set,
# so an env var set in the calling shell always takes precedence.
_env_file="$REPO_ROOT/.env"
if [[ -f "$_env_file" ]]; then
  while IFS= read -r _env_line; do
    [[ -z "$_env_line" || "$_env_line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$_env_line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*) ]]; then
      _env_key="${BASH_REMATCH[1]}"
      _env_val="${BASH_REMATCH[2]}"
      if [[ -z "${!_env_key+x}" ]]; then
        export "$_env_key=$_env_val"
      fi
    fi
  done < "$_env_file"
  unset _env_file _env_line _env_key _env_val
fi
CSHARP_COVERAGE_ROOT="$COVERAGE_ROOT/csharp"
FAILED=0
SEPARATOR="======================================================="

print_header() {
  local title="$1"
  echo ""
  echo "$SEPARATOR"
  echo "  $title"
  echo "$SEPARATOR"
  return 0
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

get_sonar_project_property() {
  local property_name="$1"
  local config_path="$REPO_ROOT/sonar-project.properties"

  if [[ ! -f "$config_path" ]]; then
    return 0
  fi

  grep -E "^${property_name}=" "$config_path" | head -n 1 | sed "s/^${property_name}=//"
}

get_git_branch_name() {
  local branch_name
  branch_name="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"

  if [[ -z "$branch_name" || "$branch_name" == "HEAD" ]]; then
    return 0
  fi

  printf '%s\n' "$branch_name"
}

print_sonar_technical_errors() {
  local scanner_output="$1"

  echo "[info] Sonar technical error summary:"
  local error_lines
  error_lines="$(printf '%s\n' "$scanner_output" | grep -E 'ERROR|EXECUTION FAILURE|HttpException|Caused by:|QUALITY GATE STATUS' || true)"

  if [[ -z "$error_lines" ]]; then
    printf '%s\n' "$scanner_output" | tail -n 20 | sed 's/^/  /'
    return 0
  fi

  printf '%s\n' "$error_lines" | head -n 25 | sed 's/^/  /'
}

print_sonar_quality_gate_summary() {
  local project_key="$1"
  local branch_name="$2"
  local response

  if [[ -z "$project_key" ]]; then
    return 0
  fi

  if [[ -n "$branch_name" ]]; then
    response="$(curl -sS -u "$SONAR_TOKEN:" --get 'https://sonarcloud.io/api/qualitygates/project_status' --data-urlencode "projectKey=$project_key" --data-urlencode "branch=$branch_name")" || {
      echo "[warn] Unable to fetch Sonar quality gate summary."
      return 0
    }
  else
    response="$(curl -sS -u "$SONAR_TOKEN:" --get 'https://sonarcloud.io/api/qualitygates/project_status' --data-urlencode "projectKey=$project_key")" || {
      echo "[warn] Unable to fetch Sonar quality gate summary."
      return 0
    }
  fi

  SONAR_JSON="$response" node - <<'NODE'
const data = JSON.parse(process.env.SONAR_JSON || '{}');
const projectStatus = data.projectStatus || {};
console.log(`[info] Sonar quality gate status: ${projectStatus.status ?? 'UNKNOWN'}`);
const failing = (projectStatus.conditions || []).filter((condition) => condition.status === 'ERROR');
if (failing.length === 0) {
  console.log('[info] No failing quality gate conditions were returned by the API.');
} else {
  console.log('[info] Failing quality gate conditions:');
  for (const condition of failing) {
    console.log(`  - ${condition.metricKey}: actual=${condition.actualValue ?? 'n/a'}, threshold=${condition.errorThreshold ?? 'n/a'}, comparator=${condition.comparator ?? 'n/a'}`);
  }
}
NODE
}

print_sonar_issue_summary() {
  local project_key="$1"
  local branch_name="$2"
  local response

  if [[ -z "$project_key" ]]; then
    return 0
  fi

  if [[ -n "$branch_name" ]]; then
    response="$(curl -sS -u "$SONAR_TOKEN:" --get 'https://sonarcloud.io/api/issues/search' --data-urlencode "componentKeys=$project_key" --data-urlencode 'resolved=false' --data-urlencode 'ps=20' --data-urlencode 'p=1' --data-urlencode 's=FILE_LINE' --data-urlencode "branch=$branch_name")" || {
      echo "[warn] Unable to fetch Sonar issue summary."
      return 0
    }
  else
    response="$(curl -sS -u "$SONAR_TOKEN:" --get 'https://sonarcloud.io/api/issues/search' --data-urlencode "componentKeys=$project_key" --data-urlencode 'resolved=false' --data-urlencode 'ps=20' --data-urlencode 'p=1' --data-urlencode 's=FILE_LINE')" || {
      echo "[warn] Unable to fetch Sonar issue summary."
      return 0
    }
  fi

  SONAR_JSON="$response" node - <<'NODE'
const data = JSON.parse(process.env.SONAR_JSON || '{}');
const issues = data.issues || [];
console.log(`[info] Sonar unresolved issues on analyzed branch: ${data.total ?? issues.length}`);
if (issues.length === 0) {
  console.log('[info] No unresolved issues were returned by the API.');
} else {
  for (const issue of issues) {
    const component = typeof issue.component === 'string' && issue.component.includes(':')
      ? issue.component.split(':').slice(1).join(':')
      : (issue.component ?? '<unknown>');
    const line = issue.line ?? '?';
    const message = String(issue.message ?? '').replace(/\s+/g, ' ').trim();
    console.log(`  - [${issue.type}/${issue.severity}] ${component}:${line} ${message} (${issue.rule})`);
  }
  if ((data.total ?? issues.length) > issues.length) {
    console.log(`[info] ... and ${(data.total ?? issues.length) - issues.length} more unresolved issue(s).`);
  }
}
NODE
}

rm -rf "$COVERAGE_ROOT"
mkdir -p "$CSHARP_COVERAGE_ROOT/domain" "$CSHARP_COVERAGE_ROOT/infrastructure" "$CSHARP_COVERAGE_ROOT/application"

cd "$REPO_ROOT"

print_header "[1/5] C# full-base build + code-smell analysis"
if dotnet build FoTestApi.sln -t:Rebuild -p:TreatWarningsAsErrors=true; then
  echo "[PASS] Full-base C# build passed."
else
  echo ""
  echo "[FAIL] Full-base C# build has analyzer violations."
  FAILED=1
fi

print_header "[2/5] C# full-base coverage (threshold: 80%)"
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

print_header "[3/5] React/TS full-base ESLint"
cd "$REPO_ROOT/fotest-react"
if npx eslint src --ext .ts,.tsx --max-warnings=0; then
  echo "[PASS] Full-base React/TS ESLint passed."
else
  echo ""
  echo "[FAIL] Full-base React/TS ESLint found violations."
  FAILED=1
fi

print_header "[4/5] Repo JS/MJS full-base ESLint"
cd "$REPO_ROOT/scripts"
if npx eslint . --ext .js,.cjs,.mjs --max-warnings=0; then
  echo "[PASS] Full-base repo JS/MJS ESLint passed."
else
  echo ""
  echo "[FAIL] Full-base repo JS/MJS ESLint found violations."
  FAILED=1
fi

print_header "[5/5] React/TS full-base coverage (threshold: 80%)"
cd "$REPO_ROOT/fotest-react"
if CI=true npm test -- --coverage --coverageReporters=json-summary --coverageReporters=lcov --watchAll=false --runInBand; then
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

if [[ "${SONAR_SCANNER_ENABLED:-}" == "1" || "${SONAR_SCANNER_ENABLED:-}" == "true" ]]; then
  print_header "[optional] SonarScanner parity analysis"
  cd "$REPO_ROOT"

  if ! command -v sonar-scanner >/dev/null 2>&1; then
    echo "[FAIL] SONAR_SCANNER_ENABLED is set, but sonar-scanner is not available on PATH."
    FAILED=1
  elif [[ -z "${SONAR_TOKEN:-}" ]]; then
    echo "[FAIL] SONAR_SCANNER_ENABLED is set, but SONAR_TOKEN is missing."
    FAILED=1
  else
    SONAR_PROJECT_KEY="$(get_sonar_project_property 'sonar.projectKey')"
    SONAR_BRANCH_NAME="$(get_git_branch_name)"

    set +e
    SCANNER_OUTPUT="$(sonar-scanner \
      -Dsonar.token="$SONAR_TOKEN" \
      -Dsonar.qualitygate.wait=true \
      -Dsonar.qualitygate.timeout=300 2>&1)"
    SCANNER_EXIT=$?
    set -e

    if [[ "$SCANNER_EXIT" -ne 0 ]]; then
      if printf '%s\n' "$SCANNER_OUTPUT" | grep -q 'QUALITY GATE STATUS: FAILED'; then
        print_sonar_quality_gate_summary "$SONAR_PROJECT_KEY" "$SONAR_BRANCH_NAME"
        print_sonar_issue_summary "$SONAR_PROJECT_KEY" "$SONAR_BRANCH_NAME"
      else
        print_sonar_technical_errors "$SCANNER_OUTPUT"
      fi

      echo "[FAIL] Optional SonarScanner parity analysis failed."
      FAILED=1
    else
      echo "[PASS] Optional SonarScanner parity analysis passed."
    fi
  fi
fi

cd "$REPO_ROOT"
echo ""

if [[ "$FAILED" -eq 1 ]]; then
  echo "$SEPARATOR"
  echo "  FULL-BASE CHECKS FAILED."
  echo "$SEPARATOR"
  exit 1
fi

echo "$SEPARATOR"
echo "  Full-base quality gates passed."
echo "$SEPARATOR"
exit 0
