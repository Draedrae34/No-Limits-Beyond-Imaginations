param()

# Installer script: installs recommended extensions and copies workspace settings to the current user profile (Windows)
$repoRoot = Resolve-Path "$PSScriptRoot\.." | Select-Object -ExpandProperty Path
$vscodeDir = Join-Path $repoRoot ".vscode"

Write-Output "Repository root: $repoRoot"

if (-not (Get-Command code -ErrorAction SilentlyContinue)) {
  Write-Error "The 'code' CLI is not available. Open VS Code and run 'Shell Command: Install 'code' command in PATH' or add code to PATH."
  exit 1
}

$extFile = Join-Path $vscodeDir "extensions.json"
if (Test-Path $extFile) {
  $json = Get-Content $extFile -Raw | ConvertFrom-Json
  foreach ($id in $json.recommendations) {
    Write-Output "Installing extension: $id"
    code --install-extension $id --force | Out-Null
  }
}
else {
  Write-Warning "No extensions.json found at $extFile"
}

$targetUser = Join-Path $env:APPDATA "Code\User"
if (-not (Test-Path $targetUser)) { New-Item -ItemType Directory -Path $targetUser -Force | Out-Null }

$srcSettings = Join-Path $vscodeDir "settings.json"
$srcKey = Join-Path $vscodeDir "keybindings.json"

if (Test-Path $srcSettings) {
  $dst = Join-Path $targetUser "settings.json"
  if (Test-Path $dst) { Copy-Item $dst "$dst.bak" -Force }
  Copy-Item $srcSettings $dst -Force
  Write-Output "Copied settings.json to $dst (backup created if existed)."
}

if (Test-Path $srcKey) {
  $dstk = Join-Path $targetUser "keybindings.json"
  if (Test-Path $dstk) { Copy-Item $dstk "$dstk.bak" -Force }
  Copy-Item $srcKey $dstk -Force
  Write-Output "Copied keybindings.json to $dstk (backup created if existed)."
}

Write-Output "Done. Please open VS Code, verify the extensions are installed, then enable/verify Settings Sync to merge personal settings across devices."
