function New-CleanupResult {
    return [pscustomobject]@{
        Planned = New-Object 'System.Collections.Generic.List[string]'
        Removed = New-Object 'System.Collections.Generic.List[string]'
        Skipped = New-Object 'System.Collections.Generic.List[string]'
        Failed = New-Object 'System.Collections.Generic.List[string]'
    }
}

function Resolve-AbsolutePath([string]$Path) {
    if (Test-Path -LiteralPath $Path) {
        return (Resolve-Path -LiteralPath $Path).Path
    }

    return [System.IO.Path]::GetFullPath($Path)
}

function Test-PathWithinRoot([string]$CandidatePath, [string]$RepoRoot) {
    $root = (Resolve-AbsolutePath $RepoRoot).TrimEnd('\\')
    $candidate = (Resolve-AbsolutePath $CandidatePath).TrimEnd('\\')
    if ($candidate -ieq $root) {
        return $true
    }

    return $candidate.StartsWith("$root\", [System.StringComparison]::OrdinalIgnoreCase)
}

function Remove-DirectorySafe(
    [string]$TargetPath,
    [string]$RepoRoot,
    [psobject]$Result,
    [string]$DisplayPath,
    [bool]$DryRun = $false
) {
    if (-not (Test-Path $TargetPath)) {
        $Result.Skipped.Add("$DisplayPath (missing)")
        return
    }

    if (-not (Test-PathWithinRoot -CandidatePath $TargetPath -RepoRoot $RepoRoot)) {
        $Result.Failed.Add("$DisplayPath (outside repository root)")
        return
    }

    if ($DryRun) {
        $Result.Planned.Add($DisplayPath)
        return
    }

    try {
        Remove-Item -LiteralPath $TargetPath -Recurse -Force -ErrorAction Stop
        $Result.Removed.Add($DisplayPath)
    }
    catch {
        $Result.Failed.Add("$DisplayPath ($($_.Exception.Message))")
    }
}

function Remove-RepoRelativeDirectory(
    [string]$RepoRoot,
    [string]$RelativePath,
    [psobject]$Result,
    [bool]$DryRun = $false
) {
    $target = Join-Path $RepoRoot $RelativePath
    Remove-DirectorySafe -TargetPath $target -RepoRoot $RepoRoot -Result $Result -DisplayPath $RelativePath -DryRun $DryRun
}

function Remove-RepoDirectoriesByName(
    [string]$RepoRoot,
    [string[]]$DirectoryNames,
    [psobject]$Result,
    [bool]$DryRun = $false
) {
    $directories = @(
        Get-ChildItem -Path $RepoRoot -Directory -Recurse -Force -ErrorAction SilentlyContinue |
        Where-Object {
            ($DirectoryNames -contains $_.Name) -and
            ($_.FullName -notmatch '[\\/]\\.git([\\/]|$)')
        } |
        Sort-Object { $_.FullName.Length } -Descending
    )

    if ($directories.Count -eq 0) {
        $Result.Skipped.Add("directories: $($DirectoryNames -join ', ') (none found)")
        return
    }

    foreach ($directory in $directories) {
        $relative = $directory.FullName.Substring((Resolve-AbsolutePath $RepoRoot).TrimEnd('\\').Length).TrimStart('\\')
        Remove-DirectorySafe -TargetPath $directory.FullName -RepoRoot $RepoRoot -Result $Result -DisplayPath $relative -DryRun $DryRun
    }
}

function Remove-StandardTestArtifacts(
    [string]$RepoRoot,
    [psobject]$Result,
    [bool]$DryRun = $false
) {
    Remove-RepoRelativeDirectory -RepoRoot $RepoRoot -RelativePath 'Tests\FoTestApi.Application.Tests\artifacts' -Result $Result -DryRun $DryRun
    Remove-RepoRelativeDirectory -RepoRoot $RepoRoot -RelativePath 'Tests\FoTestApi.Domain.Tests\artifacts' -Result $Result -DryRun $DryRun
    Remove-RepoRelativeDirectory -RepoRoot $RepoRoot -RelativePath 'Tests\FoTestApi.Infrastructure.Tests\artifacts' -Result $Result -DryRun $DryRun
}

function Invoke-LightCleanupTargets(
    [string]$RepoRoot,
    [int]$KeepLogs,
    [psobject]$Result,
    [bool]$DryRun = $false
) {
    Remove-RepoRelativeDirectory -RepoRoot $RepoRoot -RelativePath 'artifacts\coverage' -Result $Result -DryRun $DryRun
    Remove-RepoRelativeDirectory -RepoRoot $RepoRoot -RelativePath 'fotest-react\coverage' -Result $Result -DryRun $DryRun
    Remove-RepoRelativeDirectory -RepoRoot $RepoRoot -RelativePath 'fotest-react\build' -Result $Result -DryRun $DryRun
    Remove-StandardTestArtifacts -RepoRoot $RepoRoot -Result $Result -DryRun $DryRun
    Prune-GateLogs -RepoRoot $RepoRoot -KeepCount $KeepLogs -Result $Result -DryRun $DryRun
}

function Prune-GateLogs(
    [string]$RepoRoot,
    [int]$KeepCount,
    [psobject]$Result,
    [bool]$DryRun = $false
) {
    if ($KeepCount -lt 0) {
        $KeepCount = 0
    }

    $logRoot = Join-Path $RepoRoot 'artifacts\logs'
    if (-not (Test-Path $logRoot)) {
        $Result.Skipped.Add('artifacts\\logs (missing)')
        return
    }

    $logFiles = @(
        Get-ChildItem -Path $logRoot -File -Filter 'run-checks-*.log' -ErrorAction SilentlyContinue
        Get-ChildItem -Path $logRoot -File -Filter 'run-full-checks-*.log' -ErrorAction SilentlyContinue
    ) | Sort-Object LastWriteTime -Descending

    if ($logFiles.Count -le $KeepCount) {
        $Result.Skipped.Add("artifacts\\logs (kept $($logFiles.Count) of $($logFiles.Count))")
        return
    }

    $toRemove = $logFiles | Select-Object -Skip $KeepCount
    if ($DryRun) {
        foreach ($log in $toRemove) {
            $relative = $log.FullName.Substring((Resolve-AbsolutePath $RepoRoot).TrimEnd('\\').Length).TrimStart('\\')
            $Result.Planned.Add($relative)
        }
        return
    }

    foreach ($log in $toRemove) {
        try {
            Remove-Item -LiteralPath $log.FullName -Force -ErrorAction Stop
            $relative = $log.FullName.Substring((Resolve-AbsolutePath $RepoRoot).TrimEnd('\\').Length).TrimStart('\\')
            $Result.Removed.Add($relative)
        }
        catch {
            $relative = $log.FullName.Substring((Resolve-AbsolutePath $RepoRoot).TrimEnd('\\').Length).TrimStart('\\')
            $Result.Failed.Add("$relative ($($_.Exception.Message))")
        }
    }
}

function Write-CleanupSummary([psobject]$Result, [bool]$DryRun = $false) {
    Write-Host ""
    if ($DryRun) {
        Write-Host "Planned: $($Result.Planned.Count)" -ForegroundColor Cyan
    }
    Write-Host "Removed: $($Result.Removed.Count)" -ForegroundColor Green
    Write-Host "Skipped: $($Result.Skipped.Count)" -ForegroundColor Yellow
    Write-Host "Failed:  $($Result.Failed.Count)" -ForegroundColor Red

    if ($DryRun -and $Result.Planned.Count -gt 0) {
        Write-Host ""
        Write-Host "[info] Dry-run planned changes:" -ForegroundColor Cyan
        foreach ($item in $Result.Planned) {
            Write-Host "  - $item" -ForegroundColor Cyan
        }
    }

    if ($Result.Failed.Count -gt 0) {
        Write-Host ""
        Write-Host "[fail] Cleanup had errors:" -ForegroundColor Red
        foreach ($item in $Result.Failed) {
            Write-Host "  - $item" -ForegroundColor Red
        }
    }
}
