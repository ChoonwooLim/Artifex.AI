@echo off
echo ====================================
echo Artifex.AI Setup Script
echo ====================================
echo.

REM 시스템 요구사항 확인
echo [1/7] Checking system requirements...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.10 or higher
    pause
    exit /b 1
)

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18 or higher
    pause
    exit /b 1
)

REM CUDA 환경 변수 설정
echo [2/7] Setting up CUDA environment...
set CUDA_HOME=C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.4
set PATH=%CUDA_HOME%\bin;%PATH%

REM Flash Attention 최적화 설정
set WAN_FORCE_FP16=1
set WAN_COMPILE=1
set PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True

REM Python 가상환경 생성
echo [3/7] Creating Python virtual environment...
if not exist "venv" (
    python -m venv venv
    echo Virtual environment created.
) else (
    echo Virtual environment already exists.
)

REM 가상환경 활성화
echo [4/7] Activating virtual environment...
call venv\Scripts\activate.bat

REM Python 패키지 설치
echo [5/7] Installing Python dependencies...
pip install --upgrade pip
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
pip install -r Wan2.2\requirements.txt

REM Flash Attention 설치 (별도 처리)
echo Installing Flash Attention...
pip install flash-attn --no-build-isolation

REM Electron 앱 의존성 설치
echo [6/7] Installing Electron app dependencies...
cd app
call npm install
cd ..

REM 모델 다운로드 확인
echo [7/7] Checking model files...
if not exist "Wan2.2-T2V-A14B\high_noise_model" (
    echo WARNING: Model files not found in Wan2.2-T2V-A14B
    echo Please download the model files from the repository
)

if not exist "Wan2.2-TI2V-5B\diffusion_pytorch_model-00001-of-00003.safetensors" (
    echo WARNING: Model files not found in Wan2.2-TI2V-5B
    echo Please download the model files from the repository
)

echo.
echo ====================================
echo Setup Complete!
echo ====================================
echo.
echo To run the application:
echo 1. For Electron UI: cd app && npm run dev
echo 2. For Python generation: python Wan2.2\generate.py
echo.
echo Environment variables set:
echo - WAN_FORCE_FP16=1
echo - WAN_COMPILE=1
echo - PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True
echo.
pause