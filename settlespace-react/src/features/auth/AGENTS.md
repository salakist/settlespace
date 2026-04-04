# Auth Feature AGENTS Metadata

## Status
Implemented.

## Role
Auth feature provides login, registration, and password-change UI and session behavior.

## Responsibilities
- `src/features/auth/components/` owns login, registration, and password-change screens.
- `src/features/auth/hooks/` owns auth/session behavior (`useAuth`).
- Keep auth domain behavior in feature hooks; app-wide coordination belongs in `src/app/hooks/useAppAuth`.

## Key files
- `components/LoginPage.tsx`
- `components/RegisterPage.tsx`
- `components/ChangePasswordForm.tsx`
- `hooks/useAuth.ts`

## Commands
- `npm run test:ci -- src/features/auth`
- `npx eslint src/features/auth --ext .ts,.tsx --max-warnings=0`

## Dependencies
- `src/shared/api/authApi.ts`
- `src/shared/api/authStorage.ts`
- `src/shared/types/`

## Source-of-truth note
Cross-cutting frontend policy and quality-gate workflow are defined in `settlespace-react/AGENTS.md`.
Shared UX/UI conventions are defined in `settlespace-react/UX-PRINCIPLES.md`.
