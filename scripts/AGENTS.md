# scripts AGENTS Metadata

## Role
Own repository quality-gate and hook automation scripts.

## Scope
- `run-checks.ps1` - base changed-code gate implementation.
- `run-full-checks.ps1` - base full-base gate implementation.
- `run-checks-debug.ps1` - changed-code wrapper with mandatory log capture.
- `run-full-checks-debug.ps1` - full-base wrapper with mandatory log capture.
- `setup-hooks.ps1` - local git hook installation and refresh.
- `seed-dev-data.ps1` - manual local seed script for persons and transactions API data.
- `lib/` - shared PowerShell helper scripts used by the root entry points.
- `hooks/` - hook source templates copied to `.git/hooks`; `hooks/pre-commit` remains a minimal shell launcher for Git compatibility and invokes PowerShell.
- `check-coverage.mjs` - shared coverage evaluator for changed/full modes.
- `behavior-spec.md` - current-behavior validation baseline for PowerShell gate scripts during refactor work.
- `package.json` / `.eslintrc.json` - local repo-script lint configuration for Node JS/MJS files under `scripts/`.

## Agent policy
1. Quality gate execution is mandatory before commit/push unless Step 1 is validly `SKIPPED` under root `AGENTS.md` checklist rules.
  1.1 Agents must run debug wrappers, not base gate scripts: `./scripts/run-checks-debug.ps1`.
  1.2 Use `./scripts/run-full-checks-debug.ps1` only when full-base analysis is requested.
  1.2.1 Optional SonarScanner parity analysis belongs only in the full-base gate flow, never in the changed-code pre-commit gate.
  1.2.2 Enable optional SonarScanner parity analysis only when `SONAR_SCANNER_ENABLED=1` (or `true`) and `SONAR_TOKEN` is available.
    - These values may be provided as environment variables in the calling shell or via a repo-root `.env` file loaded by `run-full-checks` scripts.
  1.2.3 Optional SonarScanner parity analysis requires SonarCloud Automatic Analysis to be disabled for the bound project.
  1.2.4 Optional SonarScanner parity analysis must wait for the remote quality gate result and fail the full-base gate when SonarCloud reports a failed analysis or failed quality gate.
  1.2.5 On Sonar failure, scripts should print a compact issue or technical-error summary that is directly actionable in agent sessions.
    - If the failed quality gate includes unreviewed security hotspots, print the most likely hotspot location returned by SonarCloud.
    - If the failed quality gate includes a coverage condition, print the 10 lowest covered files returned by SonarCloud for the analyzed branch.
  1.3 Git hooks should continue invoking base scripts (do not rewrite hooks to call debug wrappers by default).
  1.4 Never suggest bypassing hooks with `--no-verify`.
2. After gates pass and before commit, documentation updates are mandatory for the same change set.
  2.1 Update only documentation relevant to the actual changes.
  2.2 Typical targets include module `AGENTS.md` files, route notes, behavior notes, and test guidance.
3. Every commit attempt must include the mandatory 2-step checklist defined in root `AGENTS.md`.
  3.1 Do not redefine checklist acceptance rules in this file.
  3.2 If script behavior changes impact commit workflow, update root `AGENTS.md` checklist policy first.
  3.3 Agents must display Step 1 and Step 2 states in chat immediately before any `git commit` command.
    - Terminal output printed by the commit command itself does not satisfy this requirement.
  3.4 If checklist output is missing or stale, agents must refresh and display it before committing.

## Logging rules
- Debug wrappers must write timestamped logs to `artifacts/logs/`.
- Wrapper success/failure output must print the resolved log path.
- Keep log naming stable (`run-checks-<timestamp>.log`, `run-full-checks-<timestamp>.log`).

## Gate intent
- Changed-code gate enforces quality only on changed production scope.
- Full-base gate enforces quality across the full production codebase.
- C# analyzer steps use solution rebuilds to avoid incremental-build false negatives.
- JavaScript analysis is intentionally split between the React app lint track and the repo-script lint track so failures stay local to their runtime context.
- Coverage threshold remains 80% unless explicitly changed by repository policy.

## Local prerequisites
- Repo-script lint track depends on `scripts/package.json` dev dependencies.
- Ensure `cd scripts && npm install` has been run on developer machines before running quality gates.
- Optional Sonar parity can be configured in a repo-root `.env` file (`SONAR_SCANNER_ENABLED`, `SONAR_TOKEN`) to avoid setting variables manually each run.

## Update checklist
When editing any script in this folder:
1. Keep the PowerShell entry points authoritative; only the minimal `hooks/pre-commit` launcher remains shell-based.
2. Update `behavior-spec.md` if observable PowerShell gate behavior changes.
3. Update related wrapper/help text if command behavior changes.
4. Verify docs alignment in `AGENTS.md` and `README.md` if command usage changes.
5. If `scripts/package.json` changes, refresh and commit `scripts/package-lock.json`.
6. Run the changed-code debug wrapper before commit.

## Commands
```powershell
.\scripts\run-checks-debug.ps1
.\scripts\run-full-checks-debug.ps1
.\scripts\run-full-checks-debug.ps1   # optional Sonar parity: use shell env vars or repo-root .env
.\scripts\setup-hooks.ps1
.\scripts\seed-dev-data.ps1
cd scripts; npm install
```
