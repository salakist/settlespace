# SettleSpace.Infrastructure AGENTS Metadata

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
- `SettleSpaceDatabaseSettings.cs`

## Commands
- `dotnet build SettleSpace.Infrastructure/SettleSpace.Infrastructure.csproj`
- `dotnet test Tests/SettleSpace.Infrastructure.Tests/SettleSpace.Infrastructure.Tests.csproj`

## Build/Test Artifact Inventory
- Module build outputs: `SettleSpace.Infrastructure/bin/` and `SettleSpace.Infrastructure/obj/`.
- Related test artifacts: `Tests/SettleSpace.Infrastructure.Tests/bin/`, `Tests/SettleSpace.Infrastructure.Tests/obj/`, `Tests/SettleSpace.Infrastructure.Tests/artifacts/`.
- Repository quality-gate outputs: `artifacts/logs/` and `artifacts/coverage/`.

## Gitignore ownership
- Root `.gitignore` is authoritative for shared artifacts.
- Infrastructure has no module-local `.gitignore`.

## Dependencies
- `MongoDB.Driver`
- `Microsoft.Extensions.Options`
- Reference to `SettleSpace.Domain`

## Source-of-truth note
Repo-wide AGENTS routing is defined in root `AGENTS.md`. Agent commit workflow and checklist policy
are authoritative in root `COMMIT-POLICY.md`. Infrastructure-context behavior is documented in the
nearest child AGENTS file.
