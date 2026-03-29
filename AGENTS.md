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

## Quality gates — mandatory before every commit and push

There are now two analysis modes:

1. `scripts/run-checks.ps1` / `scripts/run-checks.sh`
   This is the **changed-code gate**.
   It is the default path for agents and the one enforced by the git hooks.
2. `scripts/run-full-checks.ps1` / `scripts/run-full-checks.sh`
   This is the **full-base gate**.
   It is optional and should be run only when explicitly requested, or when you want to assess the whole repository.

All agents MUST use the changed-code gate before making any commit or push.
**Never bypass the git hook with `--no-verify`.**

### Run the checks

```powershell
# Windows (PowerShell) - changed code only
.\scripts\run-checks.ps1
```

```bash
# Linux / macOS / Git Bash - changed code only
sh scripts/run-checks.sh
```

Optional full-base analysis:

```powershell
.\scripts\run-full-checks.ps1
```

```bash
sh scripts/run-full-checks.sh
```

### What the gates enforce

| Gate | Changed-code mode | Full-base mode |
|------|-------------------|----------------|
| C# code smells | Build the solution and block diagnostics that touch changed C# files | Build the full solution and block all analyzer diagnostics |
| C# test coverage | Measure coverage only on changed production C# files | Measure coverage across the full production C# codebase |
| React/TS code smells | Run ESLint only on changed frontend files | Run ESLint on the full frontend source tree |
| React/TS test coverage | Measure coverage only on changed production frontend files | Measure coverage across the full production frontend codebase |

### Agent workflow

1. Write the code change.
2. Run `.\scripts\run-checks.ps1` (or `sh scripts/run-checks.sh`). This is the changed-code gate enforced by hooks.
3. If **any gate fails**:
   - Read the failure output carefully.
   - Fix the violation (add missing tests, resolve the code smell).
   - Re-run the script until all four gates pass.
4. Only then: `git add` → `git commit` → `git push`.
5. The `pre-commit` and `pre-push` git hooks also run the same changed-code script automatically — if it was skipped in step 2, the commit or push will still be blocked.
6. Run the full-base script only when explicitly requested.

### First-time setup (install the git hook)

```powershell
.\scripts\setup-hooks.ps1      # Windows
```
```bash
sh scripts/setup-hooks.sh      # Linux / macOS / Git Bash
```

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
