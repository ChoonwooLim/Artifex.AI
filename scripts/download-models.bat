@echo off
echo === Downloading AI Models ===
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
echo Available models to download:
echo 1. llava:7b (Multimodal - Image + Text) ~4.7GB
echo 2. mistral:7b (Fast Text Only) ~4.1GB
echo 3. llama2:7b (General Purpose) ~3.8GB
echo 4. codellama:7b (Code Generation) ~3.8GB
echo.

choice /C 1234A /M "Select model (1-4) or A for All"

if %errorlevel%==1 goto MODEL1
if %errorlevel%==2 goto MODEL2
if %errorlevel%==3 goto MODEL3
if %errorlevel%==4 goto MODEL4
if %errorlevel%==5 goto ALLMODELS

:MODEL1
echo Downloading LLaVA (Multimodal)...
"%OLLAMA_HOME%\ollama.exe" pull llava:7b
goto END

:MODEL2
echo Downloading Mistral...
"%OLLAMA_HOME%\ollama.exe" pull mistral:7b
goto END

:MODEL3
echo Downloading Llama 2...
"%OLLAMA_HOME%\ollama.exe" pull llama2:7b
goto END

:MODEL4
echo Downloading CodeLlama...
"%OLLAMA_HOME%\ollama.exe" pull codellama:7b
goto END

:ALLMODELS
echo Downloading all models...
"%OLLAMA_HOME%\ollama.exe" pull llava:7b
"%OLLAMA_HOME%\ollama.exe" pull mistral:7b
"%OLLAMA_HOME%\ollama.exe" pull llama2:7b
"%OLLAMA_HOME%\ollama.exe" pull codellama:7b

:END
echo.
echo === Download Complete ===
echo.
"%OLLAMA_HOME%\ollama.exe" list
pause