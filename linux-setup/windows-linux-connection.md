# Windows-Linux 연결 및 협업 설정

## 1. SSH 연결 설정

### Windows에서 Linux로 SSH 접속
```powershell
# Windows Terminal 또는 PowerShell에서
ssh username@linux-pc-ip

# 예시
ssh developer@192.168.1.100
```

### VS Code Remote Development
1. VS Code 확장 설치: "Remote - SSH"
2. F1 → "Remote-SSH: Connect to Host"
3. Linux PC IP 입력
4. 원격으로 Artifex.AI 프로젝트 열기

## 2. 파일 공유 설정

### Samba 설치 (Linux)
```bash
# Samba 설치
sudo apt install samba

# 공유 폴더 생성
sudo mkdir -p /srv/artifex-share
sudo chmod 777 /srv/artifex-share

# Samba 설정
sudo nano /etc/samba/smb.conf
```

### smb.conf 추가 내용
```ini
[ArtifexShare]
   path = /srv/artifex-share
   browseable = yes
   read only = no
   guest ok = yes
   create mask = 0755
```

### Samba 재시작
```bash
sudo systemctl restart smbd
sudo systemctl enable smbd
```

### Windows에서 접근
```
\\linux-pc-ip\ArtifexShare
또는
파일 탐색기 → 네트워크 드라이브 연결
```

## 3. 개발 워크플로우

### 옵션 1: 분산 개발 (추천)
- **Windows**: Electron UI 개발, 테스트
- **Linux**: AI 모델 서버, Python 백엔드
- **통신**: REST API 또는 WebSocket

### 옵션 2: 원격 개발
- **Windows**: VS Code (클라이언트)
- **Linux**: 전체 개발 환경
- **연결**: SSH Remote Development

### 옵션 3: 동기화 개발
- **도구**: Syncthing, rsync
- **자동 동기화**: 코드 변경사항 실시간 동기화

## 4. Docker 기반 AI 서버 설정

### Linux에 AI 서버 컨테이너 생성
```bash
# Dockerfile 생성
cat > Dockerfile << 'EOF'
FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04

RUN apt-get update && apt-get install -y \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip3 install -r requirements.txt

EXPOSE 8000
CMD ["python3", "ai_server.py"]
EOF

# 빌드 및 실행
docker build -t artifex-ai-server .
docker run -d --gpus all -p 8000:8000 artifex-ai-server
```

## 5. 네트워크 최적화

### 포트 포워딩 설정
```bash
# Linux 방화벽 규칙
sudo ufw allow from 192.168.1.0/24 to any port 8000  # AI 서버
sudo ufw allow from 192.168.1.0/24 to any port 3000  # React 개발 서버
sudo ufw allow from 192.168.1.0/24 to any port 5173  # Vite 개발 서버
```

### Windows Hosts 파일 설정
```
# C:\Windows\System32\drivers\etc\hosts
192.168.1.100  artifex-linux
192.168.1.100  ai-server.local
```

## 6. 성능 모니터링

### Linux 시스템 모니터링
```bash
# GPU 모니터링
watch -n 1 nvidia-smi

# 시스템 리소스
htop

# 네트워크 모니터링
iftop
```

### Windows에서 원격 모니터링
- Grafana + Prometheus 설정
- Netdata 웹 인터페이스
- SSH 터널링으로 접근