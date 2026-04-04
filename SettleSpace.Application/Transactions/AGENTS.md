# Application Transactions AGENTS Metadata

## Role
Transactions API context for authenticated, user-scoped transaction CRUD.

## Responsibilities
- Own `TransactionsController` endpoint behavior and claim-based user scoping.
- Own transaction commands, search query model, and transaction response DTOs.
- Own transaction mapping between commands, domain models, and DTO responses.
- Own application-service orchestration and authorization checks for transactions.
- Own search query validation and search-to-filter orchestration via `POST /transactions/search`.

## Key files
- `TransactionsController.cs`
- `TransactionDto.cs`
- `Commands/`
- `Queries/TransactionSearchQuery.cs`
- `Queries/InvolvementType.cs`
- `Mapping/`
- `Services/`

## Commands
- `dotnet test Tests/SettleSpace.Application.Tests/SettleSpace.Application.Tests.csproj --filter "FullyQualifiedName~Transaction"`

## Dependencies
- Domain transaction aggregate and transaction domain services
- Repository interfaces resolved through DI

## Source-of-truth note
Cross-context application policy (DI, middleware, and artifact ownership) is defined in the parent
`SettleSpace.Application/AGENTS.md`. Agent commit workflow and checklist policy are authoritative in
root `COMMIT-POLICY.md`.
