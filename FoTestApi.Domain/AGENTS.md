# FoTestApi.Domain AGENTS Metadata

## Role
Pure domain layer — contains business rules and invariants for the Person aggregate.
This project has **zero infrastructure dependencies** by design.

## Responsibilities
- Define `PersonEntity` (aggregate root) with validation logic
- Declare `IPersonRepository` repository interface
- Raise domain exceptions (`DuplicatePersonException`, `DomainException`)

## Domain Rules
- `FirstName` must not be null or whitespace
- `LastName` must not be null or whitespace
- Two persons are considered duplicates if `FirstName` and `LastName` match case-insensitively
- Duplicate checking is enforced at the Application layer via `IPersonRepository.FindByFullNameAsync`
- `PersonEntity.MatchesByFullName()` provides in-memory full-name equality for guard comparisons

## Key files
- `Entities/PersonEntity.cs` — aggregate root with `Validate()` and `MatchesByFullName()`
- `Repositories/IPersonRepository.cs` — repository contract
- `Exceptions/DuplicatePersonException.cs` — thrown on duplicate create/update

## Commands
- `dotnet build FoTestApi.Domain/FoTestApi.Domain.csproj`

## Dependencies
- None (no NuGet packages, no project references)
