# Application Notifications AGENTS Metadata

## Role
Application layer for the notifications bounded context — DTO, mapper, service, and controller.

## Responsibilities
- Expose `GET /api/notifications` (unread list), `POST /api/notifications/{id}/read` (mark single), and `POST /api/notifications/read-all`.
- `NotificationApplicationService` holds recipient-based filtering logic and ownership guard for mark-read.
- `TransactionApplicationService` injects `INotificationApplicationService` to fire `TransactionPendingConfirmation` notifications on transaction creation.

## Key files
- `NotificationDto.cs`
- `Mapping/INotificationMapper.cs`
- `Mapping/NotificationMapper.cs`
- `Services/INotificationApplicationService.cs`
- `Services/NotificationApplicationService.cs`
- `NotificationsController.cs`

## Commands
- `dotnet test Tests/SettleSpace.Application.Tests/SettleSpace.Application.Tests.csproj --filter "FullyQualifiedName~Notification"`

## Dependencies
- `SettleSpace.Domain/Notifications/`
- `SettleSpace.Domain/Notifications/Exceptions/`

## Source-of-truth note
Application-wide architecture rules are defined in the parent `SettleSpace.Application/AGENTS.md`.
Agent commit workflow and checklist policy are authoritative in root `COMMIT-POLICY.md`.
