# AGENTS Index

This repository defines nested agent metadata to describe project-level and sub-project agent responsibilities.

## Solution structure

```
FoTestApi.sln
├── FoTestApi.Domain/               — domain layer (entities, rules, repository interfaces, domain service)
├── FoTestApi.Infrastructure/       — infrastructure layer (MongoDB, settings)
├── FoTestApi.Application/          — application layer (commands, services, API controllers)
├── Tests/
│   ├── FoTestApi.Domain.Tests/         — unit tests for the Domain layer
│   ├── FoTestApi.Infrastructure.Tests/ — unit tests for the Infrastructure layer
│   └── FoTestApi.Application.Tests/    — unit tests for the Application layer
└── fotest-react/                   — frontend SPA (React + TypeScript + Material UI)
```

## Sub-agent files
- `FoTestApi.Domain/AGENTS.md` — domain rules, entities, exceptions, domain service interface
- `FoTestApi.Infrastructure/AGENTS.md` — MongoDB persistence, BsonClassMap configuration
- `FoTestApi.Application/AGENTS.md` — application service, commands, REST controllers
- `fotest-react/AGENTS.md` — frontend SPA implementation and UI behavior
- `Tests/FoTestApi.Domain.Tests/AGENTS.md` — domain test scope and strategy
- `Tests/FoTestApi.Infrastructure.Tests/AGENTS.md` — infrastructure repository test scope and strategy
- `Tests/FoTestApi.Application.Tests/AGENTS.md` — application/controller/auth/middleware test scope and strategy

## Testing
Each production layer has a corresponding xUnit + Moq test project:
- `FoTestApi.Domain.Tests/` — pure unit tests, no mocking needed
- `FoTestApi.Infrastructure.Tests/` — mocks `IMongoCollection<T>` via internal test constructor
- `FoTestApi.Application.Tests/` — mocks `IPersonRepository` and `IPersonDomainService` for strict isolation

Run all tests: `dotnet test FoTestApi.sln`
- Test projects live under `Tests/` to keep them separate from production projects.

## Purpose
Maintain clear per-module guidelines for AI-assisted development and handoff.
