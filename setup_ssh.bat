@echo off
echo ========================================
echo PopOS SSH Key Setup for Artifex.AI
echo ========================================
echo.
echo This will set up passwordless SSH access to PopOS server.
echo You will need to enter your PopOS password ONCE.
echo.
pause

python setup_ssh_keys.py

if errorlevel 1 (
    echo.
    echo [ERROR] SSH key setup failed!
    echo Please check the error messages above.
) else (
    echo.
    echo ========================================
    echo SSH Setup Complete!
    echo ========================================
    echo.
    echo You can now:
    echo 1. Run Artifex.AI app and the server will start automatically
    echo 2. Connect to PopOS without password: ssh popos
    echo.
    echo Next step: Run the app with 'npm start' in the app folder
)

pause