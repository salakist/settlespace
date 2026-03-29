# FoTestApi.Infrastructure AGENTS Metadata

## Role
Infrastructure layer — owns all MongoDB persistence concerns.
Implements the `IPersonRepository` interface defined in the Domain project.

## Responsibilities
- Implement `PersonRepository` against MongoDB
- Register `BsonClassMap` for `PersonEntity` (keeping Domain persistence-agnostic)
- Hold `FoTestDatabaseSettings` configuration model
- Provide case-insensitive search and full-name duplicate detection via regex

## Key files
- `Repositories/PersonRepository.cs` — MongoDB implementation of `IPersonRepository`
- `FoTestDatabaseSettings.cs` — connection string, database name, collection name config

## Dependency direction
- References: `FoTestApi.Domain`
- Must NOT be referenced by `FoTestApi.Domain`

## Commands
- `dotnet build FoTestApi.Infrastructure/FoTestApi.Infrastructure.csproj`

## NuGet packages
- `MongoDB.Driver`
- `Microsoft.Extensions.Options`
