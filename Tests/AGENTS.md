# Tests AGENTS Metadata

## Role
Shared router for the repository's test projects and common test-infrastructure guidance.

## Responsibilities
- Route test-project-specific behavior to the nearest test-project `AGENTS.md` file.
- Centralize shared artifact ownership and gitignore guidance for test outputs.
- Keep the mirrored relationship between production layers and test projects explicit.
- Keep common test-running conventions in one place so child test AGENTS can stay focused on behavior.

## Test project AGENTS
- `SettleSpace.Application.Tests/AGENTS.md`
- `SettleSpace.Domain.Tests/AGENTS.md`
- `SettleSpace.Infrastructure.Tests/AGENTS.md`

## Key files
- `SettleSpace.Application.Tests/SettleSpace.Application.Tests.csproj`
- `SettleSpace.Domain.Tests/SettleSpace.Domain.Tests.csproj`
- `SettleSpace.Infrastructure.Tests/SettleSpace.Infrastructure.Tests.csproj`

## Shared test infrastructure policy
- Test projects mirror the structure of their associated production layer.
- Project-local artifacts may appear under `Tests/**/artifacts/`, while repository-level gate logs and coverage aggregates live under `artifacts/`.
- Root `.gitignore` is authoritative for shared `bin/`, `obj/`, and `Tests/**/artifacts/` patterns.

## Commands
- `dotnet test SettleSpace.sln`
- `dotnet test Tests/SettleSpace.Application.Tests/SettleSpace.Application.Tests.csproj`
- `dotnet test Tests/SettleSpace.Domain.Tests/SettleSpace.Domain.Tests.csproj`
- `dotnet test Tests/SettleSpace.Infrastructure.Tests/SettleSpace.Infrastructure.Tests.csproj`

## Dependencies
- `xunit`
- `Moq`
- Project references vary by test project and are documented in the nearest child AGENTS file

## Source-of-truth note
Repo-wide AGENTS routing is defined in root `AGENTS.md`. Agent commit workflow and checklist policy
are authoritative in root `COMMIT-POLICY.md`. Behavior under test is documented in the
corresponding production-layer AGENTS files and the nearest test-project AGENTS file.
