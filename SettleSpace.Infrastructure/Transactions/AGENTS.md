# Infrastructure Transactions AGENTS Metadata

## Role
Infrastructure transactions persistence context for MongoDB transaction repository behavior.

## Responsibilities
- Implement transaction repository CRUD and user-scoped query behavior.
- Implement multi-parameter search filter construction from `TransactionSearchFilter`.
- Keep persistence mapping concerns out of domain models.
- Keep collection semantics and filters aligned with application authorization expectations.

## Key files
- `TransactionRepository.cs`

## Commands
- `dotnet test Tests/SettleSpace.Infrastructure.Tests/SettleSpace.Infrastructure.Tests.csproj --filter "FullyQualifiedName~TransactionRepository"`

## Dependencies
- `MongoDB.Driver`
- Domain `ITransactionRepository` contract

## Source-of-truth note
Infrastructure-wide persistence conventions, artifact ownership, and shared serialization guidance
are defined in the parent `SettleSpace.Infrastructure/AGENTS.md`. Agent commit workflow and
checklist policy are authoritative in root `COMMIT-POLICY.md`.
