@echo off
echo ========================================
echo   Artifex.AI Desktop Application
echo ========================================
echo.

:: Kill existing processes
echo Cleaning up existing processes...
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

:: Start the app using the fixed CommonJS script
echo.
echo Starting application...
node start-dev.cjs

pause