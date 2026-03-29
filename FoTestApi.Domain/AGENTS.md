# FoTestApi.Domain AGENTS Metadata

## Role
Pure domain layer — contains business rules and invariants for the Person aggregate.
This project has **zero infrastructure dependencies** by design.

## Responsibilities
- Define `PersonEntity` (aggregate root) with validation logic
- Declare `IPersonRepository` repository interface
- Declare `IPersonDomainService` domain service interface
- Implement `PersonDomainService` (uniqueness invariant enforcement)
- Define password-related domain services for strength validation, generation, and hashing
- Raise domain exceptions (`DuplicatePersonException`, `DomainException`)

## Domain Rules
- `FirstName` must not be null or whitespace
- `LastName` must not be null or whitespace
- `Password` is optional on creation; a random strong password is auto-generated if not provided
- On updates, if no password is provided, the existing password is preserved
- `Password` if provided must be at least 8 characters with uppercase, lowercase, digit, and special character
- Two persons are considered duplicates if `FirstName` and `LastName` match case-insensitively
- Duplicate checking is delegated to `IPersonDomainService.EnsureUniqueAsync`
- `PersonEntity.MatchesByFullName()` provides in-memory full-name equality for guard comparisons

### Password Strength Rules (if provided)
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)
- At least one special character: `!@#$%^&*()_+-=[]{}';:"\\|,.<>?`

### Auto-generated Passwords
- Generated when a person is created without providing a password
- Always 12+ characters
- Always contain uppercase, lowercase, digit, and special character
- Randomly shuffled to ensure security diversity

### Password Storage
- Passwords are validated as plaintext before persistence
- Persisted passwords are stored as PBKDF2 hashes rather than plaintext
- Hash verification and hash-format detection are handled by `IPasswordHashingService`

## Key files
- `Entities/PersonEntity.cs` — aggregate root with `Validate()` and `MatchesByFullName()`
- `Repositories/IPersonRepository.cs` — repository contract
- `Services/IPersonDomainService.cs` — domain service interface
- `Services/IPasswordValidator.cs` — password strength validation interface
- `Services/IPasswordHashingService.cs` — password hashing service interface
- `Services/PersonDomainService.cs` — enforces uniqueness, throws `DuplicatePersonException`
- `Services/PasswordValidator.cs` — validates password strength, throws `WeakPasswordException`
- `Services/PasswordGenerator.cs` — generates random strong passwords
- `Services/PasswordHashingService.cs` — hashes and verifies passwords using PBKDF2
- `Exceptions/DuplicatePersonException.cs` — thrown on duplicate create/update
- `Exceptions/WeakPasswordException.cs` — thrown when password does not meet strength requirements

## Commands
- `dotnet build FoTestApi.Domain/FoTestApi.Domain.csproj`
- `dotnet test FoTestApi.Domain.Tests/FoTestApi.Domain.Tests.csproj`

## Dependencies
- None (no NuGet packages, no project references)
