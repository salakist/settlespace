# FoTestApi.Infrastructure.Tests AGENTS Metadata

## Role
Unit test project for the Infrastructure layer. Tests persistence and serialization behavior without requiring a live MongoDB instance.

## Responsibilities
- Keep repository, serializer, and infrastructure-settings guidance local to the infrastructure test project.
- Verify Mongo-backed repository behavior using isolated mocks instead of live database dependencies.
- Keep serializer and configuration-model coverage close to the infrastructure layer.

## Test coverage
- `PersonRepositoryTests` / `TransactionRepositoryTests` — repository CRUD and query behavior using mocked Mongo collection/cursor abstractions
- `DateOnlyAsStringSerializerTests` — BSON string serialization/deserialization for `DateOnly` and invalid-type rejection
- `FoTestDatabaseSettingsTests` — configuration model property coverage

## Test strategy
- Repository tests inject mocked `IMongoCollection<T>` and `IAsyncCursor<T>` instances through the internal test constructor.
- `InternalsVisibleTo` in `FoTestApi.Infrastructure.csproj` enables direct testing of the repository constructor surface used for isolation.
- Serializer and settings tests exercise the real implementation directly.

## Key files
- `Persons/PersonRepositoryTests.cs`
- `Transactions/TransactionRepositoryTests.cs`
- `Serialization/DateOnlyAsStringSerializerTests.cs`
- `FoTestDatabaseSettingsTests.cs`

## Commands
- `dotnet test Tests/FoTestApi.Infrastructure.Tests/FoTestApi.Infrastructure.Tests.csproj`

## Dependencies
- `xunit`, `Moq`, `MongoDB.Driver`
- Project references: `FoTestApi.Domain`, `FoTestApi.Infrastructure`

## Source-of-truth note
Shared test artifact and gitignore policy are documented in `Tests/AGENTS.md`.
Infrastructure behavior under test is documented in the nearest `FoTestApi.Infrastructure/*/AGENTS.md` files.
