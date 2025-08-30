## Visioncut.AI → Artifex.AI 통합 설계서 (v1)

### 11. 비가역 규칙(Non‑negotiables)
- 가짜 메뉴/스켈레톤/플레이스홀더 금지: 동작하지 않는 버튼/메뉴/모달 금지
- 모달/팝업/단축키/접근성 완전 동등 구현: 기존 Visioncut과 기능/이벤트/키보드 UX 동일
- 더미 API/IPC 금지: 모든 호출은 실제 처리/네트워크/파일 IO 수행, 에러는 명세대로 반환
- “TODO/placeholder” 텍스트/주석 금지: 머지 전 반드시 실제 구현/테스트 통과
- 데이터 유실 금지: 임시 파일/키/작업 로그는 규정에 맞게 보존·정리

### 12. 기능 동등성 매트릭스 + DoD
- 업로드/미리보기: 파일 드래그/클릭, 진행 표시, 시간바/컨트롤, 배속, 새 영상 로드
  - DoD: 모든 컨트롤 동작, MP4/AVI/MOV, 1GB 파일 테스트, 오류시 사용자 경고 및 복구
- 얼굴 분석: face-api.js 모델 로드, 1s 샘플링, Actor 카드/병합/타임라인, 진행률 표시
  - DoD: 모델 경로 자동, 최소 5분 영상에서 진행률/카드/병합 정상, 이름 생성 고유성
- 오디오 추출: 네이티브 ffmpeg/품질옵션, 분할(>10MB), 로그/진행률
  - DoD: 하이/미디엄/라이트 3옵션 생성, 분할/비분할 케이스, 임시파일 정리
- STT: OpenAI/AssemblyAI/Google 프록시 경유, 언어/포맷 옵션
  - DoD: 실제 호출/요금 제한 대응 메시지, 파일 업로드/삭제 보장
- 자막 편집: Pro 모달 열기/포커스 트랩/단축키, 병합/분할/싱크/화자/검색/번역/입출력
  - DoD: 1천 라인 자막 편집 성능, SRT/VTT/ASS/TXT/JSON/CSV 입출력, 작업 취소/되돌리기
- 숏츠 제작: 해상도/프레임/비율 프리셋, 인코더 자동 선택
  - DoD: NVENC/QSV/AMF/CPU 자동 선택, 9:16/1:1/4:5/16:9 출력 검증
- AI 연동: 클라우드+로컬(게이트웨이) 선택, 이미지 동반 프롬프트, TPM 안내
  - DoD: 최소 3 공급자 성공 응답, 이미지 포함/미포함 시나리오, 오류 문구 현지화
- 저장 관리: 폴더 선택, 자동 저장, 이름 규칙, 결과 확인
  - DoD: 권한 오류 핸들링, 이름 충돌 방지
- 작업 로그: 유형/날짜 필터, 통계, 내보내기/삭제
  - DoD: 100건 이상 누적/보존, 리로딩 복원

### 13. 모달/팝업 사양(완전 구현)
- 공통: 열기/닫기 이벤트, ESC/Enter, 포커스 트랩, 스크롤 잠금, 애니메이션(페이드/슬라이드), 접근성 ARIA, 다국어 문자열
- API Key Modal: 입력/저장(보안 저장), 외부 링크, 마스킹 토글
- Google Config Modal: Client ID 읽기/저장/초기화, 유효성 검사, 현재 설정 표시
- Image Modal: 썸네일 클릭 확대/닫기, 키보드 네비게이션
- Work Log Modal: 통계/필터/목록/내보내기/전체 삭제, 확인 다이얼로그
- Subtitle Editor Pro Modal: 최대화/최소화/닫기, 파형/시커/단축키, 일괄 작업, Import/Export
- Subtitle Editor Modal(레거시): 호환 유지, Pro로 업셀
- Transcription Modal: 모델/언어/압축/진행/결과 전달, 실패 복구 버튼
- Face Analysis Modal/V2 컨테이너: 진행률/카드/선택/병합, 타임라인 표시

### 14. IPC/프록시 계약(명세)
- 네임스페이스: `artifex:visioncut:*`
- ffmpeg
  - `ffmpeg:version` → { text }
  - `ffmpeg:extract-audio`(path) → { segmented: bool, outPath|outPaths[], logs, segmentList? }
  - `ffmpeg:transcode`({ input, output, width, height, fps }) → { output, logs, vcodec } + progress 이벤트
- audio
  - `audio:extract`({ videoData(base64), fileName, quality }) → { success, audioData|error }
  - `audio:extract-from-path`({ filePath, fileName, quality }) → { success, audioData|error }
- file/io
  - `file:save-to-temp`({ fileName, data|base64, append?, tempPath? }) → { tempPath }
  - `file:save-binary`({ fileName, buffer(ArrayBuffer) }) → { tempPath }
  - `io:read-file-url`(absPath) → file:// url, `io:read-file-bytes`(absPath) → ArrayBuffer
  - `io:delete-files`([paths]) → { success }
- keys
  - `keys:load` → { provider→key }, `keys:save`({ ... }) → { success }
- stt
  - `stt:openai`({ bytes, language, apiKey? }) → { text|__error }
- app
  - `app:get-proxy-port` → number
- 프록시(Artifex Express, prefix `/visioncut`)
  - `POST /api/openai/transcriptions|translations`
  - `POST /api/assemblyai/upload|transcript`, `GET /api/assemblyai/transcript/:id`
  - `POST /api/google/speech`
  - 파일 업로드 후 즉시 삭제 보장, 오류 시 finally 정리

### 15. 자산/경로 어댑터
- face-api.js 모델: `public/models/*` → `assets/visioncut/models/*`
- 코드: `getModelBasePath()`가 Artifex 정적 경로를 반환하도록 분기(개발/프로덕션/Electron)
- 정적 라이브러리: `/js/vendor/face-api.js` 경로도 Artifex 자산 경로로 매핑

### 16. 디렉토리 매핑(권장)
- `modules/visioncut/electron/*` (main/preload/utils)
- `modules/visioncut/web/js/*` (기능 모듈)
- `modules/visioncut/web/css/*`
- `assets/visioncut/models/*`, `assets/visioncut/js/vendor/*`, `assets/visioncut/image/*`

### 17. 환경 변수 규약
- `VISIONCUT_ENABLE_HTTPS`, `VISIONCUT_DEV_PORT`, `VISIONCUT_BASE_PATH`
- GAPI/GIS 플래그는 Artifex 전역 `.env`로 승계

### 18. 로깅/보안 가이드
- 민감정보 마스킹: 키/토큰/경로 일부 별표 처리
- 예외 로깅: IPC/프록시 오류 원인·상태코드 포함, 사용자에게는 요약 메시지
- 임시파일 수명: 생성/사용/삭제 로그, 크기/경로 기록

### 19. 성능 기준(SLA)
- 초기 로드 < 2.5s(렌더러), 모듈 지연 로딩 활용
- 얼굴 분석 10분 영상 기준 샘플링 1s 간격 처리 < 실시간×1.5
- 오디오 추출 10분 영상 < 30s(NVENC 가용 시), 진행률 이벤트 500ms 주기 내 업데이트
- 자막 편집 1천행 조작시 입력 지연 < 32ms, 스크롤 스터터링 無

### 20. 테스트/수락 기준
- E2E: 업로드→분석→추출→STT→편집→렌더 전 흐름, 모달 전 종류 열기/닫기/단축키
- 단위: IPC 계약 케이스/에러, 파서/파일 IO, 분할 로직
- 통합: 프록시 실제 호출(모킹 금지), 임시파일 삭제 확인
- 수락: DoD 전 항목 충족, 가짜 UI 요소 0, 로그/에러 기준 충족

### 21. Claude Code 작업 지시서(집행용)
- “가짜 UI/스켈레톤/더미 호출” 생성 금지. 모든 메뉴/모달/버튼은 실제 기능 연결
- 기존 Visioncut 소스의 파일/함수/이벤트를 그대로 이식하거나 호환 어댑터 구현
- IPC는 `artifex:visioncut:*` 네임스페이스로 전환하고, 명세된 스키마대로 요청/응답/에러 처리
- 프록시는 Artifex 메인 Express에 통합하고 업로드 파일 정리 보장
- face-api.js 자산 경로/라이브러리 경로 어댑터를 구현하여 개발/패키지 모두 동작
- 자막 편집 Pro 모달의 모든 버튼/단축키/일괄 작업/입출력 포맷을 1:1 구현
- 병합 전 체크리스트(DoD)와 테스트/수락 기준을 모두 통과할 것. 일부 미충족 시 병합 금지
### 1. 목표와 범위
- **목표**: Visioncut.AI(영상 업로드/얼굴 분석/오디오-자막/전문 자막 편집/숏츠 제작/AI 연동)를 Artifex.AI의 서브 메뉴로 완전 이식. UX/기능 100% 동등 + Artifex 공통 서비스(키 관리, 로그, 업데이트)에 결합.
- **범위**: UI/라우팅, Electron 메인/프리로드 IPC, FFmpeg 네이티브/wasm, CORS 프록시, face-api.js 모델 자산, 자막 편집기, AI 게이트웨이(클라우드+오픈소스).

### 2. 상위 아키텍처
- Artifex.AI Shell(Electron Main) 안에 Visioncut 모듈을 **서브메뉴**로 노출
- 렌더러는 `BrowserView` 혹은 **내부 라우트**(`/visioncut`)로 로드
- 공통 서비스(키저장/업데이트/로깅) 재사용, Visioncut 고유 IPC는 `artifex:visioncut/*` 네임스페이스로 통합

### 3. 통합 구성 요소
1) UI/라우팅
   - Artifex 좌측 네비게이션에 "Visioncut" 추가 → 클릭 시 `/visioncut`
   - HTML은 기존 `index.html` 섹션을 React/TSX or Vanilla로 래핑하여 컴포넌트화

2) Electron Main/Preload
   - 기존 `electron/main.js`의 IPC를 `artifex:visioncut:*`로 옮기고, Artifex main에서 등록
   - `preload.cjs` 노출 API를 `window.visioncut` 네임스페이스로 병합

3) FFmpeg/프록시
   - 네이티브 ffmpeg: Artifex 공통 설치 경로 사용, 하드웨어 인코더 탐지 로직 유지
   - 내장 프록시(express): Artifex main 프로세스에서 단일 인스턴스 운영, 엔드포인트 접두사 `/visioncut` 추가

4) 모델/자산 배포
   - `public/models`(face-api.js) → Artifex 정적 자산 폴더(`/assets/visioncut/models`)로 복사 및 경로 어댑터 적용

5) 상태/저장소
   - Visioncut 상태는 Artifex 글로벌 스토어(예: Redux/Zustand)로 위임 또는 독립 스토어 유지 후 어댑터 제공
   - 작업 로그는 Artifex 공통 로깅 채널에 집계

### 4. 데이터 플로우(요약)
- 업로드 → 미리보기 → 얼굴분석(모델 자산) → 오디오 추출(네이티브 ffmpeg or wasm) → STT(프록시) → 자막 편집 → 렌더/숏츠 제작

### 5. LLM 게이트웨이 설계(클라우드 + 오픈소스)
- 단일 **LLM 게이트웨이** 모듈이 공급자 추상화: `provider=cloud|local`, `modelKey`, `capabilities={text,vision,audio}`
- 클라우드: OpenAI, Anthropic, Google, Groq, OpenRouter, Mistral(기존 api.js 로직 이관)
- 로컬(오픈소스): vLLM/LM Studio/llama.cpp/Ollama/SGLang 중 선택 구성

권장 구성(데스크톱, 윈도우 최적):
- 텍스트 범용: Llama 3.1 70B Instruct(로컬은 고사양 필요) 또는 8B/13B 양자화 + vLLM/llama.cpp
- 멀티모달(VLM): LLaVA-OneVision-Qwen2.5/InternVL2; 이미지 캡션/이해로 Visioncut의 얼굴/장면 요약 서브기능 강화
- 초경량 추론: Qwen2.5-7B/8B, Mistral 7B, Phi-4 미세튜닝

추론 서버 옵션:
- **Ollama**: 간편 설치/모델 관리, API 호환; Windows 지원 양호
- **vLLM**: 고성능 서버, 텐서 병렬/텐서라이즈; 로컬 GPU가 충분할 때 권장
- **llama.cpp**: CPU/소형 GPU, 저자원 양자화 모델 용이
- **LM Studio**: GUI 기반 로컬 서버, 프록시처럼 사용 가능

게이트웨이 API 초안:
```
POST /api/visioncut/llm/chat
{ provider: "openai|anthropic|ollama|vllm|llamacpp", model: "...", messages: [...], images: [...], max_tokens, temperature }

POST /api/visioncut/llm/vision
{ provider, model, prompt, images: [dataURL|path], tasks: ["caption","describe","ocr"] }
```

### 6. 추천 오픈소스(“ChatGPT-5 유사” 기능 지향)
- **프레임워크/서빙**
  - vLLM: 대규모 모델 고성능 서빙(다중 GPU/텐서 병렬); OpenAI 호환 엔드포인트
  - FastChat: 다중 모델 라우팅/채팅 UI
  - SGLang: 효율적 서빙/프로그래밍적 파이프라인
- **모델 후보**
  - 텍스트 SOTA: Llama 3.1 70B Instruct, Qwen2.5-72B-Instruct, Mistral-Large(상용), DeepSeek-R1/Chat(코딩/추론 특화)
  - 멀티모달: LLaVA-OneVision, Qwen2-VL, InternVL2.5, MiniCPM-V 2.6
  - 음성(STT/TTS): Whisper large-v3, F5-TTS/XTTS(오픈)

비고: “ChatGPT-5와 같은” 범용 고성능/멀티모달 경험을 오픈소스만으로 완전 동일 재현은 난이도 높음. 실용적으로는 상기 스택 조합(+클라우드 백업)으로 유사 UX 구현 권장.

### 7. 마이그레이션 체크리스트
1) 프로젝트 구조 이관: `js/`, `electron/`, `public/models/` → Artifex 하위 `modules/visioncut/`
2) IPC 리네이밍: `audio:*`, `ffmpeg:*`, `keys:*` → `artifex:visioncut:*`
3) 프록시 통합: 단일 Express 인스턴스, 경로 `/visioncut/*`
4) 키 저장: Artifex 보안 저장소 API로 교체
5) 모델 자산 경로 어댑터: `getModelBasePath()`에서 Artifex 정적 경로 사용
6) 자막 편집기/얼굴 분석 UI 통합 및 스타일 조정
7) LLM 게이트웨이 설치 옵션 노출(UI: 모델 소스=Cloud/Local)
8) 성능/메모리 테스트, 하드웨어 인코더 탐지 검증

### 8. 단계별 구현 계획
- Phase 1: UIshell 통합, 정적 자산/라우팅/메뉴, IPC 리네이밍
- Phase 2: 프록시/FFmpeg/face-api.js 통합, 자막 편집기 동작 확인
- Phase 3: LLM 게이트웨이(클라우드 라우팅) 이관, Key/설정 UI 통합
- Phase 4: 오픈소스 LLM 로컬 추론 연동(Ollama 우선), Vision 기능
- Phase 5: 배포/업데이트/로깅/권한 정책 통합, 튜닝/최적화

### 9. 보안/배포 고려사항
- API 키 보호(암호화 저장/OS Keychain), 로깅 시 마스킹
- 프록시 업로드 임시파일 항상 정리, 실패 경로 방어
- COOP/COEP + SharedArrayBuffer 설정 유지, CSP는 Electron 맥락 고려
- 빌드 아티팩트 네이밍/아이콘 Visioncut 브랜딩 일관화

### 10. 부록: 작업 노트
- 현재 Visioncut 문서/코드는 AutoShorts 네이밍 잔존 → 점진 교체 권장
- Artifex 공용 성능 모니터와 Visioncut의 `performance-monitor.js`는 통합 또는 어댑터로 병합


