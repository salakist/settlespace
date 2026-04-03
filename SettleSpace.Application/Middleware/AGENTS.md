# Application Middleware AGENTS Metadata

## Role
Application middleware context for exception translation and pipeline behavior.

## Responsibilities
- Own exception-to-HTTP translation behavior in middleware.
- Keep domain and transaction exception mappings aligned with API contracts.
- Keep middleware behavior testable in isolation.

## Key files
- `ExceptionHandlingMiddleware.cs`

## Commands
- `dotnet test Tests/SettleSpace.Application.Tests/SettleSpace.Application.Tests.csproj --filter "FullyQualifiedName~ExceptionHandlingMiddleware"`

## Dependencies
- Domain exception types and ASP.NET Core middleware contracts

## Source-of-truth note
Cross-context application policy (DI, host wiring, artifact ownership, gate workflow) is defined in `SettleSpace.Application/AGENTS.md` and root `AGENTS.md`.
