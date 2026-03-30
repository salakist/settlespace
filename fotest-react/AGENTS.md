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
- `src/features/transactions/components/` owns transactions page (not yet implemented).
- `src/features/debts/components/` owns debts page (not yet implemented).
- `src/shared/api/` owns API calls, auth storage, and request interception.
- `src/shared/types/` owns shared frontend domain types.
- `src/app/App.test.tsx` owns app composition tests.
- `src/app/App.integration.test.tsx` owns app-level integration flow tests.
- Hook behavior is validated in dedicated hook test files colocated with each hook.

## Commands
- `npm install`
- `npm start`
- `npm run test:ci`
- `npx eslint src --ext .ts,.tsx --max-warnings=0`
- `npm run build`
- `..\scripts\run-checks-debug.ps1` (from repository root, default gate path for agents)
- `..\scripts\run-full-checks-debug.ps1` (from repository root, when full-base analysis is explicitly requested)
- `..\scripts\run-checks.ps1` (base script used by hooks)
- `..\scripts\run-full-checks.ps1` (base full-base script)

## Notes
Current UI uses Material UI and dark mode theme.

### App Shell & Navigation
The authenticated app shell renders a fixed navigation bar below the app title with:
- **Left side**: Tabs component for primary navigation (Home, Persons, Transactions, Debts) with icons
- **Right side**: Profile button (displays current user name) and Logout button, aligned center
- Navigation uses MUI `Tabs` with enhanced active indicator (3px, rounded top) for better visual feedback
- When on Profile route, tab group shows no selection to avoid confusion with button route
- The navigation bar uses a gradient background and responsive layout that stacks on mobile
- Tab icons: Home 🏠, Persons 👥, Transactions 🔄, Debts ⚠️

The person manager must only render for authenticated users with a stored JWT.
Authenticated users can navigate to the profile page from the header button (displays their name) and change their password there.
Unauthenticated users can open a register page and are automatically signed in after creating an account.
Frontend routing is URL-driven with React Router (`/login`, `/register`, `/home`, `/persons`, `/transactions`, `/debts`, `/profile`) and supports browser back/forward navigation.
Frontend quality gates are executed from repository root scripts, not from a frontend-only wrapper.
In agent sessions, prefer the debug wrappers so every run keeps a timestamped log under `artifacts/logs/`.
Frontend coverage scope targets production files under `src/` and excludes test/bootstrap files such as `*.test.tsx`, `setupTests.ts`, `reportWebVitals.ts`, `index.tsx`, and `react-app-env.d.ts`.
The frontend source tree follows a feature-oriented layout (`app`, `features`, `shared`, `styles`) rather than a flat `src/` structure.
When running tests directly from an agent terminal, always use `npm run test:ci` so the command exits automatically without interactive watch mode.

### Future Pages Backlog (Shelved)
The items below are intentionally parked for later and are not implemented yet.

- `Settlement` page (`/settlement`) [shelved]: suggest optimal debt-settlement flows between persons.
- `Payment History` page (`/history`) [shelved]: searchable and filterable timeline of transactions.
- `Expense Split` page (`/splits`) [shelved]: create shared expenses and split across participants.
- `Analytics` page (`/analytics`) [shelved]: trend charts and summary metrics for transactions/debts.
- `Person Ledger` page (`/ledger`) [shelved]: per-person balance and detailed debit/credit history.
- `Reports` page (`/reports`) [shelved]: exportable statements and summaries.
- `Groups` page (`/groups`) [shelved]: manage circles such as roommates/trips for scoped accounting.
- `Recurring` page (`/recurring`) [shelved]: recurring charges and periodic obligations.
- `Categories` page (`/categories`) [shelved]: tagging and categorization for reporting and filtering.
- `Activity Log` page (`/activity`) [shelved]: audit trail of key user and system actions.

Guidance for future agents:
- Do not present these pages as existing behavior.
- If implementing one, move it from this shelved list to active responsibilities and add feature-level AGENTS notes.

## Refactor guidance
- Keep `App.tsx` orchestration-focused; prefer extracting domain logic into hooks rather than adding more local handlers.
- When introducing hooks, add direct hook tests first, then add/adjust app integration tests for cross-hook flows.
- Avoid moving all behavior into `App.test.tsx`; keep composition checks there and behavior checks in dedicated hook or integration tests.
