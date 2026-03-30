# FoTestApi.Application AGENTS Metadata

## Role
Application layer and API host — orchestrates domain logic, handles HTTP, and wires up DI.

## Project structure
```
FoTestApi.Application/
├── Authentication/ AuthSettings, CustomClaimTypes
├── Commands/        LoginCommand, RegisterCommand, ChangePasswordCommand, CreatePersonCommand, UpdatePersonCommand, PersonMutationCommand, DeletePersonCommand, AddressCommand
├── Controllers/     AuthController, PersonsController, TransactionsController
├── Mapping/         IPersonMapper, PersonMapper
├── DTOs/            LoginResponseDto, PersonDto, AddressDto, TransactionDto
├── Services/        AuthService, IPersonApplicationService, PersonApplicationService, ITransactionApplicationService, TransactionApplicationService
├── Program.cs
└── appsettings.json
```

## Responsibilities
- Expose login and registration endpoints via `AuthController` and issue JWT bearer tokens through `AuthService`
- Authenticate against MongoDB persons via `IPersonRepository` using `firstName.lastName` usernames
- Expose an authenticated password-change endpoint for the current user
- Expose REST endpoints via `PersonsController` (focused on orchestration, not error handling)
- Expose REST endpoints via `TransactionsController` for user-scoped transaction CRUD
- Orchestrate commands and queries in `PersonApplicationService`
- Orchestrate transaction authorization and CRUD in `TransactionApplicationService`
- Auto-generate strong passwords when none provided on person creation
- Keep password updates scoped to `AuthController` (`/auth/change-password`) rather than person update routes
- Hash passwords before persistence and upgrade legacy plaintext passwords on successful login
- Accept `IPersonDomainService` (not the concrete class) for strict layer isolation
- Define commands in `Commands/` (input contracts for create/update/delete)
- Define auth and response DTOs in `DTOs/`
- Keep mapping logic in `Mapping/` to avoid controller/service inline mapping
- Keep update IDs outside request body models and pass them via route/claims into service methods
- Register DI in `Program.cs` (repository, domain service, auth service, application service, CORS, Swagger, JWT auth)
- Register `ExceptionHandlingMiddleware` to translate domain exceptions to HTTP responses (409 Conflict, 404 Not Found, 400 Bad Request)
- Register transaction exception mappings (400 invalid transaction, 403 unauthorized transaction access, 404 transaction not found)
- Require JWT authentication for person management endpoints
- Require JWT authentication for transaction endpoints and enforce claim-based user scoping
- Treat `Program.cs` as composition-root/bootstrap code for coverage purposes; it remains part of build/analyzer validation but is excluded from the C# coverage gate

## Interfaces
- `IPersonApplicationService` — abstraction consumed by `PersonsController` (enables controller unit testing)
- `IPersonDomainService` (from Domain) — consumed by `PersonApplicationService` (enables service unit testing)
- `IPasswordGenerator` (from Domain) — consumed by `PersonApplicationService` to generate passwords through DI
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
- `Services/ITransactionApplicationService.cs` — transaction application service interface
- `Services/TransactionApplicationService.cs` — transaction command/query orchestration
- `Commands/` — LoginCommand, RegisterCommand, ChangePasswordCommand, CreatePersonCommand, UpdatePersonCommand, PersonMutationCommand, DeletePersonCommand
- `Commands/` — includes transaction commands (`CreateTransactionCommand`, `UpdateTransactionCommand`, `DeleteTransactionCommand`, `TransactionMutationCommand`)
- `Commands/AddressCommand.cs` — inbound address shape for create/register/update commands
- `DTOs/LoginResponseDto.cs` — outbound JWT response payload
- `DTOs/PersonDto.cs` and `DTOs/AddressDto.cs` — outbound API data shape
- `Controllers/AuthController.cs` — login, register, and password change endpoints
- `Controllers/PersonsController.cs` — REST endpoints
- `Controllers/TransactionsController.cs` — user-scoped transaction REST endpoints
- `appsettings.json` — MongoDB and JWT configuration

## Commands
- From `FoTestApi.Application/`: `dotnet build`
- From `FoTestApi.Application/`: `dotnet run`
- From repository root: `dotnet run --project .\FoTestApi.Application\FoTestApi.Application.csproj`
- From workspace root one level above the repo: `dotnet run --project .\fo-test\FoTestApi.Application\FoTestApi.Application.csproj`
- From repository root: `dotnet test Tests/FoTestApi.Application.Tests/FoTestApi.Application.Tests.csproj`

## Working directory note
- `dotnet run` without `--project` only works when the terminal cwd is `FoTestApi.Application/`.
- If the cwd is different, always use an explicit `--project` path that matches the current directory depth.
