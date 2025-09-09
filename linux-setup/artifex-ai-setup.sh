#!/bin/bash

# Artifex.AI 전용 Linux 개발 환경 구성
# AI 모델 서버 및 고성능 컴퓨팅 환경

set -e

echo "=============================================="
echo "   Artifex.AI 전용 환경 구성 시작"
echo "=============================================="

# CUDA 및 cuDNN 설치 (NVIDIA GPU 전용)
install_cuda() {
    echo "[1/5] CUDA 11.8 설치..."
    
    # CUDA 저장소 추가
    wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.0-1_all.deb
    sudo dpkg -i cuda-keyring_1.0-1_all.deb
    sudo apt update
    
    # CUDA 설치
    sudo apt install -y cuda-11-8
    
    # 환경 변수 설정
    echo 'export PATH=/usr/local/cuda-11.8/bin:$PATH' >> ~/.bashrc
    echo 'export LD_LIBRARY_PATH=/usr/local/cuda-11.8/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
    
    # cuDNN 설치 안내
    echo "cuDNN은 NVIDIA 개발자 사이트에서 수동 다운로드 필요"
    echo "https://developer.nvidia.com/cudnn"
}

# PyTorch 및 AI 라이브러리 설치
setup_ai_environment() {
    echo "[2/5] AI 개발 환경 구성..."
    
    # Python 가상환경 생성
    python3 -m venv ~/artifex-env
    source ~/artifex-env/bin/activate
    
    # PyTorch with CUDA
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
    
    # Wan2.2 모델 의존성
    pip install \
        diffusers==0.21.0 \
        transformers==4.35.0 \
        accelerate==0.24.0 \
        safetensors \
        omegaconf \
        einops \
        xformers==0.0.22 \
        gradio \
        fastapi \
        uvicorn
    
    # 비디오 처리 라이브러리
    pip install \
        opencv-python \
        imageio \
        imageio-ffmpeg \
        moviepy
}

# Ollama 설치 (로컬 LLM)
install_ollama() {
    echo "[3/5] Ollama 설치..."
    curl -fsSL https://ollama.ai/install.sh | sh
    
    # Ollama 서비스 시작
    sudo systemctl enable ollama
    sudo systemctl start ollama
    
    # 기본 모델 다운로드
    ollama pull llama2
    ollama pull codellama
}

# AI 모델 서버 설정
setup_model_server() {
    echo "[4/5] AI 모델 서버 구성..."
    
    # 프로젝트 디렉토리 생성
    mkdir -p ~/artifex-ai-server
    cd ~/artifex-ai-server
    
    # FastAPI 서버 생성
    cat > ai_server.py << 'EOF'
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import torch
import uvicorn
from typing import Optional
import json

app = FastAPI(title="Artifex AI Server")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "name": "Artifex AI Server",
        "version": "1.0.0",
        "cuda_available": torch.cuda.is_available(),
        "gpu_count": torch.cuda.device_count() if torch.cuda.is_available() else 0
    }

@app.post("/generate/t2v")
async def text_to_video(prompt: str, duration: int = 5):
    """Text to Video Generation Endpoint"""
    return {
        "status": "processing",
        "prompt": prompt,
        "duration": duration,
        "message": "Model server ready for Wan2.2-T2V"
    }

@app.post("/generate/i2v")
async def image_to_video(file: UploadFile = File(...)):
    """Image to Video Generation Endpoint"""
    return {
        "status": "processing",
        "filename": file.filename,
        "message": "Model server ready for Wan2.2-I2V"
    }

@app.get("/status")
def get_status():
    """서버 상태 확인"""
    if torch.cuda.is_available():
        return {
            "status": "online",
            "gpu": torch.cuda.get_device_name(0),
            "memory": f"{torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB"
        }
    return {"status": "online", "gpu": "CPU mode"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF

    # systemd 서비스 생성
    sudo tee /etc/systemd/system/artifex-ai.service > /dev/null << EOF
[Unit]
Description=Artifex AI Model Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/home/$USER/artifex-ai-server
Environment="PATH=/home/$USER/artifex-env/bin"
ExecStart=/home/$USER/artifex-env/bin/python ai_server.py
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable artifex-ai.service
}

# 모니터링 도구 설치
setup_monitoring() {
    echo "[5/5] 모니터링 도구 설치..."
    
    # GPU 모니터링
    pip install gpustat
    
    # Netdata 설치 (시스템 모니터링)
    wget -O /tmp/netdata-kickstart.sh https://my-netdata.io/kickstart.sh
    sh /tmp/netdata-kickstart.sh --dont-wait
    
    echo "모니터링 대시보드: http://localhost:19999"
}

# 메인 실행
main() {
    echo "설치할 구성 요소를 선택하세요:"
    echo "1) 전체 설치 (추천)"
    echo "2) CUDA/cuDNN만"
    echo "3) AI 환경만"
    echo "4) Ollama만"
    echo "5) 모니터링만"
    
    read -p "선택 (1-5): " choice
    
    case $choice in
        1)
            if lspci | grep -i nvidia > /dev/null; then
                install_cuda
            fi
            setup_ai_environment
            install_ollama
            setup_model_server
            setup_monitoring
            ;;
        2) install_cuda ;;
        3) setup_ai_environment ;;
        4) install_ollama ;;
        5) setup_monitoring ;;
        *) echo "잘못된 선택" ;;
    esac
    
    echo "=============================================="
    echo "설치 완료!"
    echo "AI 서버 시작: sudo systemctl start artifex-ai"
    echo "서버 상태: http://localhost:8000"
    echo "모니터링: http://localhost:19999"
    echo "=============================================="
}

main