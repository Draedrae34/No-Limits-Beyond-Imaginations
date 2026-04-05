#!/usr/bin/env pwsh
# Installs recommended VS Code extensions and Python tooling.
$extensions = @(
  'ms-python.python',
  'ms-python.vscode-pylance',
  'ms-toolsai.jupyter',
  'eamodio.gitlens',
  'GitHub.copilot',
  'VisualStudioExptTeam.vscodeintellicode',
  'ms-azuretools.vscode-docker',
  'dbaeumer.vscode-eslint'
)

function Install-Extension($ext) {
  Write-Host "Installing extension: $ext"
  & code --install-extension $ext --force
  if ($LASTEXITCODE -ne 0) { Write-Warning "Failed to install $ext with code CLI." }
}

foreach ($ext in $extensions) { Install-Extension $ext }

Write-Host "Installing Python CLI packages (black, flake8, mypy, isort, pylint, pytest)..."
python -m pip install --user black flake8 mypy isort pylint pytest

Write-Host "Done. Enable Settings Sync in VS Code and sign in to sync these settings across devices."
