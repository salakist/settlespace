# AGENTS Index

This repository uses nested AGENTS files so agents can load the narrowest relevant guidance first.

## Solution structure

```
SettleSpace.sln
+-- SettleSpace.Domain/
+-- SettleSpace.Infrastructure/
+-- SettleSpace.Application/
+-- Tests/
+-- settlespace-react/
+-- bruno/
```

## Routing model
- Root `AGENTS.md` is the global index and policy router.
- Layer or app-level `AGENTS.md` files are module routers.
- Context and feature `AGENTS.md` files are the primary source for implementation behavior.
- When guidance overlaps, the most specific AGENTS in the path is authoritative.

## Folder architecture policy
- Backend production layers use `Layer/Context/Function` organization.
- A function subfolder is used only when the context contains multiple function groups.
- If a context would contain only one function subfolder, flatten it and place files directly under the context.
- Test projects mirror the folder structure of their associated production layer.
- Domain entity class names must not use an `Entity` suffix.

## AGENTS file map

### Root and module routers
- `AGENTS.md`
- `SettleSpace.Application/AGENTS.md`
- `SettleSpace.Domain/AGENTS.md`
- `SettleSpace.Infrastructure/AGENTS.md`
- `settlespace-react/AGENTS.md`
- `bruno/AGENTS.md`
- `scripts/AGENTS.md`
- `scripts/checks/AGENTS.md`
- `scripts/hooks/AGENTS.md`
- `Tests/AGENTS.md`
- `Tests/SettleSpace.Application.Tests/AGENTS.md`
- `Tests/SettleSpace.Domain.Tests/AGENTS.md`
- `Tests/SettleSpace.Infrastructure.Tests/AGENTS.md`

### Backend context AGENTS
- `SettleSpace.Application/Authentication/AGENTS.md`
- `SettleSpace.Application/Notifications/AGENTS.md`
- `SettleSpace.Application/Persons/AGENTS.md`
- `SettleSpace.Application/Transactions/AGENTS.md`
- `SettleSpace.Application/Debts/AGENTS.md`
- `SettleSpace.Application/Middleware/AGENTS.md`
- `SettleSpace.Domain/Auth/AGENTS.md`
- `SettleSpace.Domain/Notifications/AGENTS.md`
- `SettleSpace.Domain/Persons/AGENTS.md`
- `SettleSpace.Domain/Transactions/AGENTS.md`
- `SettleSpace.Domain/Debts/AGENTS.md`
- `SettleSpace.Infrastructure/Notifications/AGENTS.md`
- `SettleSpace.Infrastructure/Persons/AGENTS.md`
- `SettleSpace.Infrastructure/Transactions/AGENTS.md`

### Frontend feature AGENTS
- `settlespace-react/src/features/auth/AGENTS.md`
- `settlespace-react/src/features/home/AGENTS.md`
- `settlespace-react/src/features/notifications/AGENTS.md`
- `settlespace-react/src/features/persons/AGENTS.md`
- `settlespace-react/src/features/profile/AGENTS.md`
- `settlespace-react/src/features/transactions/AGENTS.md`
- `settlespace-react/src/features/debts/AGENTS.md`
- `settlespace-react/src/features/search/AGENTS.md`

## Build/Test Artifact Inventory
- Shared build outputs: `**/bin/`, `**/obj/`.
- Shared dependency outputs: `**/node_modules/`.
- Repository quality-gate outputs: `artifacts/` including `artifacts/logs/` and `artifacts/coverage/`.
- Test-project local artifacts: `Tests/**/artifacts/`.
- SonarScanner working directory: `.scannerwork/`.

## Gitignore ownership
- Root `.gitignore` is authoritative for shared repository patterns and cross-project generated outputs.
- Subproject `.gitignore` files keep only stack-specific or standalone-use rules not intended to be centralized.

## Agent Rules
- Agents must not read from `.env` files to ensure sensitive information is protected.

## When to add deeper nesting
1. The parent AGENTS mixes two or more business contexts.
2. The file mixes cross-cutting policy and implementation behavior.
3. Agents repeatedly need to open unrelated sections to complete common tasks.

Do not add deeper nesting when all guidance belongs to one stable context with one workflow.

## AGENTS consistency checklist
Every new or substantially updated AGENTS file should contain:
1. `Role`
2. `Responsibilities`
3. `Key files`
4. `Commands`
5. `Dependencies`
6. `Source-of-truth note`

## Documentation source of truth
- Repository architecture and repo-wide AGENTS routing: this file.
- Agent commit workflow, checklist acceptance rules, and commit identity policy: `COMMIT-POLICY.md`.
- Scripts routing, setup, and cleanup guidance: `scripts/AGENTS.md`.
- Quality-gate behavior and debug-wrapper intent: `scripts/checks/AGENTS.md`.
- Hook behavior and local attribution enforcement: `scripts/hooks/AGENTS.md`.
- Shared test-project policy: `Tests/AGENTS.md`.
- User-facing setup and API examples: `README.md`.
- Bruno collection usage, environment conventions, and auth automation notes: `bruno/SettleSpace API/collection.bru`.
- Shared frontend UX/UI conventions: `settlespace-react/UX-PRINCIPLES.md`.
- Planned or shelved product ideas and future pages: `TODO.md`.
- Module and context behavior: nearest module/context/feature `AGENTS.md`.

Checklist authority note:
- The mandatory commit checklist policy is authoritative only in `COMMIT-POLICY.md`.
- Other AGENTS files may reference the checklist but must not redefine checklist acceptance rules.

## Testing
- Run all tests: `dotnet test SettleSpace.sln`.
- Frontend CI tests: `npm run test:ci` from `settlespace-react/`.

## Running the API host
- From repository root: `dotnet run --project .\\SettleSpace.Application\\SettleSpace.Application.csproj`.
- If cwd is one level above repo: `dotnet run --project .\\settlespace\\SettleSpace.Application\\SettleSpace.Application.csproj`.

## Agent Commit Policy and Workflow
See root `COMMIT-POLICY.md` for the authoritative agent-specific commit-time policy, including:
- agent Git identity requirements
- Conventional Commit summary, trailer, and line-wrapping rules
- the pre-commit checklist, skip conditions, and acceptance criteria
- hook enforcement boundaries

Keep this root file focused on repository architecture and AGENTS routing; keep agent commit workflow details in `COMMIT-POLICY.md`.

## Purpose
Maintain clear, hierarchical AGENTS guidance with minimal context noise for AI-assisted development.


