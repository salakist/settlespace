# SettleSpace.Domain.Tests AGENTS Metadata

## Role
Unit test project for the Domain layer. Tests business invariants, value objects, and domain services with minimal infrastructure involvement.

## Responsibilities
- Keep pure-domain validation rules and service contracts tested close to the domain test project.
- Prefer direct tests of real domain behavior over mocks whenever the type under test is pure.
- Use mocks only at domain service boundaries that depend on repository contracts.

## Test coverage
- `PersonTests` / `AddressTests` â€” aggregate and value-object validation rules, optional field validation, and name/address matching behavior
- `PersonDomainServiceTests` â€” `EnsureUniqueAsync()` duplicate and `excludeId` behavior
- `PasswordGeneratorTests`, `PasswordValidatorTests`, `PasswordHashingServiceTests` â€” password generation, validation, hashing, and verification behavior
- `TransactionTests`, `TransactionDomainServiceTests`, `TransactionExceptionsTests` â€” transaction invariants, service rules, and exception behavior

## Test strategy
- Pure domain objects are tested directly without mocks.
- Domain services use mocked repository contracts only where collaboration boundaries require them.
- Password generator/validator compatibility is checked with real implementations where that provides stronger behavior coverage.

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
- `dotnet test Tests/SettleSpace.Domain.Tests/SettleSpace.Domain.Tests.csproj`

## Dependencies
- `xunit`, `Moq`
- Project reference: `SettleSpace.Domain`

## Source-of-truth note
Shared test artifact and gitignore policy are documented in `Tests/AGENTS.md`.
Domain behavior under test is documented in the nearest `SettleSpace.Domain/*/AGENTS.md` files.
