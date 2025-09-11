@echo off
echo Generating SSH key for PopOS...
echo. | ssh-keygen -t rsa -b 4096 -f C:\Users\choon\.ssh\popos_rsa -C "artifex@windows"
echo SSH key generated at C:\Users\choon\.ssh\popos_rsa