# scripts AGENTS Metadata

## Role
Own repository quality-gate and hook automation scripts.

## Scope
- `run-checks.ps1` / `run-checks.sh` - base changed-code gate implementations.
- `run-full-checks.ps1` / `run-full-checks.sh` - base full-base gate implementations.
- `run-checks-debug.ps1` / `run-checks-debug.sh` - changed-code wrappers with mandatory log capture.
- `run-full-checks-debug.ps1` / `run-full-checks-debug.sh` - full-base wrappers with mandatory log capture.
- `setup-hooks.ps1` / `setup-hooks.sh` - local git hook installation and refresh.
- `hooks/` - hook source templates copied to `.git/hooks`.
- `check-coverage.mjs` - shared coverage evaluator for changed/full modes.

## Agent policy
- Agents must run debug wrappers, not base gate scripts, before commit/push:
  - `./scripts/run-checks-debug.ps1` (or `sh scripts/run-checks-debug.sh`)
  - `./scripts/run-full-checks-debug.ps1` (or `sh scripts/run-full-checks-debug.sh`) when full-base analysis is requested
- Git hooks should continue invoking base scripts (do not rewrite hooks to call debug wrappers by default).
- Never suggest bypassing hooks with `--no-verify`.

## Logging rules
- Debug wrappers must write timestamped logs to `artifacts/logs/`.
- Wrapper success/failure output must print the resolved log path.
- Keep log naming stable (`run-checks-<timestamp>.log`, `run-full-checks-<timestamp>.log`).

## Cross-platform parity
- If a gate rule or threshold changes in one platform script, mirror it in the counterpart script.
- Keep command semantics aligned between PowerShell and shell scripts.
- Validate path handling for both Windows-style and POSIX-style environments.

## Gate intent
- Changed-code gate enforces quality only on changed production scope.
- Full-base gate enforces quality across the full production codebase.
- Coverage threshold remains 80% unless explicitly changed by repository policy.

## Update checklist
When editing any script in this folder:
1. Update both PowerShell and shell implementations when applicable.
2. Update related wrapper/help text if command behavior changes.
3. Verify docs alignment in `AGENTS.md` and `README.md` if command usage changes.
4. Run the changed-code debug wrapper before commit.

## Commands
```powershell
.\scripts\run-checks-debug.ps1
.\scripts\run-full-checks-debug.ps1
.\scripts\setup-hooks.ps1
```

```bash
sh scripts/run-checks-debug.sh
sh scripts/run-full-checks-debug.sh
sh scripts/setup-hooks.sh
```
