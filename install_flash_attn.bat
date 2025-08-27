@echo off
echo Installing Flash Attention 2 for RTX 3090...
echo ============================================

REM Flash Attention 2 설치
pip install ninja
pip install flash-attn --no-build-isolation

REM 또는 사전 빌드된 버전 설치 (더 빠름)
REM pip install https://github.com/Dao-AILab/flash-attention/releases/download/v2.6.3/flash_attn-2.6.3+cu123torch2.4cxx11abiFALSE-cp312-cp312-win_amd64.whl

echo.
echo Installation complete!
pause