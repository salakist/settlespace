# SettleSpace.Application.Tests AGENTS Metadata

## Role
Unit test project for the Application layer. Tests application services, controllers, mappers, and middleware in strict isolation.

## Responsibilities
- Keep authentication, persons, transactions, and middleware test guidance close to the application layer test project.
- Verify orchestration and HTTP-contract behavior without requiring live infrastructure.
- Keep mock usage limited to the service and controller boundaries that the application layer owns.

## Test coverage
- `PersonApplicationServiceTests` â€” query, create, update, delete, uniqueness, and password-preservation behavior
- `AuthServiceTests` / `AuthControllerTests` â€” login, registration, password change, and legacy-password-upgrade cases
- `PersonsControllerTests` / `PersonMapperTests` â€” HTTP status mapping and DTO/entity mapping behavior
- `TransactionApplicationServiceTests`, `TransactionsControllerTests`, `TransactionMapperTests`, `DeleteTransactionCommandTests` â€” transaction orchestration, controller mapping, mapper behavior, and delete-command validation- `DebtApplicationServiceTests`, `DebtsControllerTests` — debt-summary orchestration, settlement behavior, and controller DTO mapping- `ExceptionHandlingMiddlewareTests` â€” exception-to-HTTP translation behavior

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
- `dotnet test Tests/SettleSpace.Application.Tests/SettleSpace.Application.Tests.csproj`

## Dependencies
- `xunit`, `Moq`
- Project references: `SettleSpace.Domain`, `SettleSpace.Application`

## Source-of-truth note
Shared test artifact and gitignore policy are documented in `Tests/AGENTS.md`.
Application context behavior under test is documented in the nearest `SettleSpace.Application/*/AGENTS.md` files.
