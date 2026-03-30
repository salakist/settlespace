# scripts/run-full-checks-debug.ps1
#
# Wrapper for scripts/run-full-checks.ps1 that always captures output to a timestamped log.

$ErrorActionPreference = "Continue"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$LogDirectory = Join-Path $RepoRoot "artifacts\logs"
$TimeStamp = Get-Date -Format "yyyyMMdd-HHmmss"
$LogPath = Join-Path $LogDirectory "run-full-checks-$TimeStamp.log"

New-Item -ItemType Directory -Path $LogDirectory -Force | Out-Null

Write-Host "[info] Running full-base gate with log capture..." -ForegroundColor Yellow
Write-Host "[info] Log file: $LogPath" -ForegroundColor Yellow

& "$PSScriptRoot\run-full-checks.ps1" *>&1 | Tee-Object -FilePath $LogPath
$ExitCode = if ($null -ne $LASTEXITCODE) { $LASTEXITCODE } elseif ($?) { 0 } else { 1 }

if ($ExitCode -ne 0) {
    Write-Host "[fail] Full-base gate failed. See log: $LogPath" -ForegroundColor Red
} else {
    Write-Host "[pass] Full-base gate passed. Log: $LogPath" -ForegroundColor Green
}

exit $ExitCode
