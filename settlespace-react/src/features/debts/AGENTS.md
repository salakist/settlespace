# Debts Feature AGENTS Metadata

## Status
**MVP implemented** — Debt summaries and settlement recording are now available.

## Role
Debts feature provides UI for reviewing active and settled balances with counterparties and recording partial or full settlements for outstanding balances.

## Responsibilities
- `src/features/debts/components/DebtsPage.tsx` — orchestrates the debts page, loading state, search, and mixed-list informational alerts.
- `src/features/debts/components/DebtSearchBar.tsx` and `src/features/debts/search/debtSearchBridge.ts` — keep debt-specific query/URL mapping on top of the shared generic search UI; prefer the shared bridge factory over ad-hoc filter loops.
- `src/features/debts/components/DebtsList.tsx` — renders summary cards per counterparty and currency, keeps settled balances visible in the same list, and exposes only the actions that still apply.
- `src/features/debts/components/DebtDetailsPage.tsx` — shows transaction-level debt details on a dedicated page.
- `src/features/debts/components/DebtSettlementDrawer.tsx` — handles the side-drawer settlement flow with slider, amount input, and manual percent input.
- `src/features/debts/hooks/useDebts.ts` — owns debts API loading, detail loading, drawer state, and settlement refresh flow.
- Prefer backend-provided `counterpartyDisplayName` and nested transaction display-name fields for read-only debt rendering; keep client person lookup only where an interactive picker still needs it.

## Key files
- `src/features/debts/components/DebtsPage.tsx`
- `src/features/debts/components/DebtSearchBar.tsx`
- `src/features/debts/search/debtSearchConfig.ts`
- `src/features/debts/search/debtSearchBridge.ts`
- `src/features/debts/components/DebtsList.tsx`
- `src/features/debts/components/DebtDetailsPage.tsx`
- `src/features/debts/components/DebtSettlementDrawer.tsx`
- `src/features/debts/hooks/useDebts.ts`
- `src/features/debts/api.ts`
- `src/features/debts/types.ts`

## Source-of-truth note
Cross-cutting frontend policy is maintained in `settlespace-react/AGENTS.md`.
Shared UX/UI conventions are defined in `settlespace-react/UX-PRINCIPLES.md`.
Planned or shelved product ideas and future pages are tracked in repository-root `TODO.md`.
This file should stay focused on debts feature-local scope and status.

## Commands
- `npm run test:ci -- --runTestsByPath src/features/debts/**/*.test.tsx`
- `npx eslint src/features/debts src/features/debts/api.ts --ext .ts,.tsx --max-warnings=0`

## Dependencies
- Debts backend endpoints under `/api/debts`
- Shared cross-feature models in `src/shared/types.ts`
- `src/shared/api/requestHandling.ts`
- Material UI components including `Drawer` and `Slider`
- Transaction-derived debt summaries from the backend
