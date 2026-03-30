# FoTestApi.Domain.Tests AGENTS Metadata

## Role
Unit test project for the Domain layer. Tests pure business logic with no mocking required.

## Test coverage
- `PersonTests` — `Validate()` (valid, empty/whitespace first/last name, optional field validations, future date rejection, invalid address rejection) and `MatchesByFullName()` (same, different case, different names)
- `AddressTests` — address validation rules for required fields and postal-code formats
- `PersonDomainServiceTests` — `EnsureUniqueAsync()` (no duplicate, duplicate throws, excludeId same person, excludeId different person)
- `PasswordGeneratorTests` — generated passwords satisfy strength and randomness expectations
- `PasswordValidatorTests` — password strength policy behavior and weak-password failures
- `PasswordHashingServiceTests` — hashing never returns plaintext and verification succeeds/fails correctly

## Test strategy
- `Person` is a plain object — tested directly, no mocks
- `PersonDomainService` depends on `IPersonRepository`, which is mocked via Moq
- `PasswordGeneratorTests` intentionally instantiate `PasswordValidator` directly to assert real generator/validator compatibility

## Key files
- `Persons/Entities/PersonTests.cs`
- `Persons/Entities/AddressTests.cs`
- `Persons/Services/PersonDomainServiceTests.cs`
- `Auth/PasswordGeneratorTests.cs`
- `Auth/PasswordValidatorTests.cs`
- `Auth/PasswordHashingServiceTests.cs`
- `Transactions/Entities/TransactionTests.cs`
- `Transactions/Services/TransactionDomainServiceTests.cs`
- `Transactions/Exceptions/TransactionExceptionsTests.cs`

## Commands
- `dotnet test Tests/FoTestApi.Domain.Tests/FoTestApi.Domain.Tests.csproj`

## Dependencies
- `xunit`, `Moq`
- Project reference: `FoTestApi.Domain`
