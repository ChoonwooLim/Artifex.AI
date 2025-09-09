@echo off
:: Artifex AI Studio Full Setup
:: 전체 통합 설치 프로그램

title Artifex AI Studio - Full Setup
color 0A

echo ============================================
echo    Artifex AI Studio Full Setup v0.1.0
echo ============================================
echo.
echo 이 프로그램은 다음을 자동으로 설치합니다:
echo   1. Python 3.11
echo   2. CUDA 12.1 (NVIDIA GPU가 있는 경우)
echo   3. PyTorch 및 AI 라이브러리
echo   4. Wan2.2 AI 모델 (약 50GB)
echo   5. Artifex AI Studio 앱
echo.
echo 설치에 30분-1시간이 소요될 수 있습니다.
echo.
pause

:: 관리자 권한 확인 및 요청
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo 관리자 권한이 필요합니다. 관리자 권한으로 다시 실행합니다...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:: PowerShell 실행 정책 설정
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force"

:: 종속성 설치 스크립트 실행
echo.
echo [1/2] 종속성 설치 중...
echo ----------------------------------------
powershell -ExecutionPolicy Bypass -File "%~dp0install-dependencies.ps1"

if %errorLevel% neq 0 (
    echo.
    echo 종속성 설치 중 오류가 발생했습니다.
    echo 수동으로 설치를 진행해주세요.
    pause
    exit /b 1
)

:: Artifex AI Studio 앱 설치
echo.
echo [2/2] Artifex AI Studio 앱 설치 중...
echo ----------------------------------------

if exist "%~dp0..\dist-installer\ArtifexAI-Setup-0.1.0.exe" (
    start /wait "" "%~dp0..\dist-installer\ArtifexAI-Setup-0.1.0.exe"
) else (
    echo.
    echo 경고: ArtifexAI-Setup-0.1.0.exe 파일을 찾을 수 없습니다.
    echo 먼저 npm run dist 명령으로 설치 파일을 생성해주세요.
)

echo.
echo ============================================
echo    설치가 모두 완료되었습니다!
echo ============================================
echo.
echo Artifex AI Studio를 시작 메뉴 또는 
echo 바탕화면 바로가기에서 실행할 수 있습니다.
echo.
pause