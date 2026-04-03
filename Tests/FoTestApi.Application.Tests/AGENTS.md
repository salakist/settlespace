# FoTestApi.Application.Tests AGENTS Metadata

## Role
Unit test project for the Application layer. Tests application services, controllers, mappers, and middleware in strict isolation.

## Responsibilities
- Keep authentication, persons, transactions, and middleware test guidance close to the application layer test project.
- Verify orchestration and HTTP-contract behavior without requiring live infrastructure.
- Keep mock usage limited to the service and controller boundaries that the application layer owns.

## Test coverage
- `PersonApplicationServiceTests` — query, create, update, delete, uniqueness, and password-preservation behavior
- `AuthServiceTests` / `AuthControllerTests` — login, registration, password change, and legacy-password-upgrade cases
- `PersonsControllerTests` / `PersonMapperTests` — HTTP status mapping and DTO/entity mapping behavior
- `TransactionApplicationServiceTests`, `TransactionsControllerTests`, `TransactionMapperTests`, `DeleteTransactionCommandTests` — transaction orchestration, controller mapping, mapper behavior, and delete-command validation
- `ExceptionHandlingMiddlewareTests` — exception-to-HTTP translation behavior

## Test strategy
- Application services use mocked repositories, domain services, and auth/password dependencies to stay isolated from infrastructure.
- Controller tests verify HTTP status and contract mapping with mocked application services.
- Middleware tests isolate exception translation and framework-edge behavior.

## Key files
- `Persons/Services/PersonApplicationServiceTests.cs`
- `Persons/PersonsControllerTests.cs`
- `Persons/Mapping/PersonMapperTests.cs`
- `Authentication/Services/AuthServiceTests.cs`
- `Authentication/AuthControllerTests.cs`
- `Transactions/Services/TransactionApplicationServiceTests.cs`
- `Transactions/TransactionsControllerTests.cs`
- `Transactions/Mapping/TransactionMapperTests.cs`
- `Transactions/Commands/DeleteTransactionCommandTests.cs`
- `Middleware/ExceptionHandlingMiddlewareTests.cs`

## Commands
- `dotnet test Tests/FoTestApi.Application.Tests/FoTestApi.Application.Tests.csproj`

## Dependencies
- `xunit`, `Moq`
- Project references: `FoTestApi.Domain`, `FoTestApi.Application`

## Source-of-truth note
Shared test artifact and gitignore policy are documented in `Tests/AGENTS.md`.
Application context behavior under test is documented in the nearest `FoTestApi.Application/*/AGENTS.md` files.
