@echo off
echo ===============================================
echo SSH Key Copy Script for PopOS
echo ===============================================
echo.
echo Please follow these steps:
echo.
echo 1. Run this command in PowerShell:
echo.
echo    type C:\Users\choon\.ssh\popos_rsa.pub
echo.
echo 2. Copy the output (starts with ssh-rsa)
echo.
echo 3. Connect to PopOS manually:
echo    ssh choon@10.0.0.2
echo    Password: Jiyeon71391796!
echo.
echo 4. Once connected, run:
echo    echo "PASTE_YOUR_KEY_HERE" >> ~/.ssh/authorized_keys
echo    chmod 600 ~/.ssh/authorized_keys
echo    exit
echo.
echo 5. Test connection:
echo    ssh -i C:\Users\choon\.ssh\popos_rsa choon@10.0.0.2
echo.
pause