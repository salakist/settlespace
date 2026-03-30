# FoTestApi.Infrastructure AGENTS Metadata

## Role
Infrastructure layer — owns all MongoDB persistence concerns.
Implements the `IPersonRepository` interface defined in the Domain project.

## Folder structure
Infrastructure uses context-first folders for repositories:
- `Persons/` — person persistence
- `Transactions/` — transaction persistence

Shared technical concerns remain at layer scope (for example `Serialization/` and `FoTestDatabaseSettings.cs`).

## Responsibilities
- Implement `PersonRepository` against MongoDB
- Implement `TransactionRepository` against MongoDB in a dedicated `transactions` collection
- Register `BsonClassMap` for `Person` and `Address` (keeping Domain persistence-agnostic)
- Register `BsonClassMap` for `Transaction` and `TransactionStatus`
- Serialize `DateOnly` as ISO `YYYY-MM-DD` strings in MongoDB
- Hold `FoTestDatabaseSettings` configuration model
- Provide case-insensitive search and full-name duplicate detection via regex
- Expose an `internal` test constructor on `PersonRepository` for unit testing without a live database

## Key files
- `Persons/PersonRepository.cs` — MongoDB implementation of `IPersonRepository`
- `Transactions/TransactionRepository.cs` — MongoDB implementation of `ITransactionRepository`
- `Serialization/DateOnlyAsStringSerializer.cs` — DateOnly BSON serializer used by repository class maps
- `FoTestDatabaseSettings.cs` — connection string, database name, and collection names config

## Testability
- `PersonRepository` has an `internal PersonRepository(IMongoCollection<Person>)` constructor
- `FoTestApi.Infrastructure.Tests` is listed in `InternalsVisibleTo` so tests can inject a mock collection
- Tests mock `IMongoCollection<T>` and `IAsyncCursor<T>` — no live MongoDB required

## Dependency direction
- References: `FoTestApi.Domain`
- Must NOT be referenced by `FoTestApi.Domain`

## Commands
- `dotnet build FoTestApi.Infrastructure/FoTestApi.Infrastructure.csproj`
- `dotnet test FoTestApi.Infrastructure.Tests/FoTestApi.Infrastructure.Tests.csproj`

## Build/Test Artifact Inventory
- Common .NET build outputs in this module: `FoTestApi.Infrastructure/bin/` and `FoTestApi.Infrastructure/obj/`.
- Related test-project outputs: `Tests/FoTestApi.Infrastructure.Tests/bin/`, `Tests/FoTestApi.Infrastructure.Tests/obj/`, and `Tests/FoTestApi.Infrastructure.Tests/artifacts/`.
- Repository quality-gate logs and coverage aggregates: `artifacts/logs/` and `artifacts/coverage/`.

## Gitignore ownership
- Root `.gitignore` is authoritative for shared artifacts (`bin/`, `obj/`, `node_modules/`, generic logs, repository `artifacts/`, and `Tests/**/artifacts/`).
- Infrastructure has no module-local `.gitignore`; keep shared patterns managed at repository root.
- For artifact read/cleanup requests, inspect module outputs plus the related Infrastructure test-project artifact paths.

## NuGet packages
- `MongoDB.Driver`
- `Microsoft.Extensions.Options`
