@echo off
:: Artifex AI Studio Release Package Creator
:: 다른 PC 배포용 패키지 생성 스크립트

echo ================================================
echo    Artifex AI Studio Release Package Creator
echo ================================================
echo.

:: 변수 설정
set RELEASE_DIR=ArtifexAI-Release-Package
set VERSION=0.1.0

:: 기존 패키지 삭제
if exist "%RELEASE_DIR%" (
    echo 기존 패키지 폴더 삭제 중...
    rmdir /s /q "%RELEASE_DIR%"
)

:: 패키지 디렉토리 생성
echo 패키지 디렉토리 생성 중...
mkdir "%RELEASE_DIR%"
mkdir "%RELEASE_DIR%\installer"

:: 필수 파일 복사
echo.
echo 필수 파일 복사 중...

:: 1. 메인 설치 파일
if exist "app\dist-installer\ArtifexAI-Setup-%VERSION%.exe" (
    echo [1/5] 메인 앱 설치 파일 복사...
    copy "app\dist-installer\ArtifexAI-Setup-%VERSION%.exe" "%RELEASE_DIR%\"
) else (
    echo [경고] ArtifexAI-Setup-%VERSION%.exe 파일이 없습니다!
    echo        먼저 'cd app && npm run dist' 를 실행하세요.
)

:: 2. 통합 설치 배치 파일
echo [2/5] 통합 설치 스크립트 복사...
copy "app\installer\setup-full.bat" "%RELEASE_DIR%\"

:: 3. PowerShell 설치 스크립트
echo [3/5] 종속성 설치 스크립트 복사...
copy "app\installer\install-dependencies.ps1" "%RELEASE_DIR%\installer\"

:: 4. Python 모델 다운로드 스크립트
echo [4/5] 모델 다운로드 스크립트 복사...
copy "app\installer\download_models.py" "%RELEASE_DIR%\installer\"

:: 5. README 파일 생성
echo [5/5] 설치 안내서 생성...
(
echo Artifex AI Studio v%VERSION% - 설치 안내서
echo ================================================
echo.
echo ## 설치 방법
echo.
echo ### 방법 1: 전체 자동 설치 [권장]
echo 1. setup-full.bat 파일을 관리자 권한으로 실행
echo 2. 설치 과정이 자동으로 진행됩니다 ^(30분-1시간 소요^)
echo    - Python 3.11 자동 설치
echo    - CUDA 12.1 자동 설치 ^(NVIDIA GPU가 있는 경우^)
echo    - PyTorch 및 AI 라이브러리 자동 설치
echo    - Wan2.2 AI 모델 다운로드 ^(약 50GB^)
echo    - Artifex AI Studio 앱 설치
echo.
echo ### 방법 2: 앱만 설치
echo 1. ArtifexAI-Setup-%VERSION%.exe 실행
echo 2. Python, CUDA, 모델은 별도로 설치 필요
echo.
echo ## 시스템 요구사항
echo - Windows 10/11 ^(64비트^)
echo - 16GB RAM 이상 권장
echo - NVIDIA GPU ^(선택사항, 있으면 더 빠름^)
echo - 100GB 이상 디스크 공간 ^(모델 포함^)
echo.
echo ## 파일 구조
echo - setup-full.bat              : 전체 통합 설치 실행 파일
echo - ArtifexAI-Setup-%VERSION%.exe : 메인 앱 설치 파일
echo - installer\                  : 설치 스크립트 폴더
echo   - install-dependencies.ps1  : 종속성 자동 설치 스크립트
echo   - download_models.py        : AI 모델 다운로드 스크립트
echo.
echo ## 문제 해결
echo - 관리자 권한이 필요합니다
echo - Windows Defender가 차단할 경우 "추가 정보" → "실행" 클릭
echo - 설치 중 오류 발생 시 개별 구성요소를 수동 설치
echo.
echo ## 지원
echo - GitHub: https://github.com/artifex-ai/artifex-studio
echo - Email: support@artifex.ai
echo.
echo Copyright © 2025 Artifex AI
) > "%RELEASE_DIR%\README.txt"

:: 간단한 실행 배치 파일 생성
echo 간단한 실행 파일 생성 중...
(
echo @echo off
echo echo ============================================
echo echo    Artifex AI Studio 설치를 시작합니다
echo echo ============================================
echo echo.
echo echo 전체 자동 설치를 진행하시겠습니까?
echo echo ^(Python, CUDA, AI 라이브러리 모두 설치^)
echo echo.
echo pause
echo call setup-full.bat
) > "%RELEASE_DIR%\INSTALL.bat"

:: ZIP 압축 (PowerShell 사용)
echo.
echo 압축 파일 생성 중...
powershell -Command "Compress-Archive -Path '%RELEASE_DIR%\*' -DestinationPath 'ArtifexAI-v%VERSION%-Setup.zip' -Force"

:: 결과 출력
echo.
echo ================================================
echo    패키지 생성 완료!
echo ================================================
echo.
echo 생성된 파일:
echo   - ArtifexAI-v%VERSION%-Setup.zip (압축 파일)
echo   - %RELEASE_DIR%\ (폴더)
echo.
echo 다른 PC에 전달할 파일:
echo   1. ArtifexAI-v%VERSION%-Setup.zip 하나만 전달
echo   2. 받는 사람이 압축 해제 후 INSTALL.bat 실행
echo.
pause