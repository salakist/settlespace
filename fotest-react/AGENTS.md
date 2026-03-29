# fotest-react AGENTS Metadata

## Role
React frontend for person entity management using `FoTestApi`.

## Responsibilities
- `src/app/` owns the app shell and top-level orchestration.
- `src/features/auth/components/` owns login, registration, and password change UI.
- `src/features/auth/hooks/` owns auth/session behavior (`useAuth`).
- `src/features/persons/components/` owns person list, form, search, and address editor UI.
- `src/features/persons/hooks/` owns persons domain behavior (`usePersons`).
- `src/features/profile/components/` owns authenticated profile editing.
- `src/features/profile/hooks/` owns profile domain behavior (`useProfile`).
- `src/shared/api/` owns API calls, auth storage, and request interception.
- `src/shared/types/` owns shared frontend domain types.
- `src/app/App.test.tsx` owns app composition tests.
- `src/app/App.integration.test.tsx` owns app-level integration flow tests.
- Hook behavior is validated in dedicated hook test files colocated with each hook.

## Commands
- `npm install`
- `npm start`
- `npm test`
- `npx eslint src --ext .ts,.tsx --max-warnings=0`
- `npm run build`
- `..\scripts\run-checks.ps1` (from repository root)
- `..\scripts\run-full-checks.ps1` (from repository root, when explicitly requested)

## Notes
Current UI uses Material UI and dark mode theme.
The person manager must only render for authenticated users with a stored JWT.
Authenticated users can open the profile page from the header and change their password there.
Unauthenticated users can open a register page and are automatically signed in after creating an account.
Frontend routing is URL-driven with React Router (`/login`, `/register`, `/directory`, `/profile`) and supports browser back/forward navigation.
Frontend quality gates are executed from repository root scripts, not from a frontend-only wrapper.
Frontend coverage scope targets production files under `src/` and excludes test/bootstrap files such as `*.test.tsx`, `setupTests.ts`, `reportWebVitals.ts`, `index.tsx`, and `react-app-env.d.ts`.
The frontend source tree follows a feature-oriented layout (`app`, `features`, `shared`, `styles`) rather than a flat `src/` structure.

## Refactor guidance
- Keep `App.tsx` orchestration-focused; prefer extracting domain logic into hooks rather than adding more local handlers.
- When introducing hooks, add direct hook tests first, then add/adjust app integration tests for cross-hook flows.
- Avoid moving all behavior into `App.test.tsx`; keep composition checks there and behavior checks in dedicated hook or integration tests.
