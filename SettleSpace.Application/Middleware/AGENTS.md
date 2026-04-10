# Application Middleware AGENTS Metadata

## Role
Application middleware context for exception translation and pipeline behavior.

## Responsibilities
- Own exception-to-HTTP translation behavior in middleware.
- Keep domain and transaction exception mappings aligned with API contracts.
- Keep middleware behavior testable in isolation.
- Keep shared `ProblemDetails` formatting centralized here; controllers should throw specific exceptions instead of returning `Problem(...)` directly.

## Key files
- `ExceptionHandlingMiddleware.cs`
- `ApiProblemDetailsCatalog.cs`

## Commands
- `dotnet test Tests/SettleSpace.Application.Tests/SettleSpace.Application.Tests.csproj --filter "FullyQualifiedName~ExceptionHandlingMiddleware"`

## Dependencies
- Domain exception types and ASP.NET Core middleware contracts

## Source-of-truth note
Cross-context application policy (DI, middleware, and artifact ownership) is defined in the parent
`SettleSpace.Application/AGENTS.md`. Agent commit workflow and checklist policy are authoritative in
root `COMMIT-POLICY.md`.
