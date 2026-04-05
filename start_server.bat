@echo off
echo Starting NLBL Website Server...
echo.
echo Open your browser and go to:
echo   http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo.
uv run python -m http.server 8080
