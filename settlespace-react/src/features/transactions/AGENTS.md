# Transactions Feature AGENTS Metadata

## Status
Implemented.

## Role
Transactions feature provides UI and state management for user-scoped transaction CRUD.

## Responsibilities
- `src/features/transactions/components/TransactionsPage.tsx` — page composition and orchestration.
- `src/features/transactions/components/TransactionSearchBar.tsx` — multi-parameter search with chip-based filters and person autocomplete.
- `src/features/transactions/components/TransactionList.tsx` — transaction list rendering.
- `src/features/transactions/components/TransactionForm.tsx` — create/update transaction form.
- `src/features/transactions/hooks/useTransactions.ts` — feature state, validation, and API interaction.
- Prefer backend-provided `payerDisplayName`, `payeeDisplayName`, and `createdByDisplayName` for read-only rendering; keep client person lookup only for forms, suggestions, and URL-chip hydration.
- `src/features/transactions/components/*.test.tsx` and `src/features/transactions/hooks/useTransactions.test.tsx` — component and hook tests.

## Key files
- `src/features/transactions/components/TransactionsPage.tsx`
- `src/features/transactions/components/TransactionSearchBar.tsx`
- `src/features/transactions/components/TransactionList.tsx`
- `src/features/transactions/components/TransactionForm.tsx`
- `src/features/transactions/hooks/useTransactions.ts`

## Source-of-truth note
Cross-cutting frontend policy and quality-gate workflow are defined in `settlespace-react/AGENTS.md`.
Shared UX/UI conventions are defined in `settlespace-react/UX-PRINCIPLES.md`.
Planned or shelved product ideas are tracked in repository-root `TODO.md`.
This file should stay focused on transactions feature-specific behavior.

## Commands
- `npm run test:ci -- src/features/transactions`
- `npx eslint src/features/transactions --ext .ts,.tsx --max-warnings=0`

## Dependencies
- `src/shared/api/transactionApi.ts`
- Shared transaction types under `src/shared/types/`
