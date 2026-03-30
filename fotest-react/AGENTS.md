# fotest-react AGENTS Metadata

## Role
Frontend module router for app-shell policy, shared frontend workflow, and feature ownership boundaries.

## Responsibilities
- Keep app-shell and cross-feature policy in this file.
- Route feature behavior to feature-level AGENTS files.
- Keep this file focused on cross-cutting frontend guidance.

## Feature AGENTS
- `src/features/auth/AGENTS.md`
- `src/features/home/AGENTS.md`
- `src/features/persons/AGENTS.md`
- `src/features/profile/AGENTS.md`
- `src/features/transactions/AGENTS.md`
- `src/features/debts/AGENTS.md`

## Cross-cutting frontend policy
- `src/app/` owns app shell and top-level orchestration.
- `src/app/hooks/` owns app-level orchestration hooks, including `useAppAuth`.
- Keep auth/session behavior in `src/features/auth/hooks/useAuth.ts`.
- Route composition should favor dedicated `*Page` components over inline route JSX.
- Frontend routing is URL-driven with React Router.
- In agent sessions, run tests with `npm run test:ci` to avoid watch mode.
- Frontend quality gates are executed from repository root scripts.

## Commands
- `npm install`
- `npm start`
- `npm run test:ci`
- `npx eslint src --ext .ts,.tsx --max-warnings=0`
- `npm run build`

## Build/Test Artifact Inventory
- Frontend build output: `fotest-react/build/`.
- Frontend test coverage output: `fotest-react/coverage/`.
- Frontend dependencies: `fotest-react/node_modules/`.
- Repository quality-gate outputs used by frontend checks: `artifacts/logs/` and `artifacts/coverage/`.

## Gitignore ownership
- Shared generated outputs are ignored by repository root `.gitignore`.
- Frontend-local `.gitignore` keeps React-specific outputs and environment-local files.

## Dependencies
- React, TypeScript, Material UI
- Shared API clients and types under `src/shared/`

## Source-of-truth note
Global repo policy is in root `AGENTS.md`. Feature behavior is in nearest feature AGENTS file.
Mandatory commit checklist acceptance rules are defined only in root `AGENTS.md`.
