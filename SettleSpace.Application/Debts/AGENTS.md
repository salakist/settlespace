# Application Debts AGENTS Metadata

## Role
Debts API context for authenticated, user-scoped debt summaries and settlement actions derived from transactions.

## Responsibilities
- Own `DebtsController` endpoint behavior and auth-context resolution.
- Own settlement command contracts and debt response DTOs.
- Own mapping between debt domain projections and API DTOs.
- Own application-service orchestration for reading and settling debts.

## Key files
- `DebtsController.cs`
- `DebtDtos.cs`
- `Commands/SettleDebtCommand.cs`
- `Mapping/DebtMapper.cs`
- `Services/DebtApplicationService.cs`

## Commands
- `dotnet test Tests/SettleSpace.Application.Tests/SettleSpace.Application.Tests.csproj --filter "FullyQualifiedName~Debt"`

## Dependencies
- Domain debts services and debt models
- Domain transaction repository contract resolved through DI

## Source-of-truth note
Cross-context application policy (DI, middleware, artifact ownership, gate workflow) is defined in `SettleSpace.Application/AGENTS.md` and root `AGENTS.md`.
