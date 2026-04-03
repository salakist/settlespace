# Domain Debts AGENTS Metadata

## Role
Domain debts context for computed debt balances, settlement validation, and debt-summary business rules.

## Responsibilities
- Define derived debt summary/detail models used by the application layer.
- Define and implement debt computation and settlement rules.
- Keep debt business policy in the domain layer rather than controllers or infrastructure.

## Key files
- `Entities/DebtModels.cs`
- `Services/IDebtDomainService.cs`
- `Services/DebtDomainService.cs`
- `Exceptions/InvalidDebtSettlementException.cs`

## Commands
- `dotnet test Tests/SettleSpace.Domain.Tests/SettleSpace.Domain.Tests.csproj --filter "FullyQualifiedName~Debt"`

## Dependencies
- Transaction domain entities (`Transaction`, `TransactionStatus`)
- No project references beyond the domain layer itself

## Source-of-truth note
Domain-wide architecture rules and artifact ownership are defined in `SettleSpace.Domain/AGENTS.md` and root `AGENTS.md`.
