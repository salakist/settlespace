# scripts/setup-hooks.ps1
#
# Installs the git hooks from scripts/hooks/ into .git/hooks/.
# Run once after cloning:
#   .\scripts\setup-hooks.ps1

$RepoRoot    = Split-Path -Parent $PSScriptRoot
$GitHooksDir = Join-Path $RepoRoot ".git\hooks"

function Test-HookInstalled {
    param(
        [string]$HookName
    )

    $sourcePath = Join-Path $RepoRoot "scripts\hooks\$HookName"
    $installedPath = Join-Path $GitHooksDir $HookName

    if (-not (Test-Path $installedPath)) {
        Write-Host "  [FAIL] $HookName hook not found after install" -ForegroundColor Red
        return $false
    }

    $sourceHash = (Get-FileHash -Path $sourcePath -Algorithm SHA256).Hash
    $installedHash = (Get-FileHash -Path $installedPath -Algorithm SHA256).Hash

    if ($sourceHash -ne $installedHash) {
        Write-Host "  [FAIL] $HookName hook content does not match scripts\hooks\$HookName" -ForegroundColor Red
        return $false
    }

    Write-Host "  [OK] $HookName hook installed and verified" -ForegroundColor Green
    return $true
}

if (-not (Test-Path $GitHooksDir)) {
    Write-Error "ERROR: .git\hooks directory not found. Are you in the fo-test repository?"
    exit 1
}

Write-Host "Installing git hooks..."

Copy-Item -Path (Join-Path $RepoRoot "scripts\hooks\pre-commit") `
          -Destination (Join-Path $GitHooksDir "pre-commit") `
          -Force

$hooksVerified = $true
if (-not (Test-HookInstalled "pre-commit")) { $hooksVerified = $false }

if (-not $hooksVerified) {
    Write-Host ""
    Write-Host "Hook installation verification failed. Fix the issues above and rerun setup-hooks." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Changed-code quality gates will now run automatically before every commit."
Write-Host "To run changed-code checks manually: .\scripts\run-checks.ps1"
Write-Host "To run full-base checks manually: .\scripts\run-full-checks.ps1"