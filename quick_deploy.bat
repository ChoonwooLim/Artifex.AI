@echo off
echo ====================================================
echo PopOS WAN Server Quick Deployment
echo ====================================================
echo.
echo This will deploy the high-performance WAN server to PopOS
echo Target: choon@10.0.0.2
echo.
echo Prerequisites:
echo   - SSH access to PopOS server
echo   - Python 3.10+ on PopOS
echo   - NVIDIA drivers installed on PopOS
echo.
pause

echo.
echo [1/3] Running deployment script...
python deploy_to_popos.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Deployment failed! Check the errors above.
    pause
    exit /b 1
)

echo.
echo [2/3] Waiting for server to start...
timeout /t 10 /nobreak

echo.
echo [3/3] Running server tests...
python test_popos_server.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================================
    echo SUCCESS! PopOS WAN Server is ready!
    echo ====================================================
    echo.
    echo Access points:
    echo   - API: http://10.0.0.2:8001/api/v1
    echo   - Health: http://10.0.0.2:8001/health
    echo   - GPU Info: http://10.0.0.2:8001/api/v1/gpu/info
    echo.
    echo To start using:
    echo   1. Open Artifex.AI app
    echo   2. Go to Dual GPU System menu
    echo   3. Start PopOS Server
    echo.
) else (
    echo.
    echo ====================================================
    echo WARNING: Some tests failed
    echo ====================================================
    echo.
    echo Manual verification needed:
    echo   1. SSH to server: ssh choon@10.0.0.2
    echo   2. Check logs: cd ~/wan_server
    echo   3. Start manually: python3 popos_wan_server_pro.py
    echo.
)

pause