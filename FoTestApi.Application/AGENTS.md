# FoTestApi.Application AGENTS Metadata

## Role
Application layer and API host — orchestrates domain logic, handles HTTP, and wires up DI.

## Project structure
```
FoTestApi.Application/
├── Authentication/ AuthSettings
├── Commands/        LoginCommand, ChangePasswordCommand, CreatePersonCommand, UpdatePersonCommand, DeletePersonCommand
├── Controllers/     AuthController, PersonsController
├── DTOs/            LoginResponseDto, PersonDto
├── Services/        AuthService, IPersonApplicationService, PersonApplicationService
├── Program.cs
└── appsettings.json
```

## Responsibilities
- Expose a demo login endpoint via `AuthController` and issue JWT bearer tokens through `AuthService`
- Authenticate against MongoDB persons via `IPersonRepository` using `firstName.lastName` usernames
- Expose an authenticated password-change endpoint for the current user
- Expose REST endpoints via `PersonsController` (focused on orchestration, not error handling)
- Orchestrate commands and queries in `PersonApplicationService`
- Auto-generate strong passwords when none provided on person creation
- Preserve existing password when none provided on person update
- Validate password strength using `PasswordValidator` before hashing and persisting
- Hash passwords before persistence and upgrade legacy plaintext passwords on successful login
- Accept `IPersonDomainService` (not the concrete class) for strict layer isolation
- Define commands in `Commands/` (input contracts for create/update/delete)
- Define auth and response DTOs in `DTOs/`
- Register DI in `Program.cs` (repository, domain service, auth service, application service, CORS, Swagger, JWT auth)
- Register `ExceptionHandlingMiddleware` to translate domain exceptions to HTTP responses (409 Conflict, 404 Not Found, 400 Bad Request)
- Require JWT authentication for person management endpoints

## Interfaces
- `IPersonApplicationService` — abstraction consumed by `PersonsController` (enables controller unit testing)
- `IPersonDomainService` (from Domain) — consumed by `PersonApplicationService` (enables service unit testing)

## Dependency direction
- References: `FoTestApi.Domain`, `FoTestApi.Infrastructure`

## Key files
- `Program.cs` — DI registration, middleware pipeline
- `Authentication/AuthSettings.cs` — configurable JWT settings
- `Services/IAuthService.cs` — auth abstraction
- `Services/AuthService.cs` — validates person credentials and mints JWTs
- `Services/IPersonApplicationService.cs` — application service interface
- `Services/PersonApplicationService.cs` — command/query orchestration
- `Commands/` — LoginCommand, ChangePasswordCommand, CreatePersonCommand, UpdatePersonCommand, DeletePersonCommand
- `DTOs/LoginResponseDto.cs` — outbound JWT response payload
- `DTOs/PersonDto.cs` — outbound API data shape
- `Controllers/AuthController.cs` — login and password change endpoints
- `Controllers/PersonsController.cs` — REST endpoints
- `appsettings.json` — MongoDB and JWT configuration

## Commands
- `dotnet build`
- `dotnet run`
- `dotnet test FoTestApi.Application.Tests/FoTestApi.Application.Tests.csproj`
