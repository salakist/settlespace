# Tests AGENTS Metadata

## Role
Shared router for the repository's test projects and common test-infrastructure guidance.

## Responsibilities
- Route test-project-specific behavior to the nearest test-project `AGENTS.md` file.
- Centralize shared artifact ownership and gitignore guidance for test outputs.
- Keep the mirrored relationship between production layers and test projects explicit.
- Keep common test-running conventions in one place so child test AGENTS can stay focused on behavior.

## Test project AGENTS
- `FoTestApi.Application.Tests/AGENTS.md`
- `FoTestApi.Domain.Tests/AGENTS.md`
- `FoTestApi.Infrastructure.Tests/AGENTS.md`

## Key files
- `FoTestApi.Application.Tests/FoTestApi.Application.Tests.csproj`
- `FoTestApi.Domain.Tests/FoTestApi.Domain.Tests.csproj`
- `FoTestApi.Infrastructure.Tests/FoTestApi.Infrastructure.Tests.csproj`

## Shared test infrastructure policy
- Test projects mirror the structure of their associated production layer.
- Project-local artifacts may appear under `Tests/**/artifacts/`, while repository-level gate logs and coverage aggregates live under `artifacts/`.
- Root `.gitignore` is authoritative for shared `bin/`, `obj/`, and `Tests/**/artifacts/` patterns.

## Commands
- `dotnet test FoTestApi.sln`
- `dotnet test Tests/FoTestApi.Application.Tests/FoTestApi.Application.Tests.csproj`
- `dotnet test Tests/FoTestApi.Domain.Tests/FoTestApi.Domain.Tests.csproj`
- `dotnet test Tests/FoTestApi.Infrastructure.Tests/FoTestApi.Infrastructure.Tests.csproj`

## Dependencies
- `xunit`
- `Moq`
- Project references vary by test project and are documented in the nearest child AGENTS file

## Source-of-truth note
Repository-wide workflow and documentation policy are defined in root `AGENTS.md`.
Behavior under test is documented in the corresponding production-layer AGENTS files and the nearest test-project AGENTS file.
