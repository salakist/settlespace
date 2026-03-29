# fotest-react AGENTS Metadata

## Role
React frontend for person entity management using `FoTestApi`.

## Responsibilities
- App shell, auth gating, and state management in `App.tsx`
- Login UI and credential submission in `LoginPage.tsx`
- Public registration UI and auto-login flow in `RegisterPage.tsx`
- Authenticated profile UI in `ProfilePage.tsx` (including password change)
- Shared address editing UI in `PersonAddressEditor.tsx`
- Person form handling in `PersonForm.tsx`
- Listing and action controls in `PersonList.tsx`
- Search flow in `SearchBar.tsx`
- API calls, login, registration, password change, token persistence, and auth header attachment in `api.ts`

## Commands
- `npm install`
- `npm start`
- `npm run build`

## Notes
Current UI uses Material UI and dark mode theme.
The person manager must only render for authenticated users with a stored JWT.
Authenticated users can open the profile page from the header and change their password there.
Unauthenticated users can open a register page and are automatically signed in after creating an account.
