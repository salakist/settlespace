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
- `scripts/AGENTS.md`
- `scripts/checks/AGENTS.md`
- `scripts/hooks/AGENTS.md`
- `Tests/AGENTS.md`
- `Tests/SettleSpace.Application.Tests/AGENTS.md`
- `Tests/SettleSpace.Domain.Tests/AGENTS.md`
- `Tests/SettleSpace.Infrastructure.Tests/AGENTS.md`

### Backend context AGENTS
- `SettleSpace.Application/Authentication/AGENTS.md`
- `SettleSpace.Application/Persons/AGENTS.md`
- `SettleSpace.Application/Transactions/AGENTS.md`
- `SettleSpace.Application/Debts/AGENTS.md`
- `SettleSpace.Application/Middleware/AGENTS.md`
- `SettleSpace.Domain/Auth/AGENTS.md`
- `SettleSpace.Domain/Persons/AGENTS.md`
- `SettleSpace.Domain/Transactions/AGENTS.md`
- `SettleSpace.Domain/Debts/AGENTS.md`
- `SettleSpace.Infrastructure/Persons/AGENTS.md`
- `SettleSpace.Infrastructure/Transactions/AGENTS.md`

### Frontend feature AGENTS
- `settlespace-react/src/features/auth/AGENTS.md`
- `settlespace-react/src/features/home/AGENTS.md`
- `settlespace-react/src/features/persons/AGENTS.md`
- `settlespace-react/src/features/profile/AGENTS.md`
- `settlespace-react/src/features/transactions/AGENTS.md`
- `settlespace-react/src/features/debts/AGENTS.md`

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
- Repository architecture, commit workflow policy, and agent commit identity policy: this file.
- Scripts routing, setup, and cleanup guidance: `scripts/AGENTS.md`.
- Quality-gate behavior and debug-wrapper intent: `scripts/checks/AGENTS.md`.
- Hook behavior and local attribution enforcement: `scripts/hooks/AGENTS.md`.
- Shared test-project policy: `Tests/AGENTS.md`.
- User-facing setup and API examples: `README.md`.
- Planned or shelved product ideas and future pages: `TODO.md`.
- Module and context behavior: nearest module/context/feature `AGENTS.md`.

Checklist authority note:
- The mandatory commit checklist policy is authoritative only in this file.
- Other AGENTS files may reference the checklist but must not redefine checklist acceptance rules.

## Testing
- Run all tests: `dotnet test SettleSpace.sln`.
- Frontend CI tests: `npm run test:ci` from `settlespace-react/`.

## Running the API host
- From repository root: `dotnet run --project .\\SettleSpace.Application\\SettleSpace.Application.csproj`.
- If cwd is one level above repo: `dotnet run --project .\\settlespace\\SettleSpace.Application\\SettleSpace.Application.csproj`.

## Agent Commit Identity Policy
When an agent creates a commit in this repository:
1. Use the dedicated repo-local agent identity instead of a contributor's personal Git identity.
  - Default local values: `settlespace-agent` / `settlespace-agent@local`.
  - Configure it with `./scripts/setup/set-agent-git-identity.ps1`.
  - Return to the normal inherited Git identity with `./scripts/setup/set-agent-git-identity.ps1 -ClearLocalIdentity`.
2. Use a Conventional Commit summary line in the form `<type>(<optional scope>)!: <description>`.
  - Supported local types are `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, and `ops`.
  - Every additional non-empty commit-message line (body or trailer) must be **100 characters or fewer** to satisfy the local commitlint `body-max-line-length` rule.
  - If more explanation is needed, wrap it across multiple short lines instead of one long paragraph.
3. Include the trailer `Agent: GitHub Copilot` in the commit message.
  - `Reviewed-by:` remains optional unless local config explicitly enables `settlespace.requireReviewedBy=true`.
4. Local enforcement is authoritative through `scripts/hooks/commit-msg`, installed by `./scripts/setup/setup-hooks.ps1`.
5. Human-authored commits must not include an `Agent:` trailer unless they are intentionally using the configured agent identity.

## Pre-Commit Workflow and Checklist

Workflow steps:
1. Step 1 - Quality gate validation.
  - Run `./scripts/checks/run-checks-debug.ps1` and keep the log path.
  - Use full-base debug wrappers only when explicitly requested.
  - Never bypass hooks with `--no-verify`.
2. Step 2 - Documentation alignment for the same change set.
  - Update only docs relevant to actual changes in the commit.

Checklist output (required before `git commit`):
1. Step 1 status: `DONE` or `SKIPPED`.
2. Step 2 status: `DONE` or `SKIPPED`.
3. Agents must state the checklist output in chat immediately before running any `git commit` command.
  - Do not satisfy this requirement only by printing from inside the terminal command itself.
  - In the same pre-commit review, agents should also preflight the commit message for Conventional Commit format and body/trailer lines wrapped to **<= 100 characters**.
4. If the checklist output is missing from the session, do not run `git commit`.

Checklist acceptance rules:
1. If a step is `SKIPPED`, include a one-line reason.
2. Step 1 may be `SKIPPED` only when there are no production code changes since the latest successful Step 1 run, and the latest log path is provided.
  - Production code changes means staged or unstaged edits in implementation source files under `SettleSpace.Domain/`, `SettleSpace.Infrastructure/`, `SettleSpace.Application/`, `settlespace-react/src/`, and runtime quality-gate script code/config under `scripts/` (for example `*.ps1`, `hooks/pre-commit`, `*.mjs`, `*.js`, `package.json`, `.eslintrc.json`), excluding test files and documentation-only changes.
  - The latest successful Step 1 log path must be shown directly in the checklist output.
3. Step 2 must always be reviewed at commit-time for the current staged diff. You may mark Step 2 as `SKIPPED` only as `No documentation changes required` and include a short reason tied to the staged changes.
4. If either step is neither `DONE` nor validly `SKIPPED`, do not commit.
5. If the checklist state changes after it is printed (for example new edits or a failed gate), print an updated checklist again before commit.
6. A documentation-only commit may mark both steps as `SKIPPED` when all skip conditions above are met.
  - Typical case: only `*.md` files are changed, there are no production code changes, a latest successful Step 1 log path is shown, and no additional documentation updates are required beyond the staged docs.

## Purpose
Maintain clear, hierarchical AGENTS guidance with minimal context noise for AI-assisted development.


