# scripts/setup-hooks.ps1
#
# Installs the git hooks from scripts/hooks/ into .git/hooks/.
# Run once after cloning:
#   .\scripts\setup-hooks.ps1

$RepoRoot    = Split-Path -Parent $PSScriptRoot
$GitHooksDir = Join-Path $RepoRoot ".git\hooks"

if (-not (Test-Path $GitHooksDir)) {
    Write-Error "ERROR: .git\hooks directory not found. Are you in the fo-test repository?"
    exit 1
}

Write-Host "Installing git hooks..."

Copy-Item -Path (Join-Path $RepoRoot "scripts\hooks\pre-commit") `
          -Destination (Join-Path $GitHooksDir "pre-commit") `
          -Force

Copy-Item -Path (Join-Path $RepoRoot "scripts\hooks\pre-push") `
          -Destination (Join-Path $GitHooksDir "pre-push") `
          -Force

Write-Host "  [OK] pre-commit hook installed" -ForegroundColor Green
Write-Host "  [OK] pre-push hook installed" -ForegroundColor Green
Write-Host ""
Write-Host "Changed-code quality gates will now run automatically before every commit and push."
Write-Host "To run changed-code checks manually: .\scripts\run-checks.ps1"
Write-Host "To run full-base checks manually: .\scripts\run-full-checks.ps1"