function Get-SonarProjectProperty([string]$RepoRoot, [string]$PropertyName) {
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

function Show-SonarDuplicationWarning([string]$ProjectKey, [string]$BranchName, [string]$Token, [int]$TopFiles = 10) {
    if ([string]::IsNullOrWhiteSpace($ProjectKey) -or [string]::IsNullOrWhiteSpace($Token)) {
        return
    }

    try {
        $metricsUri = "https://sonarcloud.io/api/measures/component?component=$([Uri]::EscapeDataString($ProjectKey))&metricKeys=duplicated_lines_density,duplicated_lines,duplicated_blocks"
        if (-not [string]::IsNullOrWhiteSpace($BranchName)) {
            $metricsUri += "&branch=$([Uri]::EscapeDataString($BranchName))"
        }

        $metricsResponse = Invoke-RestMethod -Method Get -Uri $metricsUri -Headers (Get-SonarAuthHeader $Token)
        $metricMap = @{}
        foreach ($measure in @($metricsResponse.component.measures)) {
            $metricMap[$measure.metric] = $measure.value
        }

        $duplicatedLines = if ($metricMap.ContainsKey('duplicated_lines')) { [int]$metricMap['duplicated_lines'] } else { 0 }
        $duplicatedBlocks = if ($metricMap.ContainsKey('duplicated_blocks')) { [int]$metricMap['duplicated_blocks'] } else { 0 }
        $duplicatedDensity = if ($metricMap.ContainsKey('duplicated_lines_density')) { [double]$metricMap['duplicated_lines_density'] } else { 0 }

        if ($duplicatedLines -le 0 -and $duplicatedBlocks -le 0) {
            return
        }

        Write-Host ("[warn] Sonar duplication detected: duplicated_lines_density={0:N1}%, duplicated_lines={1}, duplicated_blocks={2}." -f $duplicatedDensity, $duplicatedLines, $duplicatedBlocks) -ForegroundColor Yellow

        $treeUri = "https://sonarcloud.io/api/measures/component_tree?component=$([Uri]::EscapeDataString($ProjectKey))&metricKeys=duplicated_lines_density,duplicated_lines,duplicated_blocks&qualifiers=FIL&ps=500&p=1"
        if (-not [string]::IsNullOrWhiteSpace($BranchName)) {
            $treeUri += "&branch=$([Uri]::EscapeDataString($BranchName))"
        }

        $treeResponse = Invoke-RestMethod -Method Get -Uri $treeUri -Headers (Get-SonarAuthHeader $Token)
        $rankedFiles = @(
            foreach ($component in @($treeResponse.components)) {
                $fileMetricMap = @{}
                foreach ($measure in @($component.measures)) {
                    $fileMetricMap[$measure.metric] = $measure.value
                }

                $fileDuplicatedLines = if ($fileMetricMap.ContainsKey('duplicated_lines')) { [int]$fileMetricMap['duplicated_lines'] } else { 0 }
                $fileDuplicatedBlocks = if ($fileMetricMap.ContainsKey('duplicated_blocks')) { [int]$fileMetricMap['duplicated_blocks'] } else { 0 }

                if ($fileDuplicatedLines -le 0 -and $fileDuplicatedBlocks -le 0) {
                    continue
                }

                $componentPath = if ($component.key -match '^[^:]+:(.+)$') { $Matches[1] } else { $component.path }
                [pscustomobject]@{
                    Path = $componentPath
                    DuplicatedLinesDensity = if ($fileMetricMap.ContainsKey('duplicated_lines_density')) { [double]$fileMetricMap['duplicated_lines_density'] } else { 0 }
                    DuplicatedLines = $fileDuplicatedLines
                    DuplicatedBlocks = $fileDuplicatedBlocks
                }
            }
        ) | Sort-Object @(
            @{ Expression = { $_.DuplicatedLinesDensity }; Descending = $true },
            @{ Expression = { $_.DuplicatedLines }; Descending = $true },
            @{ Expression = { $_.Path }; Descending = $false }
        )

        if ($rankedFiles.Count -eq 0) {
            return
        }

        Write-Host ("[warn] Top duplicated files from SonarCloud (up to {0}):" -f [Math]::Min($TopFiles, $rankedFiles.Count)) -ForegroundColor Yellow
        $rankedFiles | Select-Object -First $TopFiles | ForEach-Object {
            Write-Host ("  - {0} - duplicated_lines_density={1:N1}%, duplicated_lines={2}, duplicated_blocks={3}" -f $_.Path, $_.DuplicatedLinesDensity, $_.DuplicatedLines, $_.DuplicatedBlocks) -ForegroundColor Yellow
        }
    } catch {
        Write-Host ("[warn] Unable to fetch Sonar duplication summary: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
    }
}