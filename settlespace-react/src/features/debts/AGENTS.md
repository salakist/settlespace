# Debts Feature AGENTS Metadata

## Status
**MVP implemented** — Debt summaries and settlement recording are now available.

## Role
Debts feature provides UI for reviewing net balances with counterparties and recording partial or full settlements.

## Responsibilities
- `src/features/debts/components/DebtsPage.tsx` — Orchestrates the debts page, loading state, and alerts.
- `src/features/debts/components/DebtsList.tsx` — Renders summary cards per counterparty and currency.
- `src/features/debts/components/DebtSettlementDrawer.tsx` — Handles the side-drawer settlement flow with slider, amount input, and manual percent input.
- `src/features/debts/hooks/useDebts.ts` — Owns debts API loading, drawer state, and settlement refresh flow.

## Key files
- `src/features/debts/components/DebtsPage.tsx`
- `src/features/debts/components/DebtsList.tsx`
- `src/features/debts/components/DebtSettlementDrawer.tsx`
- `src/features/debts/hooks/useDebts.ts`

## Source-of-truth note
Cross-cutting frontend policy is maintained in `settlespace-react/AGENTS.md`.
Planned or shelved product ideas and future pages are tracked in repository-root `TODO.md`.
This file should stay focused on debts feature-local scope and status.

## Commands
- `npm run test:ci -- --runTestsByPath src/features/debts/**/*.test.tsx`
- `npx eslint src/features/debts src/shared/api/debtsApi.ts --ext .ts,.tsx --max-warnings=0`

## Dependencies
- Debts backend endpoints under `/api/debts`
- Shared frontend types in `src/shared/types/index.ts`
- Material UI components including `Drawer` and `Slider`
- Transaction-derived debt summaries from the backend
