# FoTestApi.Application.Tests AGENTS Metadata

## Role
Unit test project for the Application layer. Tests `PersonApplicationService` and `PersonsController` in strict isolation.

## Test coverage

### `PersonApplicationServiceTests`
- Queries: `GetAllPersonsAsync`, `GetPersonByIdAsync` (found/not found), `SearchPersonsAsync`
- Create: valid command, invalid names (theory), duplicate throws `DuplicatePersonException`
- Update: valid command (verifies `EnsureUniqueAsync` called with `excludeId`), not found, duplicate
- Delete: existing person, not found

### `PersonsControllerTests`
- GET all → 200 with mapped DTOs
- GET by id → 200, 404
- POST → 201 Created, 409 Conflict, 400 Bad Request
- PUT → 204 No Content, 404, 409 Conflict
- DELETE → 204, 404

## Test strategy
- `PersonApplicationService` is tested with mocked `IPersonRepository` and `IPersonDomainService` — no real domain logic executes
- `PersonsController` is tested with a mocked `IPersonApplicationService` — verifies HTTP status code mapping only
- Both services depend on interfaces, enabling pure Moq isolation

## Key files
- `Services/PersonApplicationServiceTests.cs`
- `Controllers/PersonsControllerTests.cs`

## Commands
- `dotnet test Tests/FoTestApi.Application.Tests/FoTestApi.Application.Tests.csproj`

## Dependencies
- `xunit`, `Moq`
- Project references: `FoTestApi.Domain`, `FoTestApi.Application`
