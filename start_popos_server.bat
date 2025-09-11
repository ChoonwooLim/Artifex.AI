@echo off
echo Starting PopOS WAN Server...
echo.

REM Copy the server script to PopOS
echo Copying server script to PopOS...
pscp -pw Jiyeon71391796! C:\WORK\Artifex.AI\simple_wan_server.py stevenlim@10.0.0.2:~/simple_wan_server.py

REM Start the server on PopOS
echo Starting server on PopOS...
plink -pw Jiyeon71391796! stevenlim@10.0.0.2 "pkill -f simple_wan_server.py; nohup python3 ~/simple_wan_server.py > ~/wan_server.log 2>&1 & echo Server started"

timeout /t 3

REM Test the connection
echo Testing server connection...
curl http://10.0.0.2:8001/

echo.
echo Server should be running at http://10.0.0.2:8001
pause