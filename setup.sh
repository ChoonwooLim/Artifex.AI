#!/bin/bash

echo "===================================="
echo "Artifex.AI Setup Script (Linux/Mac)"
echo "===================================="
echo

# 시스템 요구사항 확인
echo "[1/7] Checking system requirements..."
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 is not installed"
    echo "Please install Python 3.10 or higher"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js 18 or higher"
    exit 1
fi

# CUDA 환경 변수 설정 (Linux용)
echo "[2/7] Setting up CUDA environment..."
export CUDA_HOME=/usr/local/cuda
export PATH=$CUDA_HOME/bin:$PATH
export LD_LIBRARY_PATH=$CUDA_HOME/lib64:$LD_LIBRARY_PATH

# Flash Attention 최적화 설정
export WAN_FORCE_FP16=1
export WAN_COMPILE=1
export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True

# Python 가상환경 생성
echo "[3/7] Creating Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Virtual environment created."
else
    echo "Virtual environment already exists."
fi

# 가상환경 활성화
echo "[4/7] Activating virtual environment..."
source venv/bin/activate

# Python 패키지 설치
echo "[5/7] Installing Python dependencies..."
pip install --upgrade pip
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
pip install -r Wan2.2/requirements.txt

# Flash Attention 설치
echo "Installing Flash Attention..."
pip install flash-attn --no-build-isolation

# Electron 앱 의존성 설치
echo "[6/7] Installing Electron app dependencies..."
cd app
npm install
cd ..

# 모델 다운로드 확인
echo "[7/7] Checking model files..."
if [ ! -d "Wan2.2-T2V-A14B/high_noise_model" ]; then
    echo "WARNING: Model files not found in Wan2.2-T2V-A14B"
    echo "Please download the model files from the repository"
fi

if [ ! -f "Wan2.2-TI2V-5B/diffusion_pytorch_model-00001-of-00003.safetensors" ]; then
    echo "WARNING: Model files not found in Wan2.2-TI2V-5B"
    echo "Please download the model files from the repository"
fi

echo
echo "===================================="
echo "Setup Complete!"
echo "===================================="
echo
echo "To run the application:"
echo "1. For Electron UI: cd app && npm run dev"
echo "2. For Python generation: python Wan2.2/generate.py"
echo
echo "Environment variables set:"
echo "- WAN_FORCE_FP16=1"
echo "- WAN_COMPILE=1"
echo "- PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True"
echo