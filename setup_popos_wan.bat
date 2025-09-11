@echo off
echo ========================================
echo PopOS WAN Server Setup Script
echo ========================================
echo.

echo Step 1: Deploy WAN server to PopOS...
scp popos_wan_server.py choon@10.0.0.2:~/

echo.
echo Step 2: SSH to PopOS and start server...
echo Please run these commands on PopOS:
echo.
echo   cd ~
echo   pip install flash-attn xformers accelerate
echo   python3 popos_wan_server.py
echo.
echo Or run this command from Windows:
echo   ssh choon@10.0.0.2 "nohup python3 ~/popos_wan_server.py > wan_server.log 2>&1 &"
echo.
echo ========================================
echo Once server is running, test with:
echo   python compare_performance.py
echo ========================================
pause