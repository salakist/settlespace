# scripts/hooks AGENTS Metadata

## Role
Own the Git hook source templates that enforce commit-time checks in this repository.

## Responsibilities
- Keep `pre-commit` focused on launching the changed-code quality gate.
- Keep `commit-msg` focused on local agent commit attribution and trailer enforcement.
- Preserve lightweight shell compatibility for hooks copied into `.git/hooks`.
- Keep hook documentation aligned with `scripts/setup/setup-hooks.ps1` and `scripts/setup/set-agent-git-identity.ps1`.

## Key files
- `pre-commit`
- `commit-msg`
- `../setup/setup-hooks.ps1`
- `../setup/set-agent-git-identity.ps1`

## Hook boundaries
- `pre-commit` should launch the repository quality gate and should not absorb attribution policy logic.
- `commit-msg` should validate agent identity/trailer expectations and should not duplicate the pre-commit quality gate.
- Hook installation remains the responsibility of `setup-hooks.ps1`.

## Commands
- `./scripts/setup/setup-hooks.ps1`
- `./scripts/setup/set-agent-git-identity.ps1`
- `./scripts/setup/set-agent-git-identity.ps1 -ClearLocalIdentity`

## Dependencies
- Git with a working `.git/hooks` directory
- A shell environment compatible with the minimal hook launchers
- Repo-local Git config values used by the attribution policy (`fotest.agentName`, `fotest.agentEmail`, `fotest.agentTrailer`, `fotest.requireReviewedBy`)

## Source-of-truth note
Repo-level commit checklist and agent commit attribution policy are authoritative in root `AGENTS.md`.
The parent `scripts/AGENTS.md` routes broader scripts guidance, and detailed gate behavior lives in `scripts/checks/AGENTS.md`.
