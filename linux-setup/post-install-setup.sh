#!/bin/bash

# Ubuntu 22.04 Post-Installation Setup for Artifex.AI Development
# 실행: bash post-install-setup.sh

set -e

echo "================================================"
echo "   Artifex.AI Linux 개발 환경 설정 스크립트"
echo "================================================"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 시스템 업데이트
echo -e "${GREEN}[1/10] 시스템 패키지 업데이트...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. 필수 개발 도구 설치
echo -e "${GREEN}[2/10] 필수 개발 도구 설치...${NC}"
sudo apt install -y \
    build-essential \
    git \
    curl \
    wget \
    vim \
    htop \
    neofetch \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    python3-pip \
    python3-venv \
    ffmpeg

# 3. Node.js 18.x 설치 (Electron 개발용)
echo -e "${GREEN}[3/10] Node.js 18.x 설치...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Docker 설치 (AI 모델 컨테이너용)
echo -e "${GREEN}[4/10] Docker 설치...${NC}"
sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER

# 5. NVIDIA 드라이버 확인 및 설치
echo -e "${GREEN}[5/10] NVIDIA GPU 확인...${NC}"
if lspci | grep -i nvidia > /dev/null; then
    echo -e "${YELLOW}NVIDIA GPU 감지됨. 드라이버 설치...${NC}"
    sudo add-apt-repository ppa:graphics-drivers/ppa -y
    sudo apt update
    
    # 추천 드라이버 확인
    ubuntu-drivers devices
    
    echo "추천 드라이버를 설치하시겠습니까? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        sudo ubuntu-drivers autoinstall
    fi
    
    # NVIDIA Container Toolkit 설치 (Docker GPU 지원)
    distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
    curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
    curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
    sudo apt update
    sudo apt install -y nvidia-container-toolkit
    sudo systemctl restart docker
else
    echo -e "${YELLOW}NVIDIA GPU가 감지되지 않았습니다.${NC}"
fi

# 6. Python 환경 설정
echo -e "${GREEN}[6/10] Python 개발 환경 설정...${NC}"
pip3 install --user \
    torch \
    torchvision \
    torchaudio \
    transformers \
    diffusers \
    accelerate \
    safetensors \
    opencv-python \
    pillow \
    numpy \
    scipy

# 7. VS Code 설치
echo -e "${GREEN}[7/10] Visual Studio Code 설치...${NC}"
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
sudo apt update
sudo apt install -y code

# 8. Git 설정
echo -e "${GREEN}[8/10] Git 설정...${NC}"
echo "Git 사용자 이름을 입력하세요:"
read git_name
echo "Git 이메일을 입력하세요:"
read git_email
git config --global user.name "$git_name"
git config --global user.email "$git_email"

# 9. SSH 서버 설치 (원격 개발용)
echo -e "${GREEN}[9/10] SSH 서버 설치...${NC}"
sudo apt install -y openssh-server
sudo systemctl enable ssh
sudo systemctl start ssh

# 10. 방화벽 설정
echo -e "${GREEN}[10/10] 방화벽 설정...${NC}"
sudo ufw allow ssh
sudo ufw allow 3000:9999/tcp  # 개발 포트 범위
sudo ufw --force enable

# 시스템 정보 출력
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}설치 완료! 시스템 정보:${NC}"
echo -e "${GREEN}================================================${NC}"
neofetch

# IP 주소 출력
echo -e "${YELLOW}SSH 접속 정보:${NC}"
ip addr show | grep 'inet ' | grep -v '127.0.0.1' | awk '{print "IP: " $2}'
echo "SSH 포트: 22"

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}다음 단계:${NC}"
echo "1. 재부팅: sudo reboot"
echo "2. Docker 권한 적용: 재로그인 필요"
echo "3. NVIDIA 드라이버 확인: nvidia-smi"
echo "4. Artifex.AI 클론: git clone [repository-url]"
echo -e "${GREEN}================================================${NC}"