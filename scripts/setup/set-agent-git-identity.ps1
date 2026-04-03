# scripts/setup/set-agent-git-identity.ps1
#
# Configures or clears the repo-local Git identity used for agent-authored commits.
# Examples:
#   .\scripts\setup\set-agent-git-identity.ps1
#   .\scripts\setup\set-agent-git-identity.ps1 -Name "fo-test-agent" -Email "fo-test-agent@local"
#   .\scripts\setup\set-agent-git-identity.ps1 -RequireReviewedBy
#   .\scripts\setup\set-agent-git-identity.ps1 -ClearLocalIdentity

[CmdletBinding()]
param(
    [string]$Name = "fo-test-agent",
    [string]$Email = "fo-test-agent@local",
    [string]$AgentLabel = "GitHub Copilot",
    [switch]$RequireReviewedBy,
    [switch]$ClearLocalIdentity
)

$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$GitDirectory = Join-Path $RepoRoot ".git"

function Format-ConfigValue {
    param(
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return "<inherited or unset>"
    }

    return $Value
}

if (-not (Test-Path $GitDirectory)) {
    Write-Error "ERROR: .git directory not found. Are you in the fo-test repository?"
    exit 1
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "ERROR: git was not found on PATH."
    exit 1
}

Push-Location $RepoRoot
try {
    if ($ClearLocalIdentity) {
        foreach ($key in @(
            "user.name",
            "user.email",
            "fotest.agentName",
            "fotest.agentEmail",
            "fotest.agentTrailer",
            "fotest.requireReviewedBy"
        )) {
            & git config --local --unset-all $key 2>$null | Out-Null
        }

        Write-Host "Cleared repo-local agent identity overrides." -ForegroundColor Green
    }
    else {
        $requireReviewedByValue = "false"
        if ($RequireReviewedBy.IsPresent) {
            $requireReviewedByValue = "true"
        }

        & git config --local user.name $Name
        & git config --local user.email $Email
        & git config --local fotest.agentName $Name
        & git config --local fotest.agentEmail $Email
        & git config --local fotest.agentTrailer $AgentLabel
        & git config --local fotest.requireReviewedBy $requireReviewedByValue

        Write-Host "Configured repo-local agent identity for this repository." -ForegroundColor Green
    }

    $currentName = & git config --get user.name 2>$null
    $currentEmail = & git config --get user.email 2>$null
    $currentAgentLabel = & git config --get fotest.agentTrailer 2>$null
    $currentRequireReviewedBy = & git config --bool --get fotest.requireReviewedBy 2>$null

    if ([string]::IsNullOrWhiteSpace($currentAgentLabel)) {
        $currentAgentLabel = "GitHub Copilot"
    }

    if ([string]::IsNullOrWhiteSpace($currentRequireReviewedBy)) {
        $currentRequireReviewedBy = "false"
    }

    Write-Host ""
    Write-Host "Active repo-local Git identity:"
    Write-Host "  user.name  = $(Format-ConfigValue $currentName)"
    Write-Host "  user.email = $(Format-ConfigValue $currentEmail)"
    Write-Host ""
    Write-Host "Agent commit policy values:"
    Write-Host "  Agent trailer       = Agent: $currentAgentLabel"
    Write-Host "  Require Reviewed-by = $currentRequireReviewedBy"

    if (-not $ClearLocalIdentity) {
        Write-Host ""
        Write-Host "Example agent commit message:"
        Write-Host "  chore(scope): describe the change"
        Write-Host ""
        Write-Host "  Agent: $currentAgentLabel"

        if ($RequireReviewedBy.IsPresent) {
            Write-Host "  Reviewed-by: <human name>"
        }
    }
    else {
        Write-Host ""
        Write-Host "This repo will now inherit your normal Git identity again." -ForegroundColor Yellow
    }
}
finally {
    Pop-Location
}
