# Artifex AI Studio 종속성 자동 설치 스크립트
# 관리자 권한 필요

param(
    [string]$InstallPath = "C:\ArtifexAI"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = 'SilentlyContinue'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Artifex AI Studio 종속성 설치 프로그램" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 관리자 권한 확인
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "관리자 권한이 필요합니다. 관리자 권한으로 다시 실행해주세요." -ForegroundColor Red
    exit 1
}

# GPU 정보 확인
Write-Host "GPU 정보 확인 중..." -ForegroundColor Yellow
$gpu = Get-WmiObject Win32_VideoController | Where-Object { $_.Name -like "*NVIDIA*" }
if ($gpu) {
    Write-Host "NVIDIA GPU 감지됨: $($gpu.Name)" -ForegroundColor Green
    $hasNvidiaGPU = $true
} else {
    Write-Host "NVIDIA GPU가 감지되지 않았습니다. CPU 모드로 설치됩니다." -ForegroundColor Yellow
    $hasNvidiaGPU = $false
}

# 1. Python 3.11 설치
Write-Host ""
Write-Host "1. Python 3.11 설치 중..." -ForegroundColor Cyan

$pythonInstalled = $false
try {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match "Python 3\.(8|9|10|11)") {
        Write-Host "Python이 이미 설치되어 있습니다: $pythonVersion" -ForegroundColor Green
        $pythonInstalled = $true
    }
} catch { }

if (-not $pythonInstalled) {
    Write-Host "Python 3.11 다운로드 중..." -ForegroundColor Yellow
    $pythonUrl = "https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe"
    $pythonInstaller = "$env:TEMP\python-3.11.9-amd64.exe"
    
    Invoke-WebRequest -Uri $pythonUrl -OutFile $pythonInstaller
    
    Write-Host "Python 설치 중 (자동 설치)..." -ForegroundColor Yellow
    Start-Process -FilePath $pythonInstaller -ArgumentList "/quiet", "InstallAllUsers=1", "PrependPath=1", "Include_test=0" -Wait
    
    Remove-Item $pythonInstaller -Force
    Write-Host "Python 3.11 설치 완료!" -ForegroundColor Green
}

# 2. CUDA 설치 (NVIDIA GPU가 있는 경우)
if ($hasNvidiaGPU) {
    Write-Host ""
    Write-Host "2. CUDA 12.1 설치 중..." -ForegroundColor Cyan
    
    $cudaInstalled = $false
    if (Test-Path "C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.1") {
        Write-Host "CUDA 12.1이 이미 설치되어 있습니다." -ForegroundColor Green
        $cudaInstalled = $true
    }
    
    if (-not $cudaInstalled) {
        Write-Host "CUDA 12.1 다운로드 중 (약 3GB, 시간이 걸릴 수 있습니다)..." -ForegroundColor Yellow
        $cudaUrl = "https://developer.download.nvidia.com/compute/cuda/12.1.0/local_installers/cuda_12.1.0_531.14_windows.exe"
        $cudaInstaller = "$env:TEMP\cuda_12.1.0_windows.exe"
        
        Invoke-WebRequest -Uri $cudaUrl -OutFile $cudaInstaller
        
        Write-Host "CUDA 설치 중 (자동 설치)..." -ForegroundColor Yellow
        Start-Process -FilePath $cudaInstaller -ArgumentList "-s" -Wait
        
        Remove-Item $cudaInstaller -Force
        Write-Host "CUDA 12.1 설치 완료!" -ForegroundColor Green
    }
    
    # cuDNN 설치
    Write-Host "cuDNN 8.9 설치 중..." -ForegroundColor Yellow
    $cudnnUrl = "https://developer.download.nvidia.com/compute/cudnn/redist/cudnn/windows-x86_64/cudnn-windows-x86_64-8.9.7.29_cuda12-archive.zip"
    $cudnnZip = "$env:TEMP\cudnn.zip"
    
    Invoke-WebRequest -Uri $cudnnUrl -OutFile $cudnnZip
    
    Expand-Archive -Path $cudnnZip -DestinationPath "$env:TEMP\cudnn" -Force
    
    # cuDNN 파일을 CUDA 디렉토리로 복사
    $cudaPath = "C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.1"
    Copy-Item "$env:TEMP\cudnn\cudnn-*\bin\*" "$cudaPath\bin\" -Force -Recurse
    Copy-Item "$env:TEMP\cudnn\cudnn-*\include\*" "$cudaPath\include\" -Force -Recurse
    Copy-Item "$env:TEMP\cudnn\cudnn-*\lib\*" "$cudaPath\lib\" -Force -Recurse
    
    Remove-Item $cudnnZip -Force
    Remove-Item "$env:TEMP\cudnn" -Recurse -Force
    Write-Host "cuDNN 8.9 설치 완료!" -ForegroundColor Green
}

# 3. PyTorch 및 필수 패키지 설치
Write-Host ""
Write-Host "3. PyTorch 및 AI 라이브러리 설치 중..." -ForegroundColor Cyan

# pip 업그레이드
Write-Host "pip 업그레이드 중..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# PyTorch 설치 (CUDA 또는 CPU)
if ($hasNvidiaGPU) {
    Write-Host "PyTorch (CUDA 12.1) 설치 중..." -ForegroundColor Yellow
    python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
} else {
    Write-Host "PyTorch (CPU) 설치 중..." -ForegroundColor Yellow
    python -m pip install torch torchvision torchaudio
}

# 필수 AI 라이브러리 설치
Write-Host "AI 라이브러리 설치 중..." -ForegroundColor Yellow
python -m pip install `
    transformers `
    diffusers `
    accelerate `
    safetensors `
    opencv-python `
    numpy `
    pillow `
    scipy `
    tqdm `
    huggingface_hub `
    xformers

Write-Host "AI 라이브러리 설치 완료!" -ForegroundColor Green

# 4. Wan2.2 모델 다운로드
Write-Host ""
Write-Host "4. Wan2.2 AI 모델 설정 중..." -ForegroundColor Cyan

# 모델 디렉토리 생성
$modelPath = "$InstallPath\models"
if (-not (Test-Path $modelPath)) {
    New-Item -ItemType Directory -Path $modelPath -Force | Out-Null
}

# 모델 다운로드 스크립트 생성
$downloadScript = @"
import os
import sys
from huggingface_hub import snapshot_download

models = [
    {"repo": "krea-ai/krea-v1", "local": "Wan2.2-T2V-A14B"},
    {"repo": "stabilityai/stable-video-diffusion", "local": "Wan2.2-I2V-A14B"},
    {"repo": "ali-vilab/text-to-video-ms-1.7b", "local": "Wan2.2-TI2V-5B"},
]

print("Wan2.2 모델 다운로드를 시작합니다...")
print("총 용량: 약 50GB (시간이 오래 걸릴 수 있습니다)")

for model in models:
    model_path = os.path.join(r"$modelPath", model["local"])
    if os.path.exists(model_path) and len(os.listdir(model_path)) > 0:
        print(f"{model['local']} 모델이 이미 존재합니다. 건너뜁니다.")
        continue
        
    print(f"\n{model['local']} 모델 다운로드 중...")
    try:
        snapshot_download(
            repo_id=model["repo"],
            local_dir=model_path,
            local_dir_use_symlinks=False,
            resume_download=True
        )
        print(f"{model['local']} 모델 다운로드 완료!")
    except Exception as e:
        print(f"경고: {model['local']} 모델 다운로드 실패: {e}")
        print("나중에 수동으로 다운로드할 수 있습니다.")

print("\n모델 다운로드 작업이 완료되었습니다!")
"@

$downloadScriptPath = "$env:TEMP\download_models.py"
$downloadScript | Out-File -FilePath $downloadScriptPath -Encoding UTF8

Write-Host "모델 다운로드 중 (약 50GB, 인터넷 속도에 따라 시간이 걸립니다)..." -ForegroundColor Yellow
Write-Host "다운로드를 건너뛰려면 Ctrl+C를 누르세요." -ForegroundColor Gray

try {
    python $downloadScriptPath
} catch {
    Write-Host "모델 다운로드가 취소되었거나 실패했습니다. 나중에 수동으로 다운로드할 수 있습니다." -ForegroundColor Yellow
}

Remove-Item $downloadScriptPath -Force

# 5. 환경 변수 설정
Write-Host ""
Write-Host "5. 환경 변수 설정 중..." -ForegroundColor Cyan

[Environment]::SetEnvironmentVariable("ARTIFEX_AI_HOME", $InstallPath, "Machine")
[Environment]::SetEnvironmentVariable("ARTIFEX_MODELS", $modelPath, "Machine")

if ($hasNvidiaGPU) {
    [Environment]::SetEnvironmentVariable("CUDA_HOME", "C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.1", "Machine")
}

Write-Host "환경 변수 설정 완료!" -ForegroundColor Green

# 완료
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "설치가 완료되었습니다!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "설치된 구성 요소:" -ForegroundColor Cyan
Write-Host "- Python 3.11" -ForegroundColor White
if ($hasNvidiaGPU) {
    Write-Host "- CUDA 12.1 + cuDNN 8.9" -ForegroundColor White
}
Write-Host "- PyTorch + AI 라이브러리" -ForegroundColor White
Write-Host "- Wan2.2 모델 (일부 또는 전체)" -ForegroundColor White
Write-Host ""
Write-Host "이제 Artifex AI Studio를 실행할 수 있습니다!" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")