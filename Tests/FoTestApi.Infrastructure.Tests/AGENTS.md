# FoTestApi.Infrastructure.Tests AGENTS Metadata

## Role
Unit test project for the Infrastructure layer. Tests `PersonRepository` without a live MongoDB instance.

## Test coverage
- `PersonRepositoryTests` — all repository methods: `GetAllAsync`, `GetByIdAsync`, `SearchAsync` (empty and non-empty query), `FindByFullNameAsync`, `AddAsync`, `UpdateAsync`, `DeleteAsync`
- `DateOnlyAsStringSerializerTests` — BSON string serialization/deserialization for `DateOnly` values and invalid BSON type rejection
- `FoTestDatabaseSettingsTests` — configuration model property coverage

## Test strategy
- Uses the `internal PersonRepository(IMongoCollection<Person>)` constructor to inject a mock collection
- `IMongoCollection<T>` is mocked via Moq; `IAsyncCursor<T>` is mocked to simulate MongoDB query results
- `InternalsVisibleTo` is declared in `FoTestApi.Infrastructure.csproj` to enable access to the internal constructor

## Key files
- `Persons/PersonRepositoryTests.cs`
- `Transactions/TransactionRepositoryTests.cs`
- `Serialization/DateOnlyAsStringSerializerTests.cs`
- `FoTestDatabaseSettingsTests.cs`

## Commands
- `dotnet test Tests/FoTestApi.Infrastructure.Tests/FoTestApi.Infrastructure.Tests.csproj`

## Build/Test Artifact Inventory
- Project-local test artifacts: `Tests/FoTestApi.Infrastructure.Tests/artifacts/`.
- Project-local build outputs: `Tests/FoTestApi.Infrastructure.Tests/bin/` and `Tests/FoTestApi.Infrastructure.Tests/obj/`.
- Repository-level quality-gate logs and coverage aggregates: `artifacts/logs/` and `artifacts/coverage/`.

## Gitignore ownership
- Root `.gitignore` is authoritative for shared `bin/`, `obj/`, and `Tests/**/artifacts/` patterns.
- For cleanup/read requests, inspect this test project folder plus repository `artifacts/` outputs.

## Dependencies
- `xunit`, `Moq`, `MongoDB.Driver`
- Project references: `FoTestApi.Domain`, `FoTestApi.Infrastructure`
