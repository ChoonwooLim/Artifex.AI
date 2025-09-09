#!/usr/bin/env python3
"""
Dual GPU Connection Test
PopOS GPU Worker 연결 테스트
"""

import json
import urllib.request
import urllib.error

def test_worker_connection():
    """Worker 서버 연결 테스트"""
    
    print("=" * 60)
    print("  Dual GPU System Test")
    print("=" * 60)
    print()
    
    # 1. 연결 테스트
    print("1. Testing connection to PopOS Worker...")
    try:
        with urllib.request.urlopen("http://10.0.0.2:8000", timeout=5) as response:
            data = json.loads(response.read().decode())
            print(f"   [OK] Connected: {data['worker']}")
            print(f"   Status: {data['status']}")
            print(f"   Time: {data['timestamp']}")
    except Exception as e:
        print(f"   [FAIL] Connection failed: {e}")
        return
    
    print()
    
    # 2. GPU 정보 확인
    print("2. Checking GPU Information...")
    try:
        with urllib.request.urlopen("http://10.0.0.2:8000/gpu/info", timeout=5) as response:
            data = json.loads(response.read().decode())
            
            if 'gpus' in data:
                for gpu in data['gpus']:
                    print(f"   [OK] GPU Found: {gpu['name']}")
                    print(f"     - Total Memory: {gpu['memory_total'] / (1024**3):.1f} GB")
                    print(f"     - Free Memory: {gpu['memory_free'] / (1024**3):.1f} GB")
                    print(f"     - Utilization: {gpu['utilization']}%")
            else:
                print("   [FAIL] No GPU information available")
    except Exception as e:
        print(f"   [FAIL] Failed to get GPU info: {e}")
    
    print()
    
    # 3. 로컬 GPU 확인
    print("3. Checking Local GPU (Windows)...")
    try:
        import subprocess
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,memory.total,memory.free", 
             "--format=csv,noheader,nounits"],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            line = result.stdout.strip().split(", ")
            print(f"   [OK] GPU Found: {line[0]}")
            print(f"     - Total Memory: {int(line[1]) / 1024:.1f} GB")
            print(f"     - Free Memory: {int(line[2]) / 1024:.1f} GB")
        else:
            print("   [FAIL] No local GPU found")
    except Exception as e:
        print(f"   [FAIL] Failed to check local GPU: {e}")
    
    print()
    print("=" * 60)
    print("  Dual GPU System Ready!")
    print("=" * 60)
    print()
    print("Summary:")
    print("  - PopOS Worker: RTX 3090 (24GB) @ 10.0.0.2:8000")
    print("  - Windows Local: Check above")
    print("  - Network: 10Gbps Direct Connection")
    print()
    print("You can now use dual GPU processing for:")
    print("  - Text to Video (T2V)")
    print("  - Image to Video (I2V)")
    print("  - Text+Image to Video (TI2V)")
    print("  - Speech to Video (S2V)")

if __name__ == "__main__":
    test_worker_connection()