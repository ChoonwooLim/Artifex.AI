# Claude Development Notes

> **Project**: Artifex.AI - AI Video Generation Desktop Application  
> **Version**: 0.1.0  
> **Priority**: PopOS WAN System Implementation  

---

## 🚨 CRITICAL: PopOS WAN 작업 시 자동 프로세스

### ⚡ 모든 PopOS 작업 시작 전 필수
```
1. Read POPOS_WAN_MASTER_PLAN.md
2. Check docs/popos-progress.md  
3. Identify current phase & task
4. Implement according to plan
5. Update progress tracking
```

### 📊 PopOS WAN 성능 목표
| Metric | Target | Status |
|--------|--------|--------|
| 5초 HD 생성 | < 15초 | 🔄 진행중 |
| Flash Attention | 필수 | ✅ 구현됨 |
| VRAM 사용 | < 12GB | 📋 대기 |
| 동시 작업 | 4개 | 📋 대기 |

### 🔧 PopOS 작업 규칙
- **마스터 플랜 절대 준수** - `POPOS_WAN_MASTER_PLAN.md`
- **Phase 순차 진행** - 건너뛰기 금지
- **진행 상황 실시간 업데이트** - `docs/popos-progress.md`
- **테스트 필수** - 모든 구현 후 검증

---

## 🚀 Quick Command Reference

### 자주 사용하는 명령어
```bash
# Electron 앱
cd app && npm start          # 앱 실행
cd app && npm run dev        # 개발 모드
cd app && npm run dist       # 인스톨러 생성

# PopOS 서버
ssh choon@10.0.0.2           # PopOS 접속
python3 ~/popos_wan_server.py # 서버 시작
watch -n 1 nvidia-smi        # GPU 모니터

# 테스트
python compare_performance.py # 성능 비교
브라우저: test_flash_attention_status.html
```

### 핵심 경로
```
Windows: C:\WORK\Artifex.AI
PopOS: /home/choon/Wan2.2-*/
API: http://10.0.0.2:8001
```

---

## 📁 프로젝트 구조

### Artifex.AI 핵심 구조
```
app/
├── main/          # Electron 메인 (main.ts)
├── renderer/      # React UI
│   ├── views/    # 각 기능별 뷰
│   └── components/ # 재사용 컴포넌트
└── python/        # Python 백엔드

모델/
├── Wan2.2-T2V-A14B/  # Text to Video
├── Wan2.2-I2V-A14B/  # Image to Video  
├── Wan2.2-TI2V-5B/   # Text+Image to Video
└── Wan2.2-S2V-14B/   # Speech to Video
```

---

## 🎬 핵심 기능

### WAN 비디오 생성 (Main Feature)
1. **T2V** - Text to Video (14B)
2. **I2V** - Image to Video (14B)
3. **TI2V** - Text+Image to Video (5B)
4. **S2V** - Speech to Video (14B)

### IPC 통신 채널
- `wan:run` - 스크립트 실행
- `wan:cancel` - 작업 취소
- `wan:gpuInfo` - GPU 정보
- `popos:*` - PopOS 서버 제어
- `dual-gpu:*` - 듀얼 GPU 관리

---

## 🔧 기술 스택

| Layer | Technology | Version |
|-------|-----------|---------|
| Desktop | Electron | 28.0.0 |
| UI | React + TS | 18.3.1 |
| ML | PyTorch | 2.2.0 |
| Optimization | Flash Attention | 2.5.0 |
| GPU | CUDA | 12.3+ |

---

## 🎯 작업 원칙

### 필수 준수 사항
- ✅ **실제 작동 코드만** - 가짜/데모 코드 금지
- ✅ **기능 완전 구현** - TODO/placeholder 금지
- ✅ **테스트 우선** - 구현 후 즉시 검증
- ✅ **문서 동기화** - 변경사항 즉시 반영

### 금지 사항
- ❌ 마스터 플랜 무시
- ❌ Phase 건너뛰기
- ❌ 테스트 없는 머지
- ❌ 가짜 진행률 보고

---

## 📝 VisionCut.AI 통합 (간략)

### 핵심 기능만
- 비디오 업로드/편집
- 얼굴 분석 (face-api.js)
- 오디오 추출 (FFmpeg)
- 자막 처리 (Whisper)
- AI 연동 (GPT/Claude)

### 네임스페이스
```
artifex:visioncut:ffmpeg:*
artifex:visioncut:audio:*
artifex:visioncut:stt:*
```

---

## 🔥 성능 최적화

### 현재 적용됨
- Flash Attention (PopOS)
- FP16/BF16 변환
- CPU 오프로드
- 모델 캐싱

### 계획됨
- TensorRT 통합
- 듀얼 GPU 파이프라인
- 배치 처리
- 스트리밍

---

## 📦 빌드 & 배포

### Windows Installer
```bash
cd app
npm run dist
# 출력: dist-installer/ArtifexAI-Setup-{version}.exe
```

### 요구사항
- Windows 10/11
- NVIDIA GPU (CUDA)
- Python 3.8+
- 16GB+ RAM

---

## 🧪 테스트 프로토콜

### 필수 테스트
1. PopOS 연결 테스트
2. Flash Attention 검증
3. 성능 벤치마크
4. End-to-End 생성

### 테스트 파일
- `test_popos_connection.py`
- `compare_performance.py`
- `test_flash_attention_status.html`

---

## 📚 문서 참조

### 우선순위별
1. **POPOS_WAN_MASTER_PLAN.md** - 최우선
2. **docs/popos-progress.md** - 진행 상황
3. **docs/popos-implementation/*.md** - Phase별 상세

---

## ⚠️ 중요 알림

- **현재 최우선**: PopOS WAN Phase 1 완료
- **다음 목표**: Core Server 구현 (Phase 2)
- **블로커**: 없음

---

*이 파일은 프로젝트의 핵심 참조 문서입니다.*  
*PopOS 작업 시 POPOS_WAN_MASTER_PLAN.md를 반드시 먼저 확인하세요.*