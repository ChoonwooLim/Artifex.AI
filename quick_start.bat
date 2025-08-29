@echo off
echo Starting Artifex.AI...

REM 환경 변수 설정
set WAN_FORCE_FP16=1
set WAN_COMPILE=1
set PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True

REM 가상환경 활성화
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo ERROR: Virtual environment not found. Please run setup.bat first.
    pause
    exit /b 1
)

REM Electron 앱 실행
echo Starting Electron UI...
cd app
start cmd /k "npm run dev"
cd ..

echo.
echo Artifex.AI is running!
echo - Electron UI: http://localhost:5173
echo - To generate videos, use: python Wan2.2\generate.py
echo.
pause