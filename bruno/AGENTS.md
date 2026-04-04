# Bruno Collections AGENTS

## Role
Router for the repository-managed Bruno collections and their shared scripting conventions.

## Responsibilities
- Keep Bruno collections organized for local API exploration and manual regression checks.
- Prefer collection-level scripting for shared auth behavior such as auto-login and token refresh.
- Keep the user-facing collection guidance in `SettleSpace API/collection.bru` and avoid duplicating it across extra docs.
- Store only local/dev-safe sample environments in versioned Bruno files; do not add production secrets.

## Key files
- `SettleSpace API/collection.bru`
- `SettleSpace API/environments/*.bru`
- `SettleSpace API/Auth/*.bru`
- `SettleSpace API/Persons/*.bru`
- `SettleSpace API/Transactions/*.bru`
- `SettleSpace API/Debts/*.bru`

## Commands
- Start the local stack: `./scripts/start-stack.ps1`
- Stop the local stack: `./scripts/stop-stack.ps1`
- Open `bruno/SettleSpace API/` in Bruno and select an environment

## Dependencies
- The local API host at `http://localhost:5279`
- Bruno desktop app or Bruno CLI if installed
- Seed/demo credentials documented in `SettleSpace API/collection.bru`

## Source-of-truth note
- Repo-wide routing policy lives in root `AGENTS.md`.
- Bruno collection usage, environment conventions, and auto-login behavior are documented in `bruno/SettleSpace API/collection.bru`.
