# FoTestApi.Infrastructure AGENTS Metadata

## Role
Infrastructure layer — owns all MongoDB persistence concerns.
Implements the `IPersonRepository` interface defined in the Domain project.

## Responsibilities
- Implement `PersonRepository` against MongoDB
- Implement `TransactionRepository` against MongoDB in a dedicated `transactions` collection
- Register `BsonClassMap` for `PersonEntity` and `Address` (keeping Domain persistence-agnostic)
- Register `BsonClassMap` for `TransactionEntity` and `TransactionStatus`
- Serialize `DateOnly` as ISO `YYYY-MM-DD` strings in MongoDB
- Hold `FoTestDatabaseSettings` configuration model
- Provide case-insensitive search and full-name duplicate detection via regex
- Expose an `internal` test constructor on `PersonRepository` for unit testing without a live database

## Key files
- `Repositories/PersonRepository.cs` — MongoDB implementation of `IPersonRepository`
- `Repositories/TransactionRepository.cs` — MongoDB implementation of `ITransactionRepository`
- `Serialization/DateOnlyAsStringSerializer.cs` — DateOnly BSON serializer used by repository class maps
- `FoTestDatabaseSettings.cs` — connection string, database name, and collection names config

## Testability
- `PersonRepository` has an `internal PersonRepository(IMongoCollection<PersonEntity>)` constructor
- `FoTestApi.Infrastructure.Tests` is listed in `InternalsVisibleTo` so tests can inject a mock collection
- Tests mock `IMongoCollection<T>` and `IAsyncCursor<T>` — no live MongoDB required

## Dependency direction
- References: `FoTestApi.Domain`
- Must NOT be referenced by `FoTestApi.Domain`

## Commands
- `dotnet build FoTestApi.Infrastructure/FoTestApi.Infrastructure.csproj`
- `dotnet test FoTestApi.Infrastructure.Tests/FoTestApi.Infrastructure.Tests.csproj`

## NuGet packages
- `MongoDB.Driver`
- `Microsoft.Extensions.Options`
