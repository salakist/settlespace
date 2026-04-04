# Application Persons AGENTS Metadata

## Role
Persons API context for person CRUD orchestration and DTO mapping.

## Responsibilities
- Own `PersonsController` endpoint behavior and route/claim handling.
- Own person commands and DTO contracts.
- Own person mapping between commands, domain models, and DTO responses.
- Own application-service orchestration for person workflows.

## Key files
- `PersonsController.cs`
- `Commands/`
- `DTOs/`
- `Mapping/`
- `Services/`

## Commands
- `dotnet test Tests/SettleSpace.Application.Tests/SettleSpace.Application.Tests.csproj --filter "FullyQualifiedName~Persons"`

## Dependencies
- Domain person aggregate and person domain services
- Repository interfaces resolved through DI

## Source-of-truth note
Cross-context application policy (DI, middleware, and artifact ownership) is defined in the parent
`SettleSpace.Application/AGENTS.md`. Agent commit workflow and checklist policy are authoritative in
root `COMMIT-POLICY.md`.
