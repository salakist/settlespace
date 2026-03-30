function Write-Header([string]$Text) {
    Write-Host ""
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "=======================================================" -ForegroundColor Cyan
}

function Import-RepoDotEnv([string]$RepoRoot) {
    $dotEnvPath = Join-Path $RepoRoot ".env"
    if (-not (Test-Path $dotEnvPath)) {
        return
    }

    foreach ($line in Get-Content $dotEnvPath) {
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
            $key = $Matches[1]
            $value = $Matches[2]
            if (-not (Get-Item -Path "Env:$key" -ErrorAction SilentlyContinue)) {
                Set-Item -Path "Env:$key" -Value $value
            }
        }
    }
}