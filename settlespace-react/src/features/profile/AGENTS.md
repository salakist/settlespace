# Profile Feature AGENTS Metadata

## Status
Implemented.

## Role
Profile feature provides authenticated profile editing and password-management entry points.

## Responsibilities
- `src/features/profile/components/` owns profile page/forms UI and the route-level wrapper `ProfileRoutePage.tsx`.
- `src/features/profile/hooks/` owns profile domain behavior (`useProfile`).
- Load the full current person only when the profile route is active; use auth session identity for the global header/app shell.
- Keep profile-specific state and validation in feature hooks, not app shell.

## Key files
- `components/ProfilePage.tsx`
- `components/ProfileRoutePage.tsx`
- `hooks/useProfile.ts`

## Commands
- `npm run test:ci -- src/features/profile`
- `npx eslint src/features/profile --ext .ts,.tsx --max-warnings=0`

## Dependencies
- `src/features/persons/api.ts`
- `src/features/persons/hooks/usePersonDirectory.ts`
- `src/shared/types.ts`
- `src/features/persons/components/PersonDetailsFormFields.tsx`
- `src/features/persons/hooks/personDetailsFormUtils.ts`

## Source-of-truth note
Cross-cutting frontend policy and quality-gate workflow are defined in `settlespace-react/AGENTS.md`.
Shared UX/UI conventions are defined in `settlespace-react/UX-PRINCIPLES.md`.
