@echo off
echo === Installing Ollama for Windows ===
echo.

:: Download Ollama installer
echo Downloading Ollama installer...
curl -L -o "%TEMP%\OllamaSetup.exe" https://ollama.com/download/OllamaSetup.exe

if %errorlevel% neq 0 (
    echo Failed to download Ollama installer.
    pause
    exit /b 1
)

:: Install Ollama
echo Installing Ollama...
"%TEMP%\OllamaSetup.exe"

echo.
echo Installation wizard launched. Please complete the installation.
echo After installation, run setup-qwen2-vl.bat to download the model.
echo.
pause