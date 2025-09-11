@echo off
echo ========================================
echo Artifex.AI Simple Start
echo ========================================
echo.

:: Kill all existing processes
echo Cleaning up existing processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM chrome.exe 2>nul
timeout /t 2 /nobreak >nul

:: Navigate to app directory
cd /d C:\WORK\Artifex.AI\app

:: Clean cache
echo Cleaning cache...
rmdir /s /q node_modules\.vite 2>nul
rmdir /s /q dist-electron 2>nul

:: Start the app using the existing dev script with port 5174
echo.
echo Starting Artifex.AI...
echo.

:: Set environment variables
set VITE_PORT=5174
set ELECTRON_START_URL=http://localhost:5174
set NODE_ENV=development

:: Run dev script which handles both Vite and Electron
echo Starting Artifex.AI Desktop Application...
echo This will open as a desktop window, not in browser.
echo.
npm run dev

pause