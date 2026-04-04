# Search Feature AGENTS Metadata

## Status
Implemented and actively being generalized for reuse by other frontend features.

## Role
Search feature provides the shared, domain-agnostic frontend search UI and state model for free-text search plus chip-based parameter filters.

## Responsibilities
- `src/features/search/components/GenericSearchBar.tsx` — reusable search input and high-level composition for the shared search UI.
- `src/features/search/components/ActiveFilterChips.tsx` and `src/features/search/components/PendingParameterAdornment.tsx` — presentational-only chip/adornment rendering extracted from the main component.
- `src/features/search/hooks/useGenericSearchController.ts` — search-bar orchestration, filter application/removal, and submit behavior.
- `src/features/search/hooks/useAsyncSuggestions.ts` — debounced async-suggestion loading with stale-request protection.
- `src/features/search/utils/searchHelpers.ts` — pure helper logic for option visibility, placeholder selection, and filter normalization.
- `src/features/search/types.ts` and `src/features/search/constants.ts` — shared public contract for parameter configuration and emitted search values.
- Keep this feature domain-agnostic: backend DTO mapping, URL serialization, and feature-specific query conversion stay in the consuming feature wrapper.

## Parameter format
- `SearchParameterConfig<TParam>` uses a stable feature-local `param` key plus a user-facing `label`.
- Supported `kind` values:
  - `fixed` — choose from predefined `options`
  - `text-input` — require manual text entry before applying the chip
  - `async-suggestions` — fetch suggestions via `getSuggestions(input)` with optional `minChars` and `debounceMs`
- `selectionMode` controls whether the parameter is `single` or `multiple`.
- `GenericSearchValue<TParam>` is the shared output shape: optional `freeText` plus `filters: AppliedSearchFilter<TParam>[]`.
- Consuming features such as transactions should translate between this generic value and their domain query models in a thin wrapper or bridge module.

## Key files
- `components/GenericSearchBar.tsx`
- `components/ActiveFilterChips.tsx`
- `components/PendingParameterAdornment.tsx`
- `hooks/useGenericSearchController.ts`
- `hooks/useAsyncSuggestions.ts`
- `utils/searchHelpers.ts`
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
