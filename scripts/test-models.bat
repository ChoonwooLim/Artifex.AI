@echo off
echo === Testing Installed Models ===
echo.

cd /d "%~dp0\.."
set OLLAMA_HOME=%CD%\ollama-local
set OLLAMA_MODELS=%CD%\models

echo Available models:
"%OLLAMA_HOME%\ollama.exe" list
echo.

echo Testing text generation with Mistral...
echo "Hello, can you help me?" | "%OLLAMA_HOME%\ollama.exe" run mistral:7b
echo.

echo Testing image with LLaVA (requires image file)...
echo To test image: ollama run llava:7b "describe this image" < image.jpg
echo.

pause