# Domain Notifications AGENTS Metadata

## Role
Domain notifications context for notification entity and repository contract.

## Responsibilities
- Define `Notification` entity and `NotificationType` enum.
- Define `INotificationRepository` interface (no domain service needed — no invariants to guard in Phase 1).
- Define notification-specific domain exceptions.

## Key files
- `Entities/Notification.cs`
- `Entities/NotificationType.cs`
- `INotificationRepository.cs`
- `Exceptions/NotificationNotFoundException.cs`
- `Exceptions/UnauthorizedNotificationAccessException.cs`

## Commands
- `dotnet test Tests/SettleSpace.Domain.Tests/SettleSpace.Domain.Tests.csproj --filter "FullyQualifiedName~Notification"`

## Dependencies
- None (pure domain)

## Source-of-truth note
Domain-wide architecture rules and artifact ownership are defined in the parent
`SettleSpace.Domain/AGENTS.md`. Agent commit workflow and checklist policy are authoritative in root
`COMMIT-POLICY.md`.
