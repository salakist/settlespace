# FoTestApi.Infrastructure AGENTS Metadata

## Role
Infrastructure layer router for persistence implementation and shared serialization concerns.

## Responsibilities
- Keep layer-wide persistence conventions and testability strategy.
- Route repository behavior to context AGENTS files.
- Keep shared serialization/settings guidance at layer scope unless it grows enough to require its own child AGENTS.

## Context AGENTS
- `Persons/AGENTS.md` - person repository behavior and query patterns.
- `Transactions/AGENTS.md` - transaction repository behavior and query patterns.

## Shared layer files
- `Serialization/DateOnlyAsStringSerializer.cs`
- `FoTestDatabaseSettings.cs`

## Commands
- `dotnet build FoTestApi.Infrastructure/FoTestApi.Infrastructure.csproj`
- `dotnet test Tests/FoTestApi.Infrastructure.Tests/FoTestApi.Infrastructure.Tests.csproj`

## Build/Test Artifact Inventory
- Module build outputs: `FoTestApi.Infrastructure/bin/` and `FoTestApi.Infrastructure/obj/`.
- Related test artifacts: `Tests/FoTestApi.Infrastructure.Tests/bin/`, `Tests/FoTestApi.Infrastructure.Tests/obj/`, `Tests/FoTestApi.Infrastructure.Tests/artifacts/`.
- Repository quality-gate outputs: `artifacts/logs/` and `artifacts/coverage/`.

## Gitignore ownership
- Root `.gitignore` is authoritative for shared artifacts.
- Infrastructure has no module-local `.gitignore`.

## Dependencies
- `MongoDB.Driver`
- `Microsoft.Extensions.Options`
- Reference to `FoTestApi.Domain`

## Source-of-truth note
Repo-wide workflow and checklist policy are authoritative in root `AGENTS.md`.
Infrastructure-context behavior is documented in the nearest child AGENTS file.
