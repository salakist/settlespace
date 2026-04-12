# Persons Feature AGENTS Metadata

## Status
Implemented.

## Role
Persons feature provides persons CRUD UI, search flow, and feature-level state behavior.

## Responsibilities
- `src/features/persons/components/` owns person list/form/search/address editor UI, `PersonsPage` composition, and the route-level wrapper `PersonsRoutePage.tsx`.
- `src/features/persons/components/` also owns shared person-details form fields reused by profile.
- `src/features/persons/search/` owns the typed persons search query model, shared parameter config, and query↔search-value bridge.
- The persons list uses `components/PersonSearchBar.tsx` as its shared-search wrapper; keep new search behavior on the shared `SearchBar` path and do not reintroduce a feature-local legacy bar.
- `components/PersonSearchBar.tsx` is the only feature entry point for persons directory search UI; it should compose `src/features/persons/search/` contracts rather than owning ad hoc query-mapping logic.
- `hooks/usePersons.ts` and `api.ts` own the typed structured-search request flow for the persons directory; keep `POST /persons/search` as the source of truth for directory filtering.
- The legacy string `GET /persons/search/{query}` path remains only for cross-feature consumers such as transaction person suggestions; do not route the persons directory back through that compatibility endpoint.
- `src/features/persons/hooks/` owns persons domain behavior (`usePersons`) and shared person-details form utilities reused by profile.
- Role-selection UI should derive options directly from `PersonRole` via `getEnumValues()`; do not reintroduce mirrored role arrays such as `PERSON_ROLE_VALUES`.
- The full persons directory is route-scoped: load it when `/persons`-related routes are active rather than from the app shell.
- Keep persons behavior tests close to hooks/components; keep app shell tests focused on composition. When a Jest module factory needs shared person test constants, prefer `jest.requireActual()` inside the factory over one-off `mock*` constant aliases.

## Key files
- `components/PersonsPage.tsx`
- `components/PersonsRoutePage.tsx`
- `components/PersonList.tsx`
- `components/PersonForm.tsx`
- `components/PersonSearchBar.tsx`
- `components/PersonAddressEditor.tsx`
- `components/PersonDetailsFormFields.tsx`
- `search/personSearchTypes.ts`
- `search/personSearchConfig.ts`
- `search/personSearchBridge.ts`
- `hooks/personDetailsFormUtils.ts`
- `hooks/usePersonDirectory.ts`
- `hooks/usePersons.ts`
- `api.ts`

## Commands
- `npm run test:ci -- src/features/persons`
- `npx eslint src/features/persons --ext .ts,.tsx --max-warnings=0`

## Dependencies
- `src/shared/auth/permissions.ts`
- `src/shared/types.ts`

## Source-of-truth note
Cross-cutting frontend policy and quality-gate workflow are defined in `settlespace-react/AGENTS.md`.
Shared UX/UI conventions are defined in `settlespace-react/UX-PRINCIPLES.md`.
Shared reusable search contracts and parameter-kind behavior are defined in
`src/features/search/AGENTS.md`.
