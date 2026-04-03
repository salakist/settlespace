# Application Authentication AGENTS Metadata

## Role
Authentication API context for login, registration, and password-change flows.

## Responsibilities
- Own `AuthController` endpoint behavior and auth-specific HTTP contracts.
- Own JWT settings and claim conventions used by authenticated endpoints.
- Own authentication commands and auth service orchestration.
- Keep password update flow scoped to auth endpoints, not person update routes.

## Key files
- `AuthController.cs`
- `AuthSettings.cs`
- `CustomClaimTypes.cs`
- `LoginResponseDto.cs`
- `Commands/`
- `Services/`

## Commands
- `dotnet test Tests/SettleSpace.Application.Tests/SettleSpace.Application.Tests.csproj --filter "FullyQualifiedName~Auth"`

## Dependencies
- `SettleSpace.Domain` contracts (`IPersonRepository`, password services)
- JWT framework packages configured in application host

## Source-of-truth note
Cross-context application policy (DI, middleware, artifact ownership, gate workflow) is defined in `SettleSpace.Application/AGENTS.md` and root `AGENTS.md`.
