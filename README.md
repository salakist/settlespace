# fo-test

A full-stack demonstration project showcasing Domain-Driven Design (DDD) with a C# REST API and a React TypeScript frontend.

---

## Tech Stack

### Backend
- **Framework:** ASP.NET Core 8.0 (Web API)
- **Language:** C# 12
- **Database:** MongoDB (local instance)
- **Authentication:** JWT bearer authentication backed by MongoDB persons
- **Documentation:** Swagger / OpenAPI (Swashbuckle)
- **Architecture:** Domain-Driven Design (DDD), separated into 3 .NET projects

### Frontend
- **Framework:** React 18 with TypeScript
- **HTTP Client:** Axios
- **UI Library:** Material UI (MUI) with dark mode
- **Build Tool:** Create React App
- **Access Control:** Login page with token persistence in local storage

---

## Solution Structure

```
fo-test/
├── FoTestApi.sln
├── FoTestApi.Domain/               # Domain layer — business rules and contracts
├── FoTestApi.Infrastructure/       # Infrastructure layer — MongoDB persistence
├── FoTestApi.Application/          # Application layer — API, controllers, commands
├── Tests/
│   ├── FoTestApi.Domain.Tests/         # Unit tests — Domain layer
│   ├── FoTestApi.Infrastructure.Tests/ # Unit tests — Infrastructure layer
│   └── FoTestApi.Application.Tests/    # Unit tests — Application layer
├── fotest-react/                   # React SPA frontend
├── AGENTS.md                       # Root agent index
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
├── Services/IPersonDomainService.cs
├── Services/PersonDomainService.cs
└── Exceptions/DuplicatePersonException.cs
```

#### Domain Rules

| Rule | Detail |
|------|--------|
| `FirstName` is required | Cannot be null or whitespace |
| `LastName` is required | Cannot be null or whitespace |
| `Password` is optional on creation | If not provided, a random strong password is auto-generated |
| `Password` preservation on update | When updating, if no password is provided, the existing password is preserved |
| Password strength | Must be at least 8 characters with uppercase, lowercase, digit, and special character |
| No duplicate persons | Two persons are duplicates if `FirstName` and `LastName` match case-insensitively |
| Duplicate check scope | Enforced on both **create** and **update** |
| Duplicate violation | Raises `DuplicatePersonException` → translated to HTTP `409 Conflict` |
| Weak password | Raises `WeakPasswordException` → translated to HTTP `400 Bad Request` |
| Equality method | `PersonEntity.MatchesByFullName(other)` – OrdinalIgnoreCase full-name comparison |

**Password Requirements** (if provided):
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)
- At least one special character: `!@#$%^&*()_+-=[]{}';:"\\|,.<>?`

**Auto-generated passwords** are 12+ characters and always meet all requirements.

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
├── Commands/        LoginCommand, CreatePersonCommand, UpdatePersonCommand, DeletePersonCommand
├── Controllers/     AuthController, PersonsController
├── DTOs/            LoginResponseDto, PersonDto
├── Services/        AuthService, IPersonApplicationService, PersonApplicationService
├── Program.cs
└── appsettings.json
```

`PersonApplicationService` orchestrates: validate entity → delegate duplicate check to `IPersonDomainService` → persist via repository.

`AuthService` authenticates against the MongoDB `persons` collection via `IPersonRepository`, and `AuthController` issues JWT tokens used by the React frontend.

---

## Unit Tests

Each DDD layer has a dedicated xUnit + Moq test project.

| Project | Tests | Scope |
|---|---|---|
| `FoTestApi.Domain.Tests` | 32 | `PersonEntity` rules, `PersonDomainService` uniqueness, password generation |
| `FoTestApi.Infrastructure.Tests` | 10 | `PersonRepository` CRUD via mocked `IMongoCollection<T>` |
| `FoTestApi.Application.Tests` | 36 | `PersonApplicationService` commands/queries, person-backed auth service/controller, `PersonsController` HTTP status codes |

### Run all tests

```bash
dotnet test FoTestApi.sln
```

### Run a single layer

```bash
dotnet test Tests/FoTestApi.Domain.Tests/FoTestApi.Domain.Tests.csproj
dotnet test Tests/FoTestApi.Infrastructure.Tests/FoTestApi.Infrastructure.Tests.csproj
dotnet test Tests/FoTestApi.Application.Tests/FoTestApi.Application.Tests.csproj
```

### Test isolation strategy
- **Domain tests** — no mocks; plain object instantiation
- **Infrastructure tests** — mock `IMongoCollection<T>` injected via `internal` constructor; no live MongoDB needed
- **Application tests** — mock `IPersonRepository` + `IPersonDomainService` for service tests; mock `IPersonApplicationService` for controller tests

---

## fotest-react

React SPA with login-gated access, full CRUD, search, and Material UI dark theme.

```
fotest-react/src/
+-- App.tsx           # App shell, auth gating, state management, dark ThemeProvider
+-- LoginPage.tsx     # Login screen for JWT-based access
+-- PersonForm.tsx    # Create / edit form
+-- PersonList.tsx    # Person cards with edit/delete actions
+-- SearchBar.tsx     # Case-insensitive search input
+-- api.ts            # Axios API calls, login, token storage helpers
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

### 3.1 Demo login credentials

- Username format: `firstName.lastName` (example: `john.doe`)
- Password: the password stored for that person

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
| POST | `/auth/login` | Authenticate and receive a JWT | `LoginCommand` | `200` LoginResponseDto, `401` |
| GET | `/persons` | Get all persons | none | `200` Array of PersonDto, `401` |
| GET | `/persons/{id}` | Get by ID | none | `200` PersonDto, `404`, `401` |
| GET | `/persons/search/{query}` | Search by name (case-insensitive) | none | `200` Array, `401` |
| POST | `/persons` | Create person | `CreatePersonCommand` | `201` PersonDto, `409` Conflict, `400`, `401` |
| PUT | `/persons/{id}` | Update person | `UpdatePersonCommand` | `204`, `404`, `409` Conflict, `400`, `401` |
| DELETE | `/persons/{id}` | Delete person | none | `204`, `404`, `401` |

All `/persons` endpoints require a bearer token returned by `/auth/login`.
The login endpoint validates credentials against MongoDB persons (`firstName.lastName` + person password), not appsettings.

### LoginCommand

```json
{
  "username": "john.doe",
  "password": "Strong@Pass1"
}
```

### LoginResponseDto

```json
{
  "token": "jwt-token",
  "username": "John.Doe",
  "expiresAtUtc": "2026-03-29T16:00:00Z"
}
```

### PersonDto

```json
{
  "id": "string",
  "firstName": "string",
  "lastName": "string",
  "password": "string"
}
```

### CreatePersonCommand / UpdatePersonCommand

```json
{
  "firstName": "string",
  "lastName": "string",
  "password": "string (optional, must meet strength requirements if provided)"
}
```

If `password` is omitted on creation, the API generates a strong password automatically.
If `password` is omitted on update, the API preserves the existing password.

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
  },
  "Auth": {
    "JwtKey": "fo-test-super-secret-jwt-key-2026-change-me",
    "Issuer": "FoTestApi",
    "Audience": "FoTestReact",
    "TokenExpirationMinutes": 60
  }
}
```
