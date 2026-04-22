@echo off
setlocal

REM Runs a simple local server for the Exercise Timer app.
REM Uses the workspace virtualenv if available.

cd /d "%~dp0"

echo.
echo Open: http://localhost:5173/
echo.

set "PY=%~dp0..\.venv\Scripts\python.exe"

if exist "%PY%" (
  echo Using venv: %PY%
  "%PY%" -m http.server 5173 --bind 0.0.0.0
) else (
  echo Venv python not found at: %PY%
  echo Falling back to system Python...
  py -3 -m http.server 5173 --bind 0.0.0.0
)

endlocal
