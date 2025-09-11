@echo off
echo ============================================
echo   PopOS Connection Diagnostic Tool
echo ============================================
echo.

echo [1] Checking network interfaces...
echo --------------------------------------------
ipconfig | findstr /C:"IPv4" /C:"Ethernet" /C:"Wi-Fi" /C:"WSL"
echo.

echo [2] Checking port 8000 status...
echo --------------------------------------------
netstat -an | findstr :8000
if %errorlevel% neq 0 (
    echo [!] Port 8000 is not in use
    echo     Server is NOT running
) else (
    echo [+] Port 8000 is active
)
echo.

echo [3] Testing localhost connection...
echo --------------------------------------------
ping -n 1 127.0.0.1 >nul 2>&1
if %errorlevel% equ 0 (
    echo [+] Localhost (127.0.0.1) is reachable
) else (
    echo [!] Localhost is not reachable (network issue)
)
echo.

echo [4] Checking Python installation...
echo --------------------------------------------
python --version 2>nul
if %errorlevel% neq 0 (
    echo [!] Python is not installed or not in PATH
) else (
    echo [+] Python is installed
)
echo.

echo [5] Checking firewall rules...
echo --------------------------------------------
netsh advfirewall firewall show rule name="PopOS Worker" >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Firewall rule for PopOS Worker not found
    echo     Run auto_start_worker.bat as Administrator to add rule
) else (
    echo [+] Firewall rule exists for PopOS Worker
)
echo.

echo [6] Testing server connection...
echo --------------------------------------------
curl -s http://localhost:8000/ >nul 2>&1
if %errorlevel% equ 0 (
    echo [+] Server is responding at http://localhost:8000
    curl -s http://localhost:8000/ | python -m json.tool 2>nul
) else (
    echo [!] Server is NOT responding
    echo     Please run: python popos_worker_local.py
)
echo.

echo [7] Checking WSL status (if applicable)...
echo --------------------------------------------
wsl --status >nul 2>&1
if %errorlevel% equ 0 (
    echo [+] WSL is installed
    wsl -l -v 2>nul
) else (
    echo [-] WSL is not installed (not required for local mode)
)
echo.

echo ============================================
echo   Diagnostic Complete
echo ============================================
echo.
echo Quick Fix Steps:
echo 1. Run 'auto_start_worker.bat' as Administrator
echo 2. If still not working, restart Windows
echo 3. Check Windows Defender Firewall settings
echo.
pause