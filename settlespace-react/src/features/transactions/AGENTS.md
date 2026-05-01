# Transactions Feature AGENTS Metadata

## Status
Implemented.

## Role
Transactions feature provides UI and state management for user-scoped transaction CRUD.

## Responsibilities
- `src/features/transactions/components/TransactionsRoutePage.tsx` — route container; uses `useUrlSearchQuery` with `parseTransactionSearchQuery`/`serializeTransactionSearchQuery` to sync typed query ↔ URL; owns data loading and `usePersonDirectory`; wires `canUpdateTransaction`, `canDeleteTransaction`, `canConfirmTransaction`, `canRefuseTransaction` callbacks and passes `handleConfirm`/`handleRefuse` from `useTransactions`.
- `src/features/transactions/components/TransactionsPage.tsx` — presentational page; receives all state/callbacks as props; owns route-local concerns (form toggle, delete confirmation, navigate on save/cancel).
- `src/features/transactions/components/TransactionSearchBar.tsx` — multi-parameter search with chip-based filters and person autocomplete.
- `src/features/transactions/components/TransactionList.tsx` — transaction list rendering; receives split permission callbacks (`canUpdate`, `canDelete`, `canConfirm`, `canRefuse`) instead of a single `canManage`; hides the action menu button entirely when no action is available; renders Confirm/Refuse menu items when permitted.
- `src/features/transactions/components/TransactionForm.tsx` — create/update transaction form; Status field is only shown to Admins.
- `src/features/transactions/hooks/useTransactions.ts` — feature state, validation, and API interaction; exposes `handleConfirm` and `handleRefuse`.
- Keep `transactionSearchConfig.ts` and `transactionSearchBridge.ts` on a single-source-of-truth model: use `TransactionSearchParam` directly, derive `TransactionStatus` / `TransactionInvolvement` option lists from `getEnumValues()`, and keep `transactionSearchBridge.ts` as the feature-owned public adapter even though it now delegates the repetitive mechanics to the shared declarative search bridge.
- Prefer backend-provided `payerDisplayName`, `payeeDisplayName`, and `createdByDisplayName` for read-only rendering; keep client person lookup only for forms, suggestions, and URL-chip hydration.
- `src/features/transactions/components/*.test.tsx` and `src/features/transactions/hooks/useTransactions.test.tsx` — component and hook tests. When inline `jest.mock()` factories need shared transaction constants, prefer `jest.requireActual()` inside the factory rather than `mock* = SOME_CONST` alias duplication.

## Key files
- `src/features/transactions/components/TransactionsRoutePage.tsx`
- `src/features/transactions/components/TransactionsPage.tsx`
- `src/features/transactions/components/TransactionSearchBar.tsx`
- `src/features/transactions/components/TransactionList.tsx`
- `src/features/transactions/components/TransactionForm.tsx`
- `src/features/transactions/hooks/useTransactions.ts`
- `src/features/transactions/search/transactionSearchConfig.ts`
- `src/features/transactions/search/transactionSearchBridge.ts`
- `src/features/transactions/search/transactionSearchUrl.ts`
- `src/features/transactions/api.ts`
- `src/features/transactions/types.ts`

## Source-of-truth note
Cross-cutting frontend policy and quality-gate workflow are defined in `settlespace-react/AGENTS.md`.
Shared UX/UI conventions are defined in `settlespace-react/UX-PRINCIPLES.md`.
Planned or shelved product ideas are tracked in repository-root `TODO.md`.
This file should stay focused on transactions feature-specific behavior.

## Commands
- `npm run test:ci -- src/features/transactions`
- `npx eslint src/features/transactions --ext .ts,.tsx --max-warnings=0`

## Dependencies
- Cross-feature transaction models under `src/shared/types.ts`
- `src/shared/auth/permissions.ts`
- `src/features/persons/api.ts`
- `src/features/persons/hooks/usePersonDirectory.ts`
