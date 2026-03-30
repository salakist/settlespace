# AGENTS Index

This repository uses nested AGENTS files so agents can load the narrowest relevant guidance first.

## Solution structure

```
FoTestApi.sln
+-- FoTestApi.Domain/
+-- FoTestApi.Infrastructure/
+-- FoTestApi.Application/
+-- Tests/
+-- fotest-react/
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
- `FoTestApi.Application/AGENTS.md`
- `FoTestApi.Domain/AGENTS.md`
- `FoTestApi.Infrastructure/AGENTS.md`
- `fotest-react/AGENTS.md`
- `scripts/AGENTS.md`
- `Tests/FoTestApi.Application.Tests/AGENTS.md`
- `Tests/FoTestApi.Domain.Tests/AGENTS.md`
- `Tests/FoTestApi.Infrastructure.Tests/AGENTS.md`

### Backend context AGENTS
- `FoTestApi.Application/Authentication/AGENTS.md`
- `FoTestApi.Application/Persons/AGENTS.md`
- `FoTestApi.Application/Transactions/AGENTS.md`
- `FoTestApi.Application/Middleware/AGENTS.md`
- `FoTestApi.Domain/Auth/AGENTS.md`
- `FoTestApi.Domain/Persons/AGENTS.md`
- `FoTestApi.Domain/Transactions/AGENTS.md`
- `FoTestApi.Infrastructure/Persons/AGENTS.md`
- `FoTestApi.Infrastructure/Transactions/AGENTS.md`

### Frontend feature AGENTS
- `fotest-react/src/features/auth/AGENTS.md`
- `fotest-react/src/features/home/AGENTS.md`
- `fotest-react/src/features/persons/AGENTS.md`
- `fotest-react/src/features/profile/AGENTS.md`
- `fotest-react/src/features/transactions/AGENTS.md`
- `fotest-react/src/features/debts/AGENTS.md`

## Build/Test Artifact Inventory
- Shared build outputs: `**/bin/`, `**/obj/`.
- Shared dependency outputs: `**/node_modules/`.
- Repository quality-gate outputs: `artifacts/` including `artifacts/logs/` and `artifacts/coverage/`.
- Test-project local artifacts: `Tests/**/artifacts/`.
- SonarScanner working directory: `.scannerwork/`.
- Local secrets file: `.env` (git-ignored, hidden from VS Code search).

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
- Repository architecture and commit workflow policy: this file.
- Gate script behavior and wrappers: `scripts/AGENTS.md`.
- User-facing setup and API examples: `README.md`.
- Module and context behavior: nearest module/context/feature `AGENTS.md`.

Checklist authority note:
- The mandatory commit checklist policy is authoritative only in this file.
- Other AGENTS files may reference the checklist but must not redefine checklist acceptance rules.

## Testing
- Run all tests: `dotnet test FoTestApi.sln`.
- Frontend CI tests: `npm run test:ci` from `fotest-react/`.

## Running the API host
- From repository root: `dotnet run --project .\\FoTestApi.Application\\FoTestApi.Application.csproj`.
- If cwd is one level above repo: `dotnet run --project .\\fo-test\\FoTestApi.Application\\FoTestApi.Application.csproj`.

## Pre-Commit Workflow and Checklist

Workflow steps:
1. Step 1 - Quality gate validation.
  - Run `./scripts/run-checks-debug.ps1` (or `sh scripts/run-checks-debug.sh`) and keep the log path.
  - Use full-base debug wrappers only when explicitly requested.
  - Never bypass hooks with `--no-verify`.
2. Step 2 - Documentation alignment for the same change set.
  - Update only docs relevant to actual changes in the commit.

Checklist output (required before `git commit`):
1. Step 1 status: `DONE` or `SKIPPED`.
2. Step 2 status: `DONE` or `SKIPPED`.
3. Agents must print the checklist output in the session immediately before running any `git commit` command.
4. If the checklist output is missing from the session, do not run `git commit`.

Checklist acceptance rules:
1. If a step is `SKIPPED`, include a one-line reason.
2. Step 1 may be `SKIPPED` only when there are no production code changes since the latest successful Step 1 run, and the latest log path is provided.
  - Production code changes means staged or unstaged edits in implementation source files under `FoTestApi.Domain/`, `FoTestApi.Infrastructure/`, `FoTestApi.Application/`, `fotest-react/src/`, and runtime quality-gate script code/config under `scripts/` (for example `*.ps1`, `*.sh`, `*.mjs`, `*.js`, `package.json`, `.eslintrc.json`), excluding test files and documentation-only changes.
  - The latest successful Step 1 log path must be shown directly in the checklist output.
3. Step 2 must always be reviewed at commit-time for the current staged diff. You may mark Step 2 as `SKIPPED` only as `No documentation changes required` and include a short reason tied to the staged changes.
4. If either step is neither `DONE` nor validly `SKIPPED`, do not commit.
5. If the checklist state changes after it is printed (for example new edits or a failed gate), print an updated checklist again before commit.
6. A documentation-only commit may mark both steps as `SKIPPED` when all skip conditions above are met.
  - Typical case: only `*.md` files are changed, there are no production code changes, a latest successful Step 1 log path is shown, and no additional documentation updates are required beyond the staged docs.

## Purpose
Maintain clear, hierarchical AGENTS guidance with minimal context noise for AI-assisted development.

