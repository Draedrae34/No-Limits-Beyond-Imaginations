@echo off
REM Start the local meditation app server without interactive prompts
REM Usage: double-click this file or run from cmd in the repo root

REM Ensure we're running from the repository root (this file's directory)
pushd %~dp0

nREM Prefer the virtualenv python if available
nIF EXIST ".\.venv\Scripts\python.exe" (
    .\.venv\Scripts\python.exe .\meditation-app\src\web\server.py
) ELSE (
    python .\meditation-app\src\web\server.py
)

POPd
