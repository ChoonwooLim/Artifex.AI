@echo off
echo ============================================
echo   PopOS Worker Auto-Start Script
echo ============================================
echo.

:: 방화벽 규칙 추가 (관리자 권한 필요)
echo [1/4] Checking firewall rules...
netsh advfirewall firewall show rule name="PopOS Worker" >nul 2>&1
if %errorlevel% neq 0 (
    echo Adding firewall rule for port 8000...
    netsh advfirewall firewall add rule name="PopOS Worker" dir=in action=allow protocol=TCP localport=8000
    netsh advfirewall firewall add rule name="PopOS Worker Out" dir=out action=allow protocol=TCP localport=8000
) else (
    echo Firewall rule already exists.
)

:: Python 경로 확인
echo.
echo [2/4] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python not found in PATH!
    echo Please install Python or add it to PATH.
    pause
    exit /b 1
)

:: 서버 프로세스 확인
echo.
echo [3/4] Checking if server is already running...
netstat -an | findstr :8000 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo Server is already running on port 8000
    echo.
    choice /C YN /M "Kill existing server and restart?"
    if errorlevel 2 goto :skip_kill
    
    :: 기존 Python 프로세스 종료
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 >nul
)
:skip_kill

:: 서버 시작
echo.
echo [4/4] Starting PopOS Worker Server...
echo ============================================
echo Server URL: http://localhost:8000
echo Press Ctrl+C to stop
echo ============================================
echo.

cd /d "C:\WORK\Artifex.AI"
python popos_worker_local.py