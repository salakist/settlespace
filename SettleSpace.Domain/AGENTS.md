# SettleSpace.Domain AGENTS Metadata

## Role
Pure domain layer router for business invariants and contracts.

## Responsibilities
- Keep domain-wide architecture rules and dependency boundaries.
- Route context behavior to child AGENTS files.
- Keep this file policy-focused; keep context implementation guidance in child AGENTS.

## Context AGENTS
- `Auth/AGENTS.md` - password generation, validation, and hashing contracts/services.
- `Notifications/AGENTS.md` - notification entity, repository contract, and exceptions.
- `Persons/AGENTS.md` - person aggregate, repository contract, domain service, exceptions.
- `Transactions/AGENTS.md` - transaction aggregate, repository contract, domain service, exceptions.
- `Debts/AGENTS.md` - derived debt models, debt computation rules, and settlement validation.

## Key files
- `SettleSpace.Domain.csproj`

## Commands
- `dotnet build SettleSpace.Domain/SettleSpace.Domain.csproj`
- `dotnet test Tests/SettleSpace.Domain.Tests/SettleSpace.Domain.Tests.csproj`

## Build/Test Artifact Inventory
- Module build outputs: `SettleSpace.Domain/bin/` and `SettleSpace.Domain/obj/`.
- Related test artifacts: `Tests/SettleSpace.Domain.Tests/bin/`, `Tests/SettleSpace.Domain.Tests/obj/`, `Tests/SettleSpace.Domain.Tests/artifacts/`.
- Repository quality-gate outputs: `artifacts/logs/` and `artifacts/coverage/`.

## Gitignore ownership
- Root `.gitignore` is authoritative for shared artifacts.
- Domain has no module-local `.gitignore`.

## Dependencies
- None (no project references).

## Source-of-truth note
Repo-wide AGENTS routing is defined in root `AGENTS.md`. Agent commit workflow and checklist policy
are authoritative in root `COMMIT-POLICY.md`. Domain-context behavior is documented in the nearest
child AGENTS file.
