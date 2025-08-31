@echo off
echo === Starting Local Ollama Server ===
echo.

cd /d "%~dp0\.."
set OLLAMA_HOME=%CD%\ollama-local
set OLLAMA_MODELS=%CD%\models
set OLLAMA_HOST=127.0.0.1:11434

if not exist "%OLLAMA_HOME%\ollama.exe" (
    echo ERROR: ollama.exe not found!
    pause
    exit /b 1
)

echo Starting Ollama server on localhost:11434...
"%OLLAMA_HOME%\ollama.exe" serve

pause