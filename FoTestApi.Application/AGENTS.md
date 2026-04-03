# FoTestApi.Application AGENTS Metadata

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
- `FoTestApi.Application.csproj`

## Commands
- `dotnet build FoTestApi.Application/FoTestApi.Application.csproj`
- `dotnet run --project .\\FoTestApi.Application\\FoTestApi.Application.csproj`
- `dotnet test Tests/FoTestApi.Application.Tests/FoTestApi.Application.Tests.csproj`

## Build/Test Artifact Inventory
- Module build outputs: `FoTestApi.Application/bin/` and `FoTestApi.Application/obj/`.
- Standalone local build folders: `FoTestApi.Application/Debug/`, `FoTestApi.Application/Release/`, platform-specific build folders.
- Repository quality-gate outputs: `artifacts/logs/` and `artifacts/coverage/`.

## Gitignore ownership
- Root `.gitignore` is authoritative for shared artifacts.
- `FoTestApi.Application/.gitignore` keeps application-local or standalone-use rules not centralized at root.

## Dependencies
- References: `FoTestApi.Domain`, `FoTestApi.Infrastructure`.

## Source-of-truth note
Repo-wide workflow and checklist policy are authoritative in root `AGENTS.md`.
Application-context behavior is documented in the nearest child AGENTS file.
