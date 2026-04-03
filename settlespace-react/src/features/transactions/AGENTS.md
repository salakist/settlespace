# Transactions Feature AGENTS Metadata

## Status
Implemented.

## Role
Transactions feature provides UI and state management for user-scoped transaction CRUD.

## Responsibilities
- `src/features/transactions/components/TransactionsPage.tsx` â€” page composition and orchestration.
- `src/features/transactions/components/TransactionList.tsx` â€” transaction list rendering.
- `src/features/transactions/components/TransactionForm.tsx` â€” create/update transaction form.
- `src/features/transactions/hooks/useTransactions.ts` â€” feature state, validation, and API interaction.
- `src/features/transactions/components/*.test.tsx` and `src/features/transactions/hooks/useTransactions.test.tsx` â€” component and hook tests.

## Key files
- `src/features/transactions/components/TransactionsPage.tsx`
- `src/features/transactions/components/TransactionList.tsx`
- `src/features/transactions/components/TransactionForm.tsx`
- `src/features/transactions/hooks/useTransactions.ts`

## Source-of-truth note
Cross-cutting frontend policy and quality-gate workflow are defined in `settlespace-react/AGENTS.md`.
Planned or shelved product ideas are tracked in repository-root `TODO.md`.
This file should stay focused on transactions feature-specific behavior.

## Commands
- `npm run test:ci -- src/features/transactions`
- `npx eslint src/features/transactions --ext .ts,.tsx --max-warnings=0`

## Dependencies
- `src/shared/api/transactionApi.ts`
- Shared transaction types under `src/shared/types/`
