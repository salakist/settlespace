# FoTestApi.Domain AGENTS Metadata

## Role
Pure domain layer — contains business rules and invariants for the Person aggregate.
This project has **zero infrastructure dependencies** by design.

## Folder structure
Domain uses context-first folders:
- `Auth/` — password policy, generation, and hashing services
- `Persons/` — person aggregate entities, repository contract, domain service, and person exceptions
- `Transactions/` — transaction aggregate entities, repository contract, domain service, and transaction exceptions

Function subfolders are used only when a context contains multiple function groups (for example `Entities/`, `Services/`, `Exceptions/`).

Entity naming rule: domain entities must not use an `Entity` suffix (use `Person` and `Transaction`).

## Responsibilities
- Define `Person` (aggregate root) with validation logic
- Define `Address` value object with validation logic
- Declare `IPersonRepository` repository interface
- Declare `IPersonDomainService` domain service interface
- Declare `IPasswordGenerator` password-generation interface
- Implement `PersonDomainService` (uniqueness invariant enforcement)
- Define password-related domain services for strength validation, generation, and hashing
- Raise domain exceptions (`DuplicatePersonException`, `DomainException`)
- Define `Transaction` and `TransactionStatus` with transaction invariants
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
- `Person.MatchesByFullName()` provides in-memory full-name equality for guard comparisons
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
- `Persons/Entities/Person.cs` — aggregate root with `Validate()` and `MatchesByFullName()`
- `Persons/Entities/Address.cs` — address value object with `Validate()`
- `Persons/IPersonRepository.cs` — person repository contract
- `Persons/Services/IPersonDomainService.cs` — person domain service interface
- `Persons/Services/PersonDomainService.cs` — enforces uniqueness, throws `DuplicatePersonException`
- `Persons/Exceptions/DuplicatePersonException.cs` — thrown on duplicate create/update
- `Persons/Exceptions/WeakPasswordException.cs` — thrown when password does not meet strength requirements
- `Auth/IPasswordGenerator.cs` — password generation interface
- `Auth/IPasswordValidator.cs` — password strength validation interface
- `Auth/IPasswordHashingService.cs` — password hashing service interface
- `Auth/PasswordGenerator.cs` — generates random strong passwords
- `Auth/PasswordValidator.cs` — validates password strength
- `Auth/PasswordHashingService.cs` — hashes and verifies passwords using PBKDF2
- `Transactions/Entities/Transaction.cs` — transaction aggregate root
- `Transactions/Entities/TransactionStatus.cs` — transaction status enum/catalog
- `Transactions/ITransactionRepository.cs` — transaction repository contract
- `Transactions/Services/ITransactionDomainService.cs` — transaction authorization domain service interface
- `Transactions/Services/TransactionDomainService.cs` — enforces transaction access/deletion rules
- `Transactions/Exceptions/InvalidTransactionException.cs` — thrown on invalid transaction invariants
- `Transactions/Exceptions/TransactionNotFoundException.cs` — thrown when transaction lookup fails
- `Transactions/Exceptions/UnauthorizedTransactionAccessException.cs` — thrown on unauthorized transaction access

## Commands
- `dotnet build FoTestApi.Domain/FoTestApi.Domain.csproj`
- `dotnet test FoTestApi.Domain.Tests/FoTestApi.Domain.Tests.csproj`

## Build/Test Artifact Inventory
- Common .NET build outputs in this module: `FoTestApi.Domain/bin/` and `FoTestApi.Domain/obj/`.
- Related test-project outputs: `Tests/FoTestApi.Domain.Tests/bin/`, `Tests/FoTestApi.Domain.Tests/obj/`, and `Tests/FoTestApi.Domain.Tests/artifacts/`.
- Repository quality-gate logs and coverage aggregates: `artifacts/logs/` and `artifacts/coverage/`.

## Gitignore ownership
- Root `.gitignore` is authoritative for shared artifacts (`bin/`, `obj/`, `node_modules/`, generic logs, repository `artifacts/`, and `Tests/**/artifacts/`).
- Domain has no module-local `.gitignore`; keep shared patterns managed at repository root.
- For artifact read/cleanup requests, inspect module outputs plus the related Domain test-project artifact paths.

## Dependencies
- None (no NuGet packages, no project references)
