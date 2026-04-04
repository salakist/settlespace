# SettleSpace

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

```text
settlespace/
|-- SettleSpace.sln
|-- SettleSpace.Domain/               # Domain layer - business rules and contracts
|-- SettleSpace.Infrastructure/       # Infrastructure layer - MongoDB persistence
|-- SettleSpace.Application/          # Application layer - API, controllers, commands
|-- Tests/
|   |-- SettleSpace.Domain.Tests/         # Unit tests - Domain layer
|   |-- SettleSpace.Infrastructure.Tests/ # Unit tests - Infrastructure layer
|   `-- SettleSpace.Application.Tests/    # Unit tests - Application layer
|-- settlespace-react/                   # React SPA frontend
|-- bruno/                              # Bruno collection(s) for manual API exploration
|-- AGENTS.md                           # Root agent index
`-- README.md
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

```text
SettleSpace.Application  -->  SettleSpace.Infrastructure  -->  SettleSpace.Domain
SettleSpace.Application  -->  SettleSpace.Domain
```

The Domain layer has **no external dependencies** by design.

---

## Project Details

### SettleSpace.Domain

Pure domain layer. No NuGet packages. No infrastructure coupling.

```text
SettleSpace.Domain/
|-- Auth/
|   |-- IPasswordGenerator.cs
|   |-- IPasswordHashingService.cs
|   |-- IPasswordValidator.cs
|   |-- PasswordGenerator.cs
|   |-- PasswordHashingService.cs
|   `-- PasswordValidator.cs
|-- Persons/
|   |-- IPersonRepository.cs
|   |-- Entities/
|   |   |-- Address.cs
|   |   `-- Person.cs
|   |-- Services/
|   |   |-- IPersonDomainService.cs
|   |   `-- PersonDomainService.cs
|   `-- Exceptions/
|       |-- DuplicatePersonException.cs
|       `-- WeakPasswordException.cs
|-- Transactions/
|   |-- ITransactionRepository.cs
|   |-- Entities/
|   |   |-- Transaction.cs
|   |   `-- TransactionStatus.cs
|   |-- Services/
|   |   |-- ITransactionDomainService.cs
|   |   `-- TransactionDomainService.cs
|   `-- Exceptions/
|       |-- InvalidTransactionException.cs
|       |-- TransactionNotFoundException.cs
|       `-- UnauthorizedTransactionAccessException.cs
`-- Exceptions/DomainException.cs
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
| Role model | Every person has a role: `ADMIN`, `USER`, or `MANAGER` |
| Default role | New persons default to `USER`; bootstrap rule: first registered account is `ADMIN` when no accounts exist |
| No duplicate persons | Two persons are duplicates if `FirstName` and `LastName` match case-insensitively |
| Duplicate check scope | Enforced on both **create** and **update** |
| Duplicate violation | Raises `DuplicatePersonException` -> translated to HTTP `409 Conflict` |
| Weak password | Raises `WeakPasswordException` -> translated to HTTP `400 Bad Request` |
| Persons management scope | `USER` cannot create/update/delete persons; `MANAGER` can create/update/delete only `USER` accounts and cannot change roles; `ADMIN` is unrestricted |
| Self role mutation | A person cannot change their own role |
| Transaction create scope | `USER` can create only when involved; `MANAGER` and `ADMIN` can create without involvement |
| Transaction read scope | `USER`: involved transactions only; `MANAGER`: involved + created transactions; `ADMIN`: unrestricted |
| Transaction update/delete scope | `USER` and `MANAGER`: creator-only; `ADMIN`: unrestricted |
| Debt computation source | Debts are derived from existing transactions; the MVP does not persist a separate debt record |
| Debt status inclusion | Only `Completed` transactions count toward debt balances; `Pending` and `Cancelled` are excluded |
| Debt currency handling | Net balances are computed per counterparty and per currency; different currencies are not merged |
| Debt settlement model | Settling a debt creates a compensating `Completed` transaction, typically categorized as `Settlement` |
| Equality method | `Person.MatchesByFullName(other)` - OrdinalIgnoreCase full-name comparison |

#### Debt computation rules

- Debt balances are a **net projection** of visible transactions between two persons.
- If the authenticated user paid more for the counterparty than vice versa, the result is **`TheyOweYou`**.
- If the counterparty paid more for the authenticated user, the result is **`YouOweThem`**.
- A zero net balance is treated as **settled**.
- Settlement requests are applied by writing a compensating transaction rather than mutating prior transaction history.

`IPasswordGenerator`/`PasswordGenerator` produces 12+ character passwords that satisfy the same strength policy.

---

### SettleSpace.Infrastructure

Persistence layer. Implements repository interfaces from the Domain and owns all MongoDB concerns.

```
SettleSpace.Infrastructure/
+-- Persons/PersonRepository.cs         # IPersonRepository implementation
+-- Transactions/TransactionRepository.cs # ITransactionRepository implementation
+-- Serialization/DateOnlyAsStringSerializer.cs # DateOnly BSON serializer
+-- SettleSpaceDatabaseSettings.cs          # Connection/database config model
```

- MongoDB `BsonClassMap` is registered here, keeping `Person` free of Bson attributes
- `DateOnly` values are stored as ISO strings (`YYYY-MM-DD`) in MongoDB
- Search uses case-insensitive regex matching (`i` flag) for both `firstName` and `lastName`
- Duplicate detection queries MongoDB with anchored regex (`^name$` with `i` flag)

---

### SettleSpace.Application

Application layer and API host.

```text
SettleSpace.Application/
|-- Authentication/
|   |-- AuthController.cs
|   |-- AuthSettings.cs
|   |-- CustomClaimTypes.cs
|   |-- LoginResponseDto.cs
|   |-- Commands/
|   `-- Services/
|-- Persons/
|   |-- PersonsController.cs
|   |-- Commands/
|   |-- DTOs/
|   |-- Mapping/
|   `-- Services/
|-- Transactions/
|   |-- TransactionsController.cs
|   |-- TransactionDto.cs
|   |-- Commands/
|   |-- Mapping/
|   `-- Services/
|-- Middleware/ExceptionHandlingMiddleware.cs
|-- Program.cs
`-- appsettings.json
```

`PersonMapper` isolates mapping responsibilities (command -> domain and domain -> DTO).

`PersonApplicationService` orchestrates: map command -> validate entity -> delegate duplicate check to `IPersonDomainService` -> persist via repository.

`AuthService` authenticates against the MongoDB `persons` collection via `IPersonRepository`, issues JWT tokens used by the React frontend, and stores a stable person id claim so profile and password operations keep working even after first/last name changes.

`TransactionsController` and `TransactionApplicationService` expose user-scoped transaction CRUD with a dedicated MongoDB `transactions` collection.

`DebtsController` and `DebtApplicationService` expose authenticated debt summary and settlement endpoints derived from the existing `transactions` collection. The backend currently supports:
- `GET /api/debts/me` - net balances for the current user by counterparty and currency
- `GET /api/debts/me/{counterpartyPersonId}` - detailed pair summary plus contributing transactions
- `POST /api/debts/settlements` - create a compensating settlement transaction to reduce an outstanding balance

---

## Unit Tests

Each DDD layer has a dedicated xUnit + Moq test project.

| Project | Scope |
|---|---|
| `SettleSpace.Domain.Tests` | `Person` rules, optional profile field validation, `PersonDomainService` uniqueness, password generation, and `DebtDomainService` netting/settlement rules |
| `SettleSpace.Infrastructure.Tests` | `PersonRepository` CRUD via mocked `IMongoCollection<T>` |
| `SettleSpace.Application.Tests` | `PersonApplicationService` commands/queries, person-backed auth service/controller, `PersonsController` HTTP status codes and authenticated `me` endpoints, plus `DebtApplicationService` / `DebtsController` behavior |

### Run all tests

```bash
dotnet test SettleSpace.sln
```

### Run a single layer

```bash
dotnet test Tests/SettleSpace.Domain.Tests/SettleSpace.Domain.Tests.csproj
dotnet test Tests/SettleSpace.Infrastructure.Tests/SettleSpace.Infrastructure.Tests.csproj
dotnet test Tests/SettleSpace.Application.Tests/SettleSpace.Application.Tests.csproj
```

### Test isolation strategy
- **Domain tests** - no mocks; plain object instantiation
- **Infrastructure tests** - mock `IMongoCollection<T>` injected via `internal` constructor; no live MongoDB needed
- **Application tests** - mock `IPersonRepository` + `IPersonDomainService` + `IPasswordHashingService` for service tests; mock `IPersonApplicationService` for controller tests

---

## Quality Gates

Policy precedence note:
- Agent commit identity and workflow policy are authoritative in `COMMIT-POLICY.md`.
- Script behavior, gate intent, and wrapper policy are authoritative in `scripts/AGENTS.md`.
- This section is a user-facing runbook summary.

Agent-specific note:
- `COMMIT-POLICY.md` applies to AI or automation-authored commits and agent sessions.
- It does not replace normal human contributor guidance unless you intentionally use the repo-local
  agent identity.

Two repository-level analysis modes are available:

1. `scripts/checks/run-checks.ps1`
  - changed-code gate
  - base changed-code gate implementation (also used by git hooks)
2. `scripts/checks/run-full-checks.ps1`
  - full-base gate
  - base full-base gate implementation
3. `scripts/checks/run-checks-debug.ps1`
  - changed-code gate with forced log capture
  - recommended entry point for automation and agent sessions
4. `scripts/checks/run-full-checks-debug.ps1`
  - full-base gate with forced log capture
  - recommended entry point for automation and agent sessions when full-base analysis is requested
    - optional Sonar parity step: provide `SONAR_SCANNER_ENABLED=1` and `SONAR_TOKEN` either in shell environment variables or in a repo-root `.env` file (see `.env.example`) to include local `sonar-scanner` analysis for frontend/scripts parity inside the full gate
  - prerequisite: disable SonarCloud Automatic Analysis for the project before using the optional local `sonar-scanner` step
  - the optional Sonar step waits for the remote SonarCloud quality gate result and fails the full-base gate if the analysis or quality gate fails
  - on Sonar failure, the full gate now prints a compact summary of failing quality gate conditions, unresolved branch issues, or technical scanner errors instead of relying on raw scanner logs alone
  - when the failed Sonar quality gate includes unreviewed security hotspots, the full gate also prints the most likely hotspot location returned by SonarCloud
  - when the failed Sonar quality gate includes a coverage condition, the full gate also prints the 10 lowest covered files returned by SonarCloud for the analyzed branch
  - when SonarCloud reports any duplication on the analyzed branch, the full gate prints warning lines with overall duplication metrics and top duplicated files

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
- Frontend React analysis runs through the existing `settlespace-react` ESLint configuration
- Repo-script JS/MJS analysis runs through a separate ESLint configuration under `scripts/`

### Gate prerequisites

- Install frontend dependencies once: `cd settlespace-react && npm install`
- Install repo-script lint dependencies once: `cd scripts && npm install`

### Coverage policy

- Coverage gates evaluate production implementation files, not test files
- Application startup wiring in `Program.cs` is treated as composition-root/bootstrap code and is excluded from the C# coverage calculation
- The build/analyzer gates still analyze `Program.cs`; only coverage excludes it

### Run the gates

```powershell
.\scripts\checks\run-checks-debug.ps1
.\scripts\checks\run-full-checks-debug.ps1
.\scripts\checks\run-checks.ps1
.\scripts\checks\run-full-checks.ps1
.\scripts\setup\setup-hooks.ps1
```

Notes:
- The C# quality-gate steps now use isolated temporary .NET artifacts under `artifacts/tmp-dotnet/`.
- You generally do not need to stop the running local stack before running these gate scripts.

### Cleanup workspace artifacts

- `./scripts/cleanup/cleanup.ps1`
  - default light cleanup for routine use (including agent sessions)
  - removes lightweight generated outputs (coverage/build/test-artifacts and `artifacts/tmp-dotnet/`)
  - preserves heavy dependency folders such as `node_modules/`
  - retains only the newest 2 gate logs in `artifacts/logs/`
  - use `./scripts/cleanup/cleanup.ps1 -DryRun` to preview planned removals without deleting anything
- `./scripts/cleanup/cleanup-full.ps1 -Force`
  - explicit destructive cleanup for full workspace reset
  - removes heavy generated/cached outputs including `**/node_modules/`, `**/bin/`, `**/obj/`, `artifacts/`, `.vs/`, and `.scannerwork/`
  - run only when a full cleanup is explicitly required
  - use `./scripts/cleanup/cleanup-full.ps1 -Force -DryRun` to preview full-clean scope without deleting anything

### Troubleshooting opaque gate output

Use debug wrappers by default in automation and agent sessions.
If a terminal only shows an exit code and hides the gate failure details, these wrappers preserve full output.
They capture output to timestamped log files under `artifacts/logs/`.

```powershell
.\scripts\checks\run-checks-debug.ps1
.\scripts\checks\run-full-checks-debug.ps1
```

### Git hooks

- `pre-commit` calls the changed-code gate through a minimal shell launcher that invokes PowerShell
- `commit-msg` enforces Conventional Commit headers for local commits and the local agent commit attribution policy whenever the configured repo-local agent identity is active
- Use `./scripts/setup/set-agent-git-identity.ps1` to switch this repo to the default agent identity (`settlespace-agent` / `settlespace-agent@local`)
- Use `./scripts/setup/set-agent-git-identity.ps1 -ClearLocalIdentity` to return to your normal inherited Git identity
- Ensure `cd scripts; npm install` has been run so the local commit-message validator is available
- Do not bypass the hooks with `--no-verify`

### Verify hook installation

```powershell
Get-ChildItem .git\hooks\pre-commit, .git\hooks\commit-msg
```

If a hook is missing or does not match `scripts/hooks/`, re-run `setup-hooks`.

### Conventional Commit messages

Use the summary line format:

```text
<type>(<optional scope>)!: <description>
```

Supported types for this repo include `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, and `ops`.

Examples:

```text
feat(auth): add refresh-token rotation
fix(persons): prevent duplicate email save
chore(scripts): enforce conventional commit validation
feat(api)!: remove legacy status endpoint
```

### Agent-authored commit messages

See `COMMIT-POLICY.md` for the full agent-specific workflow, including identity setup,
checklist requirements, and required trailers.

If you want an explicit human review marker as well, add:

```text
Reviewed-by: <your name>
```

---

## settlespace-react

React SPA with login-gated access, full CRUD, search, and Material UI dark theme.

```
settlespace-react/src/
+-- app/
|   +-- App.tsx                     # App shell and route composition
|   +-- App.test.tsx                # App composition tests (hook contracts + shell rendering)
|   +-- App.integration.test.tsx    # App integration behavior tests (auth, directory, profile flows)
+-- features/
|   +-- auth/components/            # Login, registration, password change UI
|   +-- auth/hooks/                 # Auth/session hook (useAuth)
|   +-- persons/components/         # Person list, form, search, address editor, shared person-details form fields
|   +-- persons/hooks/              # Persons domain hook (usePersons) + shared person-details form utilities
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
- Person details form logic is mutualized in the persons feature (`PersonDetailsFormFields` + `personDetailsFormUtils`) and reused by both `/persons` create/edit and `/profile` update flows.
- Domain hooks:
  - `useAuth` handles authentication/session transitions.
  - `usePersons` handles directory CRUD/search/form state.
  - `useTransactions` handles transaction CRUD/search/form state.
  - `useProfile` handles profile load/save/password flows.
- Routes are URL-driven and support browser back/forward navigation.
- Shared frontend UX/UI conventions are documented in `settlespace-react/UX-PRINCIPLES.md`.
- Backend route generation is configured to lowercase URLs.

### Frontend commands

```bash
cd settlespace-react
npm install
npm start
npm run test:ci
npx eslint src --ext .ts,.tsx --max-warnings=0
```

### Frontend coverage scope

- Coverage targets production files under `settlespace-react/src/`
- Excluded from frontend coverage scope: `*.test.tsx`, `setupTests.ts`, `reportWebVitals.ts`, `index.tsx`, `react-app-env.d.ts`
- Repository gate scripts (`scripts/checks/run-checks.*`, `scripts/checks/run-full-checks.*`) are the source of truth for frontend quality validation
- Changed-code pre-commit validation stays local and fast via ESLint in `scripts/checks/run-checks.*`; optional Sonar parity analysis belongs only to the full-base gate flow

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
git clone https://github.com/salakist/settlespace.git
cd settlespace
```

### 2. Start MongoDB

```bash
mongod --dbpath "C:\data\db"
```

### 3. Run the API

From the repository root (`settlespace`):

```bash
dotnet run --project SettleSpace.Application\SettleSpace.Application.csproj
```

If your terminal is one level above the repository (for example the VS Code workspace root is `Repos/`), use the repository-prefixed path instead:

```bash
dotnet run --project settlespace\SettleSpace.Application\SettleSpace.Application.csproj
```

Alternatively, change into the project directory first and run `dotnet run` there:

```bash
cd settlespace\SettleSpace.Application
dotnet run
```

API starts on `http://localhost:5279`.

### 3.1 Demo login credentials

- Username format: `firstName.lastName` (example: `john.doe`)
- Password: the password stored for that person

### 3.2 Bruno collection (optional)

A repo-managed Bruno collection is available under `bruno/SettleSpace API/`.

- Open that folder in Bruno and select one of the provided environments (`John Doe`, `Jane Smith`, or `Jean Cule`).
- Protected requests auto-login with the environment `username` and `password` when `token` is missing or expired, then persist the refreshed token back into the environment.
- The collection usage guide and environment conventions are documented directly in `bruno/SettleSpace API/collection.bru`.

### 4. Run the Frontend

```bash
cd settlespace-react
npm install
npm start
```

Frontend starts on `http://localhost:3000`.

### 4.1 Convenience full-stack helpers

From the repository root, you can launch or stop both app ends with the repo scripts:

```powershell
.\scripts\start-stack.ps1
.\scripts\stop-stack.ps1
```

Notes:
- `start-stack.ps1` checks whether the backend and frontend are already running and reports what it started vs. what was already up.
- If one or both are already running, it asks once whether you want to restart the detected component(s).
- `stop-stack.ps1` asks once for confirmation before stopping the detected component(s).
- Use `.\scripts\stop-stack.ps1 -Force` to skip the confirmation prompt.

### 5. Seed demo data manually

With the API running, you can populate persons and transactions with repeatable sample data.

If you are introducing this role model on an existing local database, clear/recreate local data first, then run the seed script so all persons include a persisted `role` value.

Database reset note:
- `./scripts/cleanup/cleanup.ps1` and `./scripts/cleanup/cleanup-full.ps1` only clean workspace artifacts; they do not reset MongoDB data.
- Before reseeding this feature, drop the local `settlespace` database or clear the `persons` and `transactions` collections, then run the seed script below.

Seed expectations:
- `john.doe` is seeded as `ADMIN` (bootstrap first-account rule on empty data).
- Other seeded accounts are `USER`.

```powershell
.\scripts\setup\seed-dev-data.ps1
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
| POST | `/persons` | Create person (role rules apply) | `CreatePersonCommand` | `201` PersonDto, `409` Conflict, `400`, `401`, `403` |
| PUT | `/persons/me` | Update the authenticated person's profile | `UpdatePersonCommand` | `204`, `400`, `401`, `404`, `409` |
| PUT | `/persons/{id}` | Update person (role rules apply) | `UpdatePersonCommand` | `204`, `404`, `409` Conflict, `400`, `401`, `403` |
| DELETE | `/persons/{id}` | Delete person (role rules apply) | none | `204`, `404`, `401`, `403` |
| GET | `/transactions/me` | Get transactions in role-based scope | none | `200` Array of TransactionDto, `401` |
| POST | `/transactions/search` | Search transactions with composable filters | `TransactionSearchQuery` | `200` Array, `400`, `401` |
| GET | `/transactions/{id}` | Get transaction by ID (role rules apply) | none | `200` TransactionDto, `401`, `403`, `404` |
| POST | `/transactions` | Create transaction (role rules apply) | `CreateTransactionCommand` | `201` TransactionDto, `400`, `401`, `403` |
| PUT | `/transactions/{id}` | Update transaction (role rules apply) | `UpdateTransactionCommand` | `204`, `400`, `401`, `403`, `404` |
| DELETE | `/transactions/{id}` | Delete transaction (role rules apply) | none | `204`, `401`, `403`, `404` |

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
  "role": "ADMIN",
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
  "role": "ADMIN | USER | MANAGER",
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
  "role": "ADMIN | USER | MANAGER (optional, defaults to USER)",
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
  "role": "ADMIN | USER | MANAGER (optional)",
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
Role changes are restricted by role-based authorization rules; a person cannot change their own role.

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

`SettleSpace.Application/appsettings.json`:

```json
{
  "SettleSpaceDatabase": {
    "ConnectionString": "mongodb://localhost:27017",
    "DatabaseName": "settlespace",
    "PersonsCollectionName": "persons"
  },
  "Auth": {
    "JwtKey": "settlespace-super-secret-jwt-key-2026-change-me",
    "Issuer": "SettleSpace",
    "Audience": "SettleSpaceReact",
    "TokenExpirationMinutes": 60
  }
}
```


