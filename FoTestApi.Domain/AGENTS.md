# FoTestApi.Domain AGENTS Metadata

## Role
Pure domain layer — contains business rules and invariants for the Person aggregate.
This project has **zero infrastructure dependencies** by design.

## Responsibilities
- Define `PersonEntity` (aggregate root) with validation logic
- Declare `IPersonRepository` repository interface
- Declare `IPersonDomainService` domain service interface
- Implement `PersonDomainService` (uniqueness invariant enforcement)
- Raise domain exceptions (`DuplicatePersonException`, `DomainException`)

## Domain Rules
- `FirstName` must not be null or whitespace
- `LastName` must not be null or whitespace
- Two persons are considered duplicates if `FirstName` and `LastName` match case-insensitively
- Duplicate checking is delegated to `IPersonDomainService.EnsureUniqueAsync`
- `PersonEntity.MatchesByFullName()` provides in-memory full-name equality for guard comparisons

## Key files
- `Entities/PersonEntity.cs` — aggregate root with `Validate()` and `MatchesByFullName()`
- `Repositories/IPersonRepository.cs` — repository contract
- `Services/IPersonDomainService.cs` — domain service interface
- `Services/PersonDomainService.cs` — enforces uniqueness, throws `DuplicatePersonException`
- `Exceptions/DuplicatePersonException.cs` — thrown on duplicate create/update

## Commands
- `dotnet build FoTestApi.Domain/FoTestApi.Domain.csproj`
- `dotnet test FoTestApi.Domain.Tests/FoTestApi.Domain.Tests.csproj`

## Dependencies
- None (no NuGet packages, no project references)
