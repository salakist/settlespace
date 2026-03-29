# AGENTS Index

This repository defines nested agent metadata to describe project-level and sub-project agent responsibilities.

## Solution structure

```
fo-test.sln
├── FoTestApi.Domain/      — domain layer (entities, rules, repository interfaces)
├── FoTestApi.Infrastructure/ — infrastructure layer (MongoDB, settings)
├── FoTestApi/             — application layer (commands, services, API controllers)
└── fotest-react/          — frontend SPA (React + TypeScript + Material UI)
```

## Sub-agent files
- `FoTestApi.Domain/AGENTS.md` — domain rules, entities, exceptions
- `FoTestApi.Infrastructure/AGENTS.md` — MongoDB persistence, BsonClassMap configuration
- `FoTestApi/AGENTS.md` — application service, commands, REST controllers
- `fotest-react/AGENTS.md` — frontend SPA implementation and UI behavior

## Purpose
Maintain clear per-module guidelines for AI-assisted development and handoff.
