# Domain Persons AGENTS Metadata

## Role
Domain persons context for aggregate invariants, repository contract, and uniqueness rules.

## Responsibilities
- Define person aggregate and address value-object validation rules.
- Define person repository interface.
- Define and implement person domain service uniqueness rules.
- Define person-specific domain exceptions.

## Key files
- `Entities/Person.cs`
- `Entities/Address.cs`
- `IPersonRepository.cs`
- `Services/IPersonDomainService.cs`
- `Services/PersonDomainService.cs`
- `Exceptions/`

## Commands
- `dotnet test Tests/SettleSpace.Domain.Tests/SettleSpace.Domain.Tests.csproj --filter "FullyQualifiedName~Person"`

## Dependencies
- None (pure domain)

## Source-of-truth note
Domain-wide architecture rules and artifact ownership are defined in `SettleSpace.Domain/AGENTS.md` and root `AGENTS.md`.
