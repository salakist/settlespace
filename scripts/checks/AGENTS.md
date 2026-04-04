# scripts/checks AGENTS Metadata

## Role
Own repository quality-gate execution behavior for changed-code and full-base validation flows.

## Responsibilities
- Keep the changed-code gate and full-base gate intent documented in one place.
- Own debug-wrapper expectations, including transcript/log output under `artifacts/logs/`.
- Keep optional Sonar parity guidance scoped to the full-base flow only.
- Route cleanup, setup, and commit-attribution topics back to parent or sibling AGENTS files.

## Key files
- `run-checks.ps1`
- `run-checks-debug.ps1`
- `run-full-checks.ps1`
- `run-full-checks-debug.ps1`
- `../check-coverage.mjs`

## Quality-gate model
- `run-checks*` validates changed production scope for the pre-commit workflow.
- `run-full-checks*` validates the full production codebase and is used when broader analysis is requested.
- Optional Sonar parity belongs only in the full-base flow and requires the expected environment configuration.
- Debug wrappers must print the resolved timestamped log path for agent sessions.

## Commands
- `./scripts/checks/run-checks-debug.ps1`
- `./scripts/checks/run-full-checks-debug.ps1`
- `./scripts/checks/run-checks.ps1`
- `./scripts/checks/run-full-checks.ps1`

## Dependencies
- .NET SDK for backend build/test and analyzer steps
- Node/npm dependencies from `scripts/package.json` for repo-script linting
- Optional Sonar environment configuration for parity analysis in the full-base flow

## Source-of-truth note
Repo-wide AGENTS routing is defined in root `AGENTS.md`. Agent commit workflow, checklist rules,
and commit attribution policy are authoritative in root `COMMIT-POLICY.md`.
The `scripts/AGENTS.md` file remains the router for the broader `scripts/` area, while hook behavior is documented in `scripts/hooks/AGENTS.md`.
