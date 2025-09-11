@echo off
echo ========================================
echo   Artifex.AI Studio - Desktop Application
echo ========================================
echo.

REM Kill any existing processes
echo Cleaning up existing processes...
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM node.exe 2>nul
taskkill /F /IM chrome.exe 2>nul
timeout /t 2 /nobreak >nul

REM Change to app directory
cd /d C:\WORK\Artifex.AI\app

REM Check if node_modules exists
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Set environment variable for port
set VITE_PORT=5174
set NODE_ENV=development

echo Starting Artifex.AI Studio as Desktop Application...
echo Port: %VITE_PORT%
echo.
echo NOTE: The app will open as a desktop window, not in browser!
echo.

REM Run the development server with Electron
call npm run dev

if errorlevel 1 (
    echo.
    echo ========================================
    echo Error starting application!
    echo Please check the error messages above.
    echo ========================================
)

pause