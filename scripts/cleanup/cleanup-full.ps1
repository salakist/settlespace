# scripts/cleanup/cleanup-full.ps1
#
# Full cleanup for explicit destructive reset requests.
# Removes light artifacts plus heavy caches and dependency directories.

param(
    [switch]$Force,
    [switch]$DryRun
)

$ErrorActionPreference = 'Continue'

$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $RepoRoot

if (-not $Force) {
    Write-Host '[fail] Full cleanup is destructive. Re-run with -Force to proceed.' -ForegroundColor Red
    exit 1
}

$LibRoot = Join-Path $RepoRoot 'scripts\lib'
. (Join-Path $LibRoot 'common.ps1')
. (Join-Path $LibRoot 'cleanup.ps1')

$result = New-CleanupResult

Write-Header 'Full cleanup (explicit)'

if ($DryRun) {
    Write-Host '[info] Dry-run mode enabled. No files will be deleted.' -ForegroundColor Cyan
}

Remove-RepoRelativeDirectory -RepoRoot $RepoRoot -RelativePath 'artifacts' -Result $result -DryRun $DryRun.IsPresent
Remove-RepoRelativeDirectory -RepoRoot $RepoRoot -RelativePath '.scannerwork' -Result $result -DryRun $DryRun.IsPresent
Remove-RepoRelativeDirectory -RepoRoot $RepoRoot -RelativePath '.vs' -Result $result -DryRun $DryRun.IsPresent
Remove-RepoRelativeDirectory -RepoRoot $RepoRoot -RelativePath 'fotest-react\coverage' -Result $result -DryRun $DryRun.IsPresent
Remove-RepoRelativeDirectory -RepoRoot $RepoRoot -RelativePath 'fotest-react\build' -Result $result -DryRun $DryRun.IsPresent
Remove-StandardTestArtifacts -RepoRoot $RepoRoot -Result $result -DryRun $DryRun.IsPresent
Remove-RepoDirectoriesByName -RepoRoot $RepoRoot -DirectoryNames @('bin', 'obj', 'node_modules') -Result $result -DryRun $DryRun.IsPresent

Write-CleanupSummary -Result $result -DryRun $DryRun.IsPresent

if ($result.Failed.Count -gt 0) {
    Write-Host ''
    Write-Host '[FAIL] Full cleanup failed.' -ForegroundColor Red
    exit 1
}

Write-Host ''
if ($DryRun) {
    Write-Host '[PASS] Full cleanup dry-run completed.' -ForegroundColor Green
} else {
    Write-Host '[PASS] Full cleanup completed.' -ForegroundColor Green
}
exit 0
