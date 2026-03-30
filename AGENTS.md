# AGENTS Index

This repository defines nested agent metadata to describe project-level and sub-project agent responsibilities.

## Solution structure

```
FoTestApi.sln
├── FoTestApi.Domain/               — domain layer (entities, rules, repository interfaces, domain service)
├── FoTestApi.Infrastructure/       — infrastructure layer (MongoDB, settings)
├── FoTestApi.Application/          — application layer (commands, services, API controllers)
├── Tests/
│   ├── FoTestApi.Domain.Tests/         — unit tests for the Domain layer
│   ├── FoTestApi.Infrastructure.Tests/ — unit tests for the Infrastructure layer
│   └── FoTestApi.Application.Tests/    — unit tests for the Application layer
└── fotest-react/                   — frontend SPA (React + TypeScript + Material UI)
```

## Sub-agent files
- `FoTestApi.Domain/AGENTS.md` — domain rules, entities, exceptions, domain service interface
- `FoTestApi.Infrastructure/AGENTS.md` — MongoDB persistence, BsonClassMap configuration
- `FoTestApi.Application/AGENTS.md` — application service, commands, REST controllers
- `fotest-react/AGENTS.md` — frontend SPA implementation and UI behavior
- `scripts/AGENTS.md` — gate scripts, debug wrappers, hooks, and coverage automation policy
- `Tests/FoTestApi.Domain.Tests/AGENTS.md` — domain test scope and strategy
- `Tests/FoTestApi.Infrastructure.Tests/AGENTS.md` — infrastructure repository test scope and strategy
- `Tests/FoTestApi.Application.Tests/AGENTS.md` — application/controller/auth/middleware test scope and strategy

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

## Quality gates — mandatory before every commit

The authoritative script policy now lives in `scripts/AGENTS.md`.

Repository-wide minimums:
1. Agents must run `./scripts/run-checks-debug.ps1` (or `sh scripts/run-checks-debug.sh`) before commit/push.
2. Use full-base debug wrappers only when explicitly requested.
3. `pre-commit` keeps enforcing the base changed-code gate.
4. Never bypass hooks with `--no-verify`.

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
