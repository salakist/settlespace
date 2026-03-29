# FoTestApi.Application AGENTS Metadata

## Role
Application layer and API host — orchestrates domain logic, handles HTTP, and wires up DI.

## Project structure
```
FoTestApi.Application/
├── Authentication/ AuthSettings, CustomClaimTypes
├── Commands/        LoginCommand, RegisterCommand, ChangePasswordCommand, CreatePersonCommand, UpdatePersonCommand, DeletePersonCommand
├── Controllers/     AuthController, PersonsController
├── Mapping/         IPersonMapper, PersonMapper
├── DTOs/            LoginResponseDto, PersonDto, AddressDto
├── Services/        AuthService, IPersonApplicationService, PersonApplicationService
├── Program.cs
└── appsettings.json
```

## Responsibilities
- Expose login and registration endpoints via `AuthController` and issue JWT bearer tokens through `AuthService`
- Authenticate against MongoDB persons via `IPersonRepository` using `firstName.lastName` usernames
- Expose an authenticated password-change endpoint for the current user
- Expose REST endpoints via `PersonsController` (focused on orchestration, not error handling)
- Orchestrate commands and queries in `PersonApplicationService`
- Auto-generate strong passwords when none provided on person creation
- Keep password updates scoped to `AuthController` (`/auth/change-password`) rather than person update routes
- Hash passwords before persistence and upgrade legacy plaintext passwords on successful login
- Accept `IPersonDomainService` (not the concrete class) for strict layer isolation
- Define commands in `Commands/` (input contracts for create/update/delete)
- Define auth and response DTOs in `DTOs/`
- Keep mapping logic in `Mapping/` to avoid controller/service inline mapping
- Register DI in `Program.cs` (repository, domain service, auth service, application service, CORS, Swagger, JWT auth)
- Register `ExceptionHandlingMiddleware` to translate domain exceptions to HTTP responses (409 Conflict, 404 Not Found, 400 Bad Request)
- Require JWT authentication for person management endpoints

## Interfaces
- `IPersonApplicationService` — abstraction consumed by `PersonsController` (enables controller unit testing)
- `IPersonDomainService` (from Domain) — consumed by `PersonApplicationService` (enables service unit testing)
- `IPasswordValidator` (from Domain) — consumed by application services to enforce password policy via DI

## Dependency direction
- References: `FoTestApi.Domain`, `FoTestApi.Infrastructure`

## Key files
- `Program.cs` — DI registration, middleware pipeline
- `Authentication/AuthSettings.cs` — configurable JWT settings
- `Authentication/CustomClaimTypes.cs` — custom claim names used in JWT and authorized endpoints
- `Mapping/IPersonMapper.cs` and `Mapping/PersonMapper.cs` — centralized mapping between commands, entities, and DTOs
- `Services/IAuthService.cs` — auth abstraction
- `Services/AuthService.cs` — validates person credentials and mints JWTs
- `Services/IPersonApplicationService.cs` — application service interface
- `Services/PersonApplicationService.cs` — command/query orchestration
- `Commands/` — LoginCommand, RegisterCommand, ChangePasswordCommand, CreatePersonCommand, UpdatePersonCommand, DeletePersonCommand
- `DTOs/LoginResponseDto.cs` — outbound JWT response payload
- `DTOs/PersonDto.cs` and `DTOs/AddressDto.cs` — outbound API data shape
- `Controllers/AuthController.cs` — login, register, and password change endpoints
- `Controllers/PersonsController.cs` — REST endpoints
- `appsettings.json` — MongoDB and JWT configuration

## Commands
- `dotnet build`
- `dotnet run`
- `dotnet test FoTestApi.Application.Tests/FoTestApi.Application.Tests.csproj`
