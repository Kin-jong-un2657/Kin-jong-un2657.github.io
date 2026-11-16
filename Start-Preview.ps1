$ErrorActionPreference = 'Stop'
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$previewNode = if ($nodeCommand) { $nodeCommand.Source } else { Join-Path $env:TEMP 'academic-cv-runtime\node-v22.23.5-win-x64\node.exe' }
if (-not (Test-Path -LiteralPath $previewNode -PathType Leaf)) {
    throw 'Install Node.js 22.13 or newer, then run this preview again.'
}
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'dist\index.html') -PathType Leaf)) {
    throw 'Build the website first: npm ci, then npm run build inside portfolio-site.'
}
& $previewNode (Join-Path $PSScriptRoot 'scripts\serve.mjs')
exit $LASTEXITCODE
