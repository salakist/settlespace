# Domain Transactions AGENTS Metadata

## Role
Domain transactions context for transaction invariants, access rules, and repository contract.

## Responsibilities
- Define transaction aggregate and status model.
- Define transaction repository interface.
- Define and implement transaction authorization/involvement domain rules.
- Define transaction-specific domain exceptions.

## Key files
- `Entities/Transaction.cs`
- `Entities/TransactionStatus.cs`
- `ITransactionRepository.cs`
- `Services/ITransactionDomainService.cs`
- `Services/TransactionDomainService.cs`
- `Exceptions/`

## Commands
- `dotnet test Tests/SettleSpace.Domain.Tests/SettleSpace.Domain.Tests.csproj --filter "FullyQualifiedName~Transaction"`

## Dependencies
- None (pure domain)

## Source-of-truth note
Domain-wide architecture rules and artifact ownership are defined in `SettleSpace.Domain/AGENTS.md` and root `AGENTS.md`.
