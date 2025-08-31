@echo off
echo === Local Ollama Setup ===
echo.

REM Set local paths
set OLLAMA_HOME=%CD%\ollama-local
set OLLAMA_MODELS=%CD%\models
set PATH=%OLLAMA_HOME%;%PATH%

REM Check if Ollama exists
if not exist "%OLLAMA_HOME%\ollama.exe" (
    echo ERROR: ollama.exe not found in ollama-local folder
    echo Please download and extract Ollama first
    pause
    exit /b 1
)

echo Starting local Ollama server...
start /B "%OLLAMA_HOME%\ollama.exe" serve

REM Wait for server to start
timeout /t 5 /nobreak >nul

echo.
echo Downloading models...
echo.

REM Download models
echo 1. Downloading LLaVA (multimodal - image+text)...
"%OLLAMA_HOME%\ollama.exe" pull llava:7b

echo.
echo 2. Downloading Mistral (fast text model)...
"%OLLAMA_HOME%\ollama.exe" pull mistral:7b

echo.
echo === Setup Complete ===
echo Models are ready for offline use!
echo.
pause