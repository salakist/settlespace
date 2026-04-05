# Persons Feature AGENTS Metadata

## Status
Implemented.

## Role
Persons feature provides persons CRUD UI, search flow, and feature-level state behavior.

## Responsibilities
- `src/features/persons/components/` owns person list/form/search/address editor UI, `PersonsPage` composition, and the route-level wrapper `PersonsRoutePage.tsx`.
- `src/features/persons/components/` also owns shared person-details form fields reused by profile.
- The persons list uses `components/PersonSearchBar.tsx` as its shared-search wrapper; keep new search behavior on the shared `GenericSearchBar` path and do not reintroduce a feature-local legacy bar.
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
