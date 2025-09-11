# 📋 Phase 1: Infrastructure Setup - 상세 구현 가이드

> **Phase**: 1 of 6  
> **Duration**: Week 1  
> **Priority**: Critical  
> **Dependencies**: None

---

## 🎯 목표

PopOS 서버 환경을 완벽하게 구축하고, Flash Attention과 듀얼 GPU를 위한 기반을 마련합니다.

---

## 📝 작업 목록

### 1. PopOS 서버 환경 설정

#### 1.1 시스템 업데이트
```bash
# PopOS 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 도구 설치
sudo apt install -y \
    build-essential \
    cmake \
    git \
    wget \
    curl \
    htop \
    nvtop \
    screen \
    tmux
```

#### 1.2 Python 환경 구축
```bash
# Python 3.10+ 확인
python3 --version

# pip 업그레이드
pip3 install --upgrade pip

# 가상환경 생성
python3 -m venv ~/wan_env
source ~/wan_env/bin/activate

# 기본 패키지 설치
pip install wheel setuptools
```

---

### 2. NVIDIA 드라이버 및 CUDA 설치

#### 2.1 드라이버 설치
```bash
# 현재 드라이버 확인
nvidia-smi

# 필요시 최신 드라이버 설치
sudo apt install nvidia-driver-545

# 재부팅
sudo reboot
```

#### 2.2 CUDA Toolkit 설치
```bash
# CUDA 12.3 설치
wget https://developer.download.nvidia.com/compute/cuda/12.3.0/local_installers/cuda_12.3.0_545.23.06_linux.run
sudo sh cuda_12.3.0_545.23.06_linux.run

# 환경 변수 설정
echo 'export PATH=/usr/local/cuda-12.3/bin:$PATH' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/usr/local/cuda-12.3/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc

# 확인
nvcc --version
```

#### 2.3 cuDNN 설치
```bash
# cuDNN 8.9 다운로드 (NVIDIA 계정 필요)
# https://developer.nvidia.com/cudnn 에서 다운로드

# 설치
tar -xzvf cudnn-linux-x86_64-8.9.*.tar.gz
sudo cp cudnn-*-archive/include/cudnn*.h /usr/local/cuda/include
sudo cp cudnn-*-archive/lib/libcudnn* /usr/local/cuda/lib64
sudo chmod a+r /usr/local/cuda/include/cudnn*.h /usr/local/cuda/lib64/libcudnn*
```

---

### 3. PyTorch 및 Flash Attention 설치

#### 3.1 PyTorch 설치
```bash
# PyTorch 2.2.0 with CUDA 12.1
pip install torch==2.2.0 torchvision==0.17.0 torchaudio==2.2.0 --index-url https://download.pytorch.org/whl/cu121

# 확인
python -c "import torch; print(torch.__version__); print(torch.cuda.is_available())"
```

#### 3.2 Flash Attention 설치
```bash
# 컴파일 도구 설치
pip install ninja

# Flash Attention 2.5.0 설치
pip install flash-attn==2.5.0

# 설치 실패 시 소스에서 빌드
git clone https://github.com/Dao-AILab/flash-attention.git
cd flash-attention
pip install -e .

# 확인
python -c "from flash_attn import flash_attn_func; print('Flash Attention installed successfully')"
```

#### 3.3 xFormers 설치 (백업)
```bash
# xFormers 설치
pip install xformers==0.0.24

# 확인
python -c "import xformers; print(xformers.__version__)"
```

---

### 4. WAN 모델 환경 설정

#### 4.1 필수 패키지 설치
```bash
pip install \
    transformers==4.38.0 \
    diffusers==0.26.0 \
    accelerate==0.27.0 \
    safetensors \
    omegaconf \
    einops \
    timm \
    scipy \
    ftfy \
    imageio[ffmpeg] \
    opencv-python
```

#### 4.2 모델 경로 확인
```bash
# 모델 존재 확인
ls -la ~/Wan2.2-*/

# 각 모델 크기 확인
du -sh ~/Wan2.2-T2V-A14B/
du -sh ~/Wan2.2-I2V-A14B/
du -sh ~/Wan2.2-TI2V-5B/
du -sh ~/Wan2.2-S2V-14B/
```

#### 4.3 테스트 스크립트
```python
# test_environment.py
#!/usr/bin/env python3
import torch
import sys

print("=" * 50)
print("Environment Test")
print("=" * 50)

# PyTorch
print(f"PyTorch Version: {torch.__version__}")
print(f"CUDA Available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"CUDA Version: {torch.version.cuda}")
    print(f"GPU Count: {torch.cuda.device_count()}")
    for i in range(torch.cuda.device_count()):
        print(f"  GPU {i}: {torch.cuda.get_device_name(i)}")

# Flash Attention
try:
    import flash_attn
    print(f"Flash Attention: ✅ Version {flash_attn.__version__}")
except ImportError:
    print("Flash Attention: ❌ Not installed")

# xFormers
try:
    import xformers
    print(f"xFormers: ✅ Version {xformers.__version__}")
except ImportError:
    print("xFormers: ❌ Not installed")

print("=" * 50)
```

---

### 5. 네트워크 최적화

#### 5.1 MTU 설정
```bash
# 현재 MTU 확인
ip link show

# Jumbo Frames 설정 (9000 MTU)
sudo ip link set dev eth0 mtu 9000

# 영구 설정 (/etc/network/interfaces)
# mtu 9000

# 확인
ping -M do -s 8972 10.0.0.1
```

#### 5.2 네트워크 성능 테스트
```bash
# iperf3 설치
sudo apt install iperf3

# 서버 모드 실행 (PopOS)
iperf3 -s

# 클라이언트에서 테스트 (Windows)
# iperf3 -c 10.0.0.2 -t 30
```

---

### 6. 서비스 설정

#### 6.1 시스템 서비스 생성
```bash
# /etc/systemd/system/wan-server.service
sudo tee /etc/systemd/system/wan-server.service << EOF
[Unit]
Description=WAN Generation Server
After=network.target

[Service]
Type=simple
User=choon
WorkingDirectory=/home/choon
Environment="PATH=/home/choon/wan_env/bin:/usr/local/cuda/bin:/usr/bin"
ExecStart=/home/choon/wan_env/bin/python /home/choon/popos_wan_server_pro.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 서비스 활성화
sudo systemctl daemon-reload
sudo systemctl enable wan-server
```

#### 6.2 GPU 성능 모드 설정
```bash
# 최대 성능 모드
sudo nvidia-smi -pm 1
sudo nvidia-smi -pl 350  # RTX 3090 최대 전력

# 자동 시작 설정
echo "nvidia-smi -pm 1" | sudo tee -a /etc/rc.local
echo "nvidia-smi -pl 350" | sudo tee -a /etc/rc.local
```

---

### 7. 검증 테스트

#### 7.1 기본 연결 테스트
```python
# test_connection.py
import requests

# API 서버 테스트
response = requests.get("http://10.0.0.2:8001/")
print(f"Server Status: {response.status_code}")

# Flash Attention 테스트
response = requests.get("http://10.0.0.2:8001/flash/status")
print(f"Flash Attention: {response.json()}")
```

#### 7.2 성능 벤치마크
```python
# benchmark_flash.py
import torch
import time

def benchmark_attention(use_flash=False):
    batch_size = 4
    seq_len = 2048
    num_heads = 16
    head_dim = 64
    
    q = torch.randn(batch_size, num_heads, seq_len, head_dim).cuda().half()
    k = torch.randn(batch_size, num_heads, seq_len, head_dim).cuda().half()
    v = torch.randn(batch_size, num_heads, seq_len, head_dim).cuda().half()
    
    # Warmup
    for _ in range(10):
        if use_flash:
            from flash_attn import flash_attn_func
            _ = flash_attn_func(q, k, v)
        else:
            scores = torch.matmul(q, k.transpose(-2, -1)) / (head_dim ** 0.5)
            attn = torch.nn.functional.softmax(scores, dim=-1)
            _ = torch.matmul(attn, v)
    
    torch.cuda.synchronize()
    start = time.time()
    
    for _ in range(100):
        if use_flash:
            _ = flash_attn_func(q, k, v)
        else:
            scores = torch.matmul(q, k.transpose(-2, -1)) / (head_dim ** 0.5)
            attn = torch.nn.functional.softmax(scores, dim=-1)
            _ = torch.matmul(attn, v)
    
    torch.cuda.synchronize()
    elapsed = time.time() - start
    
    return elapsed

# 테스트 실행
standard_time = benchmark_attention(False)
flash_time = benchmark_attention(True)

print(f"Standard Attention: {standard_time:.3f}s")
print(f"Flash Attention: {flash_time:.3f}s")
print(f"Speedup: {standard_time/flash_time:.2f}x")
```

---

## ✅ 완료 체크리스트

- [ ] PopOS 시스템 업데이트 완료
- [ ] Python 3.10+ 환경 구축
- [ ] NVIDIA Driver 545+ 설치
- [ ] CUDA 12.3+ 설치
- [ ] cuDNN 8.9+ 설치
- [ ] PyTorch 2.2.0 설치 및 CUDA 확인
- [ ] Flash Attention 2.5.0 설치 및 테스트
- [ ] xFormers 설치 (백업)
- [ ] WAN 모델 경로 확인
- [ ] 네트워크 MTU 9000 설정
- [ ] 10Gbps 속도 테스트 통과
- [ ] GPU 성능 모드 설정
- [ ] 서비스 자동 시작 설정
- [ ] 모든 테스트 통과

---

## 🚨 트러블슈팅

### Flash Attention 설치 실패
```bash
# GCC 버전 확인 (11+ 필요)
gcc --version

# 필요시 GCC 11 설치
sudo apt install gcc-11 g++-11
sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-11 100
```

### CUDA 메모리 오류
```bash
# 캐시 정리
torch.cuda.empty_cache()

# 환경 변수 설정
export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
```

### 네트워크 지연
```bash
# TCP 최적화
sudo sysctl -w net.core.rmem_max=134217728
sudo sysctl -w net.core.wmem_max=134217728
sudo sysctl -w net.ipv4.tcp_rmem="4096 87380 134217728"
sudo sysctl -w net.ipv4.tcp_wmem="4096 65536 134217728"
```

---

## 📚 참고 문서

- [Flash Attention GitHub](https://github.com/Dao-AILab/flash-attention)
- [PyTorch CUDA Setup](https://pytorch.org/get-started/locally/)
- [NVIDIA Driver Installation](https://docs.nvidia.com/datacenter/tesla/tesla-installation-notes/)

---

## ⏭️ 다음 단계: Phase 2

Phase 1이 완료되면 Phase 2 (Core Server Implementation)로 진행합니다.

---

*이 문서는 Phase 1의 모든 작업을 상세히 안내합니다.*  
*문제 발생 시 트러블슈팅 섹션을 참조하세요.*