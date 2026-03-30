# scripts/run-checks-debug.ps1
#
# Wrapper for scripts/run-checks.ps1 that always captures output to a timestamped log.

$ErrorActionPreference = "Continue"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$LogDirectory = Join-Path $RepoRoot "artifacts\logs"
$TimeStamp = Get-Date -Format "yyyyMMdd-HHmmss"
$LogPath = Join-Path $LogDirectory "run-checks-$TimeStamp.log"

New-Item -ItemType Directory -Path $LogDirectory -Force | Out-Null

Write-Host "[info] Running changed-code gate with log capture..." -ForegroundColor Yellow
Write-Host "[info] Log file: $LogPath" -ForegroundColor Yellow

& "$PSScriptRoot\run-checks.ps1" *>&1 | Tee-Object -FilePath $LogPath
$ExitCode = if ($null -ne $LASTEXITCODE) { $LASTEXITCODE } elseif ($?) { 0 } else { 1 }

if ($ExitCode -ne 0) {
    Write-Host "[fail] Changed-code gate failed. See log: $LogPath" -ForegroundColor Red
} else {
    Write-Host "[pass] Changed-code gate passed. Log: $LogPath" -ForegroundColor Green
}

exit $ExitCode
