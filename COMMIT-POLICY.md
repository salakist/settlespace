# Agent Commit Policy

This file is the authoritative policy for **agent or automation-authored commits** in this
repository.

Use it when an AI agent is preparing or creating a commit. For repository architecture and AGENTS
routing, see root `AGENTS.md`. For general contributor setup and runbook guidance, see
`README.md`.

## Identity and message requirements

1. Use the repo-local agent identity, not a contributor's personal identity.
   - Default: `settlespace-agent` / `settlespace-agent@local`
   - Set: `./scripts/setup/set-agent-git-identity.ps1`
   - Clear: `./scripts/setup/set-agent-git-identity.ps1 -ClearLocalIdentity`
2. Use a Conventional Commit summary line: `<type>(<optional scope>)!: <description>`.
   - Supported types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `ops`
3. Include the trailer `Agent: GitHub Copilot`.
   - `Reviewed-by:` is optional unless `settlespace.requireReviewedBy=true`
4. Keep each non-empty commit body or trailer line at **100 characters or fewer**.
5. Local enforcement is handled by `scripts/hooks/commit-msg`, installed by
   `./scripts/setup/setup-hooks.ps1`.
6. Human-authored commits should not include an `Agent:` trailer unless they are intentionally
   using the configured agent identity.

## Pre-commit workflow

1. **Step 1 — Quality gate**
   - Run `./scripts/checks/run-checks-debug.ps1` and keep the log path.
   - `./scripts/checks/run-full-checks-debug.ps1` also satisfies Step 1 when broader validation
     is requested.
   - Never bypass hooks with `--no-verify`.
2. **Step 2 — Documentation alignment**
   - Update only documentation relevant to the current change set.

## Checklist to state before `git commit`

```text
Step 1: DONE | SKIPPED - <reason if skipped> - <latest successful log path when required>
Step 2: DONE | SKIPPED - <reason if skipped>
Message preflight: DONE
```

Rules:
- Provide the checklist in chat immediately before running `git commit`; printing it only inside
  the terminal command is not enough.
- `Message preflight: DONE` means the summary is a valid Conventional Commit and each non-empty
  body or trailer line is `<= 100` chars.
- If the checklist state changes after you print it, print an updated version before committing.
- If the checklist is missing or invalid, do not commit.

## Skip conditions and acceptance rules

1. Any `SKIPPED` step must include a one-line reason.
2. **Step 1** may be `SKIPPED` only when:
   - there are no production code changes since the latest successful Step 1-equivalent gate run, and
   - the latest successful log path is shown in the checklist output.

   Step 1-equivalent runs are:
   - `./scripts/checks/run-checks-debug.ps1`
   - `./scripts/checks/run-full-checks-debug.ps1`

   Production code changes include implementation files under `SettleSpace.Domain/`,
   `SettleSpace.Infrastructure/`, `SettleSpace.Application/`, `settlespace-react/src/`, and
   runtime quality-gate script code or config under `scripts/`, excluding test files and
   documentation-only changes.

3. **Step 2** must always be reviewed for the staged diff. It may be `SKIPPED` only as
   `No documentation changes required` with a short reason tied to the staged changes.
4. A documentation-only commit may mark both steps `SKIPPED` only when all Step 1 skip conditions
   are satisfied and no further docs updates are needed.
5. If either step is neither `DONE` nor validly `SKIPPED`, do not commit.

## Hook boundaries

- `pre-commit` launches the repository quality gate; it should not own attribution or
  Conventional Commit parsing.
- `commit-msg` validates agent identity or trailer expectations, the Conventional Commit header,
  and commit body line length rules; it should not duplicate the pre-commit gate.
- Pre-wrap commit body lines to **100 characters or fewer** instead of relying on a failed hook
  run to discover formatting issues.
- Hook installation is handled by `./scripts/setup/setup-hooks.ps1`.
