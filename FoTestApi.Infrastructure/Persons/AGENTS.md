# Infrastructure Persons AGENTS Metadata

## Role
Infrastructure persons persistence context for MongoDB repository behavior.

## Responsibilities
- Implement person repository CRUD and search behavior.
- Keep persistence mapping concerns out of domain models.
- Preserve testability through internal constructor and mockable collection usage.

## Key files
- `PersonRepository.cs`

## Commands
- `dotnet test Tests/FoTestApi.Infrastructure.Tests/FoTestApi.Infrastructure.Tests.csproj --filter "FullyQualifiedName~PersonRepository"`

## Dependencies
- `MongoDB.Driver`
- Domain `IPersonRepository` contract

## Source-of-truth note
Infrastructure-wide persistence conventions, artifact ownership, and shared serialization guidance are defined in `FoTestApi.Infrastructure/AGENTS.md` and root `AGENTS.md`.
