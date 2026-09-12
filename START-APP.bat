@echo off
title Silent Spirits Legacy — Meditation App
echo ========================================
echo   SILENT SPIRITS LEGACY
echo   Starting local server...
echo ========================================
echo.
echo Your app will be available at:
echo   http://localhost:8888/src/web/player.html
echo.
echo Press Ctrl+C to stop the server
echo.

C:\Users\aundr\.platformio\python3\python.exe "D:\Projects\Silent-Spirits-Legacy\meditation-app\src\web\server.py"

pause
