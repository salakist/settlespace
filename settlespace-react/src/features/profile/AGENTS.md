# Profile Feature AGENTS Metadata

## Status
Implemented.

## Role
Profile feature provides authenticated profile editing and password-management entry points.

## Responsibilities
- `src/features/profile/components/` owns profile page/forms UI.
- `src/features/profile/hooks/` owns profile domain behavior (`useProfile`).
- Keep profile-specific state and validation in feature hooks, not app shell.

## Key files
- `components/ProfilePage.tsx`
- `hooks/useProfile.ts`

## Commands
- `npm run test:ci -- src/features/profile`
- `npx eslint src/features/profile --ext .ts,.tsx --max-warnings=0`

## Dependencies
- `src/shared/api/personApi.ts`
- `src/shared/types/`
- `src/features/persons/components/PersonDetailsFormFields.tsx`
- `src/features/persons/hooks/personDetailsFormUtils.ts`

## Source-of-truth note
Cross-cutting frontend policy and quality-gate workflow are defined in `settlespace-react/AGENTS.md`.
Shared UX/UI conventions are defined in `settlespace-react/UX-PRINCIPLES.md`.
