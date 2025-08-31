# 완전 오프라인 LLM 설정 가이드

## 필요한 파일 다운로드 목록

### 1. Ollama 실행 파일
- **URL**: https://github.com/ollama/ollama/releases/download/v0.5.5/ollama-windows-amd64.zip
- **크기**: ~1.8GB
- **저장 경로**: `C:\WORK\Artifex.AI\ollama-local\`
- **설명**: Ollama 서버 바이너리 (완전 포터블)

### 2. 모델 다운로드 방법

#### 방법 1: Ollama를 통한 자동 다운로드 (권장)
Ollama 설치 후 명령어로 다운로드:
```batch
# LLaVA 모델 (멀티모달 - 이미지+텍스트)
ollama pull llava:7b

# Mistral 모델 (텍스트 전용, 매우 빠름)
ollama pull mistral:7b

# Llama 3.2 Vision (최신 멀티모달)
ollama pull llama3.2-vision:11b
```

#### 방법 2: 직접 다운로드 (대체 방법)
아래 사이트에서 수동 다운로드:

**TheBloke의 모델 저장소** (로그인 불필요):
- https://huggingface.co/TheBloke
- 여기서 GGUF 형식 모델 선택

**추천 모델:**
1. **Mistral-7B-Instruct** (텍스트 전용, 안정적)
   - https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF
   - 파일: mistral-7b-instruct-v0.2.Q4_K_M.gguf

2. **Llama-2-7B** (텍스트 전용)
   - https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF
   - 파일: llama-2-7b-chat.Q4_K_M.gguf

3. **Vicuna-7B** (대화 특화)
   - https://huggingface.co/TheBloke/vicuna-7B-v1.5-GGUF
   - 파일: vicuna-7b-v1.5.Q4_K_M.gguf

## 폴더 구조
```
C:\WORK\Artifex.AI\
├── ollama-local\
│   ├── ollama.exe          # Ollama 실행 파일
│   ├── lib\                # 라이브러리 파일들
│   └── runners\            # GPU 런너 파일들
├── models\
│   ├── qwen2-vl-7b-instruct-q4_k_m.gguf
│   ├── qwen2-vl-2b-instruct-q4_k_m.gguf
│   └── llava-v1.5-7b-q4_k.gguf
└── scripts\
    ├── start-ollama.bat    # Ollama 시작 스크립트
    └── load-models.bat     # 모델 로드 스크립트
```

## 다운로드 방법

### PowerShell 스크립트 (자동 다운로드)
```powershell
# Ollama 다운로드
Invoke-WebRequest -Uri "https://github.com/ollama/ollama/releases/download/v0.5.5/ollama-windows-amd64.zip" `
                  -OutFile "ollama-local.zip"

# 모델 다운로드 (Qwen2-VL-7B)
Invoke-WebRequest -Uri "https://huggingface.co/Qwen/Qwen2-VL-7B-Instruct-GGUF/resolve/main/qwen2-vl-7b-instruct-q4_k_m.gguf" `
                  -OutFile "models\qwen2-vl-7b-instruct-q4_k_m.gguf"
```

### 수동 다운로드
1. 위 URL들을 브라우저에 복사
2. 각 파일을 지정된 경로에 저장
3. Ollama zip 파일은 압축 해제

## 완료 후 알려주세요!
파일 다운로드가 완료되면 제가:
1. 자동 시작 스크립트 생성
2. 모델 자동 로드 설정
3. 앱과 완벽한 통합
4. 오프라인 실행 보장

을 설정해드리겠습니다!