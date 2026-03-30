# FoTestApi.Application AGENTS Metadata

## Role
Application layer and API host — orchestrates domain logic, handles HTTP, and wires up DI.

## Project structure
```
FoTestApi.Application/
├── Authentication/
│   ├── AuthController.cs
│   ├── AuthSettings.cs
│   ├── CustomClaimTypes.cs
│   ├── LoginResponseDto.cs
│   ├── Commands/
│   └── Services/
├── Persons/
│   ├── PersonsController.cs
│   ├── Commands/
│   ├── DTOs/
│   ├── Mapping/
│   └── Services/
├── Transactions/
│   ├── TransactionsController.cs
│   ├── TransactionDto.cs
│   ├── Commands/
│   ├── Mapping/
│   └── Services/
├── Middleware/
├── Program.cs
└── appsettings.json
```

Function subfolders are used only when a context contains multiple function groups. If a context would otherwise have only one function subfolder, files are flattened directly under the context.

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
- Define commands within each context `Commands/` folder
- Keep mapping logic in context `Mapping/` folders to avoid controller/service inline mapping
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
- `Authentication/Services/IAuthService.cs` — auth abstraction
- `Authentication/Services/AuthService.cs` — validates person credentials and mints JWTs
- `Authentication/Commands/` — `LoginCommand`, `RegisterCommand`, `ChangePasswordCommand`
- `Authentication/AuthController.cs` — login, register, and password-change endpoints
- `Authentication/LoginResponseDto.cs` — outbound JWT response payload
- `Persons/Services/IPersonApplicationService.cs` and `Persons/Services/PersonApplicationService.cs` — person command/query orchestration
- `Persons/Mapping/IPersonMapper.cs` and `Persons/Mapping/PersonMapper.cs` — centralized person mapping
- `Persons/Commands/` — person CRUD commands + `AddressCommand`
- `Persons/DTOs/PersonDto.cs` and `Persons/DTOs/AddressDto.cs` — person response shape
- `Persons/PersonsController.cs` — person REST endpoints
- `Transactions/Services/ITransactionApplicationService.cs` and `Transactions/Services/TransactionApplicationService.cs` — transaction command/query orchestration
- `Transactions/Mapping/ITransactionMapper.cs` and `Transactions/Mapping/TransactionMapper.cs` — centralized transaction mapping
- `Transactions/Commands/` — transaction CRUD commands
- `Transactions/TransactionDto.cs` — transaction response shape
- `Transactions/TransactionsController.cs` — user-scoped transaction REST endpoints
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
