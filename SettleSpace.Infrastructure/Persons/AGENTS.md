# Infrastructure Persons AGENTS Metadata

## Role
Infrastructure persons persistence context for MongoDB repository behavior.

## Responsibilities
- Implement person repository CRUD, batch lookup, and search behavior.
- Keep persistence mapping concerns out of domain models.
- Preserve testability through internal constructor and mockable collection usage.

## Key files
- `PersonRepository.cs`

## Query guidance
- Prefer repository-owned batch person retrieval (for example `GetByIdsAsync(List<string>)`) over repeating controller-level `GetByIdAsync` loops when another context needs related-person display names.

## Commands
- `dotnet test Tests/SettleSpace.Infrastructure.Tests/SettleSpace.Infrastructure.Tests.csproj --filter "FullyQualifiedName~PersonRepository"`

## Dependencies
- `MongoDB.Driver`
- Domain `IPersonRepository` contract

## Source-of-truth note
Infrastructure-wide persistence conventions, artifact ownership, and shared serialization guidance
are defined in the parent `SettleSpace.Infrastructure/AGENTS.md`. Agent commit workflow and
checklist policy are authoritative in root `COMMIT-POLICY.md`.
