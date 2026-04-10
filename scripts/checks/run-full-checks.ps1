# scripts/checks/run-full-checks.ps1
#
# Runs the full-base quality gates across the repository:
#   1. C# build + analyzers on the full solution
#      - warnings/errors remain blocking
#      - info/suggestion cosmetic diagnostics are surfaced as non-blocking warnings
#   2. C# coverage on the full production codebase (threshold: 80%)
#   3. React/TS ESLint on the full frontend source tree
#   4. Repo JS/MJS ESLint on the full scripts tree
#   5. React/TS coverage on the full production frontend codebase (threshold: 80%)

$ErrorActionPreference = "Continue"

$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $RepoRoot

$LibRoot = Join-Path $RepoRoot "scripts\lib"
. (Join-Path $LibRoot "common.ps1")
. (Join-Path $LibRoot "coverage.ps1")
. (Join-Path $LibRoot "sonar.ps1")

$Failed = $false

Import-RepoDotEnv -RepoRoot $RepoRoot
$CoverageRoot = Join-Path $RepoRoot "artifacts\coverage\full"
$CSharpCoverageRoot = Join-Path $CoverageRoot "csharp"
$ReactCoverageRoot = Join-Path $CoverageRoot "react"
$DotNetArtifactsRoot = Join-Path $RepoRoot "artifacts\tmp-dotnet\full\$(Get-Date -Format 'yyyyMMdd-HHmmss')"

if (Test-Path $CoverageRoot) {
    Remove-Item $CoverageRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $CSharpCoverageRoot -Force | Out-Null
New-Item -ItemType Directory -Path $ReactCoverageRoot -Force | Out-Null
New-Item -ItemType Directory -Path $DotNetArtifactsRoot -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $CSharpCoverageRoot "domain") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $CSharpCoverageRoot "infrastructure") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $CSharpCoverageRoot "application") -Force | Out-Null

Write-Header "[1/5] C# full-base build + code-smell analysis"
Write-Host "Isolated .NET artifacts: $DotNetArtifactsRoot" -ForegroundColor DarkGray
$buildOutput = @(dotnet build SettleSpace.sln -t:Rebuild --artifacts-path $DotNetArtifactsRoot /p:TreatWarningsAsErrors=true /nr:false 2>&1)
$buildExitCode = $LASTEXITCODE
$buildLines = @($buildOutput | ForEach-Object { $_.ToString() })
$blockingDiagnostics = Get-DotNetDiagnosticLines -OutputLines $buildLines -AllowedSeverities @("warning", "error")

if ($buildExitCode -ne 0) {
    if ($blockingDiagnostics.Count -gt 0) {
        $blockingDiagnostics | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    }

    Write-Host ""
    Write-Host "[FAIL] Full-base C# build has blocking analyzer violations." -ForegroundColor Red
    $Failed = $true
} else {
    Write-Host "[PASS] Full-base C# build passed." -ForegroundColor Green
}

if ($buildExitCode -eq 0) {
    $cosmeticResult = Invoke-DotNetFormatDiagnostics -RepoRoot $RepoRoot

    if ($cosmeticResult.TechnicalFailure) {
        Write-Host "[FAIL] dotnet format could not evaluate full-base .NET cosmetic diagnostics." -ForegroundColor Red
        $Failed = $true
    } else {
        Show-DotNetDiagnosticReport `
            -Title "Full-base .NET cosmetic diagnostics are present (non-blocking)." `
            -Diagnostics $cosmeticResult.Diagnostics `
            -EmptyMessage "No non-blocking .NET cosmetic diagnostics in the full solution." `
            -FollowUpNote "Agents should fix these on touched files or note a short deferral reason. Do not suppress or ignore them."
    }
} else {
    Write-Host "[SKIP] Full-base .NET cosmetic diagnostics were skipped because the build did not complete." -ForegroundColor Yellow
}

Write-Header "[2/5] C# full-base coverage (threshold: 80%)"

$DomainExit = Invoke-CSharpCoverage "Tests\SettleSpace.Domain.Tests\SettleSpace.Domain.Tests.csproj" (Join-Path $CSharpCoverageRoot "domain\coverage") $DotNetArtifactsRoot
$InfrastructureExit = Invoke-CSharpCoverage "Tests\SettleSpace.Infrastructure.Tests\SettleSpace.Infrastructure.Tests.csproj" (Join-Path $CSharpCoverageRoot "infrastructure\coverage") $DotNetArtifactsRoot
$ApplicationExit = Invoke-CSharpCoverage "Tests\SettleSpace.Application.Tests\SettleSpace.Application.Tests.csproj" (Join-Path $CSharpCoverageRoot "application\coverage") $DotNetArtifactsRoot

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
Set-Location "$RepoRoot\settlespace-react"
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
Set-Location "$RepoRoot\settlespace-react"
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
        --report (Join-Path $RepoRoot "settlespace-react\coverage\coverage-summary.json")

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
        $hasTechnicalFailure = $false

        if ($scannerExitCode -ne 0) {
            $scannerText = ($scannerLines -join "`n")
            if ($scannerText -match 'QUALITY GATE STATUS:\s*FAILED') {
                Show-SonarQualityGateSummary -ProjectKey $projectKey -BranchName $branchName -Token $env:SONAR_TOKEN
            } else {
                Show-SonarTechnicalErrors -ScannerLines $scannerLines
                $hasTechnicalFailure = $true
            }
        }

        if (-not $hasTechnicalFailure) {
            Show-SonarIssueSummary -ProjectKey $projectKey -BranchName $branchName -Token $env:SONAR_TOKEN -Types @('CODE_SMELL') -SummaryLabel 'Sonar unresolved maintainability issues on analyzed branch'
            Show-SonarDuplicationWarning -ProjectKey $projectKey -BranchName $branchName -Token $env:SONAR_TOKEN
        }

        if ($scannerExitCode -ne 0) {
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
