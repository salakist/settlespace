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
- **Routing:** React Router with browser history support (`/login`, `/register`, `/home`, `/persons`, `/transactions`, `/debts`, `/profile`)
- **HTTP Client:** Axios
- **UI Library:** Material UI (MUI) with dark mode
- **Build Tool:** Create React App
- **Access Control:** Login page with token persistence in local storage, public registration, and an authenticated profile page for personal data + password updates

---

## Solution Structure

```
fo-test/
├── FoTestApi.sln
├── FoTestApi.Domain/               # Domain layer — context-first (Auth, Persons, Transactions)
├── FoTestApi.Infrastructure/       # Infrastructure layer — context-first repositories + shared tech
├── FoTestApi.Application/          # Application layer — context-first API slices
├── Tests/
│   ├── FoTestApi.Domain.Tests/         # Mirrors Domain context/function structure
│   ├── FoTestApi.Infrastructure.Tests/ # Mirrors Infrastructure context/function structure
│   └── FoTestApi.Application.Tests/    # Mirrors Application context/function structure
├── fotest-react/                   # React SPA frontend
├── AGENTS.md                       # Root agent index
└── README.md
```

### Folder architecture policy

Summary for contributors (authoritative policy lives in `AGENTS.md` under "Folder architecture policy"):

1. Organize backend code as `Layer/Context/Function`.
2. Pick the business context first (`Authentication`, `Persons`, `Transactions`, etc.), then place files under `Layer/Context/...`.
3. Create a function subfolder (`Commands`, `Services`, `Mapping`, `Entities`, `Exceptions`) only when that context has multiple function groups.
4. If a context would otherwise contain only one function folder, flatten it and place files directly under the context.
5. Treat `Exceptions` as a function group and use an `Exceptions/` folder when the context has multiple function groups.
6. Keep test files in the matching test project with the same context/function shape as production.
7. Keep namespaces aligned with folder paths.
8. In Domain, entity class names must not use the `Entity` suffix (for example, `Person`, not `PersonEntity`).

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
├── Auth/
│   ├── IPasswordGenerator.cs
│   ├── IPasswordHashingService.cs
│   ├── IPasswordValidator.cs
│   ├── PasswordGenerator.cs
│   ├── PasswordHashingService.cs
│   └── PasswordValidator.cs
├── Persons/
│   ├── IPersonRepository.cs
│   ├── Entities/
│   │   ├── Address.cs
│   │   └── Person.cs
│   ├── Services/
│   │   ├── IPersonDomainService.cs
│   │   └── PersonDomainService.cs
│   └── Exceptions/
│       ├── DuplicatePersonException.cs
│       └── WeakPasswordException.cs
├── Transactions/
│   ├── ITransactionRepository.cs
│   ├── Entities/
│   │   ├── Transaction.cs
│   │   └── TransactionStatus.cs
│   ├── Services/
│   │   ├── ITransactionDomainService.cs
│   │   └── TransactionDomainService.cs
│   └── Exceptions/
│       ├── InvalidTransactionException.cs
│       ├── TransactionNotFoundException.cs
│       └── UnauthorizedTransactionAccessException.cs
└── Exceptions/DomainException.cs
```

#### Domain Rules

| Rule | Detail |
|------|--------|
| `FirstName` is required | Cannot be null or whitespace |
| `LastName` is required | Cannot be null or whitespace |
| `Password` is optional on creation | If not provided, a random strong password is auto-generated |
| Password updates are route-scoped | Password changes are only supported via `/auth/change-password` |
| Password strength policy | Passwords provided to create/register/change-password must be 8+ chars with uppercase, lowercase, digit, and special character |
| Contact details are optional | `PhoneNumber`, `Email`, `DateOfBirth`, and an address list may be stored per person |
| `PhoneNumber` validation | Optional; if provided must match `^(?=.*\d)[0-9+()\-.\s]{7,20}$` |
| `Email` validation | Optional; if provided must be a valid email address |
| `DateOfBirth` validation | Optional; if provided cannot be in the future |
| Address validation | Optional list; each address requires non-empty `Label`, `StreetLine1`, `City`, `Country`, and `PostalCode` matching `^[A-Za-z0-9\-\s]{3,12}$` |
| No duplicate persons | Two persons are duplicates if `FirstName` and `LastName` match case-insensitively |
| Duplicate check scope | Enforced on both **create** and **update** |
| Duplicate violation | Raises `DuplicatePersonException` → translated to HTTP `409 Conflict` |
| Weak password | Raises `WeakPasswordException` → translated to HTTP `400 Bad Request` |
| Transaction access scope | Create, get, and update require logged-user involvement as payer or payee |
| Transaction delete scope | Delete is restricted to the transaction creator |
| Equality method | `Person.MatchesByFullName(other)` – OrdinalIgnoreCase full-name comparison |

`IPasswordGenerator`/`PasswordGenerator` produces 12+ character passwords that satisfy the same strength policy.

---

### FoTestApi.Infrastructure

Persistence layer. Implements repository interfaces from the Domain and owns all MongoDB concerns.

```
FoTestApi.Infrastructure/
+-- Persons/PersonRepository.cs         # IPersonRepository implementation
+-- Transactions/TransactionRepository.cs # ITransactionRepository implementation
+-- Serialization/DateOnlyAsStringSerializer.cs # DateOnly BSON serializer
+-- FoTestDatabaseSettings.cs          # Connection/database config model
```

- MongoDB `BsonClassMap` is registered here, keeping `Person` free of Bson attributes
- `DateOnly` values are stored as ISO strings (`YYYY-MM-DD`) in MongoDB
- Search uses case-insensitive regex matching (`i` flag) for both `firstName` and `lastName`
- Duplicate detection queries MongoDB with anchored regex (`^name$` with `i` flag)

---

### FoTestApi.Application

Application layer and API host.

```
FoTestApi.Application/
├── Authentication/
│   ├── AuthController.cs
│   ├── AuthSettings.cs
│   ├── CustomClaimTypes.cs
│   ├── LoginResponseDto.cs
│   ├── Commands/
│   └── Services/
├── Persons/
│   ├── PersonsController.cs
│   ├── Commands/
│   ├── DTOs/
│   ├── Mapping/
│   └── Services/
├── Transactions/
│   ├── TransactionsController.cs
│   ├── TransactionDto.cs
│   ├── Commands/
│   ├── Mapping/
│   └── Services/
├── Middleware/ExceptionHandlingMiddleware.cs
├── Program.cs
└── appsettings.json
```

`PersonMapper` isolates mapping responsibilities (command → domain and domain → DTO).

`PersonApplicationService` orchestrates: map command → validate entity → delegate duplicate check to `IPersonDomainService` → persist via repository.

`AuthService` authenticates against the MongoDB `persons` collection via `IPersonRepository`, issues JWT tokens used by the React frontend, and stores a stable person id claim so profile and password operations keep working even after first/last name changes.

`TransactionsController` and `TransactionApplicationService` expose user-scoped transaction CRUD with a dedicated MongoDB `transactions` collection.

---

## Unit Tests

Each DDD layer has a dedicated xUnit + Moq test project.

| Project | Scope |
|---|---|
| `FoTestApi.Domain.Tests` | `Person` rules, optional profile field validation, `PersonDomainService` uniqueness, password generation |
| `FoTestApi.Infrastructure.Tests` | `PersonRepository` CRUD via mocked `IMongoCollection<T>` |
| `FoTestApi.Application.Tests` | `PersonApplicationService` commands/queries, person-backed auth service/controller, `PersonsController` HTTP status codes and authenticated `me` endpoints |

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
- **Application tests** — mock `IPersonRepository` + `IPersonDomainService` + `IPasswordHashingService` for service tests; mock `IPersonApplicationService` for controller tests

---

## Quality Gates

Policy precedence note:
- Commit workflow requirements and skip rules are authoritative in `AGENTS.md`.
- Script behavior, gate intent, and wrapper policy are authoritative in `scripts/AGENTS.md`.
- This section is a user-facing runbook summary.

Practical note: for a documentation-only commit, both workflow steps may be `SKIPPED` when `AGENTS.md` skip conditions are satisfied (including showing the latest successful Step 1 log path).

Two repository-level analysis modes are available:

1. `scripts/run-checks.ps1` / `scripts/run-checks.sh`
  - changed-code gate
  - base changed-code gate implementation (also used by git hooks)
2. `scripts/run-full-checks.ps1` / `scripts/run-full-checks.sh`
  - full-base gate
  - base full-base gate implementation
3. `scripts/run-checks-debug.ps1` / `scripts/run-checks-debug.sh`
  - changed-code gate with forced log capture
  - recommended entry point for automation and agent sessions
4. `scripts/run-full-checks-debug.ps1` / `scripts/run-full-checks-debug.sh`
  - full-base gate with forced log capture
  - recommended entry point for automation and agent sessions when full-base analysis is requested

### Changed-code gate

- Builds the solution and blocks analyzer/compiler diagnostics that touch changed C# files
- Measures coverage only for changed production C# files
- Runs ESLint on changed frontend files
- Runs ESLint on changed repo JS/MJS script files under `scripts/`
- Measures coverage only for changed production frontend files

### Full-base gate

- Builds the full solution and blocks all analyzer/compiler diagnostics
- Measures coverage across the full production C# codebase
- Runs ESLint on the full frontend source tree
- Runs ESLint on the full repo JS/MJS script scope under `scripts/`
- Measures coverage across the full production frontend codebase

### Local analyzer tracks

- Backend C# analysis runs during `dotnet build` via Roslyn analyzers configured in `Directory.Build.props`
- Frontend React analysis runs through the existing `fotest-react` ESLint configuration
- Repo-script JS/MJS analysis runs through a separate ESLint configuration under `scripts/`

### Gate prerequisites

- Install frontend dependencies once: `cd fotest-react && npm install`
- Install repo-script lint dependencies once: `cd scripts && npm install`

### Coverage policy

- Coverage gates evaluate production implementation files, not test files
- Application startup wiring in `Program.cs` is treated as composition-root/bootstrap code and is excluded from the C# coverage calculation
- The build/analyzer gates still analyze `Program.cs`; only coverage excludes it

### Run the gates

```powershell
.\scripts\run-checks-debug.ps1
.\scripts\run-full-checks-debug.ps1
.\scripts\run-checks.ps1
.\scripts\run-full-checks.ps1
.\scripts\setup-hooks.ps1
```

```bash
sh scripts/run-checks-debug.sh
sh scripts/run-full-checks-debug.sh
sh scripts/run-checks.sh
sh scripts/run-full-checks.sh
sh scripts/setup-hooks.sh
```

### Troubleshooting opaque gate output

Use debug wrappers by default in automation and agent sessions.
If a terminal only shows an exit code and hides the gate failure details, these wrappers preserve full output.
They capture output to timestamped log files under `artifacts/logs/`.

```powershell
.\scripts\run-checks-debug.ps1
.\scripts\run-full-checks-debug.ps1
```

```bash
sh scripts/run-checks-debug.sh
sh scripts/run-full-checks-debug.sh
```

### Git hooks

- `pre-commit` calls the changed-code gate
- Do not bypass the hooks with `--no-verify`

### Verify hook installation

```powershell
Get-ChildItem .git\hooks\pre-commit
```

```bash
ls -l .git/hooks/pre-commit
```

If a hook is missing or does not match `scripts/hooks/`, re-run `setup-hooks`.

---

## fotest-react

React SPA with login-gated access, full CRUD, search, and Material UI dark theme.

```
fotest-react/src/
+-- app/
|   +-- App.tsx                     # App shell and route composition
|   +-- App.test.tsx                # App composition tests (hook contracts + shell rendering)
|   +-- App.integration.test.tsx    # App integration behavior tests (auth, directory, profile flows)
+-- features/
|   +-- auth/components/            # Login, registration, password change UI
|   +-- auth/hooks/                 # Auth/session hook (useAuth)
|   +-- persons/components/         # Person list, form, search, address editor
|   +-- persons/hooks/              # Persons domain hook (usePersons)
|   +-- profile/components/         # Authenticated profile page
|   +-- profile/hooks/              # Profile domain hook (useProfile)
+-- shared/
|   +-- api/api.ts                  # Axios API calls, login, token storage helpers
|   +-- types/index.ts              # Shared TypeScript interfaces
+-- styles/
|   +-- App.css
|   +-- index.css
+-- __mocks__/
|   +-- react-router-dom.tsx        # Test mock for router utilities
+-- index.tsx                       # React entry point
```

### Frontend architecture notes

- `App.tsx` now focuses on composition and routing, while feature logic lives in hooks.
- Domain hooks:
  - `useAuth` handles authentication/session transitions.
  - `usePersons` handles directory CRUD/search/form state.
  - `useTransactions` handles transaction CRUD/search/form state.
  - `useProfile` handles profile load/save/password flows.
- Routes are URL-driven and support browser back/forward navigation.
- Backend route generation is configured to lowercase URLs.

### Frontend commands

```bash
cd fotest-react
npm install
npm start
npm run test:ci
npx eslint src --ext .ts,.tsx --max-warnings=0
```

### Frontend coverage scope

- Coverage targets production files under `fotest-react/src/`
- Excluded from frontend coverage scope: `*.test.tsx`, `setupTests.ts`, `reportWebVitals.ts`, `index.tsx`, `react-app-env.d.ts`
- Repository gate scripts (`scripts/run-checks.*`, `scripts/run-full-checks.*`) are the source of truth for frontend quality validation

### Frontend test strategy

- `src/app/App.test.tsx` validates app composition and hook/component wiring contracts.
- `src/app/App.integration.test.tsx` validates integrated user flows with mocked feature UI controls.
- Hook-specific behavior is tested in dedicated files:
  - `src/features/auth/hooks/useAuth.test.tsx`
  - `src/features/persons/hooks/usePersons.test.tsx`
  - `src/features/profile/hooks/useProfile.test.tsx`

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

From the repository root (`fo-test`):

```bash
dotnet run --project FoTestApi.Application\FoTestApi.Application.csproj
```

If your terminal is one level above the repository (for example the VS Code workspace root is `Repos/`), use the repository-prefixed path instead:

```bash
dotnet run --project fo-test\FoTestApi.Application\FoTestApi.Application.csproj
```

Alternatively, change into the project directory first and run `dotnet run` there:

```bash
cd fo-test\FoTestApi.Application
dotnet run
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

### 5. Seed demo data manually

With the API running, you can populate persons and transactions with repeatable sample data.

```powershell
.\scripts\seed-dev-data.ps1
```

```bash
sh scripts/seed-dev-data.sh
```

---

## API Reference

Base URL: `http://localhost:5279/api`

| Method | Endpoint | Description | Body | Response |
|--------|----------|-------------|------|----------|
| POST | `/auth/login` | Authenticate and receive a JWT | `LoginCommand` | `200` LoginResponseDto, `401` |
| POST | `/auth/register` | Register a new person and automatically sign in | `RegisterCommand` | `200` LoginResponseDto, `400`, `409` |
| POST | `/auth/change-password` | Change password for the current authenticated user | `ChangePasswordCommand` | `204`, `400`, `401` |
| GET | `/persons` | Get all persons | none | `200` Array of PersonDto, `401` |
| GET | `/persons/me` | Get the authenticated person's profile | none | `200` PersonDto, `401`, `404` |
| GET | `/persons/{id}` | Get by ID | none | `200` PersonDto, `404`, `401` |
| GET | `/persons/search/{query}` | Search by name (case-insensitive) | none | `200` Array, `401` |
| POST | `/persons` | Create person | `CreatePersonCommand` | `201` PersonDto, `409` Conflict, `400`, `401` |
| PUT | `/persons/me` | Update the authenticated person's profile | `UpdatePersonCommand` | `204`, `400`, `401`, `404`, `409` |
| PUT | `/persons/{id}` | Update person | `UpdatePersonCommand` | `204`, `404`, `409` Conflict, `400`, `401` |
| DELETE | `/persons/{id}` | Delete person | none | `204`, `404`, `401` |
| GET | `/transactions/me` | Get transactions where current user is payer or payee | none | `200` Array of TransactionDto, `401` |
| GET | `/transactions/me/search/{query}` | Search current-user transactions by description/category | none | `200` Array, `401` |
| GET | `/transactions/{id}` | Get transaction by ID (must be involved) | none | `200` TransactionDto, `401`, `403`, `404` |
| POST | `/transactions` | Create transaction (current user must be payer or payee) | `CreateTransactionCommand` | `201` TransactionDto, `400`, `401`, `403` |
| PUT | `/transactions/{id}` | Update transaction (must be involved) | `UpdateTransactionCommand` | `204`, `400`, `401`, `403`, `404` |
| DELETE | `/transactions/{id}` | Delete transaction (creator only) | none | `204`, `401`, `403`, `404` |

All `/persons` endpoints require a bearer token returned by `/auth/login`.
The login endpoint validates credentials against MongoDB persons (`firstName.lastName` + person password), not appsettings.
Passwords are stored as PBKDF2 hashes. If an older plaintext password is encountered, it is upgraded to a hash on the next successful login.

`DateOfBirth` is represented as `DateOnly` in backend contracts and exchanged as `YYYY-MM-DD` JSON values.

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

### RegisterCommand

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "password": "Strong@Pass1",
  "phoneNumber": "+33 6 12 34 56 78",
  "email": "john.doe@example.com",
  "dateOfBirth": "1990-05-02",
  "addresses": [
    {
      "label": "Home",
      "streetLine1": "1 Main Street",
      "streetLine2": "Apartment 4B",
      "postalCode": "75001",
      "city": "Paris",
      "stateOrRegion": "Ile-de-France",
      "country": "France"
    }
  ]
}
```

`/auth/register` is public and returns a valid JWT response so the user is logged in immediately after registration.

### ChangePasswordCommand

```json
{
  "currentPassword": "Strong@Pass1",
  "newPassword": "NewStrong@Pass2"
}
```

`/auth/change-password` requires a valid bearer token and changes the password of the currently authenticated user.
Frontend users can access this action from the authenticated profile page.

### PersonDto

```json
{
  "id": "string",
  "firstName": "string",
  "lastName": "string",
  "phoneNumber": "string | null",
  "email": "string | null",
  "dateOfBirth": "YYYY-MM-DD | null",
  "addresses": [
    {
      "label": "Home",
      "streetLine1": "string",
      "streetLine2": "string | null",
      "postalCode": "string",
      "city": "string",
      "stateOrRegion": "string | null",
      "country": "string"
    }
  ]
}
```

### CreatePersonCommand

```json
{
  "firstName": "string",
  "lastName": "string",
  "password": "string (optional, must meet strength requirements if provided)",
  "phoneNumber": "string (optional)",
  "email": "string (optional)",
  "dateOfBirth": "YYYY-MM-DD (optional)",
  "addresses": [
    {
      "label": "string",
      "streetLine1": "string",
      "streetLine2": "string (optional)",
      "postalCode": "string",
      "city": "string",
      "stateOrRegion": "string (optional)",
      "country": "string"
    }
  ]
}
```

### UpdatePersonCommand

```json
{
  "firstName": "string",
  "lastName": "string",
  "phoneNumber": "string (optional)",
  "email": "string (optional)",
  "dateOfBirth": "YYYY-MM-DD (optional)",
  "addresses": [
    {
      "label": "string",
      "streetLine1": "string",
      "streetLine2": "string (optional)",
      "postalCode": "string",
      "city": "string",
      "stateOrRegion": "string (optional)",
      "country": "string"
    }
  ]
}
```

If `password` is omitted on creation, the API generates a strong password automatically.
Provided create/register passwords are validated before being hashed for storage.
`UpdatePersonCommand` does not accept a password field; use `/auth/change-password` instead.
`UpdatePersonCommand` also does not carry an `id`; the id comes from route (`/persons/{id}`) or auth claim (`/persons/me`).
When a person edits their own profile, the frontend uses `/persons/me`; administrative CRUD continues to use `/persons/{id}`.

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

`FoTestApi.Application/appsettings.json`:

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
