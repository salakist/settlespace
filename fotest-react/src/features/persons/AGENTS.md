# Persons Feature AGENTS Metadata

## Status
Implemented.

## Role
Persons feature provides persons CRUD UI, search flow, and feature-level state behavior.

## Responsibilities
- `src/features/persons/components/` owns person list/form/search/address editor UI and `PersonsPage` composition.
- `src/features/persons/hooks/` owns persons domain behavior (`usePersons`).
- Keep persons behavior tests close to hooks/components; keep app shell tests focused on composition.

## Key files
- `components/PersonsPage.tsx`
- `components/PersonList.tsx`
- `components/PersonForm.tsx`
- `components/SearchBar.tsx`
- `components/PersonAddressEditor.tsx`
- `hooks/usePersons.ts`

## Commands
- `npm run test:ci -- src/features/persons`
- `npx eslint src/features/persons --ext .ts,.tsx --max-warnings=0`

## Dependencies
- `src/shared/api/personApi.ts`
- `src/shared/types/`

## Source-of-truth note
Cross-cutting frontend policy and quality-gate workflow are defined in `fotest-react/AGENTS.md`.
