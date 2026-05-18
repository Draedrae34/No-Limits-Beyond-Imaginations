# Specialized environment setup for Silent Spirits Legacy
# Bypasses restricted execution policy for the current session and activates the virtual environment.

Write-Host "🌌 Initializing Workshop Environment..." -ForegroundColor Cyan

# Set policy for the current process to allow the activation script to run
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned -Force

if (Test-Path ".\venv\Scripts\Activate.ps1") { & .\venv\Scripts\Activate.ps1 }
else { Write-Error "Virtual environment not found at .\venv" }