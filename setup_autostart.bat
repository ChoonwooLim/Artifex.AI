@echo off
echo ============================================
echo   Setup Auto-Start for PopOS Worker
echo ============================================
echo.
echo This will add PopOS Worker to Windows startup
echo.

:: 관리자 권한 확인
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] This script requires Administrator privileges!
    echo     Right-click and select "Run as Administrator"
    pause
    exit /b 1
)

:: 옵션 선택
echo Choose setup method:
echo [1] Add to Windows Startup folder (User level)
echo [2] Create Windows Service (System level - Recommended)
echo [3] Create Scheduled Task (Flexible)
echo [4] Skip auto-start setup
echo.
choice /C 1234 /M "Select option"

if errorlevel 4 goto :end
if errorlevel 3 goto :scheduled_task
if errorlevel 2 goto :windows_service
if errorlevel 1 goto :startup_folder

:startup_folder
echo.
echo Setting up Startup folder method...
set "startupFolder=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
echo Creating startup shortcut...

:: VBS 스크립트로 숨김 실행 생성
echo Set WshShell = CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut.vbs"
echo Set oShellLink = WshShell.CreateShortcut("%startupFolder%\PopOS Worker.lnk") >> "%TEMP%\CreateShortcut.vbs"
echo oShellLink.TargetPath = "C:\WORK\Artifex.AI\auto_start_worker.bat" >> "%TEMP%\CreateShortcut.vbs"
echo oShellLink.WindowStyle = 7 >> "%TEMP%\CreateShortcut.vbs"
echo oShellLink.IconLocation = "C:\Windows\System32\cmd.exe" >> "%TEMP%\CreateShortcut.vbs"
echo oShellLink.Description = "PopOS GPU Worker Server" >> "%TEMP%\CreateShortcut.vbs"
echo oShellLink.WorkingDirectory = "C:\WORK\Artifex.AI" >> "%TEMP%\CreateShortcut.vbs"
echo oShellLink.Save >> "%TEMP%\CreateShortcut.vbs"

cscript //nologo "%TEMP%\CreateShortcut.vbs"
del "%TEMP%\CreateShortcut.vbs"

echo [+] Startup shortcut created successfully!
goto :end

:windows_service
echo.
echo Setting up Windows Service...

:: Python 서비스 래퍼 생성
echo import win32serviceutil > "%CD%\worker_service.py"
echo import win32service >> "%CD%\worker_service.py"
echo import win32event >> "%CD%\worker_service.py"
echo import servicemanager >> "%CD%\worker_service.py"
echo import socket >> "%CD%\worker_service.py"
echo import sys >> "%CD%\worker_service.py"
echo import os >> "%CD%\worker_service.py"
echo. >> "%CD%\worker_service.py"
echo sys.path.append(r'C:\WORK\Artifex.AI') >> "%CD%\worker_service.py"
echo. >> "%CD%\worker_service.py"
echo class PopOSWorkerService(win32serviceutil.ServiceFramework): >> "%CD%\worker_service.py"
echo     _svc_name_ = "PopOSWorker" >> "%CD%\worker_service.py"
echo     _svc_display_name_ = "PopOS GPU Worker Service" >> "%CD%\worker_service.py"
echo     _svc_description_ = "GPU Worker Server for Artifex.AI" >> "%CD%\worker_service.py"
echo. >> "%CD%\worker_service.py"
echo     def __init__(self, args): >> "%CD%\worker_service.py"
echo         win32serviceutil.ServiceFramework.__init__(self, args) >> "%CD%\worker_service.py"
echo         self.hWaitStop = win32event.CreateEvent(None, 0, 0, None) >> "%CD%\worker_service.py"
echo         socket.setdefaulttimeout(60) >> "%CD%\worker_service.py"
echo. >> "%CD%\worker_service.py"
echo     def SvcStop(self): >> "%CD%\worker_service.py"
echo         self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING) >> "%CD%\worker_service.py"
echo         win32event.SetEvent(self.hWaitStop) >> "%CD%\worker_service.py"
echo. >> "%CD%\worker_service.py"
echo     def SvcDoRun(self): >> "%CD%\worker_service.py"
echo         import popos_worker_local >> "%CD%\worker_service.py"
echo. >> "%CD%\worker_service.py"
echo if __name__ == '__main__': >> "%CD%\worker_service.py"
echo     win32serviceutil.HandleCommandLine(PopOSWorkerService) >> "%CD%\worker_service.py"

echo.
echo [!] Windows Service requires pywin32 package
echo     Install with: pip install pywin32
echo     Then run: python worker_service.py install
echo     Start with: net start PopOSWorker
goto :end

:scheduled_task
echo.
echo Creating Scheduled Task...

:: 스케줄 태스크 생성
schtasks /create /tn "PopOS Worker Server" /tr "C:\WORK\Artifex.AI\auto_start_worker.bat" /sc onlogon /rl highest /f

echo [+] Scheduled task created successfully!
echo.
echo To manage the task:
echo - Start: schtasks /run /tn "PopOS Worker Server"
echo - Stop: schtasks /end /tn "PopOS Worker Server"
echo - Delete: schtasks /delete /tn "PopOS Worker Server" /f
goto :end

:end
echo.
echo ============================================
echo Setup complete!
echo.
echo To test the connection:
echo 1. Restart your computer
echo 2. Open test_connection.html in browser
echo 3. Or run diagnose_connection.bat
echo ============================================
pause