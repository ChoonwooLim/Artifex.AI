@echo off
echo === Installing All AI Models for Offline Use ===
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
echo === Downloading All Required Models ===
echo.

echo [1/3] Downloading LLaVA (Multimodal - Image + Text) ~4.7GB...
"%OLLAMA_HOME%\ollama.exe" pull llava:7b
if %errorlevel% neq 0 (
    echo WARNING: Failed to download LLaVA
) else (
    echo SUCCESS: LLaVA downloaded
)

echo.
echo [2/3] Downloading Mistral (Fast Text Only) ~4.1GB...
"%OLLAMA_HOME%\ollama.exe" pull mistral:7b
if %errorlevel% neq 0 (
    echo WARNING: Failed to download Mistral
) else (
    echo SUCCESS: Mistral downloaded
)

echo.
echo [3/3] Downloading Llama 3.2 Vision (Latest Multimodal) ~6.5GB...
"%OLLAMA_HOME%\ollama.exe" pull llama3.2-vision:11b
if %errorlevel% neq 0 (
    echo WARNING: Failed to download Llama 3.2 Vision
) else (
    echo SUCCESS: Llama 3.2 Vision downloaded
)

echo.
echo === Installation Complete ===
echo.
echo Installed Models:
"%OLLAMA_HOME%\ollama.exe" list

echo.
echo Total download size: ~15GB
echo Models are now ready for offline use!
echo.
pause