# FoTestApi.Application AGENTS Metadata

## Role
Application layer and API host — orchestrates domain logic, handles HTTP, and wires up DI.

## Project structure
```
FoTestApi.Application/
├── Commands/        CreatePersonCommand, UpdatePersonCommand, DeletePersonCommand
├── Controllers/     PersonsController
├── DTOs/            PersonDto
├── Services/        IPersonApplicationService, PersonApplicationService
├── Program.cs
└── appsettings.json
```

## Responsibilities
- Expose REST endpoints via `PersonsController` (focused on orchestration, not error handling)
- Orchestrate commands and queries in `PersonApplicationService`
- Validate password strength using `PasswordValidator` before persisting
- Accept `IPersonDomainService` (not the concrete class) for strict layer isolation
- Define commands in `Commands/` (input contracts for create/update/delete)
- Define `PersonDto` in `DTOs/` as the public API response shape
- Register DI in `Program.cs` (repository, domain service, application service, CORS, Swagger)
- Register `ExceptionHandlingMiddleware` to translate domain exceptions to HTTP responses (409 Conflict, 404 Not Found, 400 Bad Request)

## Interfaces
- `IPersonApplicationService` — abstraction consumed by `PersonsController` (enables controller unit testing)
- `IPersonDomainService` (from Domain) — consumed by `PersonApplicationService` (enables service unit testing)

## Dependency direction
- References: `FoTestApi.Domain`, `FoTestApi.Infrastructure`

## Key files
- `Program.cs` — DI registration, middleware pipeline
- `Services/IPersonApplicationService.cs` — application service interface
- `Services/PersonApplicationService.cs` — command/query orchestration
- `Commands/` — CreatePersonCommand, UpdatePersonCommand, DeletePersonCommand
- `DTOs/PersonDto.cs` — outbound API data shape
- `Controllers/PersonsController.cs` — REST endpoints
- `appsettings.json` — MongoDB connection settings

## Commands
- `dotnet build`
- `dotnet run`
- `dotnet test FoTestApi.Application.Tests/FoTestApi.Application.Tests.csproj`
