# fo-test

A full-stack demonstration project showcasing Domain-Driven Design (DDD) with a C# REST API and a React TypeScript frontend.

---

## Tech Stack

### Backend
- **Framework:** ASP.NET Core 8.0 (Web API)
- **Language:** C# 12
- **Database:** MongoDB (local instance)
- **Documentation:** Swagger / OpenAPI (Swashbuckle)
- **Architecture:** Domain-Driven Design (DDD), separated into 3 .NET projects

### Frontend
- **Framework:** React 18 with TypeScript
- **HTTP Client:** Axios
- **UI Library:** Material UI (MUI) with dark mode
- **Build Tool:** Create React App

---

## Solution Structure

```
fo-test/
├── FoTestApi.sln
├── FoTestApi.Domain/           # Domain layer — business rules and contracts
├── FoTestApi.Infrastructure/   # Infrastructure layer — MongoDB persistence
├── FoTestApi.Application/      # Application layer — API, controllers, commands
├── fotest-react/               # React SPA frontend
├── AGENTS.md                   # Root agent index
└── README.md
```

### Dependency direction

```
FoTestApi.Application  ──►  FoTestApi.Infrastructure  ──►  FoTestApi.Domain
FoTestApi.Application  ──►  FoTestApi.Domain
```

The Domain layer has **no external dependencies** by design.

---

## Project Details

### FoTestApi.Domain

Pure domain layer. No NuGet packages. No infrastructure coupling.

```
FoTestApi.Domain/
├── Entities/PersonEntity.cs
├── Repositories/IPersonRepository.cs
├── Services/PersonDomainService.cs
└── Exceptions/DuplicatePersonException.cs
```

#### Domain Rules

| Rule | Detail |
|------|--------|
| `FirstName` is required | Cannot be null or whitespace |
| `LastName` is required | Cannot be null or whitespace |
| No duplicate persons | Two persons are duplicates if `FirstName` and `LastName` match case-insensitively |
| Duplicate check scope | Enforced on both **create** and **update** |
| Duplicate violation | Raises `DuplicatePersonException` ? translated to HTTP `409 Conflict` |
| Equality method | `PersonEntity.MatchesByFullName(other)` � OrdinalIgnoreCase full-name comparison |

---

### FoTestApi.Infrastructure

Persistence layer. Implements repository interfaces from the Domain and owns all MongoDB concerns.

```
FoTestApi.Infrastructure/
+-- Repositories/PersonRepository.cs   # IPersonRepository implementation
+-- FoTestDatabaseSettings.cs          # Connection/database config model
```

- MongoDB `BsonClassMap` is registered here, keeping `PersonEntity` free of Bson attributes
- Search uses case-insensitive regex matching (`i` flag) for both `firstName` and `lastName`
- Duplicate detection queries MongoDB with anchored regex (`^name$` with `i` flag)

---

### FoTestApi.Application

Application layer and API host.

```
FoTestApi.Application/
├── Commands/        CreatePersonCommand, UpdatePersonCommand, DeletePersonCommand
├── Controllers/     PersonsController
├── DTOs/            PersonDto
├── Services/        PersonApplicationService
├── Program.cs
└── appsettings.json
```

`PersonApplicationService` orchestrates: validate entity → delegate duplicate check to `PersonDomainService` → persist via repository.

---

### fotest-react

React SPA with full CRUD, search, and Material UI dark theme.

```
fotest-react/src/
+-- App.tsx           # App shell, state management, dark ThemeProvider
+-- PersonForm.tsx    # Create / edit form
+-- PersonList.tsx    # Person cards with edit/delete actions
+-- SearchBar.tsx     # Case-insensitive search input
+-- api.ts            # Axios API calls
+-- types.ts          # TypeScript interfaces
```

---

## Prerequisites

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) running on `localhost:27017`
- [Node.js](https://nodejs.org/) (for the frontend)

---

## Setup & Running

### 1. Clone

```bash
git clone https://github.com/salakist/fo-test.git
cd fo-test
```

### 2. Start MongoDB

```bash
mongod --dbpath "C:\data\db"
```

### 3. Run the API

```bash
dotnet run --project FoTestApi.Application\FoTestApi.Application.csproj
```

API starts on `http://localhost:5279`.

### 4. Run the Frontend

```bash
cd fotest-react
npm install
npm start
```

Frontend starts on `http://localhost:3000`.

---

## API Reference

Base URL: `http://localhost:5279/api`

| Method | Endpoint | Description | Body | Response |
|--------|----------|-------------|------|----------|
| GET | `/persons` | Get all persons | � | `200` Array of PersonDto |
| GET | `/persons/{id}` | Get by ID | � | `200` PersonDto, `404` |
| GET | `/persons/search/{query}` | Search by name (case-insensitive) | � | `200` Array |
| POST | `/persons` | Create person | `CreatePersonCommand` | `201` PersonDto, `409` Conflict |
| PUT | `/persons/{id}` | Update person | `UpdatePersonCommand` | `204`, `404`, `409` Conflict |
| DELETE | `/persons/{id}` | Delete person | � | `204`, `404` |

### PersonDto

```json
{
  "id": "string",
  "firstName": "string",
  "lastName": "string"
}
```

### CreatePersonCommand / UpdatePersonCommand

```json
{
  "firstName": "string",
  "lastName": "string"
}
```

### Error response (409 Conflict)

```json
{
  "error": "A person with first name 'John' and last name 'Doe' already exists."
}
```

---

## Swagger UI

Navigate to `http://localhost:5279/swagger` for interactive documentation.

---

## Configuration

`FoTestApi/appsettings.json`:

```json
{
  "FoTestDatabase": {
    "ConnectionString": "mongodb://localhost:27017",
    "DatabaseName": "fo-test",
    "PersonsCollectionName": "persons"
  }
}
```
