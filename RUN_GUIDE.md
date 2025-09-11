# PopOS WAN 시스템 실행 가이드 (자동 서버 시작 지원!)

## 🚀 빠른 시작 (Quick Start) - 더 쉬워졌습니다!

### 초기 설정 (한 번만 실행)
```bash
# 1. SSH 키 설정 (패스워드 없는 접속)
cd C:\WORK\Artifex.AI
python setup_ssh_keys.py

# 2. PopOS 서버 배포 (선택사항)
python deploy_to_popos.py
```

### 앱 실행 (매번)
```bash
# Artifex.AI 앱 실행 - 서버가 자동으로 시작됩니다!
cd C:\WORK\Artifex.AI\app
npm start
```

**✨ 새로운 기능: 앱을 실행하면 PopOS 서버가 자동으로 시작됩니다!**
더 이상 SSH로 수동 접속할 필요가 없습니다.

---

## 🔧 상세 실행 방법

### Step 0: SSH 키 설정 (최초 1회) - 새로운!
```powershell
# Windows PowerShell에서
cd C:\WORK\Artifex.AI
python setup_ssh_keys.py
```

이 스크립트가:
- ✅ SSH 키 쌍 생성
- ✅ PopOS 서버에 공개키 복사
- ✅ SSH 설정 파일 구성
- ✅ 패스워드 없는 접속 설정

**주의**: PopOS 패스워드를 한 번만 입력하면 이후 모든 접속은 자동!

### Step 1: PopOS 서버 설정 (최초 1회)

#### Windows PowerShell에서:
```powershell
# Artifex.AI 폴더로 이동
cd C:\WORK\Artifex.AI

# 자동 배포 스크립트 실행
python deploy_to_popos.py
```

이 스크립트가 자동으로:
- ✅ 서버 파일 전송
- ✅ Python 환경 설정
- ✅ Flash Attention 설치
- ✅ 필요한 패키지 설치

### Step 2: PopOS 서버 시작 (자동!)

#### 방법 1: 자동 시작 (권장) ✨
```powershell
# Artifex.AI 앱 실행시 자동으로 서버 시작됨
cd C:\WORK\Artifex.AI\app
npm start
```
- 앱 시작 3초 후 자동으로 PopOS 서버 시작
- SSH 키가 설정되어 있으면 패스워드 입력 불필요
- 앱 종료시 서버도 자동 종료

#### 방법 2: 수동 시작 (선택사항)
앱 내에서:
1. **Dual GPU System Control Center** 열기
2. **PopOS Server** 탭 선택
3. **Start Server** 버튼 클릭

#### 방법 3: SSH로 직접 실행 (디버깅용)
```bash
# SSH 접속 (패스워드 없이!)
ssh popos

# 서버 시작
cd ~/wan_server
python popos_wan_server_pro.py
```

### Step 3: Windows 앱 실행

```powershell
# Artifex.AI 앱 폴더로 이동
cd C:\WORK\Artifex.AI\app

# 앱 실행
npm start
```

---

## ✅ 실행 확인 방법

### 1. PopOS 서버 상태 확인
브라우저에서: http://10.0.0.2:8001/docs
- FastAPI 문서가 보이면 정상

### 2. Artifex.AI 앱에서 확인
1. 앱 실행 후 **"Dual GPU System"** 메뉴 클릭
2. **"PopOS Server"** 탭 클릭
3. **"Start Server"** 버튼 클릭 (이미 실행중이면 "Running" 표시)
4. **"Settings"** 탭에서:
   - Flash Attention: **Available** ✅
   - Dual GPU Mode: **활성화 가능** ✅

### 3. 성능 테스트
```powershell
# Windows에서
cd C:\WORK\Artifex.AI
python test_performance.py
```

---

## 🎮 새로운 기능 사용법

### 1. WAN 비디오 생성 (고성능 모드)
1. 앱에서 **"WAN"** 메뉴 선택
2. 품질 프리셋 선택:
   - **Draft** (1초) - 테스트용
   - **Fast** (5초) - 빠른 미리보기
   - **Standard** (15초) - 일반 품질
   - **High** (30초) - 고품질
   - **Ultimate** (60초) - 최고 품질

3. **"Use PopOS Server"** 토글 ON
4. 프롬프트 입력 후 **Generate** 클릭

### 2. Flash Attention 활용
- Settings → Flash Attention Toggle → **자동으로 활성화됨**
- 메모리 사용량 10-20배 감소
- 속도 2-4배 향상

### 3. 듀얼 GPU 모드
- Settings → Dual GPU Toggle → **Enable**
- 자동 로드 밸런싱
- 파이프라인 병렬 처리

---

## 🔍 문제 해결

### SSH 패스워드를 계속 물어볼 때:
```powershell
# SSH 키 재설정
cd C:\WORK\Artifex.AI
python setup_ssh_keys.py

# SSH 설정 확인
type %USERPROFILE%\.ssh\config
```

### 서버가 자동으로 시작되지 않을 때:
1. 콘솔 로그 확인:
   - `SSH key not configured` 메시지 → SSH 키 설정 필요
   - `PopOS server auto-start disabled` → 설정에서 활성화
2. 수동으로 SSH 테스트:
   ```powershell
   ssh popos "echo Connection successful"
   ```
3. 앱 설정에서 Auto-start 체크박스 확인

### PopOS 서버가 연결 안 될 때:
```bash
# PopOS에서 서버 프로세스 확인
ps aux | grep popos_wan_server

# 서버 로그 확인
tail -f ~/wan_server/server.log

# 방화벽 확인 (포트 8001)
sudo ufw status
```

### Flash Attention이 Not Available일 때:
```bash
# PopOS에서 Flash Attention 재설치
pip install flash-attn --no-build-isolation

# GPU 확인
nvidia-smi
```

### Windows 앱이 안 뜰 때:
```powershell
# 종속성 재설치
cd C:\WORK\Artifex.AI\app
npm install

# 개발 모드로 실행 (디버그)
npm run dev
```

---

## 📊 성능 모니터링

### GPU 사용률 실시간 모니터링
```bash
# PopOS에서
watch -n 1 nvidia-smi

# Windows에서
nvidia-smi -l 1
```

### 서버 API 테스트
```powershell
# Windows PowerShell
Invoke-RestMethod -Uri "http://10.0.0.2:8001/health"
```

---

## 🚨 중요 참고사항

1. **PopOS 서버는 항상 먼저 실행**되어야 함
2. **첫 실행시 모델 로딩**에 1-2분 소요
3. **네트워크 연결** 확인: 10.0.0.2 ping 테스트
4. **VRAM 여유** 확인: 최소 10GB 필요

---

## 💡 팁

- **성능 최적화**: Ultimate 프리셋은 8K 해상도 지원
- **배치 처리**: 여러 작업 동시 큐잉 가능
- **자동 재시작**: 서버 크래시시 자동 복구
- **캐시 활용**: 자주 사용하는 모델은 메모리에 상주

---

## 📞 지원

문제 발생시:
1. `server.log` 확인
2. `C:\WORK\Artifex.AI\logs` 폴더 확인
3. Dual GPU System → Advanced → Export Config로 설정 백업

---

## 🎯 자동 서버 시작 기능 요약

### 구현된 기능:
1. **SSH 키 기반 인증**: 패스워드 없이 PopOS 접속
2. **자동 서버 시작**: 앱 실행시 PopOS 서버 자동 시작
3. **자동 서버 종료**: 앱 종료시 서버도 자동 종료
4. **상태 모니터링**: 실시간 서버 상태 확인
5. **자동 재시도**: 서버 시작 실패시 3회 자동 재시도
6. **Health Check**: 60초마다 서버 상태 확인

### 주요 파일:
- `setup_ssh_keys.py`: SSH 키 설정 스크립트
- `app/main/popos-server.ts`: 서버 관리자 (자동 시작 로직)
- `app/main/main.ts`: 앱 시작시 서버 자동 실행
- `app/renderer/components/PopOSServerControl.tsx`: UI 컨트롤

마지막 업데이트: 2025-09-11