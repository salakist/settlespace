# fotest-react AGENTS Metadata

## Role
React frontend for person entity management using `FoTestApi`.

## Responsibilities
- App shell, auth gating, and state management in `App.tsx`
- Login UI and credential submission in `LoginPage.tsx`
- Person form handling in `PersonForm.tsx`
- Listing and action controls in `PersonList.tsx`
- Search flow in `SearchBar.tsx`
- API calls, login, token persistence, and auth header attachment in `api.ts`

## Commands
- `npm install`
- `npm start`
- `npm run build`

## Notes
Current UI uses Material UI and dark mode theme.
The person manager must only render for authenticated users with a stored JWT.
