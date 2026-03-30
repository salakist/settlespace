# FoTestApi.Domain AGENTS Metadata

## Role
Pure domain layer — contains business rules and invariants for the Person aggregate.
This project has **zero infrastructure dependencies** by design.

## Responsibilities
- Define `PersonEntity` (aggregate root) with validation logic
- Define `Address` value object with validation logic
- Declare `IPersonRepository` repository interface
- Declare `IPersonDomainService` domain service interface
- Declare `IPasswordGenerator` password-generation interface
- Implement `PersonDomainService` (uniqueness invariant enforcement)
- Define password-related domain services for strength validation, generation, and hashing
- Raise domain exceptions (`DuplicatePersonException`, `DomainException`)
- Define `TransactionEntity` and `TransactionStatus` with transaction invariants
- Declare `ITransactionRepository` repository interface
- Declare and implement `ITransactionDomainService`/`TransactionDomainService` for involvement and creator authorization rules
- Raise transaction-specific domain exceptions (`InvalidTransactionException`, `TransactionNotFoundException`, `UnauthorizedTransactionAccessException`)

## Domain Rules
- `FirstName` must not be null or whitespace
- `LastName` must not be null or whitespace
- `Password` is optional on creation; a random strong password is auto-generated if not provided
- Password changes are scoped to the auth flow (`/auth/change-password`), not person update routes
- `Password` provided to create/register/change-password must be at least 8 characters with uppercase, lowercase, digit, and special character
- `PhoneNumber` is optional; when provided it must match `^(?=.*\d)[0-9+()\-.\s]{7,20}$`
- `Email` is optional; when provided it must be a valid email address
- `DateOfBirth` is optional; when provided it cannot be in the future
- `Addresses` is optional; each address requires non-empty label/street/city/country and a valid postal code
- Two persons are considered duplicates if `FirstName` and `LastName` match case-insensitively
- Duplicate checking is delegated to `IPersonDomainService.EnsureUniqueAsync`
- `PersonEntity.MatchesByFullName()` provides in-memory full-name equality for guard comparisons
- Transaction amount must be greater than zero
- Transaction currency code must be a 3-letter uppercase code (ISO style)
- `PayerPersonId` and `PayeePersonId` must be different
- Transaction description is required (max 200 chars) and category is optional (max 80 chars)
- `TransactionDateUtc` cannot be far in the future
- Transaction creator must be either payer or payee
- Create/update/get transaction operations require logged user involvement (payer or payee)
- Delete transaction operation is restricted to the creator

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
- `Entities/Address.cs` — address value object with `Validate()`
- `Repositories/IPersonRepository.cs` — repository contract
- `Services/IPersonDomainService.cs` — domain service interface
- `Services/IPasswordGenerator.cs` — password generation interface
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
