# scripts/run-checks.ps1
#
# Runs the changed-code quality gates used by agents and git hooks:
#   1. C# build + analyzers, filtered to diagnostics in changed C# files
#   2. C# coverage on changed production C# files (threshold: 80%)
#   3. React/TS ESLint on changed frontend files
#   4. Repo JS/MJS ESLint on changed script files
#   5. React/TS coverage on changed production frontend files (threshold: 80%)

$ErrorActionPreference = "Continue"

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

$Failed = $false
$ArtifactsRoot = Join-Path $RepoRoot "artifacts"
$CoverageRoot = Join-Path $ArtifactsRoot "coverage\changed"
$ChangedListPath = Join-Path $ArtifactsRoot "changed-files.txt"

function Write-Header([string]$Text) {
    Write-Host ""
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "=======================================================" -ForegroundColor Cyan
}

function Get-UniqueLines([string[]]$Lines) {
    return @($Lines | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Sort-Object -Unique)
}

function Get-ChangedContext {
    param()

    $staged = Get-UniqueLines @(git diff --cached --name-only --diff-filter=ACMR)
    if ($staged.Count -gt 0) {
        return @{ Source = "staged changes"; Files = $staged }
    }

    $workingTree = Get-UniqueLines @(git diff --name-only --diff-filter=ACMR HEAD 2>$null)
    $untracked = Get-UniqueLines @(git ls-files --others --exclude-standard)
    $workingFiles = Get-UniqueLines @($workingTree + $untracked)
    if ($workingFiles.Count -gt 0) {
        return @{ Source = "working tree changes"; Files = $workingFiles }
    }

    $upstream = git rev-parse --abbrev-ref --symbolic-full-name "@{upstream}" 2>$null
    if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($upstream)) {
        $upstreamFiles = Get-UniqueLines @(git diff --name-only --diff-filter=ACMR "$upstream...HEAD")
        return @{ Source = "changes since $upstream"; Files = $upstreamFiles }
    }

    git rev-parse --verify "HEAD~1" 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $lastCommitFiles = Get-UniqueLines @(git diff --name-only --diff-filter=ACMR "HEAD~1..HEAD")
        return @{ Source = "last commit"; Files = $lastCommitFiles }
    }

    return @{ Source = "tracked files"; Files = Get-UniqueLines @(git ls-files) }
}

function Is-ProductionCSharpFile([string]$Path) {
    return $Path -match '^FoTestApi\.(Application|Domain|Infrastructure)/.*\.cs$' -and $Path -notmatch '/Program\.cs$'
}

function Is-ReactFile([string]$Path) {
    return $Path -match '^fotest-react/src/.*\.(ts|tsx)$'
}

function Is-ProductionReactFile([string]$Path) {
    return (Is-ReactFile $Path) -and $Path -notmatch '\.test\.(ts|tsx)$' -and $Path -notmatch '/setupTests\.ts$' -and $Path -notmatch '/index\.tsx$' -and $Path -notmatch '/reportWebVitals\.ts$' -and $Path -notmatch '/react-app-env\.d\.ts$'
}

function Is-ScriptLintFile([string]$Path) {
    return $Path -match '^scripts/.*\.(js|cjs|mjs)$'
}

function Invoke-CSharpCoverage([string]$ProjectPath, [string]$OutputPrefix) {
    $outputDirectory = Split-Path -Parent $OutputPrefix
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

    dotnet test $ProjectPath `
        /p:CollectCoverage=true `
        /p:CoverletOutputFormat=json `
        /p:CoverletOutput=$OutputPrefix | Out-Host
    return $LASTEXITCODE
}

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
Set-Content -Path $ChangedListPath -Value $changedFiles

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
    $buildOutput = @(dotnet build FoTestApi.sln -t:Rebuild 2>&1)
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

    $domainExit = Invoke-CSharpCoverage "Tests\FoTestApi.Domain.Tests\FoTestApi.Domain.Tests.csproj" (Join-Path $CSharpCoverageRoot "domain\coverage")
    $infrastructureExit = Invoke-CSharpCoverage "Tests\FoTestApi.Infrastructure.Tests\FoTestApi.Infrastructure.Tests.csproj" (Join-Path $CSharpCoverageRoot "infrastructure\coverage")
    $applicationExit = Invoke-CSharpCoverage "Tests\FoTestApi.Application.Tests\FoTestApi.Application.Tests.csproj" (Join-Path $CSharpCoverageRoot "application\coverage")

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
    $eslintTargets = @($changedReactFiles | ForEach-Object { $_ -replace '^fotest-react/', '' })
    Set-Location "$RepoRoot\fotest-react"
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
    Set-Location "$RepoRoot\fotest-react"
    $reactCoverageTargets = @($changedProductionReactFiles | ForEach-Object { $_ -replace '^fotest-react/', '' })
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
            --report (Join-Path $RepoRoot "fotest-react\coverage\coverage-summary.json")

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
    Write-Host "  Resolve the issues above, then re-run .\scripts\run-checks.ps1" -ForegroundColor Red
    Write-Host "=======================================================" -ForegroundColor Red
    exit 1
}

Write-Host "=======================================================" -ForegroundColor Green
Write-Host "  Changed-code quality gates passed." -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
exit 0