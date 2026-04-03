# Application Transactions AGENTS Metadata

## Role
Transactions API context for authenticated, user-scoped transaction CRUD.

## Responsibilities
- Own `TransactionsController` endpoint behavior and claim-based user scoping.
- Own transaction commands and transaction response DTOs.
- Own transaction mapping between commands, domain models, and DTO responses.
- Own application-service orchestration and authorization checks for transactions.

## Key files
- `TransactionsController.cs`
- `TransactionDto.cs`
- `Commands/`
- `Mapping/`
- `Services/`

## Commands
- `dotnet test Tests/SettleSpace.Application.Tests/SettleSpace.Application.Tests.csproj --filter "FullyQualifiedName~Transaction"`

## Dependencies
- Domain transaction aggregate and transaction domain services
- Repository interfaces resolved through DI

## Source-of-truth note
Cross-context application policy (DI, middleware, artifact ownership, gate workflow) is defined in `SettleSpace.Application/AGENTS.md` and root `AGENTS.md`.
