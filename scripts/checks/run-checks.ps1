# scripts/checks/run-checks.ps1
#
# Runs the changed-code quality gates used by agents and git hooks:
#   1. C# build + analyzers, filtered to diagnostics in changed C# files
#   2. C# coverage on changed production C# files (threshold: 80%)
#   3. React/TS ESLint on changed frontend files
#   4. Repo JS/MJS ESLint on changed script files
#   5. React/TS coverage on changed production frontend files (threshold: 80%)

$ErrorActionPreference = "Continue"

$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $RepoRoot

$LibRoot = Join-Path $RepoRoot "scripts\lib"
. (Join-Path $LibRoot "common.ps1")
. (Join-Path $LibRoot "change-detection.ps1")
. (Join-Path $LibRoot "coverage.ps1")

$Failed = $false
$ArtifactsRoot = Join-Path $RepoRoot "artifacts"
$CoverageRoot = Join-Path $ArtifactsRoot "coverage\changed"
$ChangedListPath = Join-Path $ArtifactsRoot "changed-files.txt"
$DotNetArtifactsRoot = Join-Path $ArtifactsRoot "tmp-dotnet\changed\$(Get-Date -Format 'yyyyMMdd-HHmmss')"

$changedContext = Get-ChangedContext
$changedFiles = @($changedContext.Files | ForEach-Object { $_.Replace('\\', '/') })
$changedFiles = Get-UniqueLines $changedFiles

Write-Host "[mandatory] changed-code gate: run before every commit" -ForegroundColor Yellow

Write-Header "Changed-code analysis target"
Write-Host "Scope: $($changedContext.Source)" -ForegroundColor Yellow
if ($changedFiles.Count -eq 0) {
    Write-Host "No changed files detected. Skipping changed-code gates." -ForegroundColor Yellow
    exit 0
}

$preview = $changedFiles | Select-Object -First 20
$preview | ForEach-Object { Write-Host "  $_" }
if ($changedFiles.Count -gt 20) {
    Write-Host "  ... and $($changedFiles.Count - 20) more file(s)." -ForegroundColor Yellow
}

if (-not (Test-Path $ArtifactsRoot)) {
    New-Item -ItemType Directory -Path $ArtifactsRoot -Force | Out-Null
}
New-Item -ItemType Directory -Path $DotNetArtifactsRoot -Force | Out-Null
Set-Content -Path $ChangedListPath -Value $changedFiles
Write-Host "Isolated .NET artifacts: $DotNetArtifactsRoot" -ForegroundColor DarkGray

$changedCSharpFiles = @($changedFiles | Where-Object { $_ -match '\.cs$' })
$changedProductionCSharpFiles = @($changedFiles | Where-Object { Is-ProductionCSharpFile $_ })
$changedReactFiles = @($changedFiles | Where-Object { Is-ReactFile $_ })
$changedScriptLintFiles = @($changedFiles | Where-Object { Is-ScriptLintFile $_ })
$changedProductionReactFiles = @($changedFiles | Where-Object { Is-ProductionReactFile $_ })

Write-Header "[1/5] C# changed-file analyzer gate"
if ($changedCSharpFiles.Count -eq 0) {
    Write-Host "[SKIP] No changed C# files." -ForegroundColor Yellow
} else {
    # Use Rebuild so analyzer diagnostics are emitted even when incremental build would skip compilation.
    # Route build outputs to an isolated artifacts folder so the gate can run while the app stack is up.
    $buildOutput = @(dotnet build SettleSpace.sln -t:Rebuild --artifacts-path $DotNetArtifactsRoot /nr:false 2>&1)
    $buildExitCode = $LASTEXITCODE
    $diagnosticLines = @($buildOutput | ForEach-Object { $_.ToString() } | Where-Object { $_ -match ': (warning|error) [A-Za-z]{2,}\d+:' })
    $changedDiagnostics = @()

    foreach ($line in $diagnosticLines) {
        $lowerLine = $line.ToLowerInvariant()
        foreach ($file in $changedCSharpFiles) {
            $relativeNeedle = $file.ToLowerInvariant().Replace('/', '\')
            $absoluteNeedle = (Join-Path $RepoRoot $file.Replace('/', '\')).ToLowerInvariant()
            if ($lowerLine.Contains($relativeNeedle) -or $lowerLine.Contains($absoluteNeedle)) {
                $changedDiagnostics += $line
                break
            }
        }
    }

    $changedDiagnostics = Get-UniqueLines $changedDiagnostics

    if ($changedDiagnostics.Count -gt 0) {
        $changedDiagnostics | ForEach-Object { Write-Host $_ -ForegroundColor Red }
        Write-Host ""
        Write-Host "[FAIL] Changed C# files introduced analyzer or compiler violations." -ForegroundColor Red
        $Failed = $true
    } elseif ($buildExitCode -ne 0) {
        Write-Host "[FAIL] Solution build failed outside the changed-file filter. Commit is blocked until the repository builds cleanly." -ForegroundColor Red
        $Failed = $true
    } else {
        Write-Host "[PASS] No analyzer/compiler violations in changed C# files." -ForegroundColor Green
    }
}

Write-Header "[2/5] C# changed-file coverage gate (threshold: 80%)"
if ($changedProductionCSharpFiles.Count -eq 0) {
    Write-Host "[SKIP] No changed production C# files." -ForegroundColor Yellow
} else {
    if (Test-Path $CoverageRoot) {
        Remove-Item $CoverageRoot -Recurse -Force
    }

    $CSharpCoverageRoot = Join-Path $CoverageRoot "csharp"
    New-Item -ItemType Directory -Path $CSharpCoverageRoot -Force | Out-Null

    $domainExit = Invoke-CSharpCoverage "Tests\SettleSpace.Domain.Tests\SettleSpace.Domain.Tests.csproj" (Join-Path $CSharpCoverageRoot "domain\coverage") $DotNetArtifactsRoot
    $infrastructureExit = Invoke-CSharpCoverage "Tests\SettleSpace.Infrastructure.Tests\SettleSpace.Infrastructure.Tests.csproj" (Join-Path $CSharpCoverageRoot "infrastructure\coverage") $DotNetArtifactsRoot
    $applicationExit = Invoke-CSharpCoverage "Tests\SettleSpace.Application.Tests\SettleSpace.Application.Tests.csproj" (Join-Path $CSharpCoverageRoot "application\coverage") $DotNetArtifactsRoot

    if ($domainExit -ne 0 -or $infrastructureExit -ne 0 -or $applicationExit -ne 0) {
        Write-Host "[FAIL] One or more C# test projects failed before coverage evaluation." -ForegroundColor Red
        $Failed = $true
    } else {
        node .\scripts\check-coverage.mjs `
            --mode csharp `
            --scope changed `
            --repo-root $RepoRoot `
            --threshold 80 `
            --changed-list $ChangedListPath `
            --report (Join-Path $CSharpCoverageRoot "domain\coverage.json") `
            --report (Join-Path $CSharpCoverageRoot "infrastructure\coverage.json") `
            --report (Join-Path $CSharpCoverageRoot "application\coverage.json")

        if ($LASTEXITCODE -ne 0) {
            Write-Host "[FAIL] Changed production C# files are below 80% coverage." -ForegroundColor Red
            $Failed = $true
        } else {
            Write-Host "[PASS] Changed production C# coverage gate passed." -ForegroundColor Green
        }
    }
}

Write-Header "[3/5] React/TS changed-file ESLint gate"
if ($changedReactFiles.Count -eq 0) {
    Write-Host "[SKIP] No changed React/TS files." -ForegroundColor Yellow
} else {
    $eslintTargets = @($changedReactFiles | ForEach-Object { $_ -replace '^settlespace-react/', '' })
    Set-Location "$RepoRoot\settlespace-react"
    & npx eslint --max-warnings=0 $eslintTargets
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[FAIL] ESLint found violations in changed React/TS files." -ForegroundColor Red
        $Failed = $true
    } else {
        Write-Host "[PASS] No ESLint violations in changed React/TS files." -ForegroundColor Green
    }
}

Write-Header "[4/5] Repo JS/MJS changed-file ESLint gate"
if ($changedScriptLintFiles.Count -eq 0) {
    Write-Host "[SKIP] No changed repo JS/MJS script files." -ForegroundColor Yellow
} else {
    $scriptLintTargets = @($changedScriptLintFiles | ForEach-Object { $_ -replace '^scripts/', '' })
    Set-Location "$RepoRoot\scripts"
    & npx eslint --max-warnings=0 $scriptLintTargets
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[FAIL] ESLint found violations in changed repo JS/MJS script files." -ForegroundColor Red
        $Failed = $true
    } else {
        Write-Host "[PASS] No ESLint violations in changed repo JS/MJS script files." -ForegroundColor Green
    }
}

Write-Header "[5/5] React/TS changed-file coverage gate (threshold: 80%)"
if ($changedProductionReactFiles.Count -eq 0) {
    Write-Host "[SKIP] No changed production React/TS files." -ForegroundColor Yellow
} else {
    Set-Location "$RepoRoot\settlespace-react"
    $reactCoverageTargets = @($changedProductionReactFiles | ForEach-Object { $_ -replace '^settlespace-react/', '' })
    if (Test-Path ".\coverage") {
        Remove-Item ".\coverage" -Recurse -Force
    }

    $env:CI = "true"
    & npm test -- --coverage --coverageReporters=json-summary --watchAll=false --runInBand --findRelatedTests $reactCoverageTargets
    $reactTestExit = $LASTEXITCODE
    Remove-Item Env:CI -ErrorAction SilentlyContinue

    if ($reactTestExit -ne 0) {
        Write-Host "[FAIL] React/TS tests failed before changed-file coverage evaluation." -ForegroundColor Red
        $Failed = $true
    } else {
        node ..\scripts\check-coverage.mjs `
            --mode react `
            --scope changed `
            --repo-root $RepoRoot `
            --threshold 80 `
            --changed-list $ChangedListPath `
            --report (Join-Path $RepoRoot "settlespace-react\coverage\coverage-summary.json")

        if ($LASTEXITCODE -ne 0) {
            Write-Host "[FAIL] Changed production React/TS files are below 80% coverage." -ForegroundColor Red
            $Failed = $true
        } else {
            Write-Host "[PASS] Changed production React/TS coverage gate passed." -ForegroundColor Green
        }
    }
}

Set-Location $RepoRoot
Write-Host ""

if ($Failed) {
    Write-Host "=======================================================" -ForegroundColor Red
    Write-Host "  CHANGED-CODE CHECKS FAILED. Commit is blocked." -ForegroundColor Red
    Write-Host "  Resolve the issues above, then re-run .\scripts\checks\run-checks.ps1" -ForegroundColor Red
    Write-Host "=======================================================" -ForegroundColor Red
    exit 1
}

Write-Host "=======================================================" -ForegroundColor Green
Write-Host "  Changed-code quality gates passed." -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
exit 0