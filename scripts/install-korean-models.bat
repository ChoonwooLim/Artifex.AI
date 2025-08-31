@echo off
echo === Installing Korean-Optimized AI Models ===
echo.

cd /d "%~dp0\.."
set OLLAMA_HOME=%CD%\ollama-local
set OLLAMA_MODELS=%CD%\models
set PATH=%OLLAMA_HOME%;%PATH%

echo Checking Ollama...
"%OLLAMA_HOME%\ollama.exe" --version
if %errorlevel% neq 0 (
    echo ERROR: Ollama not working properly
    pause
    exit /b 1
)

echo.
echo Starting Ollama server...
start /B "%OLLAMA_HOME%\ollama.exe" serve

timeout /t 5 /nobreak >nul

echo.
echo === Korean Language Optimized Models ===
echo.

echo [1/3] Downloading EEVE Korean (한국어 특화) ~4.1GB...
"%OLLAMA_HOME%\ollama.exe" pull eeve:latest
if %errorlevel% neq 0 (
    echo WARNING: Failed to download EEVE
) else (
    echo SUCCESS: EEVE downloaded
)

echo.
echo [2/3] Downloading Qwen2.5 (다국어 지원) ~4.3GB...
"%OLLAMA_HOME%\ollama.exe" pull qwen2.5:7b
if %errorlevel% neq 0 (
    echo WARNING: Failed to download Qwen2.5
) else (
    echo SUCCESS: Qwen2.5 downloaded
)

echo.
echo [3/3] Downloading Gemma2 Korean (한국어 최적화) ~5.0GB...
"%OLLAMA_HOME%\ollama.exe" pull gemma2:9b
if %errorlevel% neq 0 (
    echo WARNING: Failed to download Gemma2
) else (
    echo SUCCESS: Gemma2 downloaded
)

echo.
echo === Installation Complete ===
echo.
echo Installed Models:
"%OLLAMA_HOME%\ollama.exe" list

echo.
echo Korean-optimized models are ready!
echo.
pause