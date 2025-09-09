# Dual GPU Setup Guide for Artifex.AI

## 🚀 Overview
Artifex.AI의 듀얼 GPU 시스템을 사용하면 두 대의 PC에서 GPU를 활용하여 비디오 생성 성능을 최대 2배 향상시킬 수 있습니다.

## 📋 시스템 요구사항

### Windows PC (Main)
- Windows 10/11
- NVIDIA GPU (RTX 3060 이상 권장)
- CUDA 12.1+
- Python 3.10+
- 10Gbps 네트워크 연결

### Pop!_OS PC (Worker)
- Pop!_OS 22.04 LTS
- NVIDIA GPU
- CUDA 12.1+
- Python 3.10+
- 10Gbps 네트워크 연결 (10.0.0.2)

## 🔧 설치 가이드

### 1. Pop!_OS Worker 설정

1. **파일 복사**
   ```bash
   # PopOS PC에서 실행
   scp -r choon@10.0.0.1:/c/WORK/Artifex.AI/popos-gpu-worker ~/
   cd ~/popos-gpu-worker
   ```

2. **Worker 서버 설치**
   ```bash
   chmod +x install_worker.sh
   ./install_worker.sh
   ```

3. **서버 시작**
   ```bash
   sudo systemctl start gpu-worker
   sudo systemctl status gpu-worker
   ```

4. **연결 테스트**
   ```bash
   curl http://10.0.0.2:8000
   ```

### 2. Windows PC 설정

1. **앱 빌드**
   ```cmd
   cd app
   npm run build
   npm run dist
   ```

2. **설치 및 실행**
   - `ArtifexAI-Setup-0.1.0.exe` 실행
   - 앱 실행 후 Settings → Dual GPU 활성화

### 3. 연결 확인

앱에서 Developer 메뉴 → GPU Info 선택하여:
- Local GPU: Windows PC GPU 정보
- Remote GPU: Pop!_OS GPU 정보
- Status: Connected

## 💻 사용 방법

### 듀얼 GPU 모드 활성화
1. Settings → Advanced → Enable Dual GPU
2. Worker URL: `http://10.0.0.2:8000` (기본값)
3. Save 클릭

### 비디오 생성
1. 원하는 모드 선택 (T2V, I2V, TI2V, S2V)
2. Dual GPU 체크박스 활성화
3. Generate 클릭

### 성능 모니터링
- View → GPU Monitor
- 실시간 GPU 사용률, 메모리, 온도 확인
- 로컬/원격 GPU 동시 모니터링

## 🎯 작업 분산 전략

### 프레임 분할 모드 (기본)
- 비디오를 두 부분으로 나누어 처리
- 각 GPU가 절반씩 생성
- 마지막에 자동 병합

### 파이프라인 모드
- Stage 1: Text/Image 처리 (GPU 1)
- Stage 2: Video 생성 (GPU 2)
- 더 효율적인 메모리 사용

### 로드 밸런싱
- 자동으로 덜 바쁜 GPU에 작업 할당
- GPU 메모리 기반 스마트 스케줄링

## 📊 예상 성능

| 작업 | 단일 GPU | 듀얼 GPU | 향상률 |
|------|----------|----------|--------|
| T2V (30초) | 10분 | 5-6분 | 1.8x |
| I2V (30초) | 8분 | 4-5분 | 1.7x |
| TI2V (30초) | 12분 | 6-7분 | 1.9x |
| S2V (30초) | 15분 | 8-9분 | 1.8x |

## 🔍 문제 해결

### Worker 연결 실패
```bash
# PopOS에서
sudo ufw allow 8000/tcp
sudo systemctl restart gpu-worker
journalctl -u gpu-worker -f
```

### CUDA 오류
```bash
# CUDA 버전 확인
nvcc --version
nvidia-smi

# PyTorch CUDA 확인
python -c "import torch; print(torch.cuda.is_available())"
```

### 네트워크 속도 확인
```bash
# Windows에서
iperf3 -c 10.0.0.2

# PopOS에서
iperf3 -s
```

## 📝 로그 위치

### Windows
- 앱 로그: `%APPDATA%\Artifex AI Studio\logs\`
- GPU 로그: `%TEMP%\artifex-gpu.log`

### Pop!_OS
- Worker 로그: `sudo journalctl -u gpu-worker`
- 작업 로그: `/tmp/gpu-worker/`

## 🛡️ 보안 설정

### SSH 키 설정 (권장)
```bash
# Windows에서
ssh-keygen -t rsa -b 4096
ssh-copy-id choon@10.0.0.2
```

### 방화벽 규칙
```bash
# PopOS
sudo ufw allow from 10.0.0.1 to any port 8000

# Windows
netsh advfirewall firewall add rule name="Artifex GPU Worker" dir=out action=allow protocol=TCP remoteport=8000
```

## 📚 API 문서

### Worker API Endpoints

- `GET /` - 헬스체크
- `GET /gpu/info` - GPU 정보
- `GET /gpu/cuda` - CUDA 환경
- `POST /task/submit` - 작업 제출
- `GET /task/status/{id}` - 작업 상태
- `GET /task/result/{id}` - 결과 다운로드

## 🤝 기여하기

1. Fork the repository
2. Create feature branch (`git checkout -b feature/DualGPU`)
3. Commit changes (`git commit -m 'Add Dual GPU support'`)
4. Push to branch (`git push origin feature/DualGPU`)
5. Open Pull Request

## 📄 라이선스

MIT License - Artifex AI © 2025