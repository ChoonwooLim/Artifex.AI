@echo off
echo ========================================
echo Building Artifex AI Studio Installer
echo ========================================
echo.

REM 빌드 전 정리
echo [1/5] Cleaning previous builds...
if exist dist-installer rmdir /s /q dist-installer
if exist dist rmdir /s /q dist
if exist dist-electron rmdir /s /q dist-electron

REM 렌더러 빌드
echo [2/5] Building renderer...
call npm run build:renderer
if %errorlevel% neq 0 (
    echo ERROR: Renderer build failed
    pause
    exit /b 1
)

REM Electron 메인 프로세스 빌드
echo [3/5] Building Electron main process...
call npm run build:electron
if %errorlevel% neq 0 (
    echo ERROR: Electron build failed
    pause
    exit /b 1
)

REM 아이콘 파일 체크 (없으면 기본 아이콘 생성)
echo [4/5] Checking icon files...
if not exist build-resources\icon.ico (
    echo WARNING: icon.ico not found in build-resources
    echo Creating default icon...
    REM 기본 아이콘 생성 (실제로는 아이콘 파일을 준비해야 함)
    echo Please add icon.ico to build-resources directory
)

REM 설치 프로그램 빌드
echo [5/5] Building installer...
call npx electron-builder --win --x64
if %errorlevel% neq 0 (
    echo ERROR: Installer build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Installer created at: dist-installer\
echo.
dir dist-installer\*.exe
echo.
pause