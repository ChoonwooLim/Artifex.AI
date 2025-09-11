@echo off
echo ============================================
echo   Starting PopOS Worker on 10.0.0.2:8000
echo ============================================
echo.
echo Checking network interface...

:: Check if 10.0.0.2 is available
ping -n 1 10.0.0.2 >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] 10.0.0.2 is not configured on this system!
    echo.
    echo To set up 10.0.0.2 as a fixed IP:
    echo 1. Open Network Settings
    echo 2. Edit your network adapter
    echo 3. Add IP address: 10.0.0.2
    echo 4. Subnet mask: 255.255.255.0
    echo.
    echo Starting on localhost instead...
    python popos_worker_local.py
) else (
    echo [OK] 10.0.0.2 is configured
    echo Starting PopOS Worker...
    python popos_worker.py
)

pause