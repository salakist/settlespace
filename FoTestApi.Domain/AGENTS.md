# FoTestApi.Domain AGENTS Metadata

## Role
Pure domain layer router for business invariants and contracts.

## Responsibilities
- Keep domain-wide architecture rules and dependency boundaries.
- Route context behavior to child AGENTS files.
- Keep this file policy-focused; keep context implementation guidance in child AGENTS.

## Context AGENTS
- `Auth/AGENTS.md` - password generation, validation, and hashing contracts/services.
- `Persons/AGENTS.md` - person aggregate, repository contract, domain service, exceptions.
- `Transactions/AGENTS.md` - transaction aggregate, repository contract, domain service, exceptions.

## Key files
- `FoTestApi.Domain.csproj`

## Commands
- `dotnet build FoTestApi.Domain/FoTestApi.Domain.csproj`
- `dotnet test Tests/FoTestApi.Domain.Tests/FoTestApi.Domain.Tests.csproj`

## Build/Test Artifact Inventory
- Module build outputs: `FoTestApi.Domain/bin/` and `FoTestApi.Domain/obj/`.
- Related test artifacts: `Tests/FoTestApi.Domain.Tests/bin/`, `Tests/FoTestApi.Domain.Tests/obj/`, `Tests/FoTestApi.Domain.Tests/artifacts/`.
- Repository quality-gate outputs: `artifacts/logs/` and `artifacts/coverage/`.

## Gitignore ownership
- Root `.gitignore` is authoritative for shared artifacts.
- Domain has no module-local `.gitignore`.

## Dependencies
- None (no project references).

## Source-of-truth note
Repo-wide workflow and checklist policy are authoritative in root `AGENTS.md`.
Domain-context behavior is documented in the nearest child AGENTS file.
