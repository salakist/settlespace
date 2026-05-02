# Infrastructure Notifications AGENTS Metadata

## Role
MongoDB persistence for the notifications bounded context.

## Responsibilities
- Implement `INotificationRepository` via `NotificationRepository`.
- Own BSON class map registration for `Notification` entity.

## Key files
- `NotificationRepository.cs`

## Commands
- `dotnet test Tests/SettleSpace.Infrastructure.Tests/SettleSpace.Infrastructure.Tests.csproj --filter "FullyQualifiedName~Notification"`

## Dependencies
- `SettleSpace.Domain/Notifications/`
- `SettleSpace.Infrastructure/SettleSpaceDatabaseSettings.cs` (`NotificationsCollectionName`)

## Source-of-truth note
Infrastructure-wide architecture rules are defined in the parent `SettleSpace.Infrastructure/AGENTS.md`.
Agent commit workflow and checklist policy are authoritative in root `COMMIT-POLICY.md`.
