@echo off
echo === Setting up Qwen2-VL-7B Model ===
echo.

:: Check if Ollama is installed
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Ollama is not installed or not in PATH.
    echo Please install Ollama first using install-ollama.bat
    pause
    exit /b 1
)

:: Start Ollama service if not running
echo Starting Ollama service...
start /B ollama serve

:: Wait for service to start
timeout /t 3 /nobreak >nul

:: Pull the model
echo.
echo Downloading Qwen2-VL-7B model (approximately 7GB)...
echo This may take 10-30 minutes depending on your internet speed.
echo.

ollama pull qwen2-vl:7b

if %errorlevel% neq 0 (
    echo.
    echo Failed to pull qwen2-vl:7b. Trying alternative model...
    ollama pull llava:7b
    
    if %errorlevel% neq 0 (
        echo Failed to download models. Please check your connection.
        pause
        exit /b 1
    )
)

:: List models
echo.
echo Available models:
ollama list

echo.
echo === Setup Complete ===
echo The model is ready to use!
echo.
pause