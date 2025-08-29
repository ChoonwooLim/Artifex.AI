@echo off
echo ========================================
echo Building Artifex AI Studio Portable
echo ========================================
echo.

REM 빌드 전 정리
echo [1/4] Cleaning previous builds...
if exist dist-portable rmdir /s /q dist-portable

REM 렌더러 빌드
echo [2/4] Building renderer...
call npm run build:renderer
if %errorlevel% neq 0 (
    echo ERROR: Renderer build failed
    pause
    exit /b 1
)

REM Electron 메인 프로세스 빌드
echo [3/4] Building Electron main process...
call npm run build:electron
if %errorlevel% neq 0 (
    echo ERROR: Electron build failed
    pause
    exit /b 1
)

REM 포터블 버전 빌드
echo [4/4] Building portable version...
call npx electron-builder --win portable --x64
if %errorlevel% neq 0 (
    echo ERROR: Portable build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Portable version created at: dist-installer\
echo.
dir dist-installer\*.exe
echo.
pause