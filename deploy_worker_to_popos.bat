@echo off
echo ============================================
echo PopOS GPU Worker Remote Deploy Script
echo ============================================
echo.

REM Deploy the worker script to PopOS
echo Deploying worker script to PopOS (10.0.0.2)...
echo.

REM Create the worker script locally first
echo Creating worker script...
copy popos_worker_remote.py temp_worker.py >nul 2>&1

REM Use PowerShell to copy via SSH (requires SSH key setup)
echo Copying to PopOS...
powershell -Command "scp temp_worker.py choon@10.0.0.2:~/popos_worker.py"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to copy worker script to PopOS.
    echo Please ensure:
    echo 1. SSH keys are configured
    echo 2. PopOS machine is accessible at 10.0.0.2
    echo 3. User 'choon' exists on PopOS
    echo.
    echo Alternatively, manually copy popos_worker_remote.py to PopOS.
    del temp_worker.py >nul 2>&1
    pause
    exit /b 1
)

del temp_worker.py >nul 2>&1

echo.
echo Worker script deployed successfully!
echo.
echo ============================================
echo Starting PopOS Worker...
echo ============================================
echo.

REM Start the worker on PopOS
echo Starting worker on PopOS...
powershell -Command "ssh choon@10.0.0.2 'nohup python3 ~/popos_worker.py > worker.log 2>&1 &'"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to start worker on PopOS.
    echo Please manually SSH to PopOS and run:
    echo   python3 ~/popos_worker.py
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo PopOS Worker Started Successfully!
echo ============================================
echo.
echo Worker is running at: http://10.0.0.2:8000
echo.
echo To check status, open: http://10.0.0.2:8000
echo To check Flash Attention: http://10.0.0.2:8000/flash/status
echo To check GPU info: http://10.0.0.2:8000/gpu/info
echo.
echo You can now use Flash Attention in the app!
echo.
pause