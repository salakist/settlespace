# Domain Transactions AGENTS Metadata

## Role
Domain transactions context for transaction invariants, access rules, and repository contract.

## Responsibilities
- Define transaction aggregate and status model.
- Define transaction repository interface.
- Define transaction search filter domain model.
- Define and implement transaction authorization/involvement domain rules.
- Own search filter validation via `TransactionSearchFilter.Validate()`.
- Define transaction-specific domain exceptions.
- `Transaction.ConfirmedByPersonIds` tracks which involved parties have confirmed; `InitializeConfirmations(creatorPersonId)` seeds it at creation/reset; `IsFullyConfirmed()` returns true when both payer and payee are present.
- `TransactionDomainService` guards: `EnsureCanUpdate` (USER: Pending only), `EnsureCanDelete` (USER: never; MANAGER: creator only), `EnsureCanConfirm`/`EnsureCanRefuse` (must be Pending, involved, not already confirmed).

## Key files
- `Entities/Transaction.cs`
- `Entities/TransactionStatus.cs`
- `ITransactionRepository.cs`
- `TransactionSearchFilter.cs`
- `InvolvementType.cs`
- `Services/ITransactionDomainService.cs`
- `Services/TransactionDomainService.cs`
- `Exceptions/`

## Commands
- `dotnet test Tests/SettleSpace.Domain.Tests/SettleSpace.Domain.Tests.csproj --filter "FullyQualifiedName~Transaction"`

## Dependencies
- None (pure domain)

## Source-of-truth note
Domain-wide architecture rules and artifact ownership are defined in the parent
`SettleSpace.Domain/AGENTS.md`. Agent commit workflow and checklist policy are authoritative in root
`COMMIT-POLICY.md`.
