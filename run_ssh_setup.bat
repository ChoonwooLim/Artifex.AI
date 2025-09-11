@echo off
echo [INFO] Copying SSH key to PopOS server...
echo.
echo You will be prompted for password.
echo Password is: Jiyeon71391796!
echo.

REM Create .ssh directory on remote
ssh choon@10.0.0.2 "mkdir -p ~/.ssh && chmod 700 ~/.ssh"

REM Copy the public key
echo ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC1U+MjZsev9Mw33yg8x31r0+h9RJLAOqV9j47rL42zL4WWQ4UOoIEOgx+zhfWoeKduF3XZkSjA0tcdIOF6/kzKMuvQyyVQFwInyJyfsgfBeqm/RJDh1PPIvXhPl/IF8kmHwXrbtZsSIQ2fZcUMFKG7D/aPmtsx0vGeEZRlMkOimVxXYRNVdhg//6IfiltRm5nkws02a5vHzUZITqySWDWRSdgIQrTXvFakQCT4g5C5IACexu2ZK5UcC3vxQuCw7WeqlPen+xvcnEJKxvLNjD4hRQmQIn6CUapiwIAlRrPbZ4c6GN2EOdX+evteadL6K04qQHvJQKYWGRlBbDTo63cNeaG+6foTtGp4pKkC6dgyLGwxAJFvbInYB4udpgG3zZcxNu7Y2WyUHejn4hodm4Nds5SBv/8mmlrg9aspPSIuGDlOepqbIVjcWoWjDoFn0N9aSxg8BXTJ7MAE8O8wyVpabgZDkYS0dVwvHWX9KYsWmKTe455J177TTbYNX1tyzJ00QZ7BnnKLgTIzWp03FguZ4K7BHd0m2Vsw8Bp4usk9m3grEZNpKJNHORAXV17ZZNdNai3ZL9S7cAx9Ev1OrX/wHlTRe+rDei4XMIxNJUgyZRNWNKNWcJTQ217kvHO7AVfAKUdl8pufwee1hQGIpxgbvNL7RSPTZQjKDdGsPkbcUQ== artifex@windows | ssh choon@10.0.0.2 "cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo SSH key added successfully"

echo.
echo [INFO] Testing connection...
ssh -i "C:\Users\choon\.ssh\popos_rsa" -o BatchMode=yes choon@10.0.0.2 "echo Connection successful"

if errorlevel 1 (
    echo [WARNING] Passwordless connection not working yet
    echo Please try running this script again
) else (
    echo [SUCCESS] Passwordless SSH is now configured!
)
