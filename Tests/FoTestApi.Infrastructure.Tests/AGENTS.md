# FoTestApi.Infrastructure.Tests AGENTS Metadata

## Role
Unit test project for the Infrastructure layer. Tests `PersonRepository` without a live MongoDB instance.

## Test coverage
- `PersonRepositoryTests` — all repository methods: `GetAllAsync`, `GetByIdAsync`, `SearchAsync` (empty and non-empty query), `FindByFullNameAsync`, `AddAsync`, `UpdateAsync`, `DeleteAsync`

## Test strategy
- Uses the `internal PersonRepository(IMongoCollection<PersonEntity>)` constructor to inject a mock collection
- `IMongoCollection<T>` is mocked via Moq; `IAsyncCursor<T>` is mocked to simulate MongoDB query results
- `InternalsVisibleTo` is declared in `FoTestApi.Infrastructure.csproj` to enable access to the internal constructor

## Key files
- `Repositories/PersonRepositoryTests.cs`

## Commands
- `dotnet test Tests/FoTestApi.Infrastructure.Tests/FoTestApi.Infrastructure.Tests.csproj`

## Dependencies
- `xunit`, `Moq`, `MongoDB.Driver`
- Project references: `FoTestApi.Domain`, `FoTestApi.Infrastructure`
