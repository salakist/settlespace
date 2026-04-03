# scripts AGENTS Metadata

## Role
Own repository quality-gate, hook, cleanup, and setup automation scripts.

## Responsibilities
- Keep high-level routing for the `checks/`, `hooks/`, `cleanup/`, `setup/`, and `lib/` areas.
- Keep this parent file concise and route detailed gate semantics to `checks/AGENTS.md` and hook behavior to `hooks/AGENTS.md`.
- Default agent sessions to the debug wrappers for quality-gate validation and to the non-destructive cleanup path for routine cleanup.
- Keep script documentation aligned when entry points, hook installation, or agent-identity setup behavior changes.

## Scope
- `checks/` - quality gate entry points and debug wrappers (see `scripts/checks/AGENTS.md`)
- `hooks/` - `pre-commit` and `commit-msg` source templates (see `scripts/hooks/AGENTS.md`)
- `cleanup/` - cleanup scripts (`cleanup.ps1`, `cleanup-full.ps1`)
- `setup/` - setup scripts (`setup-hooks.ps1`, `set-agent-git-identity.ps1`, `seed-dev-data.ps1`)
- `lib/` - shared PowerShell helper scripts used by the root entry points
- `check-coverage.mjs`, `package.json`, `.eslintrc.json` - repo-script lint and coverage support files

## Agent policy
1. Quality gate execution is mandatory before commit/push unless Step 1 is validly `SKIPPED` under root `AGENTS.md` checklist rules.
  1.1 Agents should run `./scripts/checks/run-checks-debug.ps1` for normal commit validation.
  1.2 Use `./scripts/checks/run-full-checks-debug.ps1` only when full-base analysis is requested.
  1.3 Never suggest bypassing hooks with `--no-verify`.
  1.4 For cleanup tasks, default to `./scripts/cleanup/cleanup.ps1`; use `cleanup-full.ps1 -Force` only when the user explicitly requests destructive cleanup.
  1.5 Agent-authored commits must use the repo-local agent identity configured via `./scripts/setup/set-agent-git-identity.ps1`.
2. After gates pass and before commit, update only documentation relevant to the same change set.
3. Do not redefine the root checklist acceptance rules in this file.

## Local prerequisites
- Repo-script linting depends on the dev dependencies from `scripts/package.json`.
- Ensure `cd scripts && npm install` has been run on developer machines before running script quality gates.
- Install the local hooks with `./scripts/setup/setup-hooks.ps1`.
- Optional Sonar parity environment configuration applies only to the full-base gate; see `scripts/checks/AGENTS.md`.

## Update checklist
When editing any script in this folder:
1. Keep the PowerShell entry points authoritative and the hook launchers minimal and shell-compatible.
2. Update related docs/help text if behavior changes.
3. Verify alignment in `AGENTS.md` and `README.md` when command usage changes.
4. If `scripts/package.json` changes, refresh and commit `scripts/package-lock.json`.
5. Run the changed-code debug wrapper before commit.

## Commands
```powershell
.\scripts\checks\run-checks-debug.ps1
.\scripts\checks\run-full-checks-debug.ps1
.\scripts\cleanup\cleanup.ps1
.\scripts\cleanup\cleanup.ps1 -DryRun
.\scripts\cleanup\cleanup-full.ps1 -Force
.\scripts\cleanup\cleanup-full.ps1 -Force -DryRun
.\scripts\setup\setup-hooks.ps1
.\scripts\setup\set-agent-git-identity.ps1
.\scripts\setup\set-agent-git-identity.ps1 -ClearLocalIdentity
.\scripts\setup\seed-dev-data.ps1
cd scripts; npm install
```

## Dependencies
- PowerShell and Git for the local automation entry points and hook installation
- .NET SDK for backend build/test and analyzer steps triggered by the gates
- Node/npm for the repo-script lint track and coverage helpers

## Source-of-truth note
Repo-wide commit workflow, checklist rules, and agent commit attribution policy are authoritative in root `AGENTS.md`.
Detailed quality-gate behavior lives in `scripts/checks/AGENTS.md`, and hook behavior lives in `scripts/hooks/AGENTS.md`.


