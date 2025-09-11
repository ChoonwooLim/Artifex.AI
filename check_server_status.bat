@echo off
echo ============================================
echo   PopOS Worker Server Status Check
echo ============================================
echo.

echo [1] Checking if 10.0.0.2 is configured...
ping -n 1 10.0.0.2 >nul 2>&1
if %errorlevel% equ 0 (
    echo    [OK] 10.0.0.2 is reachable
) else (
    echo    [FAIL] 10.0.0.2 is NOT configured
    echo.
    echo    Please configure 10.0.0.2 as a network interface:
    echo    - For WSL2: Add to /etc/netplan/ or use ifconfig
    echo    - For Windows: Network adapter settings
    echo    - For Virtual Network: Check adapter settings
)

echo.
echo [2] Checking if port 8000 is in use...
netstat -an | findstr :8000 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo    [OK] Port 8000 is LISTENING
    netstat -an | findstr :8000 | findstr LISTENING
) else (
    echo    [FAIL] Port 8000 is NOT listening
    echo    Server is NOT running!
)

echo.
echo [3] Testing HTTP connection...
powershell -Command "(Invoke-WebRequest -Uri 'http://10.0.0.2:8000/' -UseBasicParsing -TimeoutSec 2).StatusCode" >nul 2>&1
if %errorlevel% equ 0 (
    echo    [OK] Server is responding
) else (
    echo    [FAIL] Server is NOT responding
)

echo.
echo ============================================
echo   Recommended Actions:
echo ============================================
echo.
echo If server is not running:
echo   1. Run: python popos_worker.py
echo   2. Or double-click: start_popos_worker.bat
echo.
echo If 10.0.0.2 is not configured:
echo   1. Check your network settings
echo   2. Or use localhost version: python popos_worker_local.py
echo.
pause