# Agent Commit Attribution Plan

## Goal
Make commits created by an agent in this repository clearly identifiable while keeping the rollout local to the repo and low-friction.

## Recommended baseline
- Use a **repo-scoped bot Git identity** for agent commits.
- Require a commit trailer such as `Agent: GitHub Copilot`.
- Enforce the rule with a local `commit-msg` hook.
- Keep the existing `pre-commit` quality gate behavior unchanged.

> This gives clear attribution in both Git metadata and commit text without requiring GitHub-side setup.

## Decisions already made
- **Enforcement scope:** local repo only
- **Identity model:** separate bot/account identity
- **Commit flow:** direct commits allowed

## Required inputs
Before implementation, choose the following values:

1. **Bot display name**
   - Recommended: `fo-test-agent`

2. **Bot email**
   - Option A: local placeholder email for a fast rollout
   - Option B: GitHub noreply or machine-account email for stronger auditability

3. **Required trailer**
   - Recommended: `Agent: GitHub Copilot`

4. **Optional human accountability trailer**
   - Example: `Reviewed-by: Simon`
   - Decide whether this should be optional or mandatory

## Rollout phases

### Phase 1 — Define the policy
Document the rule that:
- agent commits must not use your personal Git identity
- agent commits must use the dedicated bot identity
- agent commits must include the required `Agent:` trailer

**Files to update**
- `AGENTS.md`
- `scripts/AGENTS.md`
- optionally `README.md` for contributor-facing guidance

### Phase 2 — Enforce the policy locally
Add a new hook at:
- `scripts/hooks/commit-msg`

Recommended behavior:
- If the author matches the bot identity, require the `Agent:` trailer.
- Optionally require `Reviewed-by:` as well.
- Reject invalid messages with a clear explanation.
- Leave ordinary human commits unaffected unless they claim agent authorship incorrectly.

Then update:
- `scripts/setup/setup-hooks.ps1`

So it installs and verifies both:
- `pre-commit`
- `commit-msg`

### Phase 3 — Make identity switching easy
Choose one of these:

1. **Simple path**
   - Document the `git config --local` commands needed to switch the repo into agent identity mode.

2. **Convenience path**
   - Add a small helper script under `scripts/setup/` to set the repo-local bot identity and print the active author info.

This reduces the risk of an agent accidentally committing as you.

### Phase 4 — Roll out locally
Manual actions for you:

1. Choose the final bot name and email.
2. Pull the repository changes.
3. Run:
   - `scripts/setup/setup-hooks.ps1`
4. Set the repo-local Git identity to the bot values when agent commits are intended.
5. Switch back to your normal identity when making your own commits, if needed.

### Phase 5 — Verify behavior
After rollout, verify with these checks:

1. Reinstall hooks and confirm both are present.
2. Attempt a bot-identity commit **without** the `Agent:` trailer and confirm it is blocked.
3. Attempt a bot-identity commit **with** the required trailer and confirm it proceeds.
4. Attempt a normal human commit and confirm it is unaffected.
5. Review `git log` and confirm agent-authored commits are visually distinct.

## Suggested verification commands
Examples to use during validation:

```powershell
# inspect local author identity
git config --local user.name
git config --local user.email

# inspect recent history
git log --format=fuller -n 5
```

## Manual actions summary
### Required now
- Choose the final bot display name
- Choose the final bot email
- Decide whether `Reviewed-by:` is optional or mandatory

### Required during rollout
- Run `scripts/setup/setup-hooks.ps1`
- Configure the repo-local bot identity when enabling agent commits

### Optional later hardening
- Create a dedicated GitHub machine/bot account
- Configure SSH key or PAT for that account
- Add commit signing for stronger proof
- Add PR-only or branch-protection enforcement if desired

## Scope boundaries
### Included
- local repo enforcement
- separate bot identity
- direct commits allowed
- hook-based attribution

### Not included for now
- CI or GitHub Actions enforcement
- branch protection rules
- signed commits
- PR-only workflow
- organization-wide bot account management

## Final recommendation
Start with a **repo-local bot identity plus a mandatory `Agent:` trailer** enforced by a **local `commit-msg` hook**.

If you later want stronger proof beyond local attribution, the next upgrade is a **dedicated GitHub bot account plus signed commits**.