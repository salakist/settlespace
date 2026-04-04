# scripts AGENTS Metadata

## Role
Own repository quality-gate, hook, cleanup, and setup automation scripts.

## Responsibilities
- Keep high-level routing for the `checks/`, `hooks/`, `cleanup/`, `setup/`, and `lib/` areas.
- Keep this parent file concise and route detailed gate semantics to `checks/AGENTS.md` and hook behavior to `hooks/AGENTS.md`.
- Default agent sessions to the debug wrappers for quality-gate validation and to the non-destructive cleanup path for routine cleanup.
- Keep script documentation aligned when entry points, hook installation, agent-identity setup, or commit-message validation behavior changes.

## Scope
- `checks/` - quality gate entry points and debug wrappers (see `scripts/checks/AGENTS.md`)
- `hooks/` - `pre-commit` and `commit-msg` source templates (see `scripts/hooks/AGENTS.md`)
- `cleanup/` - cleanup scripts (`cleanup.ps1`, `cleanup-full.ps1`)
- `setup/` - setup scripts (`setup-hooks.ps1`, `set-agent-git-identity.ps1`, `seed-dev-data.ps1`)
- `lib/` - shared PowerShell helper scripts used by the root entry points
- `check-coverage.mjs`, `package.json`, `package-lock.json`, `.eslintrc.json`, `commitlint.config.cjs` - repo-script lint and commit validation support files

## Policy alignment
Repo-wide AGENTS routing is defined in root `AGENTS.md`. Agent commit workflow, checklist rules,
and commit attribution policy are authoritative in root `COMMIT-POLICY.md`.

Within the `scripts/` area:
1. Use `./scripts/checks/run-checks-debug.ps1` for normal commit validation.
2. Use `./scripts/checks/run-full-checks-debug.ps1` only when full-base analysis is requested.
3. Never suggest bypassing hooks with `--no-verify`.
4. For cleanup tasks, default to `./scripts/cleanup/cleanup.ps1`; use
   `cleanup-full.ps1 -Force` only when the user explicitly requests destructive cleanup.
   Cleanup now also covers isolated gate artifacts under `artifacts/tmp-dotnet/`.
5. Keep script documentation aligned when entry points, hook installation, agent-identity setup,
   or commit-message validation behavior changes.
6. Do not redefine the central checklist acceptance rules in this file.

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
.\scripts\start-stack.ps1
.\scripts\start-stack.ps1 -RestartRunning
.\scripts\stop-stack.ps1
.\scripts\stop-stack.ps1 -Force
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
Repo-wide AGENTS routing is defined in root `AGENTS.md`. Agent commit workflow, checklist rules,
and commit attribution policy are authoritative in root `COMMIT-POLICY.md`.
Detailed quality-gate behavior lives in `scripts/checks/AGENTS.md`, and hook behavior lives in `scripts/hooks/AGENTS.md`.


