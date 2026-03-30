# Scripts Behavior Spec

## Purpose

This document is the current-behavior baseline for the PowerShell gate entry points under `scripts/`.
Its primary purpose is post-refactor validation, not end-user onboarding.

The first pass covers only the gate scripts:
- `run-checks.ps1`
- `run-checks-debug.ps1`
- `run-full-checks.ps1`
- `run-full-checks-debug.ps1`

## Baseline Notes

- Current repository documentation is materially aligned with the current gate-script behavior in `AGENTS.md`, `scripts/AGENTS.md`, and `README.md`.
- PowerShell gate scripts are the authoritative implementation; the only remaining shell artifact is the minimal `scripts/hooks/pre-commit` launcher used for Git hook compatibility.
- Output strictness is mixed:
  - exact markers are required for critical headings and terminal pass/fail summaries
  - semantic equivalence is acceptable for subordinate detail lines unless an exact marker is listed below

## run-checks.ps1

### Role

Base changed-code quality gate used by git hooks and by the debug wrapper.

### Entry Point

```powershell
.\scripts\run-checks.ps1
```

### Preconditions

- Must be run from the repository root or by a caller that preserves `PSScriptRoot` correctly.
- `dotnet` must be available on `PATH`.
- Frontend dependencies under `fotest-react/` must be installed for React lint/test steps.
- Repo script dependencies under `scripts/` must be installed for JS/MJS lint.
- A git repository must be present because changed-file scope comes from git commands.

### Scope Resolution Behavior

- Determines changed scope in this order:
  1. staged changes
  2. working tree changes including untracked files
  3. changes since upstream branch
  4. last commit
  5. all tracked files fallback
- Normalizes paths to forward-slash repo-relative paths.
- Writes the resolved changed file list to `artifacts/changed-files.txt`.

### Exact Required Markers

- `[mandatory] changed-code gate: run before every commit`
- `Changed-code analysis target`
- `[1/5] C# changed-file analyzer gate`
- `[2/5] C# changed-file coverage gate (threshold: 80%)`
- `[3/5] React/TS changed-file ESLint gate`
- `[4/5] Repo JS/MJS changed-file ESLint gate`
- `[5/5] React/TS changed-file coverage gate (threshold: 80%)`
- Success banner: `Changed-code quality gates passed.`
- Failure banner: `CHANGED-CODE CHECKS FAILED. Commit is blocked.`

### Semantic Step Contract

- Prints the changed-file scope source and a preview of the matched files.
- Filters C# diagnostics to changed C# files only.
- Uses `dotnet build FoTestApi.sln -t:Rebuild` for analyzer visibility.
- Runs C# coverage only when changed production C# files exist.
- Runs React ESLint only on changed frontend files.
- Runs repo-script ESLint only on changed JS/MJS files under `scripts/`.
- Runs React coverage only on changed production React/TS files using `--findRelatedTests`.
- Uses `scripts/check-coverage.mjs` as the shared coverage evaluator for both C# and React coverage gates.

### Artifacts And Side Effects

- Always updates `artifacts/changed-files.txt`.
- Creates `artifacts/coverage/changed/csharp/` only when changed production C# files exist.
- Removes `fotest-react/coverage/` before changed React coverage runs.
- Temporarily sets `CI=true` for the changed React coverage test invocation and removes it afterward.
- Ends in repository root.

### Exit Code Contract

- Exits `0` only when all applicable gate steps pass or are validly skipped.
- Exits `1` when any applicable step fails.

### Important Failure Cases

- Changed C# diagnostics found in changed files -> fail.
- Solution build fails outside the changed-file filter -> fail.
- Any C# test project fails before coverage evaluation -> fail.
- Changed production C# coverage below 80% -> fail.
- Changed React ESLint violations -> fail.
- Changed repo JS/MJS ESLint violations -> fail.
- Changed React tests fail before coverage evaluation -> fail.
- Changed production React coverage below 80% -> fail.

## run-checks-debug.ps1

### Role

Wrapper for `run-checks.ps1` that always captures output to a timestamped transcript log.

### Entry Point

```powershell
.\scripts\run-checks-debug.ps1
```

### Preconditions

- Same runtime/tooling prerequisites as `run-checks.ps1`.
- Must be able to create `artifacts/logs/`.

### Exact Required Markers

- `[info] Running changed-code gate with log capture...`
- `[info] Log file:`
- Success summary: `[pass] Changed-code gate passed. Log:`
- Failure summary: `[fail] Changed-code gate failed. See log:`

### Semantic Step Contract

- Creates `artifacts/logs/run-checks-<timestamp>.log`.
- Starts a PowerShell transcript before invoking `run-checks.ps1`.
- Preserves the underlying script exit code.
- Always stops the transcript in a `finally` block.

### Artifacts And Side Effects

- Always creates a new `artifacts/logs/run-checks-<timestamp>.log` transcript file.

### Exit Code Contract

- Mirrors the effective exit code from `run-checks.ps1`.

### Important Failure Cases

- If `run-checks.ps1` fails, wrapper still stops transcript, prints the failure summary line, and exits non-zero.

## run-full-checks.ps1

### Role

Base full-base quality gate for repository-wide validation.

### Entry Point

```powershell
.\scripts\run-full-checks.ps1
```

### Preconditions

- Must be run from the repository root or by a caller that preserves `PSScriptRoot` correctly.
- `dotnet`, `node`, `npm`, and `npx` must be available on `PATH`.
- Frontend dependencies under `fotest-react/` must be installed.
- Repo script dependencies under `scripts/` must be installed.
- Optional Sonar parity additionally requires:
  - `SONAR_SCANNER_ENABLED=1` or `true`
  - `SONAR_TOKEN` available either in environment or repo-root `.env`
  - `sonar-scanner` available on `PATH`
  - SonarCloud Automatic Analysis disabled for the bound project

### Environment Loading Behavior

- Loads repo-root `.env` if present.
- Only sets env vars from `.env` when the same variable is not already set in the calling shell.
- Current intended Sonar vars are `SONAR_SCANNER_ENABLED` and `SONAR_TOKEN`, but the loader is generic `KEY=value` parsing.

### Exact Required Markers

- `[1/5] C# full-base build + code-smell analysis`
- `[2/5] C# full-base coverage (threshold: 80%)`
- `[3/5] React/TS full-base ESLint`
- `[4/5] Repo JS/MJS full-base ESLint`
- `[5/5] React/TS full-base coverage (threshold: 80%)`
- Optional section header when enabled: `[optional] SonarScanner parity analysis`
- Success banner: `Full-base quality gates passed.`
- Failure banner: `FULL-BASE CHECKS FAILED.`

### Semantic Step Contract

- Rebuilds the entire solution with warnings treated as errors.
- Runs C# coverage across Domain, Infrastructure, and Application test projects.
- Evaluates full C# coverage through `scripts/check-coverage.mjs` at an 80% threshold.
- Runs full React/TS ESLint over `fotest-react/src`.
- Runs full repo-script ESLint over `scripts/` JS/MJS files.
- Runs full React/TS coverage with `json-summary` and `lcov` reporters.
- Evaluates full React/TS coverage through `scripts/check-coverage.mjs` at an 80% threshold.
- Removes `CI` after the React test step.
- If Sonar parity is enabled and scanner returns a failed quality gate, prints:
  - quality gate status
  - failing quality gate conditions
  - likely hotspot location when hotspot-review condition fails
  - 10 lowest covered files from SonarCloud when a coverage condition fails
  - unresolved issue summary
- If Sonar parity is enabled and SonarCloud reports duplication on the analyzed branch, prints warning lines with:
  - duplicated_lines_density, duplicated_lines, and duplicated_blocks
  - top duplicated files and their duplication metrics
- If Sonar scanner fails for technical reasons instead of a failed quality gate, prints a technical error summary instead of the API-based issue summary.

### Artifacts And Side Effects

- Removes and recreates `artifacts/coverage/full/` at the start of the run.
- Recreates `artifacts/coverage/full/csharp/domain`, `.../infrastructure`, and `.../application`.
- Produces coverlet JSON reports under `artifacts/coverage/full/csharp/`.
- Produces frontend coverage under `fotest-react/coverage/` including `coverage-summary.json` and `lcov.info`.
- Ends in repository root.

### Exit Code Contract

- Exits `0` only when all applicable full-base steps pass.
- Exits `1` when any full-base step fails or optional Sonar parity fails when enabled.

### Important Failure Cases

- Full solution build fails -> fail.
- Any C# test project fails before coverage evaluation -> fail.
- Full C# coverage below 80% -> fail.
- Full React/TS ESLint violations -> fail.
- Full repo JS/MJS ESLint violations -> fail.
- Full React tests fail before coverage evaluation -> fail.
- Full React coverage below 80% -> fail.
- Sonar parity enabled but scanner missing -> fail.
- Sonar parity enabled but token missing -> fail.
- Sonar scanner reports failed analysis or failed quality gate -> fail.

## run-full-checks-debug.ps1

### Role

Wrapper for `run-full-checks.ps1` that always captures output to a timestamped transcript log.

### Entry Point

```powershell
.\scripts\run-full-checks-debug.ps1
```

### Preconditions

- Same runtime/tooling prerequisites as `run-full-checks.ps1`.
- Must be able to create `artifacts/logs/`.

### Exact Required Markers

- `[info] Running full-base gate with log capture...`
- `[info] Log file:`
- Success summary: `[pass] Full-base gate passed. Log:`
- Failure summary: `[fail] Full-base gate failed. See log:`

### Semantic Step Contract

- Creates `artifacts/logs/run-full-checks-<timestamp>.log`.
- Starts a PowerShell transcript before invoking `run-full-checks.ps1`.
- Preserves the underlying script exit code.
- Always stops the transcript in a `finally` block.

### Artifacts And Side Effects

- Always creates a new `artifacts/logs/run-full-checks-<timestamp>.log` transcript file.

### Exit Code Contract

- Mirrors the effective exit code from `run-full-checks.ps1`.

### Important Failure Cases

- If `run-full-checks.ps1` fails, wrapper still stops transcript, prints the failure summary line, and exits non-zero.