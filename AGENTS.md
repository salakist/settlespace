# AGENTS Index

This repository defines nested agent metadata to describe project-level and sub-project agent responsibilities.

## Solution structure

```
FoTestApi.sln
├── FoTestApi.Domain/               — domain layer organized by context (Auth, Persons, Transactions)
├── FoTestApi.Infrastructure/       — infrastructure layer organized by context (Persons, Transactions) + shared tech folders
├── FoTestApi.Application/          — application layer organized by context (Authentication, Persons, Transactions)
├── Tests/
│   ├── FoTestApi.Domain.Tests/         — mirrors Domain context/function structure
│   ├── FoTestApi.Infrastructure.Tests/ — mirrors Infrastructure context/function structure
│   └── FoTestApi.Application.Tests/    — mirrors Application context/function structure
└── fotest-react/                   — frontend SPA (React + TypeScript + Material UI)
```

## Folder architecture policy
- Backend production layers use `Layer/Context/Function` organization.
- A function subfolder is used only when the context contains multiple function groups.
- If a context would contain only one function subfolder, flatten it and place files directly under the context.
- Exceptions are treated as a function group and should use an `Exceptions/` subfolder when a context has multiple function groups.
- Domain entity class names must not use an `Entity` suffix (for example use `Person`, not `PersonEntity`).
- Test projects must mirror the folder structure of their associated production layer.

## Sub-agent files
- `FoTestApi.Domain/AGENTS.md` — domain rules, entities, exceptions, domain service interface
- `FoTestApi.Infrastructure/AGENTS.md` — MongoDB persistence, BsonClassMap configuration
- `FoTestApi.Application/AGENTS.md` — application service, commands, REST controllers
- `fotest-react/AGENTS.md` — frontend SPA implementation and UI behavior
- `scripts/AGENTS.md` — gate scripts, debug wrappers, hooks, and coverage automation policy
- `Tests/FoTestApi.Domain.Tests/AGENTS.md` — domain test scope and strategy
- `Tests/FoTestApi.Infrastructure.Tests/AGENTS.md` — infrastructure repository test scope and strategy
- `Tests/FoTestApi.Application.Tests/AGENTS.md` — application/controller/auth/middleware test scope and strategy

## Documentation source of truth
- Repository architecture and commit workflow policy: this file (`AGENTS.md`).
- Gate script behavior, wrappers, and logging policy: `scripts/AGENTS.md`.
- User-facing setup/runbook and API usage examples: `README.md`.
- Module-specific behavior and testing details: each module `AGENTS.md`.

When guidance overlaps, prefer the more specific authoritative file above and update references instead of duplicating policy text.

## Testing
Each production layer has a corresponding xUnit + Moq test project:
- `FoTestApi.Domain.Tests/` — pure unit tests, no mocking needed
- `FoTestApi.Infrastructure.Tests/` — mocks `IMongoCollection<T>` via internal test constructor
- `FoTestApi.Application.Tests/` — mocks `IPersonRepository` and `IPersonDomainService` for strict isolation

Run all tests: `dotnet test FoTestApi.sln`
- Test projects live under `Tests/` to keep them separate from production projects.

## Running the API host

- From the repository root (`fo-test/`), run `dotnet run --project .\FoTestApi.Application\FoTestApi.Application.csproj`.
- If the current terminal is one level above the repo (for example the workspace root is `Repos/`), run `dotnet run --project .\fo-test\FoTestApi.Application\FoTestApi.Application.csproj` instead.
- Do not assume the terminal cwd is the repository root; verify the current directory before using a relative project path.

## Commit workflow requirements

The authoritative script policy now lives in `scripts/AGENTS.md`.

When commit workflow guidance overlaps across docs, `AGENTS.md` files are the source of truth and take precedence over `README.md`.

Repository-wide minimums (before commit/push):
1. Step 1 - Quality gate validation.
	1.1 Run `./scripts/run-checks-debug.ps1` (or `sh scripts/run-checks-debug.sh`) and keep the log path.
	1.2 Use full-base debug wrappers only when explicitly requested.
	1.3 `pre-commit` keeps enforcing the base changed-code gate.
	1.4 Never bypass hooks with `--no-verify`.
2. Step 2 - Documentation alignment for the same change set.
	2.1 Update only docs relevant to the actual changes in the commit.
	2.2 Typical targets include module `AGENTS.md` files, route notes, behavior notes, and test guidance.

### Mandatory commit checklist (must be shown for every commit attempt)

Before running `git commit`, explicitly show this 2-step checklist with a status for each step:
1. Step 1 status: `DONE` or `SKIPPED`.
2. Step 2 status: `DONE` or `SKIPPED`.

Checklist rules:
1. If a step is `SKIPPED`, include a one-line reason.
2. Step 1 may be `SKIPPED` only when there are no production code changes since the latest successful Step 1 run, and the latest log path is provided.
	- Production code changes means staged or unstaged edits in implementation source files under `FoTestApi.Domain/`, `FoTestApi.Infrastructure/`, `FoTestApi.Application/`, `fotest-react/src/`, and runtime quality-gate script code/config under `scripts/` (for example `*.ps1`, `*.sh`, `*.mjs`, `*.js`, `package.json`, `.eslintrc.json`), excluding test files and documentation-only changes.
	- The latest successful Step 1 log path must be shown directly in the commit checklist output (for example under a `Latest Step 1 log` line).
3. Step 2 must always be reviewed at commit-time for the current staged diff. You may mark Step 2 as `SKIPPED` only as `No documentation changes required` and include a short reason tied to the staged changes.
4. If either step is neither `DONE` nor validly `SKIPPED`, do not commit.
5. A documentation-only commit may mark both steps as `SKIPPED` when all skip conditions above are met.
	- Typical case: only `*.md` files are changed, there are no production code changes, a latest successful Step 1 log path is shown, and no additional documentation updates are required beyond the staged docs.

### First-time setup (install the git hook)

```powershell
.\scripts\setup-hooks.ps1      # Windows
```
```bash
sh scripts/setup-hooks.sh      # Linux / macOS / Git Bash
```

### Verify hooks are healthy

```powershell
Get-ChildItem .git\hooks\pre-commit
```

```bash
ls -l .git/hooks/pre-commit
```

If the hook is missing or stale, re-run `setup-hooks` before commit.

### Fixing a coverage failure

- Check which file or class is below threshold in the coverlet/Jest output.
- Add focused unit tests for the uncovered code paths.
- Re-run the script — do not lower the threshold.
- In changed-code mode, the threshold is evaluated only against changed production files.
- In full-base mode, the threshold is evaluated across the full production codebase.
- The C# coverage scope excludes application startup composition-root files such as `FoTestApi.Application/Program.cs`.

### Fixing a code-smell failure

- Read the diagnostic ID and message in the output (e.g. `RCS1077`, `sonar/cognitive-complexity`).
- Refactor the offending code to resolve the violation.
- Re-run the script — do not suppress the diagnostic with `#pragma warning disable` or `// eslint-disable` unless it is a genuine false positive and a comment explains why.
- Changed-code mode is meant to stop new debt from being introduced.
- Full-base mode is meant to assess and reduce existing debt across the repository.

## Purpose
Maintain clear per-module guidelines for AI-assisted development and handoff.
