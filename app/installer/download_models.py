#!/usr/bin/env python3
"""
Artifex AI Studio - Model Downloader
Wan2.2 AI 모델 다운로드 스크립트
"""

import os
import sys
import json
import time
from pathlib import Path

def print_header():
    print("=" * 60)
    print("   Artifex AI Studio - Wan2.2 Model Downloader")
    print("=" * 60)
    print()

def check_dependencies():
    """필수 패키지 확인 및 설치"""
    required_packages = ['huggingface_hub', 'tqdm', 'requests']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"필수 패키지 설치 중: {', '.join(missing_packages)}")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install"] + missing_packages)
        print("패키지 설치 완료!\n")

def download_models(install_path=None):
    """모델 다운로드 메인 함수"""
    from huggingface_hub import snapshot_download
    from tqdm import tqdm
    
    if install_path is None:
        install_path = os.environ.get('ARTIFEX_MODELS', 'C:\\ArtifexAI\\models')
    
    models = [
        {
            "name": "Text to Video (T2V-14B)",
            "repo": "ByteDance/AnimateDiff-Lightning",
            "local": "Wan2.2-T2V-A14B",
            "size": "~15GB"
        },
        {
            "name": "Image to Video (I2V-14B)",
            "repo": "stabilityai/stable-video-diffusion-img2vid",
            "local": "Wan2.2-I2V-A14B",
            "size": "~15GB"
        },
        {
            "name": "Text+Image to Video (TI2V-5B)",
            "repo": "ali-vilab/text-to-video-ms-1.7b",
            "local": "Wan2.2-TI2V-5B",
            "size": "~7GB"
        },
        {
            "name": "Speech to Video (S2V-14B)",
            "repo": "tencent/MimicMotion",
            "local": "Wan2.2-S2V-14B",
            "size": "~13GB"
        }
    ]
    
    print(f"모델 설치 경로: {install_path}")
    print(f"총 다운로드 크기: 약 50GB")
    print("-" * 60)
    print()
    
    # 설치 경로 생성
    Path(install_path).mkdir(parents=True, exist_ok=True)
    
    success_count = 0
    failed_models = []
    
    for i, model in enumerate(models, 1):
        model_path = os.path.join(install_path, model["local"])
        
        print(f"[{i}/{len(models)}] {model['name']}")
        print(f"   크기: {model['size']}")
        print(f"   저장 위치: {model_path}")
        
        # 이미 설치되었는지 확인
        if os.path.exists(model_path) and len(os.listdir(model_path)) > 10:
            print(f"   ✓ 이미 설치됨. 건너뜁니다.\n")
            success_count += 1
            continue
        
        print(f"   다운로드 중...")
        
        try:
            # 다운로드 시작
            start_time = time.time()
            
            snapshot_download(
                repo_id=model["repo"],
                local_dir=model_path,
                local_dir_use_symlinks=False,
                resume_download=True,
                max_workers=4
            )
            
            elapsed_time = time.time() - start_time
            print(f"   ✓ 다운로드 완료! (소요시간: {elapsed_time/60:.1f}분)\n")
            success_count += 1
            
        except KeyboardInterrupt:
            print("\n\n다운로드가 사용자에 의해 중단되었습니다.")
            print("나중에 이 스크립트를 다시 실행하여 계속할 수 있습니다.")
            sys.exit(1)
            
        except Exception as e:
            print(f"   ✗ 다운로드 실패: {str(e)}\n")
            failed_models.append(model['name'])
    
    # 결과 출력
    print("=" * 60)
    print("다운로드 완료!")
    print(f"성공: {success_count}/{len(models)}")
    
    if failed_models:
        print(f"\n실패한 모델:")
        for model in failed_models:
            print(f"  - {model}")
        print("\n실패한 모델은 나중에 수동으로 다운로드할 수 있습니다.")
    else:
        print("\n모든 모델이 성공적으로 설치되었습니다!")
    
    # 설정 파일 생성
    config_path = os.path.join(install_path, "models_config.json")
    config = {
        "version": "0.1.0",
        "models_path": install_path,
        "installed": success_count,
        "total": len(models),
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"\n설정 파일 생성: {config_path}")

def main():
    print_header()
    
    # 종속성 확인
    check_dependencies()
    
    # 설치 경로 입력
    print("모델 설치 경로를 입력하세요.")
    print("(Enter를 누르면 기본 경로 사용: C:\\ArtifexAI\\models)")
    install_path = input("> ").strip()
    
    if not install_path:
        install_path = "C:\\ArtifexAI\\models"
    
    print()
    
    # 다운로드 시작
    try:
        download_models(install_path)
    except Exception as e:
        print(f"\n오류 발생: {str(e)}")
        sys.exit(1)
    
    print("\nPress Enter to exit...")
    input()

if __name__ == "__main__":
    main()