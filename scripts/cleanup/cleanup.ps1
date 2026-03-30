# scripts/cleanup/cleanup.ps1
#
# Light cleanup for routine agent/developer use.
# Removes lightweight generated artifacts and keeps the newest gate logs.

param(
    [int]$KeepLogs = 2,
    [switch]$DryRun
)

$ErrorActionPreference = 'Continue'

$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $RepoRoot

$LibRoot = Join-Path $RepoRoot 'scripts\lib'
. (Join-Path $LibRoot 'common.ps1')
. (Join-Path $LibRoot 'cleanup.ps1')

$result = New-CleanupResult

Write-Header 'Light cleanup (default)'

if ($DryRun) {
    Write-Host '[info] Dry-run mode enabled. No files will be deleted.' -ForegroundColor Cyan
}

Invoke-LightCleanupTargets -RepoRoot $RepoRoot -KeepLogs $KeepLogs -Result $result -DryRun $DryRun.IsPresent

Write-CleanupSummary -Result $result -DryRun $DryRun.IsPresent

if ($result.Failed.Count -gt 0) {
    Write-Host ''
    Write-Host '[FAIL] Light cleanup failed.' -ForegroundColor Red
    exit 1
}

Write-Host ''
if ($DryRun) {
    Write-Host '[PASS] Light cleanup dry-run completed.' -ForegroundColor Green
} else {
    Write-Host '[PASS] Light cleanup completed.' -ForegroundColor Green
}
exit 0
