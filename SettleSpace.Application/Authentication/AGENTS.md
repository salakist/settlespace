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
Cross-context application policy (DI, middleware, and artifact ownership) is defined in the parent
`SettleSpace.Application/AGENTS.md`. Agent commit workflow and checklist policy are authoritative in
root `COMMIT-POLICY.md`.
