# scripts/run-full-checks.ps1
#
# Runs the full-base quality gates across the repository:
#   1. C# build + analyzers on the full solution
#   2. C# coverage on the full production codebase (threshold: 80%)
#   3. React/TS ESLint on the full frontend source tree
#   4. Repo JS/MJS ESLint on the full scripts tree
#   5. React/TS coverage on the full production frontend codebase (threshold: 80%)

$ErrorActionPreference = "Continue"

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

$LibRoot = Join-Path $PSScriptRoot "lib"
. (Join-Path $LibRoot "common.ps1")
. (Join-Path $LibRoot "coverage.ps1")
. (Join-Path $LibRoot "sonar.ps1")

$Failed = $false

Import-RepoDotEnv -RepoRoot $RepoRoot
$CoverageRoot = Join-Path $RepoRoot "artifacts\coverage\full"
$CSharpCoverageRoot = Join-Path $CoverageRoot "csharp"
$ReactCoverageRoot = Join-Path $CoverageRoot "react"

if (Test-Path $CoverageRoot) {
    Remove-Item $CoverageRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $CSharpCoverageRoot -Force | Out-Null
New-Item -ItemType Directory -Path $ReactCoverageRoot -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $CSharpCoverageRoot "domain") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $CSharpCoverageRoot "infrastructure") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $CSharpCoverageRoot "application") -Force | Out-Null

Write-Header "[1/5] C# full-base build + code-smell analysis"
dotnet build FoTestApi.sln -t:Rebuild /p:TreatWarningsAsErrors=true
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[FAIL] Full-base C# build has analyzer violations." -ForegroundColor Red
    $Failed = $true
} else {
    Write-Host "[PASS] Full-base C# build passed." -ForegroundColor Green
}

Write-Header "[2/5] C# full-base coverage (threshold: 80%)"

$DomainExit = Invoke-CSharpCoverage "Tests\FoTestApi.Domain.Tests\FoTestApi.Domain.Tests.csproj" (Join-Path $CSharpCoverageRoot "domain\coverage")
$InfrastructureExit = Invoke-CSharpCoverage "Tests\FoTestApi.Infrastructure.Tests\FoTestApi.Infrastructure.Tests.csproj" (Join-Path $CSharpCoverageRoot "infrastructure\coverage")
$ApplicationExit = Invoke-CSharpCoverage "Tests\FoTestApi.Application.Tests\FoTestApi.Application.Tests.csproj" (Join-Path $CSharpCoverageRoot "application\coverage")

if ($DomainExit -ne 0 -or $InfrastructureExit -ne 0 -or $ApplicationExit -ne 0) {
    Write-Host ""
    Write-Host "[FAIL] One or more C# test projects failed before coverage evaluation." -ForegroundColor Red
    $Failed = $true
} else {
    node .\scripts\check-coverage.mjs `
        --mode csharp `
        --scope full `
        --repo-root $RepoRoot `
        --threshold 80 `
        --report (Join-Path $CSharpCoverageRoot "domain\coverage.json") `
        --report (Join-Path $CSharpCoverageRoot "infrastructure\coverage.json") `
        --report (Join-Path $CSharpCoverageRoot "application\coverage.json")

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[FAIL] Full-base C# coverage is below 80%." -ForegroundColor Red
        $Failed = $true
    } else {
        Write-Host "[PASS] Full-base C# coverage gate passed." -ForegroundColor Green
    }
}

Write-Header "[3/5] React/TS full-base ESLint"
Set-Location "$RepoRoot\fotest-react"
npx eslint src --ext .ts,.tsx --max-warnings=0
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[FAIL] Full-base React/TS ESLint found violations." -ForegroundColor Red
    $Failed = $true
} else {
    Write-Host "[PASS] Full-base React/TS ESLint passed." -ForegroundColor Green
}

Write-Header "[4/5] Repo JS/MJS full-base ESLint"
Set-Location "$RepoRoot\scripts"
npx eslint . --ext .js,.cjs,.mjs --max-warnings=0
if ($LASTEXITCODE -ne 0) {
    Write-Host "" 
    Write-Host "[FAIL] Full-base repo JS/MJS ESLint found violations." -ForegroundColor Red
    $Failed = $true
} else {
    Write-Host "[PASS] Full-base repo JS/MJS ESLint passed." -ForegroundColor Green
}

Write-Header "[5/5] React/TS full-base coverage (threshold: 80%)"
Set-Location "$RepoRoot\fotest-react"
$env:CI = "true"
npm test -- --coverage --coverageReporters=json-summary --coverageReporters=lcov --watchAll=false --runInBand
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[FAIL] React/TS tests failed before full-base coverage evaluation." -ForegroundColor Red
    $Failed = $true
} else {
    node ..\scripts\check-coverage.mjs `
        --mode react `
        --scope full `
        --repo-root $RepoRoot `
        --threshold 80 `
        --report (Join-Path $RepoRoot "fotest-react\coverage\coverage-summary.json")

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[FAIL] Full-base React/TS coverage is below 80%." -ForegroundColor Red
        $Failed = $true
    } else {
        Write-Host "[PASS] Full-base React/TS coverage gate passed." -ForegroundColor Green
    }
}
Remove-Item Env:CI -ErrorAction SilentlyContinue

$runSonarScanner = $env:SONAR_SCANNER_ENABLED -eq "1" -or $env:SONAR_SCANNER_ENABLED -eq "true"
if ($runSonarScanner) {
    Write-Header "[optional] SonarScanner parity analysis"
    Set-Location $RepoRoot

    if (-not (Get-Command "sonar-scanner" -ErrorAction SilentlyContinue)) {
        Write-Host "[FAIL] SONAR_SCANNER_ENABLED is set, but sonar-scanner is not available on PATH." -ForegroundColor Red
        $Failed = $true
    } elseif (-not $env:SONAR_TOKEN) {
        Write-Host "[FAIL] SONAR_SCANNER_ENABLED is set, but SONAR_TOKEN is missing." -ForegroundColor Red
        $Failed = $true
    } else {
        $projectKey = Get-SonarProjectProperty -RepoRoot $RepoRoot -PropertyName "sonar.projectKey"
        $branchName = Get-GitBranchName
        $sonarArgs = @(
            "--define",
            "sonar.token=$($env:SONAR_TOKEN)",
            "--define",
            "sonar.qualitygate.wait=true",
            "--define",
            "sonar.qualitygate.timeout=300"
        )

        $scannerLines = @(& sonar-scanner @sonarArgs 2>&1)
        $scannerExitCode = $LASTEXITCODE

        if ($scannerExitCode -ne 0) {
            $scannerText = ($scannerLines -join "`n")
            if ($scannerText -match 'QUALITY GATE STATUS:\s*FAILED') {
                Show-SonarQualityGateSummary -ProjectKey $projectKey -BranchName $branchName -Token $env:SONAR_TOKEN
                Show-SonarIssueSummary -ProjectKey $projectKey -BranchName $branchName -Token $env:SONAR_TOKEN
            } else {
                Show-SonarTechnicalErrors -ScannerLines $scannerLines
            }

            Write-Host "[FAIL] Optional SonarScanner parity analysis failed." -ForegroundColor Red
            $Failed = $true
        } else {
            Write-Host "[PASS] Optional SonarScanner parity analysis passed." -ForegroundColor Green
        }
    }
}

Set-Location $RepoRoot
Write-Host ""

if ($Failed) {
    Write-Host "=======================================================" -ForegroundColor Red
    Write-Host "  FULL-BASE CHECKS FAILED." -ForegroundColor Red
    Write-Host "=======================================================" -ForegroundColor Red
    exit 1
}

Write-Host "=======================================================" -ForegroundColor Green
Write-Host "  Full-base quality gates passed." -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
exit 0
