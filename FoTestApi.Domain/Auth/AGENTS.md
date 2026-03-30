# Domain Auth AGENTS Metadata

## Role
Domain authentication services for password generation, validation, and hashing contracts.

## Responsibilities
- Define password generation, validation, and hashing interfaces.
- Implement password generator, validator, and PBKDF2 hashing service.
- Keep password rules deterministic and testable without infrastructure dependencies.

## Key files
- `IPasswordGenerator.cs`
- `IPasswordValidator.cs`
- `IPasswordHashingService.cs`
- `PasswordGenerator.cs`
- `PasswordValidator.cs`
- `PasswordHashingService.cs`

## Commands
- `dotnet test Tests/FoTestApi.Domain.Tests/FoTestApi.Domain.Tests.csproj --filter "FullyQualifiedName~Password"`

## Dependencies
- None outside .NET runtime cryptography APIs

## Source-of-truth note
Domain-wide architecture rules and artifact ownership are defined in `FoTestApi.Domain/AGENTS.md` and root `AGENTS.md`.
