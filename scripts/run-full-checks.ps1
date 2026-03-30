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

$Failed = $false

# Load .env from repo root if present.
# Values in .env are only applied when the corresponding env var is not already set,
# so an env var set in the calling shell always takes precedence.
$dotEnvPath = Join-Path $RepoRoot ".env"
if (Test-Path $dotEnvPath) {
    foreach ($line in Get-Content $dotEnvPath) {
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
            $key   = $Matches[1]
            $value = $Matches[2]
            if (-not (Get-Item -Path "Env:$key" -ErrorAction SilentlyContinue)) {
                Set-Item -Path "Env:$key" -Value $value
            }
        }
    }
}
$CoverageRoot = Join-Path $RepoRoot "artifacts\coverage\full"
$CSharpCoverageRoot = Join-Path $CoverageRoot "csharp"
$ReactCoverageRoot = Join-Path $CoverageRoot "react"

function Write-Header([string]$Text) {
    Write-Host ""
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "=======================================================" -ForegroundColor Cyan
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

function Get-SonarProjectProperty([string]$PropertyName) {
    $configPath = Join-Path $RepoRoot "sonar-project.properties"
    if (-not (Test-Path $configPath)) {
        return $null
    }

    foreach ($line in Get-Content $configPath) {
        if ($line -match '^\s*([^=]+)=(.*)$' -and $Matches[1].Trim() -eq $PropertyName) {
            return $Matches[2].Trim()
        }
    }

    return $null
}

function Get-GitBranchName {
    $branchName = git rev-parse --abbrev-ref HEAD 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($branchName) -or $branchName -eq 'HEAD') {
        return $null
    }

    return $branchName.Trim()
}

function Get-SonarAuthHeader([string]$Token) {
    $encoded = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${Token}:"))
    return @{ Authorization = "Basic $encoded" }
}

function Show-SonarTechnicalErrors([string[]]$ScannerLines) {
    Write-Host "[info] Sonar technical error summary:" -ForegroundColor Yellow
    $errorLines = @($ScannerLines | Where-Object {
        $_ -match 'ERROR|EXECUTION FAILURE|HttpException|Caused by:|QUALITY GATE STATUS'
    })

    if ($errorLines.Count -eq 0) {
        $errorLines = @($ScannerLines | Select-Object -Last 20)
    }

    $errorLines | Select-Object -First 25 | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Yellow
    }
}

function Show-SonarQualityGateSummary([string]$ProjectKey, [string]$BranchName, [string]$Token) {
    if ([string]::IsNullOrWhiteSpace($ProjectKey)) {
        return
    }

    $uri = "https://sonarcloud.io/api/qualitygates/project_status?projectKey=$([Uri]::EscapeDataString($ProjectKey))"
    if (-not [string]::IsNullOrWhiteSpace($BranchName)) {
        $uri += "&branch=$([Uri]::EscapeDataString($BranchName))"
    }

    try {
        $response = Invoke-RestMethod -Method Get -Uri $uri -Headers (Get-SonarAuthHeader $Token)
        $projectStatus = $response.projectStatus
        Write-Host ("[info] Sonar quality gate status: {0}" -f $projectStatus.status) -ForegroundColor Yellow

        $failingConditions = @($projectStatus.conditions | Where-Object { $_.status -eq 'ERROR' })
        if ($failingConditions.Count -eq 0) {
            Write-Host "[info] No failing quality gate conditions were returned by the API." -ForegroundColor Yellow
            return
        }

        Write-Host "[info] Failing quality gate conditions:" -ForegroundColor Yellow
        $failingConditions | ForEach-Object {
            Write-Host ("  - {0}: actual={1}, threshold={2}, comparator={3}" -f $_.metricKey, $_.actualValue, $_.errorThreshold, $_.comparator) -ForegroundColor Yellow
        }

        $failingMetricKeys = @($failingConditions | ForEach-Object { $_.metricKey })
        if ($failingMetricKeys -contains 'new_security_hotspots_reviewed') {
            Show-SonarHotspotLikelyLocation -ProjectKey $ProjectKey -BranchName $BranchName -Token $Token
        }

        if (@($failingMetricKeys | Where-Object { $_ -match 'coverage' }).Count -gt 0) {
            Show-SonarLowestCoveredFiles -ProjectKey $ProjectKey -BranchName $BranchName -Token $Token -Limit 10
        }
    } catch {
        Write-Host ("[warn] Unable to fetch Sonar quality gate summary: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
    }
}

function Show-SonarHotspotLikelyLocation([string]$ProjectKey, [string]$BranchName, [string]$Token) {
    if ([string]::IsNullOrWhiteSpace($ProjectKey)) {
        return
    }

    $uri = "https://sonarcloud.io/api/hotspots/search?projectKey=$([Uri]::EscapeDataString($ProjectKey))&status=TO_REVIEW&ps=5&p=1"
    if (-not [string]::IsNullOrWhiteSpace($BranchName)) {
        $uri += "&branch=$([Uri]::EscapeDataString($BranchName))"
    }

    try {
        $response = Invoke-RestMethod -Method Get -Uri $uri -Headers (Get-SonarAuthHeader $Token)
        $hotspots = @($response.hotspots)

        if ($hotspots.Count -eq 0) {
            Write-Host "[info] No unreviewed hotspots were returned by the API." -ForegroundColor Yellow
            return
        }

        $hotspot = $hotspots[0]
        $componentPath = if ($hotspot.component -match '^[^:]+:(.+)$') { $Matches[1] } else { $hotspot.component }
        $line = if ($null -ne $hotspot.line) { $hotspot.line } else { '?' }
        $messageSource = if ($null -ne $hotspot.message -and -not [string]::IsNullOrWhiteSpace($hotspot.message)) {
            $hotspot.message
        } elseif ($null -ne $hotspot.ruleName -and -not [string]::IsNullOrWhiteSpace($hotspot.ruleName)) {
            $hotspot.ruleName
        } else {
            'Unreviewed hotspot candidate'
        }
        $message = ($messageSource -replace '\s+', ' ').Trim()

        Write-Host "[info] Likely unreviewed hotspot location:" -ForegroundColor Yellow
        Write-Host ("  - {0}:{1} {2}" -f $componentPath, $line, $message) -ForegroundColor Yellow

        $total = if ($null -ne $response.paging -and $null -ne $response.paging.total) {
            [int]$response.paging.total
        } elseif ($null -ne $response.total) {
            [int]$response.total
        } else {
            $hotspots.Count
        }

        if ($total -gt 1) {
            Write-Host ("[info] ... and {0} more unreviewed hotspot candidate(s)." -f ($total - 1)) -ForegroundColor Yellow
        }
    } catch {
        Write-Host ("[warn] Unable to fetch Sonar hotspot summary: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
    }
}

function Show-SonarLowestCoveredFiles([string]$ProjectKey, [string]$BranchName, [string]$Token, [int]$Limit = 10) {
    if ([string]::IsNullOrWhiteSpace($ProjectKey)) {
        return
    }

    $metricKeys = 'new_coverage,coverage'
    $pageSize = 500
    $page = 1
    $allComponents = @()

    try {
        do {
            $uri = "https://sonarcloud.io/api/measures/component_tree?component=$([Uri]::EscapeDataString($ProjectKey))&metricKeys=$([Uri]::EscapeDataString($metricKeys))&qualifiers=FIL&ps=$pageSize&p=$page"
            if (-not [string]::IsNullOrWhiteSpace($BranchName)) {
                $uri += "&branch=$([Uri]::EscapeDataString($BranchName))"
            }

            $response = Invoke-RestMethod -Method Get -Uri $uri -Headers (Get-SonarAuthHeader $Token)
            $components = @($response.components)
            $allComponents += $components

            $total = if ($null -ne $response.paging -and $null -ne $response.paging.total) {
                [int]$response.paging.total
            } else {
                $allComponents.Count
            }

            $page += 1
        } while ($allComponents.Count -lt $total -and $components.Count -gt 0)

        $rankedFiles = @(
            foreach ($component in $allComponents) {
                $measureMap = @{}
                foreach ($measure in @($component.measures)) {
                    $measureValue = $null
                    if ($null -ne $measure.value -and -not [string]::IsNullOrWhiteSpace([string]$measure.value)) {
                        $measureValue = [double]$measure.value
                    } elseif ($null -ne $measure.period -and $null -ne $measure.period.value -and -not [string]::IsNullOrWhiteSpace([string]$measure.period.value)) {
                        $measureValue = [double]$measure.period.value
                    }

                    if ($null -ne $measureValue) {
                        $measureMap[$measure.metric] = $measureValue
                    }
                }

                if (-not $measureMap.ContainsKey('new_coverage') -and -not $measureMap.ContainsKey('coverage')) {
                    continue
                }

                $componentPath = if ($component.key -match '^[^:]+:(.+)$') { $Matches[1] } else { $component.path }
                $primaryMetric = if ($measureMap.ContainsKey('new_coverage')) { 'new_coverage' } else { 'coverage' }
                $primaryValue = [double]$measureMap[$primaryMetric]
                $overallCoverage = if ($measureMap.ContainsKey('coverage')) { [double]$measureMap['coverage'] } else { $null }

                [pscustomobject]@{
                    Path = $componentPath
                    PrimaryMetric = $primaryMetric
                    PrimaryValue = $primaryValue
                    OverallCoverage = $overallCoverage
                }
            }
        ) | Sort-Object PrimaryValue, Path

        if ($rankedFiles.Count -eq 0) {
            Write-Host "[info] No file-level Sonar coverage measures were returned by the API." -ForegroundColor Yellow
            return
        }

        Write-Host ("[info] {0} lowest covered file(s) from SonarCloud:" -f [Math]::Min($Limit, $rankedFiles.Count)) -ForegroundColor Yellow
        $rankedFiles | Select-Object -First $Limit | ForEach-Object {
            if ($null -ne $_.OverallCoverage -and $_.PrimaryMetric -ne 'coverage') {
                Write-Host ("  - {0} - {1}={2:N2}% (coverage={3:N2}%)" -f $_.Path, $_.PrimaryMetric, $_.PrimaryValue, $_.OverallCoverage) -ForegroundColor Yellow
            } else {
                Write-Host ("  - {0} - {1}={2:N2}%" -f $_.Path, $_.PrimaryMetric, $_.PrimaryValue) -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host ("[warn] Unable to fetch Sonar file coverage summary: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
    }
}

function Show-SonarIssueSummary([string]$ProjectKey, [string]$BranchName, [string]$Token) {
    if ([string]::IsNullOrWhiteSpace($ProjectKey)) {
        return
    }

    $uri = "https://sonarcloud.io/api/issues/search?componentKeys=$([Uri]::EscapeDataString($ProjectKey))&resolved=false&ps=20&p=1&s=FILE_LINE"
    if (-not [string]::IsNullOrWhiteSpace($BranchName)) {
        $uri += "&branch=$([Uri]::EscapeDataString($BranchName))"
    }

    try {
        $response = Invoke-RestMethod -Method Get -Uri $uri -Headers (Get-SonarAuthHeader $Token)
        $issues = @($response.issues)
        Write-Host ("[info] Sonar unresolved issues on analyzed branch: {0}" -f $response.total) -ForegroundColor Yellow

        if ($issues.Count -eq 0) {
            Write-Host "[info] No unresolved issues were returned by the API." -ForegroundColor Yellow
            return
        }

        $issues | ForEach-Object {
            $componentPath = if ($_.component -match '^[^:]+:(.+)$') { $Matches[1] } else { $_.component }
            $line = if ($null -ne $_.line) { $_.line } else { '?' }
            $message = ($_.message -replace '\s+', ' ').Trim()
            Write-Host ("  - [{0}/{1}] {2}:{3} {4} ({5})" -f $_.type, $_.severity, $componentPath, $line, $message, $_.rule) -ForegroundColor Yellow
        }

        if ($response.total -gt $issues.Count) {
            Write-Host ("[info] ... and {0} more unresolved issue(s)." -f ($response.total - $issues.Count)) -ForegroundColor Yellow
        }
    } catch {
        Write-Host ("[warn] Unable to fetch Sonar issue summary: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
    }
}

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
        $projectKey = Get-SonarProjectProperty "sonar.projectKey"
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
