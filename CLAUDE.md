# Claude Development Notes

## 🚀 Artifex.AI - 대표 프로젝트 정보
- **메인 프로젝트명**: Artifex.AI (이 프로젝트의 대표 앱)
- **앱 이름**: Artifex AI Studio
- **버전**: 0.1.0
- **Type**: AI 비디오 생성 데스크톱 애플리케이션 (Electron + React + Python)
- **Location**: C:\WORK\Artifex.AI

## 🎬 핵심 기능 (AI 비디오 생성)
### Wan2.2 AI 모델 기반 비디오 생성 기능
1. **Text to Video (T2V-14B)** - 텍스트를 비디오로 변환
2. **Image to Video (I2V-14B)** - 이미지를 비디오로 변환
3. **Text+Image to Video (TI2V-5B)** - 텍스트와 이미지를 결합하여 비디오 생성
4. **Speech to Video (S2V-14B)** - 음성을 비디오로 변환 (립싱크 포함)

## 📁 앱 구조 상세 분석
### /app (Electron 데스크톱 앱)
```
app/
├── main/                 # Electron 메인 프로세스
│   ├── main.ts          # 메인 프로세스 (메뉴, IPC, 업데이터, GPU 관리)
│   └── updater.ts       # 자동 업데이트 관리
├── renderer/            # React UI (프론트엔드)
│   ├── App.tsx         # 메인 앱 컴포넌트
│   ├── views/          # 각 기능별 뷰
│   │   ├── TextToVideoView.tsx
│   │   ├── ImageToVideoView.tsx
│   │   ├── TextImageToVideoView.tsx
│   │   ├── SpeechToVideoView.tsx
│   │   └── VideoGenerationView.tsx
│   ├── workflow/       # 비디오 편집 워크플로우
│   │   ├── VideoEditor.tsx
│   │   ├── VideoTimeline.tsx
│   │   ├── VideoEffects.tsx
│   │   ├── VideoExport.tsx
│   │   ├── CinematicControls.tsx
│   │   └── Flow.tsx (Node Editor)
│   └── components/     # 재사용 가능한 UI 컴포넌트
├── python/             # Python 백엔드
│   ├── s2v.py         # Speech to Video 처리
│   └── t2i.py         # Text to Image 처리
├── preload/           # Electron preload 스크립트
└── dist-electron/     # 빌드된 Electron 파일
```

### 모델 디렉토리 (Wan2.2 AI Models)
```
Wan2.2/                 # 메인 모델 코드베이스
Wan2.2-T2V-A14B/       # Text to Video 모델
Wan2.2-I2V-A14B/       # Image to Video 모델
Wan2.2-TI2V-5B/        # Text+Image to Video 모델
Wan2.2-S2V-14B/        # Speech to Video 모델
```

## 🛠 개발 명령어
### Electron 앱 (app/ 디렉토리)
- `cd app && npm start` - Electron 앱 실행
- `cd app && npm run dev` - 개발 모드 (hot reload)
- `cd app && npm run build` - 프로덕션 빌드
- `cd app && npm run dist` - 설치 파일 생성 (Windows installer)
- `cd app && npm run pack` - 패키징만 수행

## 🔧 기술 스택
### Frontend
- **Electron 28.0.0** - 데스크톱 앱 프레임워크
- **React 18.3.1** - UI 라이브러리
- **TypeScript 5.5.4** - 타입 안전성
- **ReactFlow 11.11.4** - 노드 에디터
- **Three.js 0.179.1** - 3D 그래픽스
- **Vite 5.4.0** - 빌드 도구

### Backend (Python)
- **Wan2.2 Models** - AI 비디오 생성 모델
- **PyTorch** - 딥러닝 프레임워크
- **Diffusers** - 확산 모델 라이브러리
- **CUDA** - GPU 가속

## 💻 주요 기능 상세
### 1. 메인 프로세스 (main.ts)
- 창 상태 관리 (위치, 크기 저장/복원)
- 자동 업데이트 (GitHub 릴리즈)
- GPU 정보 및 CUDA 상태 확인
- Python 프로세스 관리
- 파일/폴더 다이얼로그
- 설정 저장/불러오기
- 모델 체크포인트 자동 감지

### 2. IPC 통신 채널
- `wan:run` - Python 스크립트 실행
- `wan:cancel` - 실행 중인 작업 취소
- `wan:openFile/openFolder` - 파일/폴더 선택
- `wan:getSettings/setSettings` - 설정 관리
- `wan:suggestCkpt` - 모델 체크포인트 추천
- `wan:validatePython` - Python 환경 검증
- `wan:gpuInfo` - GPU 정보 조회
- `wan:generateS2V` - Speech to Video 생성

### 3. 메뉴 시스템
- **File** - 프로젝트 관리, 캐시 정리, 앱 리셋
- **Edit** - 표준 편집 기능
- **View** - UI 토글, 개발자 도구
- **Developer** - 디버깅, GPU 정보, 시스템 정보
- **Help** - 문서, 단축키, 업데이트 확인

### 4. 보안 설정
- Context Isolation 활성화
- Node Integration 비활성화
- Web Security 활성화
- 단일 인스턴스 잠금

## 🎨 UI 특징
- 다크 테마 기본
- 그라디언트 애니메이션
- 반응형 디자인
- 드래그 앤 드롭 지원
- 실시간 진행률 표시
- 콘솔 로그 뷰어

## 📦 빌드 및 배포
### Windows Installer (NSIS)
- 관리자 권한 요구
- 데스크톱/시작 메뉴 바로가기 생성
- 다국어 지원 (영어, 한국어)
- 자동 업데이트 지원
- 설치 경로 선택 가능

### 빌드 리소스
- `build-resources/icon.ico` - 앱 아이콘
- `build-resources/license.txt` - 라이선스
- 출력: `dist-installer/ArtifexAI-Setup-{version}.exe`

## 🔥 성능 최적화
- CPU 오프로드 지원
- FP16/BF16 자동 변환
- T5 모델 CPU 실행 옵션
- Flash Attention 지원
- 메모리 효율적인 모델 로딩

## 📝 중요 참고사항
- **Artifex.AI는 이 프로젝트의 대표 앱입니다**
- 모든 Wan2.2 모델이 통합되어 있음
- GPU CUDA 지원 필수 (NVIDIA)
- Python 3.8+ 필요
- 최소 16GB RAM 권장
- Windows 10/11 지원

## AI Collaboration Guidelines (자동 적용)

### 핵심 원칙
1. **절대적 투명성** - 기술적 한계 먼저 설명, 경제적 투명성 보장
2. **실용성 우선** - 실제 작동하는 기능만 구현, 데모 코드 금지
3. **적응적 효율성** - 작업 복잡도에 따른 전략 선택
4. **한국어 설명명 우선**

### 작업 복잡도 전략
- **단순 작업**: 병렬 처리로 속도 최적화
- **복잡 작업**: 단계별 직렬 처리로 정확성 보장

### 비용 투명성 프로토콜
- 유료 서비스 필요시 사전 비용 공개
- 무료 대안과 비교 분석 제공
- 숨겨진 비용이나 추가 요금 투명 공개

### 전문가 AI 네트워크
- 3회 시도 후 해결 안 되면 전문 AI 연결
- 코딩: Claude-3.5-Sonnet, Cursor
- 수학: Wolfram Alpha, GPT-4
- 창작: Midjourney, DALL-E 3

### 금지 행위
- ❌ 가짜 구현 (작동하지 않는 코드)
- ❌ 기술적 한계 숨김
- ❌ 불필요한 시간 소모
- ❌ 복잡한 작업에 강제 병렬 처리

### 성공 지표
- ✅ 제공된 모든 코드 즉시 실행 가능: 100%
- ✅ 추가 수정 없이 바로 사용 가능
- ✅ 예상 시간 내 작업 완료
- ✅ 기술적 한계 사전 정확 예측

## 코드 리뷰 수정 가이드라인 🛡️

### 철저히 확인할 사항들

#### 1. **기존 기능 보존**
- 모든 현재 작동하는 기능들이 그대로 유지되는지 확인
- API 호출, UI 동작, 데이터 처리 등 모든 기능 테스트
- 사용자 경험(UX)에 영향이 없는지 검증

#### 2. **디자인 무결성**
- CSS 클래스나 스타일 변경이 다른 UI에 영향을 주지 않는지 확인
- 레이아웃, 색상, 애니메이션 등 시각적 요소 보존
- 반응형 디자인 유지

#### 3. **안전한 수정 원칙**
- 기존 코드를 삭제하기보다는 조건부 추가
- 새로운 기능은 기존 기능과 독립적으로 구현
- 충돌 가능성이 있는 부분은 사전에 경고

#### 4. **변경 전후 비교**
- 수정 전 코드의 동작 완벽히 이해
- 수정 후 예상되는 영향 범위 분석
- 사이드 이펙트 가능성 체크

### 작업 프로세스 📋
1. **코드 리뷰 내용 분석**
2. **영향 범위 파악**
3. **안전한 구현 방법 제시**
4. **위험 요소 사전 경고**
5. **단계별 신중한 수정**

> ⚠️ **중요**: 코드 리뷰 요청사항을 구현할 때는 **기존 기능과 디자인을 100% 보존**하면서 요청사항을 구현해야 합니다.

## Notes
- 이 파일은 Claude가 프로젝트별 정보를 기억하는 데 사용됩니다
- 중요한 개발 메모, 명령어, 프로젝트 세부사항을 추가하세요
- **AI 협업 가이드라인은 모든 작업에 자동 적용됩니다**

