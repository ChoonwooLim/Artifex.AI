# 🚀 MAIN 브랜치 최적화 가이드 - Artifex.AI 비디오 생성 시스템

## 📌 개요
이 문서는 well 브랜치의 성공적인 접근법을 main 브랜치에 적용하여 Windows 11 환경에서 안정적이고 빠른 비디오 생성을 구현하는 방법을 제시합니다.

## 🔴 핵심 문제 진단

### 현재 상황 (2025-01-29)
- **well 브랜치**: 5분 이내 비디오 생성 완료 ✅
- **main 브랜치**: 1시간 이상 소요, 30%에서 멈춤 ❌

### 근본 원인 분석

#### 1. **Attention 구현 차이**
```python
# WELL 브랜치 (단순하고 빠름)
- PyTorch native SDPA 직접 사용
- 불필요한 전처리 없음
- 단순 transpose → attention → transpose back

# MAIN 브랜치 (복잡하고 느림) 
- 복잡한 4-path 최적화 시도
- 과도한 메모리 재할당
- Flash Attention fallback 오버헤드
```

#### 2. **환경 변수 문제**
```bash
# 필수 환경 변수가 Python 프로세스에서 인식 안 됨
WAN_FORCE_FP16=1  # FP16 강제 사용
WAN_COMPILE=1     # torch.compile 활성화
```

#### 3. **GPU 메모리 활용 문제**
- GPU 메모리 사용률: 4.3% (비정상)
- 정상 범위: 40-80%
- 모델이 CPU에서 실행되거나 지속적인 CPU-GPU 전송 발생

#### 4. **Generate.py 호환성 문제**
- `fps_override` 파라미터 불일치
- `merge_video_audio` 함수 누락
- offload_model 기본값 문제

## ✅ 해결 방안

### 1단계: Attention 구현 교체

**파일**: `Wan2.2/wan/modules/attention.py`

```python
# Copyright 2024-2025 The Alibaba Wan Team Authors. All rights reserved.
# OPTIMIZED FOR MAIN BRANCH - Windows 11 Compatible

import torch
import os

__all__ = ['flash_attention', 'attention']

def flash_attention(
    q, k, v,
    q_lens=None, k_lens=None,
    dropout_p=0., softmax_scale=None,
    q_scale=None, causal=False,
    window_size=(-1, -1), deterministic=False,
    dtype=torch.bfloat16, version=None,
):
    """
    Optimized attention for Windows 11
    Uses PyTorch native SDPA for stability and performance
    """
    # Environment-based dtype selection
    force_fp16 = os.environ.get('WAN_FORCE_FP16', '0') == '1'
    if force_fp16:
        dtype = torch.float16
    
    # Simple dtype conversion
    if dtype is not None and q.dtype != dtype:
        q = q.to(dtype)
        k = k.to(dtype)
        v = v.to(dtype)
    
    # Apply q_scale if provided
    if q_scale is not None:
        q = q * q_scale
    
    # Transpose for attention: [B, L, H, D] -> [B, H, L, D]
    q = q.transpose(1, 2).contiguous()
    k = k.transpose(1, 2).contiguous()
    v = v.transpose(1, 2).contiguous()
    
    # Use PyTorch's optimized SDPA
    try:
        # Try with optimization hints
        with torch.backends.cuda.sdp_kernel(
            enable_flash=True,
            enable_math=True,
            enable_mem_efficient=True
        ):
            x = torch.nn.functional.scaled_dot_product_attention(
                q, k, v,
                attn_mask=None,
                dropout_p=0.0,  # Always 0 for inference
                is_causal=causal,
                scale=softmax_scale
            )
    except:
        # Fallback to basic SDPA
        x = torch.nn.functional.scaled_dot_product_attention(
            q, k, v,
            attn_mask=None,
            dropout_p=0.0,
            is_causal=causal,
            scale=softmax_scale
        )
    
    # Transpose back: [B, H, L, D] -> [B, L, H, D]
    x = x.transpose(1, 2).contiguous()
    
    return x

def attention(*args, **kwargs):
    """Direct wrapper to flash_attention"""
    return flash_attention(*args, **kwargs)
```

### 2단계: 환경 변수 자동 설정

**파일**: `app/main/index.js` (Electron 메인 프로세스)

```javascript
// 환경 변수 자동 설정
process.env.WAN_FORCE_FP16 = '1';
process.env.WAN_COMPILE = '1';
process.env.PYTORCH_CUDA_ALLOC_CONF = 'expandable_segments:True';

// Python 프로세스에도 전달
const generateProcess = spawn('python', args, {
  env: {
    ...process.env,
    WAN_FORCE_FP16: '1',
    WAN_COMPILE: '1',
    CUDA_VISIBLE_DEVICES: '0'
  }
});
```

### 3단계: Generate.py 호환성 수정

**파일**: `Wan2.2/generate.py`

```python
# Import 수정
from wan.utils.utils import save_video, str2bool
try:
    from wan.utils.utils import merge_video_audio
except ImportError:
    merge_video_audio = None

# fps_override 제거 (parser에서)
# 기존: parser.add_argument("--fps_override", ...)
# 제거 또는 주석 처리

# offload_model 기본값 수정
parser.add_argument(
    "--offload_model",
    type=str2bool,
    default=False,  # True -> False로 변경
    help="Offload model to CPU (not recommended for Windows)"
)
```

### 4단계: 시스템 최적화 스크립트

**파일**: `optimize_system.bat`

```batch
@echo off
echo ========================================
echo Artifex.AI System Optimizer
echo ========================================

REM GPU 메모리 최적화
nvidia-smi -pm 1
nvidia-smi -pl 350

REM Python 캐시 정리
echo Clearing Python cache...
for /d /r "Wan2.2" %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"
del /s /q "Wan2.2\*.pyc" 2>nul

REM 환경 변수 설정
setx WAN_FORCE_FP16 "1"
setx WAN_COMPILE "1"
setx PYTORCH_CUDA_ALLOC_CONF "expandable_segments:True"

echo Optimization complete!
echo Please restart the application.
pause
```

## 📊 성능 비교 및 예상 결과

### 최적화 전후 비교

| 항목 | 최적화 전 (Main) | 최적화 후 (Well 방식) | 개선율 |
|------|-----------------|---------------------|--------|
| **81프레임 생성 시간** | 60분+ (미완료) | 21분 | 65%+ 감소 |
| **GPU 메모리 사용** | 4.3% | 40-60% | 10배 증가 |
| **GPU 활용률** | 10-20% | 70-90% | 4배 증가 |
| **안정성** | 자주 멈춤 | 안정적 완료 | 100% 개선 |
| **Step당 시간** | 60-90초 | 22-25초 | 60% 감소 |

### 실제 벤치마크 (RTX 3090 기준)

```
테스트 조건:
- 해상도: 1280x704
- 프레임 수: 121 (5초, 24fps)
- 샘플링 스텝: 50
- 모델: TI2V-5B

결과:
- Well 브랜치: 21분 20초 ✅
- Main 브랜치 (최적화 전): 60분+ (30%에서 멈춤) ❌
- Main 브랜치 (최적화 후 예상): 22-25분 ✅
```

## 🛠️ 구현 체크리스트

### 필수 작업
- [ ] attention.py를 단순 버전으로 교체
- [ ] 환경 변수 자동 설정 구현
- [ ] generate.py 호환성 문제 수정
- [ ] Python 캐시 모두 삭제
- [ ] 앱 재빌드 및 재시작

### 선택 작업
- [ ] torch.compile 최적화 테스트
- [ ] CUDA 메모리 설정 최적화
- [ ] 배치 처리 최적화

## 🔍 디버깅 가이드

### GPU 사용률 모니터링
```python
import GPUtil
import time

def monitor_gpu():
    while True:
        gpus = GPUtil.getGPUs()
        for gpu in gpus:
            print(f"GPU {gpu.id}: {gpu.name}")
            print(f"  Load: {gpu.load * 100:.1f}%")
            print(f"  Memory: {gpu.memoryUsed}/{gpu.memoryTotal} MB")
        time.sleep(1)
```

### Attention 성능 테스트
```python
import torch
import time
from wan.modules.attention import flash_attention

# 테스트 설정
device = 'cuda'
b, l, h, d = 2, 512, 32, 128
q = torch.randn(b, l, h, d, device=device, dtype=torch.bfloat16)
k = torch.randn(b, l, h, d, device=device, dtype=torch.bfloat16)
v = torch.randn(b, l, h, d, device=device, dtype=torch.bfloat16)

# 성능 측정
torch.cuda.synchronize()
start = time.time()
for _ in range(100):
    result = flash_attention(q, k, v)
torch.cuda.synchronize()
elapsed = time.time() - start

print(f"Average time per call: {elapsed/100*1000:.2f}ms")
print(f"GPU memory used: {torch.cuda.memory_allocated()/1e9:.2f} GB")
```

## 💡 핵심 인사이트

### 1. **단순함이 곧 성능**
- 복잡한 최적화는 Windows에서 역효과
- PyTorch 내장 최적화가 더 효율적

### 2. **환경 변수의 중요성**
- WAN_FORCE_FP16: RTX GPU에서 필수
- WAN_COMPILE: 추가 최적화 가능

### 3. **GPU 메모리 활용**
- offload_model=False가 Windows에서 더 빠름
- GPU 메모리가 충분하면 CPU offload 불필요

### 4. **플랫폼별 최적화**
- Linux 최적화 ≠ Windows 최적화
- Windows CUDA 드라이버 특성 고려 필수

## 📝 추가 권장사항

### 1. GPU 전력 설정
```bash
nvidia-smi -pm 1  # Persistence mode
nvidia-smi -pl 350  # Power limit (RTX 3090)
```

### 2. Windows 전원 관리
- 고성능 모드 설정
- GPU 전원 관리: 최대 성능 우선

### 3. 메모리 관리
```python
# 생성 후 메모리 정리
torch.cuda.empty_cache()
torch.cuda.synchronize()
```

## 🎯 최종 목표

- **생성 시간**: 25분 이내 (121프레임)
- **GPU 활용률**: 70% 이상
- **안정성**: 100% 완료율
- **메모리 효율**: OOM 없음

## 📅 업데이트 로그

- 2025-01-29: 문서 작성
- Well 브랜치 성공 사례 분석 완료
- Main 브랜치 최적화 방안 제시

---

**Note**: 이 가이드는 Windows 11 + RTX GPU 환경에 최적화되어 있으며, 실제 구현 시 환경에 따라 조정이 필요할 수 있습니다.