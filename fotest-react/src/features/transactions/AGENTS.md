# Transactions Feature AGENTS Metadata

## Status
Implemented.

## Role
Transactions feature provides UI and state management for user-scoped transaction CRUD.

## Responsibilities
- `src/features/transactions/components/TransactionsPage.tsx` — page composition and orchestration.
- `src/features/transactions/components/TransactionList.tsx` — transaction list rendering.
- `src/features/transactions/components/TransactionForm.tsx` — create/update transaction form.
- `src/features/transactions/hooks/useTransactions.ts` — feature state, validation, and API interaction.
- `src/features/transactions/components/*.test.tsx` and `src/features/transactions/hooks/useTransactions.test.tsx` — component and hook tests.

## Key files
- `src/features/transactions/components/TransactionsPage.tsx`
- `src/features/transactions/components/TransactionList.tsx`
- `src/features/transactions/components/TransactionForm.tsx`
- `src/features/transactions/hooks/useTransactions.ts`

## Source-of-truth note
Cross-cutting frontend policy, quality-gate workflow, and shelved backlog items are defined in `fotest-react/AGENTS.md`.
This file should stay focused on transactions feature-specific behavior.

## Commands
- `npm run test:ci -- src/features/transactions`
- `npx eslint src/features/transactions --ext .ts,.tsx --max-warnings=0`

## Dependencies
- `src/shared/api/transactionApi.ts`
- Shared transaction types under `src/shared/types/`
