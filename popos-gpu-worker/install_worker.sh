#!/bin/bash

# Pop!_OS GPU Worker 설치 스크립트
# Artifex.AI 듀얼 GPU 시스템용

set -e

echo "================================================"
echo "  Pop!_OS GPU Worker Installation"
echo "  Artifex.AI Dual GPU System"
echo "================================================"
echo ""

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# GPU 확인
echo -e "${YELLOW}Checking GPU...${NC}"
if nvidia-smi &> /dev/null; then
    echo -e "${GREEN}✓ NVIDIA GPU detected${NC}"
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
else
    echo -e "${RED}✗ No NVIDIA GPU detected${NC}"
    echo "This worker requires an NVIDIA GPU with CUDA support."
    exit 1
fi

# Python 3.10+ 확인
echo -e "\n${YELLOW}Checking Python...${NC}"
if python3 --version | grep -E "3\.(10|11|12)" &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ Python installed: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}✗ Python 3.10+ required${NC}"
    echo "Installing Python 3.11..."
    sudo apt update
    sudo apt install -y python3.11 python3.11-venv python3-pip
fi

# CUDA 확인
echo -e "\n${YELLOW}Checking CUDA...${NC}"
if nvcc --version &> /dev/null; then
    CUDA_VERSION=$(nvcc --version | grep "release" | awk '{print $6}' | cut -c2-)
    echo -e "${GREEN}✓ CUDA installed: $CUDA_VERSION${NC}"
else
    echo -e "${YELLOW}⚠ CUDA not found. Installing CUDA 12.1...${NC}"
    
    # CUDA 12.1 설치
    wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.0-1_all.deb
    sudo dpkg -i cuda-keyring_1.0-1_all.deb
    sudo apt-get update
    sudo apt-get -y install cuda-12-1
    rm cuda-keyring_1.0-1_all.deb
    
    # 환경 변수 설정
    echo 'export PATH=/usr/local/cuda-12.1/bin:$PATH' >> ~/.bashrc
    echo 'export LD_LIBRARY_PATH=/usr/local/cuda-12.1/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
    source ~/.bashrc
fi

# 가상환경 생성
echo -e "\n${YELLOW}Creating Python virtual environment...${NC}"
python3 -m venv venv
source venv/bin/activate

# 필수 패키지 설치
echo -e "\n${YELLOW}Installing required packages...${NC}"
pip install --upgrade pip

# PyTorch with CUDA
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# FastAPI 및 서버 패키지
pip install fastapi uvicorn[standard] aiohttp pydantic

# AI 라이브러리
pip install transformers diffusers accelerate safetensors
pip install opencv-python-headless numpy pillow scipy tqdm
pip install huggingface_hub xformers

# GPU 모니터링
pip install nvidia-ml-py gpustat

echo -e "${GREEN}✓ All packages installed${NC}"

# 서비스 파일 생성
echo -e "\n${YELLOW}Creating systemd service...${NC}"
sudo tee /etc/systemd/system/gpu-worker.service > /dev/null <<EOF
[Unit]
Description=Artifex.AI GPU Worker Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment="PATH=$(pwd)/venv/bin:/usr/local/cuda-12.1/bin:/usr/bin"
ExecStart=$(pwd)/venv/bin/python gpu_worker_server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 서비스 활성화
sudo systemctl daemon-reload
sudo systemctl enable gpu-worker.service

# 방화벽 설정
echo -e "\n${YELLOW}Configuring firewall...${NC}"
sudo ufw allow 8000/tcp comment 'GPU Worker API'

# Wan2.2 모델 다운로드 옵션
echo -e "\n${YELLOW}Download Wan2.2 models? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "Downloading models..."
    python3 - <<EOF
from huggingface_hub import snapshot_download
import os

models_dir = "models"
os.makedirs(models_dir, exist_ok=True)

# 모델 리스트 (실제 모델로 교체 필요)
models = [
    ("ByteDance/AnimateDiff-Lightning", "Wan2.2-T2V"),
    ("stabilityai/stable-video-diffusion-img2vid", "Wan2.2-I2V"),
]

for repo, local in models:
    print(f"Downloading {repo}...")
    try:
        snapshot_download(
            repo_id=repo,
            local_dir=os.path.join(models_dir, local),
            local_dir_use_symlinks=False,
            resume_download=True
        )
        print(f"✓ {local} downloaded")
    except Exception as e:
        print(f"✗ Failed to download {local}: {e}")
EOF
fi

# 설정 파일 생성
echo -e "\n${YELLOW}Creating configuration file...${NC}"
cat > config.json <<EOF
{
    "host": "10.0.0.2",
    "port": 8000,
    "models_path": "$(pwd)/models",
    "temp_path": "/tmp/gpu-worker",
    "max_concurrent_tasks": 2,
    "gpu_memory_fraction": 0.9
}
EOF

echo -e "${GREEN}✓ Configuration created${NC}"

# 테스트 실행
echo -e "\n${YELLOW}Testing server...${NC}"
timeout 5 python gpu_worker_server.py &> test.log || true

if grep -q "Listening on" test.log; then
    echo -e "${GREEN}✓ Server test successful${NC}"
else
    echo -e "${RED}✗ Server test failed. Check test.log for details${NC}"
fi

# 완료
echo ""
echo "================================================"
echo -e "${GREEN}  Installation Complete!${NC}"
echo "================================================"
echo ""
echo "To start the GPU Worker:"
echo "  sudo systemctl start gpu-worker"
echo ""
echo "To check status:"
echo "  sudo systemctl status gpu-worker"
echo ""
echo "To view logs:"
echo "  sudo journalctl -u gpu-worker -f"
echo ""
echo "API will be available at:"
echo "  http://10.0.0.2:8000"
echo ""