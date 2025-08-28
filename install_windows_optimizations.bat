@echo off
REM ============================================
REM Windows 11 Flash Attention 대체 솔루션 설치
REM ============================================

echo ========================================
echo Windows 11 Attention 최적화 패키지 설치
echo ========================================
echo.

REM Python 버전 확인
echo [1/7] Python 버전 확인...
python --version
echo.

REM PyTorch 2.0+ 설치/업그레이드 (SDPA 포함)
echo [2/7] PyTorch 2.0+ 설치 (Scaled Dot Product Attention 포함)...
pip install torch>=2.0.0 torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
echo.

REM xFormers 설치 (Windows 지원, Flash Attention 대체)
echo [3/7] xFormers 설치 (메모리 효율적 어텐션)...
pip install xformers --index-url https://download.pytorch.org/whl/cu118
echo.

REM DeepSpeed 설치 (선택사항)
echo [4/7] DeepSpeed 설치 (선택)...
echo 설치하시겠습니까? (Y/N)
set /p install_deepspeed=
if /i "%install_deepspeed%"=="Y" (
    pip install deepspeed
)
echo.

REM ONNX Runtime GPU 설치 (선택사항)
echo [5/7] ONNX Runtime GPU 설치 (선택)...
echo 설치하시겠습니까? (Y/N)
set /p install_onnx=
if /i "%install_onnx%"=="Y" (
    pip install onnxruntime-gpu
)
echo.

REM Triton for Windows (WSL2 필요)
echo [6/7] Triton 설치는 WSL2에서만 가능합니다.
echo WSL2를 사용중이라면 다음 명령을 실행하세요:
echo pip install triton
echo.

REM 환경 변수 설정
echo [7/7] 환경 변수 설정...
setx TORCH_CUDNN_V8_API_ENABLED 1
setx TORCH_BACKENDS_CUDNN_ALLOW_TF32 1
setx CUDA_MODULE_LOADING LAZY
setx PYTORCH_CUDA_ALLOC_CONF max_split_size_mb:512

echo.
echo ========================================
echo 설치 완료!
echo ========================================
echo.

REM 테스트 실행
echo 최적화 테스트를 실행하시겠습니까? (Y/N)
set /p run_test=
if /i "%run_test%"=="Y" (
    echo.
    echo 사용 가능한 최적화 방법 확인중...
    python Wan2.2\windows_attention_optimizer.py
    echo.
    echo 벤치마크 실행중...
    python Wan2.2\windows_attention_optimizer.py --benchmark
)

echo.
echo ========================================
echo 최적화 적용 방법:
echo ========================================
echo 1. 자동 패치: python Wan2.2\windows_attention_optimizer.py --patch
echo 2. 수동 적용: generate.py 실행 전에 다음 추가
echo    from windows_attention_optimizer import patch_wan_attention
echo    patch_wan_attention()
echo.
echo 3. 환경 변수가 적용되려면 새 명령 프롬프트를 열어야 합니다.
echo ========================================

pause