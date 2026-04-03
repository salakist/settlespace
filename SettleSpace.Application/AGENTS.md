# SettleSpace.Application AGENTS Metadata

## Role
Application layer and API host router for orchestration, HTTP endpoints, and dependency wiring.

## Responsibilities
- Keep cross-context application policy (DI, host wiring, middleware registration, artifact ownership).
- Route implementation guidance to context AGENTS files under this module.
- Keep this file policy-focused; keep context behavior in child AGENTS.

## Context AGENTS
- `Authentication/AGENTS.md` - auth controllers, commands, and services.
- `Persons/AGENTS.md` - persons controllers, commands, DTOs, mapping, services.
- `Transactions/AGENTS.md` - transactions controllers, commands, DTOs, mapping, services.
- `Middleware/AGENTS.md` - exception middleware behavior and mappings.

## Key files
- `Program.cs`
- `appsettings.json`
- `appsettings.Development.json`
- `SettleSpace.Application.csproj`

## Commands
- `dotnet build SettleSpace.Application/SettleSpace.Application.csproj`
- `dotnet run --project .\\SettleSpace.Application\\SettleSpace.Application.csproj`
- `dotnet test Tests/SettleSpace.Application.Tests/SettleSpace.Application.Tests.csproj`

## Build/Test Artifact Inventory
- Module build outputs: `SettleSpace.Application/bin/` and `SettleSpace.Application/obj/`.
- Standalone local build folders: `SettleSpace.Application/Debug/`, `SettleSpace.Application/Release/`, platform-specific build folders.
- Repository quality-gate outputs: `artifacts/logs/` and `artifacts/coverage/`.

## Gitignore ownership
- Root `.gitignore` is authoritative for shared artifacts.
- `SettleSpace.Application/.gitignore` keeps application-local or standalone-use rules not centralized at root.

## Dependencies
- References: `SettleSpace.Domain`, `SettleSpace.Infrastructure`.

## Source-of-truth note
Repo-wide workflow and checklist policy are authoritative in root `AGENTS.md`.
Application-context behavior is documented in the nearest child AGENTS file.
