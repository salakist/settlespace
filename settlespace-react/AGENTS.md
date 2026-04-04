# settlespace-react AGENTS Metadata

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
- Shared UX/UI and interaction conventions are defined in `UX-PRINCIPLES.md`.
- If a requested UI change clearly conflicts with `UX-PRINCIPLES.md`, agents should explain the conflict briefly and ask for confirmation before proceeding.
- Route composition should favor dedicated `*Page` components over inline route JSX, and major flows should remain URL-driven with React Router.
- In agent sessions, run tests with `npm run test:ci` to avoid watch mode.
- Frontend quality gates are executed from repository root scripts.
- Frontend ESLint is the fast local pre-commit subset gate for React/TypeScript issues it can model directly.
- Sonar-connected analysis is the parity layer for frontend and repo-script issue classes that ESLint does not fully reproduce.

## Commands
- `npm install`
- `npm start`
- `npm run test:ci`
- `npx eslint src --ext .ts,.tsx --max-warnings=0`
- `npm run build`

## Build/Test Artifact Inventory
- Frontend build output: `settlespace-react/build/`.
- Frontend test coverage output: `settlespace-react/coverage/`.
- Frontend dependencies: `settlespace-react/node_modules/`.
- Repository quality-gate outputs used by frontend checks: `artifacts/logs/` and `artifacts/coverage/`.

## Gitignore ownership
- Shared generated outputs are ignored by repository root `.gitignore`.
- Frontend-local `.gitignore` keeps React-specific outputs and environment-local files.

## Dependencies
- React, TypeScript, Material UI
- Shared API clients and types under `src/shared/`

## Source-of-truth note
Repo-wide AGENTS routing is defined in root `AGENTS.md`. Shared frontend UX/UI conventions are
maintained in `UX-PRINCIPLES.md`. Agent commit workflow and checklist policy are authoritative in
root `COMMIT-POLICY.md`. Feature behavior is documented in the nearest feature AGENTS file.
