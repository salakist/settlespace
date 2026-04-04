# Frontend UX/UI Principles

This document is the shared source of truth for cross-feature frontend UX/UI conventions in SettleSpace.
It is intended for contributors and agents changing the React UI.

Use this file for **shared interaction and presentation principles**. Use feature `AGENTS.md` files for
feature-local responsibilities and behavior, and use `README.md` for setup, runbook, and architecture
summaries.

These principles are meant to guide durable product decisions. They should stay generic enough to outlive
individual polish passes while remaining concrete enough to support consistent implementation choices.

## Core principles

### 1. Consistent dark visual language
- Keep the interface visually consistent with the app's dark theme.
- Reuse shared surface, spacing, and emphasis patterns before introducing one-off styling.
- Keep controls, dialogs, and overlays aligned with the same tone and contrast expectations.

**Example in SettleSpace:** shared surfaces and inputs should align with the existing app theme rather than
introducing feature-specific visual treatments.

### 2. URL-driven major flows
- Important user states such as list, create, edit, and detail views should be reachable by URL.
- Browser back/forward navigation should feel natural for major flows.

**Example in SettleSpace:** routes such as `/persons/new`, `/transactions/new`, and debt detail pages expose
major states directly.

### 3. Dedicated pages for major tasks
- Prefer clear page-level flows for create, edit, and detail work instead of overcrowding one screen with too
  many simultaneous modes.
- Keep page state explicit so users can easily tell whether they are viewing, creating, or editing.

### 4. Compact primary action areas
- Top-of-page controls should remain easy to scan.
- Pair search/filter controls with one clear primary action instead of a crowded toolbar.

**Example in SettleSpace:** list pages use a compact search area with a single prominent create action.

### 5. Progressive disclosure for secondary actions
- Secondary or less-frequent actions should be revealed progressively rather than displayed all at once.
- Prefer a small action menu over multiple competing inline buttons when a row or card has several actions.

**Example in SettleSpace:** list rows and cards use an overflow menu for actions like edit, delete, or view
related details.

### 6. Primary action emphasis
- The main intended action should be the most visually prominent.
- When actions are paired, prefer the affirmative or forward action first when that improves clarity.
- Secondary actions such as cancel, close, or back should remain available but less dominant.

### 7. Safe destructive actions
- Destructive actions must require explicit confirmation inside the app.
- Confirmation copy should be clear about what will happen and whether the action is irreversible.

**Example in SettleSpace:** destructive delete flows use a shared confirmation dialog instead of browser-native
prompts.

### 8. Consistent formatting and copy
- Standardize visible formatting for shared concepts such as dates, statuses, labels, and action wording.
- Use concise, plain-language text that stays consistent across features.

**Example in SettleSpace:** the app uses consistent user-facing date formatting and action wording across auth,
persons, transactions, and debts screens.

### 9. Clear information hierarchy
- Important data should stand out visually from supporting detail.
- Use typography, chips, spacing, and layout to help users scan key information quickly.

**Example in SettleSpace:** transaction amounts and status indicators are visually stronger than supporting row
metadata.

### 10. Clear loading, empty, success, and error states
- Never leave users with a blank or ambiguous state.
- Loading, empty results, success feedback, and errors should all be visible and understandable.

### 11. Accessibility and cross-feature consistency
- Use labeled controls, descriptive action names, and accessible patterns throughout the app.
- Similar interactions should behave similarly across `Persons`, `Transactions`, `Debts`, `Profile`, and `Auth`.

## Working with requests that conflict with these principles

When a requested UI change clearly contradicts one of these principles, contributors and agents should not
silently apply it as if it were a routine change.

They should explicitly call out the conflict, explain it briefly, and ask for confirmation before proceeding.
A good pattern is:

> This request appears to conflict with the UX/UI principles because `<brief explanation>`. Are you sure you
> want to proceed?

This check is especially important when the request would reduce consistency across features, weaken a shared
interaction pattern, or introduce avoidable UX debt.

## Examples in SettleSpace

The following shared components and screens are useful references when applying these principles:
- `src/features/persons/components/SearchBar.tsx`
- `src/shared/components/ConfirmationDialog.tsx`
- `src/shared/components/DateInputField.tsx`
- `src/features/transactions/components/TransactionList.tsx`
- `src/features/debts/components/DebtsList.tsx`
- `src/features/debts/components/DebtSettlementDrawer.tsx`

These examples are illustrative only. This file is meant to describe durable principles, not to replace
feature documentation.

## Out of scope

This document does **not** own:
- domain or business rules
- backend or API behavior
- temporary review notes or one-off polish tasks
- feature ownership and implementation responsibilities already covered by the relevant `AGENTS.md` files
