# FoTestApi.Domain.Tests AGENTS Metadata

## Role
Unit test project for the Domain layer. Tests pure business logic with no mocking required.

## Test coverage
- `PersonEntityTests` — `Validate()` (valid, empty/whitespace first/last name) and `MatchesByFullName()` (same, different case, different names)
- `PersonDomainServiceTests` — `EnsureUniqueAsync()` (no duplicate, duplicate throws, excludeId same person, excludeId different person)
- `PasswordGeneratorTests` — generated passwords satisfy strength and randomness expectations
- `PasswordHashingServiceTests` — hashing never returns plaintext and verification succeeds/fails correctly

## Test strategy
- `PersonEntity` is a plain object — tested directly, no mocks
- `PersonDomainService` depends on `IPersonRepository`, which is mocked via Moq

## Key files
- `Entities/PersonEntityTests.cs`
- `Services/PersonDomainServiceTests.cs`
- `Services/PasswordGeneratorTests.cs`
- `Services/PasswordHashingServiceTests.cs`

## Commands
- `dotnet test Tests/FoTestApi.Domain.Tests/FoTestApi.Domain.Tests.csproj`

## Dependencies
- `xunit`, `Moq`
- Project reference: `FoTestApi.Domain`
