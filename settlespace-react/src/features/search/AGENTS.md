# Search Feature AGENTS Metadata

## Status
Implemented and actively being generalized for reuse by other frontend features.

## Role
Search feature provides the shared, domain-agnostic frontend search UI and state model for free-text search plus chip-based parameter filters.

## Responsibilities
- `src/features/search/components/GenericSearchBar.tsx` — reusable search input and high-level composition for the shared search UI.
- `src/features/search/components/ActiveFilterChips.tsx`, `src/features/search/components/PendingParameterAdornment.tsx`, and `src/features/search/components/SearchResultsAlert.tsx` — shared presentational helpers for active chips, pending-filter affordances, and unified no-results messaging.
- `src/features/search/hooks/useGenericSearchController.ts` — search-bar orchestration, filter application/removal, and submit behavior.
- `src/features/search/hooks/useAsyncSuggestions.ts` — debounced async-suggestion loading with stale-request protection.
- `src/features/search/utils/searchHelpers.ts` — pure helper logic for option visibility, placeholder selection, and filter normalization.
- `src/features/search/bridges/searchValueBridge.ts` — reusable helpers plus the declarative `createSearchValueBridge(...)` factory for mapping typed query objects to/from `GenericSearchValue` filter lists.
- `src/features/search/types.ts` owns the finite search enums and shared type contract (`SearchParameterKind`, `SearchSelectionMode`, parameter config interfaces, emitted values).
- `src/features/search/constants.ts` owns only search UI text, placeholders, layout tokens, and test IDs; do not reintroduce enum-wrapper mirrors such as `SEARCH_PARAMETER_KINDS` or `SEARCH_SELECTION_MODES` there.
- Keep this feature domain-agnostic: reusable query/filter conversion mechanics may live here, but backend DTO mapping, URL serialization, enum parsing, and feature-specific query semantics stay in the consuming feature wrapper.
- Prefer the declarative bridge field shapes (`text-single`, `lookup-single`, `lookup-multi`, `resolved-single`, `resolved-multi`) plus the small `custom` escape hatch before adding more one-off bridge helpers.

## Parameter format
- `SearchParameterConfig<TParam>` uses a stable feature-local `param` key plus a user-facing `label`.
- Supported `kind` values:
  - `fixed` — choose from predefined `options`
  - `text-input` — require manual text entry before applying the chip
  - `async-suggestions` — fetch suggestions via `getSuggestions(input)` with optional `minChars` and `debounceMs`
- `selectionMode` controls whether the parameter is `single` or `multiple`.
- `showGroupLabel` optionally controls whether the top-level filter autocomplete shows a non-clickable group header for that parameter; parameter-value entry autocompletes should suppress those headings.
- `GenericSearchValue<TParam>` is the shared output shape: optional `freeText` plus `filters: AppliedSearchFilter<TParam>[]`.
- Consuming features such as transactions should translate between this generic value and their domain query models in a thin wrapper or bridge module.
- When multiple features need similar query↔filter wiring, prefer a feature-local bridge config consumed by `createSearchValueBridge(...)` instead of duplicating imperative loops.

## Key files
- `components/GenericSearchBar.tsx`
- `components/ActiveFilterChips.tsx`
- `components/PendingParameterAdornment.tsx`
- `components/SearchResultsAlert.tsx`
- `hooks/useGenericSearchController.ts`
- `hooks/useAsyncSuggestions.ts`
- `utils/searchHelpers.ts`
- `bridges/searchValueBridge.ts`
- `types.ts`
- `constants.ts`

## Commands
- `npm run test:ci -- src/features/search src/features/transactions`
- `npx eslint src/features/search src/features/transactions --ext .ts,.tsx --max-warnings=0`

## Dependencies
- React and TypeScript
- Material UI `Autocomplete`, `Chip`, `TextField`, and icon components
- Consumer-owned feature wrappers under `src/features/*` for domain-specific query mapping

## Source-of-truth note
Cross-cutting frontend policy and quality-gate workflow are defined in `settlespace-react/AGENTS.md`.
Shared UX/UI conventions are defined in `settlespace-react/UX-PRINCIPLES.md`.
Repo-wide AGENTS routing is defined in root `AGENTS.md`.
This file should stay focused on the shared search feature contract and reuse boundaries.
