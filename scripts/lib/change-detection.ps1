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