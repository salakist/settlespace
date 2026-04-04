function Invoke-CSharpCoverage(
    [string]$ProjectPath,
    [string]$OutputPrefix,
    [string]$ArtifactsPath = ""
) {
    $resolvedOutputPrefix = [System.IO.Path]::GetFullPath($OutputPrefix)
    $outputDirectory = Split-Path -Parent $resolvedOutputPrefix
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

    $dotnetArgs = @(
        'test'
        $ProjectPath
        '--nologo'
        '/nr:false'
        '--blame-hang-timeout'
        '30s'
        '/p:CollectCoverage=true'
        '/p:CoverletOutputFormat=json'
        "/p:CoverletOutput=$resolvedOutputPrefix"
    )

    if (-not [string]::IsNullOrWhiteSpace($ArtifactsPath)) {
        $dotnetArgs += @('--artifacts-path', $ArtifactsPath)
    }

    & dotnet @dotnetArgs | Out-Host
    return $LASTEXITCODE
}