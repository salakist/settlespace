function Invoke-CSharpCoverage([string]$ProjectPath, [string]$OutputPrefix) {
    $outputDirectory = Split-Path -Parent $OutputPrefix
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

    dotnet test $ProjectPath `
        /p:CollectCoverage=true `
        /p:CoverletOutputFormat=json `
        /p:CoverletOutput=$OutputPrefix | Out-Host
    return $LASTEXITCODE
}