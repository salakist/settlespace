# Frontend Notifications AGENTS Metadata

## Role
React feature for in-app notifications — bell icon, unread badge, dropdown, polling hook, and context.

## Responsibilities
- Poll `GET /api/notifications` every 30 s via `useNotifications`.
- Show unread count on `NotificationBell` (MUI Badge).
- `NotificationDropdown` lists items; clicking an item marks it read and navigates to `/transactions?status=Pending`.
- "Mark all as read" button clears all unread.
- `NotificationsProvider` wraps the authenticated app tree in `App.tsx`.

## Key files
- `api.ts`
- `hooks/useNotifications.ts`
- `context/NotificationsContext.tsx`
- `components/NotificationBell.tsx`
- `components/NotificationDropdown.tsx`

## Commands
- `npm run test:ci` from `settlespace-react/`
- Jest filter: `--testPathPattern=notifications`

## Dependencies
- `src/shared/types.ts` (`Notification`, `NotificationType`)
- `src/shared/api/client.ts` (`apiClient`)
- `src/app/constants.ts` (`APP_ROUTES`)
- `NotificationsProvider` wired in `src/app/App.tsx`

## Source-of-truth note
Frontend-wide conventions are in `settlespace-react/AGENTS.md` and `UX-PRINCIPLES.md`.
Agent commit workflow and checklist policy are authoritative in root `COMMIT-POLICY.md`.
