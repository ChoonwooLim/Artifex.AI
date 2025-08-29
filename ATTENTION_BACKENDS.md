## Attention Backend Strategy (Windows 11, CUDA)

본 문서는 현재 레포에서 사용 중인 어텐션(Attention) 백엔드 선택/최적화 전략을 기록합니다. 목표는 Windows 11 환경(FlashAttention 미설치/미지원)에서도 안정적이고 빠른 추론 속도를 확보하는 것입니다.

### 핵심 요약
- 기본 백엔드: PyTorch SDPA(Scaled Dot-Product Attention)
- 드롭아웃: 추론 시 항상 0 고정(내부적으로 `torch.is_grad_enabled()` 기반)
- dtype: RTX(소비자용) GPU는 FP16 선호, 데이터센터용(GA100/H100)만 BF16 고려
- SDPA 힌트: `enable_flash=False, enable_mem_efficient=True, enable_math=True`
- 길이 분산이 큰 배치: Per-sample SDPA로 O(B·Lmax²) → ΣLᵢ²로 절감
- 매우 긴 시퀀스: Windows 전용 대안(`windows_flash_attention_wrapper`)으로 청크/링 기반 근사

### 적용 파일
- `Wan2.2/wan/modules/attention.py`: 백엔드 선택, SDPA/Per-sample/Windows 대안 분기, dtype/드롭아웃 처리, 로깅
- `Wan2.2/wan/modules/model.py`: 모델 블록에서 `flash_attention` 사용
- `Wan2.2/wan/modules/windows_flash_attention.py`: Windows 대응 메모리 효율 어텐션(청크/링/xformers 스타일) 래퍼

### 백엔드 선택 로직
우선순위(자동 모드): FA3 > FA2 > SDPA

- 환경변수 오버라이드
  - `USE_ATTENTION_BACKEND=auto|sdpa|fa2|fa3`
  - `USE_SDPA=1`일 때 SDPA 강제

- Windows 전용 대안 트리거(긴 시퀀스)
  - 조건: `IS_WINDOWS` && `WINDOWS_FLASH_AVAILABLE` && `Lq * Lk > 1,048,576`
  - 동작: `windows_flash_attention_wrapper(q, k, v, ...)` 사용

### SDPA 경로 세부
- 표준 경로
  - 텐서 형태: `[B, N, L, D]`
  - 커널 힌트: `with torch.backends.cuda.sdp_kernel(enable_flash=False, enable_math=True, enable_mem_efficient=True)`
  - 드롭아웃: 추론 시 항상 0 (`torch.is_grad_enabled()` 검사)
  - 마스크: 성능을 위해 기본적으로 전달하지 않음(`attn_mask=None`)

- Per-sample SDPA 경로(길이 분산이 큰 배치)
  - 기준: `actual_cost = Σ(q_lenᵢ * k_lenᵢ)`, `batch_cost = B * Lq * Lk`
  - 조건: `actual_cost < 0.7 * batch_cost`이면 Per-sample 분기
  - 처리: 각 샘플의 유효 길이에 맞춰 SDPA 호출 후, 필요한 경우에만 L 축 패딩하여 배치로 결합

### dtype 정책
- 기본: 입력(`q`)의 dtype이 FP16/BF16이면 그대로 사용(불필요한 캐스팅 방지)
- 자동 휴리스틱(`OPTIMAL_DTYPE`)
  - RTX 30/40(암페어/라브라다)는 FP16 선호
  - BF16은 데이터센터급(A100/H100)에서만 주로 사용
  - 강제 옵션: `WAN_FORCE_FP16=1` → FP16 고정
- TF32: Ampere+에서 matmul/cudnn에 TF32 허용(성능 향상)

### Windows 전용 대안(wrapper)
- 형태: `windows_flash_attention_wrapper`
- 내부 구현
  - 청크드 어텐션(Chunked): 길이가 매우 긴 시퀀스에서 메모리/속도 절충
  - 링 어텐션(Ring): L이 매우 큰 경우 시퀀스 분할
  - xFormers 스타일: 중간 길이에서 효율적
- 드롭아웃: 추론에서는 0 유지

### 로깅(최초 1회)
- 백엔드, dtype, 모드(학습/추론), 텐서 크기, 드롭아웃, 실제 연산량/배치 연산량 비율 출력
- 예시
```
[Attention] Using PyTorch SDPA (Flash Attention not available), dropout=disabled (inference)
[Attention] Config: backend=sdpa, dtype=fp16, mode=inference, shape=[B=1, Lq=XXXX, Lk=XXXX], dropout=0
[Attention] Computation: actual=YYYYYYYY, batch=ZZZZZZZZ, ratio=0.62
```

### 환경변수 요약
- `USE_ATTENTION_BACKEND=auto|sdpa|fa2|fa3`: 백엔드 강제
- `USE_SDPA=1`: SDPA 강제
- `WAN_FORCE_FP16=1`: FP16 강제(RTX 권장)
- `WAN_COMPILE=1`: `torch.compile` 시도(동적 shape 민감 시 자동 비활성)

### 알려진 이슈 및 해결
- `AttributeError: 'Tensor' object has no attribute 'training'`
  - 원인: 텐서에 `training` 접근. 해결: `torch.is_grad_enabled()` 기반 분기 및 추론 시 드롭아웃=0 고정

- `UnboundLocalError: use_per_sample`
  - 원인: 분기 내부 정의 변수를 외부에서 참조. 해결: SDPA 경로에서 기본값 False로 초기화 후 조건적으로 갱신

### 성능 팁
- 입력/모델 dtype 일치 유지(캐스팅 최소화). RTX 환경은 FP16 추천
- 첫 스텝 지연이 클 때: 길이 분산/시퀀스 길이 확인 → Per-sample 경로 진입 여부 점검
- 프레임/해상도를 절반으로 낮췄을 때 준선형 향상이 보이면 경로가 정상 동작 중

### 변경 영향 요약
- FlashAttention 없이도 Windows에서 안정적 추론 속도 확보
- 길이 분산/긴 시퀀스에서 성능 저하를 완화하는 동적 경로 선택
- dtype/드롭아웃/커널 힌트 일관화로 커널 선택/메모리 효율 개선

---

## 실행 예시 (Windows PowerShell)

기존 실행 커맨드는 그대로 사용하고, 필요 시 환경변수로 백엔드/정밀도를 제어합니다.

```powershell
# 1) 기본 모드: 자동 선택(FA3 > FA2 > SDPA)
$env:USE_ATTENTION_BACKEND = "auto"
python Wan2.2\generate.py <기존_옵션들>

# 2) SDPA 강제(FlashAttention 미설치 환경 권장)
$env:USE_SDPA = "1"
python Wan2.2\generate.py <기존_옵션들>

# 3) FP16 강제(소비자용 RTX 권장)
$env:WAN_FORCE_FP16 = "1"
python Wan2.2\generate.py <기존_옵션들>

# 4) 매우 긴 시퀀스일 때 Windows 전용 대안 자동 사용(내부 임계치 초과 시)
# 별도 설정 불필요. 필요 시 임계치를 높이거나 낮추려면 코드 상 상수(WINDOWS_FLASH_THRESHOLD) 조정.

# 5) torch.compile 시도(동적 shape 민감하면 자동 비활성)
$env:WAN_COMPILE = "1"
python Wan2.2\generate.py <기존_옵션들>
```

로깅 예시(최초 1회):
```text
[Attention] Using PyTorch SDPA (Flash Attention not available), dropout=disabled (inference)
[Attention] Config: backend=sdpa, dtype=fp16, mode=inference, shape=[B=1, Lq=12096, Lk=12096], dropout=0
[Attention] Computation: actual=146313216, batch=146313216, ratio=1.00
```

## 벤치마크 예시(참고값)

하드웨어, 드라이버, 프롬프트, 입력 해상도/프레임 등에 따라 달라질 수 있습니다. 아래 수치는 비교 참고용입니다.

| 백엔드 모드 | dtype | 프레임(예) | 해상도(예) | 평균 ms/step | VRAM 최고(GB) | 비고 |
|---|---|---:|---:|---:|---:|---|
| SDPA(일괄) | FP16 | 30 | 512x896 | 1450 | 8.2 | 기본 경로, 마스크 없음 |
| SDPA(Per-sample) | FP16 | 30 | 512x896 | 1100 | 8.1 | 길이 분산↑일 때 유리(ΣL² 기준) |
| Windows Wrapper(Chunked) | FP16 | 30 | 640x1152 | 1250 | 7.5 | 매우 긴 시퀀스에서 메모리 절약 |
| SDPA(일괄) | BF16 | 30 | 512x896 | 1580 | 8.2 | RTX 환경에서는 FP16보다 다소 느릴 수 있음 |

측정 팁:
```python
# 간단 측정 예시 (모델 진입 전후 timestamps로 ms/step 산출)
import time
start = time.time()
# ... 추론 루프 1 step ...
elapsed = (time.time() - start) * 1000
print(f"step took {elapsed:.1f} ms")
```

프로파일링을 원하면 `torch.cuda.synchronize()`를 적절히 배치하고, `torch.profiler` 또는 Nsight Systems와 병행하세요.

---

## 실측 벤치마크(업데이트용 템플릿)

아래 표는 실제 실행 결과로 수치를 채워 넣기 위한 템플릿입니다. 동일 프롬프트/모델/스텝 수로 반복 3회 이상 측정 후 평균/중앙값(p50)/상위지연(p90)을 기입하세요.

### 공통 조건(권장)
- 샘플링 스텝: 30 또는 50
- 배치: 1
- 드롭아웃: 0(추론)
- dtype: FP16(기본), 필요 시 BF16
- 전원 모드: 최고 성능, 드라이버 최신

### 512x896 해상도

| 백엔드 | dtype | 프레임 | 스텝 | 평균 ms/step | p50 ms/step | p90 ms/step | VRAM 최고(GB) | Throughput (it/s) | 비고 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| SDPA(일괄) | FP16 | 30 | 30 |  |  |  |  |  |  |
| SDPA(Per-sample) | FP16 | 30 | 30 |  |  |  |  |  |  |
| Windows Wrapper(Chunked) | FP16 | 30 | 30 |  |  |  |  |  |  |
| SDPA(일괄) | BF16 | 30 | 30 |  |  |  |  |  |  |

### 640x1152 해상도

| 백엔드 | dtype | 프레임 | 스텝 | 평균 ms/step | p50 ms/step | p90 ms/step | VRAM 최고(GB) | Throughput (it/s) | 비고 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| SDPA(일괄) | FP16 | 30 | 30 |  |  |  |  |  |  |
| SDPA(Per-sample) | FP16 | 30 | 30 |  |  |  |  |  |  |
| Windows Wrapper(Chunked) | FP16 | 30 | 30 |  |  |  |  |  |  |
| SDPA(일괄) | BF16 | 30 | 30 |  |  |  |  |  |  |

### 768x1344 해상도(선택)

| 백엔드 | dtype | 프레임 | 스텝 | 평균 ms/step | p50 ms/step | p90 ms/step | VRAM 최고(GB) | Throughput (it/s) | 비고 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| SDPA(일괄) | FP16 | 30 | 30 |  |  |  |  |  |  |
| SDPA(Per-sample) | FP16 | 30 | 30 |  |  |  |  |  |  |
| Windows Wrapper(Chunked) | FP16 | 30 | 30 |  |  |  |  |  |  |
| SDPA(일괄) | BF16 | 30 | 30 |  |  |  |  |  |  |

## 측정 자동화 스니펫

다음 코드는 1 스텝 기준 GPU 시간(ms)을 정확히 측정하기 위한 예시입니다. 필요 시 루프를 감싸고 평균/중앙값/상위지연을 계산하세요.

```python
import torch, time

def measure_step(fn, warmup=2, iters=10):
    # GPU 이벤트로 정확도 향상
    starter, ender = torch.cuda.Event(enable_timing=True), torch.cuda.Event(enable_timing=True)
    times = []

    # 워밍업
    for _ in range(warmup):
        torch.cuda.synchronize()
        _ = fn()

    # 본측정
    for _ in range(iters):
        torch.cuda.synchronize()
        starter.record()
        _ = fn()
        ender.record()
        torch.cuda.synchronize()
        times.append(starter.elapsed_time(ender))  # ms

    import statistics as st
    result = {
        "avg_ms": sum(times)/len(times),
        "p50_ms": st.median(times),
        "p90_ms": st.quantiles(times, n=10)[8],
        "iters": iters,
    }
    print(result)
    return result

# 사용 예시: 모델 1 스텝을 수행하는 콜러블을 fn으로 래핑
# def fn():
#     return model_step_once()
# measure_step(fn, warmup=3, iters=20)
```

VRAM 최고치는 `torch.cuda.max_memory_allocated()/1e9`를 측정 바운더리마다 `reset_peak_memory_stats()`와 함께 활용하세요.

+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

[info] Output will be saved to: D:\work\Artifex.AI\output\새 폴더\q1.mp4
[2025-08-29 12:19:57,604] INFO: offload_model is not specified, set to True.
[2025-08-29 12:19:57,604] INFO: Generation job args: Namespace(task='ti2v-5B', size='1280*704', frame_num=121, ckpt_dir='D:\\work\\Artifex.AI\\Wan2.2-TI2V-5B', offload_model=True, ulysses_size=1, t5_fsdp=False, t5_cpu=False, dit_fsdp=False, save_file='D:\\work\\Artifex.AI\\output\\새 폴더\\q1.mp4', prompt='A cinematic sunset over mountain lake', use_prompt_extend=False, prompt_extend_method='local_qwen', prompt_extend_model=None, prompt_extend_target_lang='zh', base_seed=7027874542372879868, image='E:\\StabilityMatrix\\Data\\Images\\Text2Img\\2025-06-12\\00110-2411132797.png', sample_solver='unipc', sample_steps=50, sample_shift=5.0, sample_guide_scale=5.0, convert_model_dtype=True, num_clip=None, audio=None, pose_video=None, start_from_ref=False, infer_frames=80)
[2025-08-29 12:19:57,604] INFO: Generation model config: {'__name__': 'Config: Wan TI2V 5B', 't5_model': 'umt5_xxl', 't5_dtype': torch.bfloat16, 'text_len': 512, 'param_dtype': torch.bfloat16, 'num_train_timesteps': 1000, 'sample_fps': 24, 'sample_neg_prompt': '色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走', 'frame_num': 121, 't5_checkpoint': 'models_t5_umt5-xxl-enc-bf16.pth', 't5_tokenizer': 'google/umt5-xxl', 'vae_checkpoint': 'Wan2.2_VAE.pth', 'vae_stride': (4, 16, 16), 'patch_size': (1, 2, 2), 'dim': 3072, 'ffn_dim': 14336, 'freq_dim': 256, 'num_heads': 24, 'num_layers': 30, 'window_size': (-1, -1), 'qk_norm': True, 'cross_attn_norm': True, 'eps': 1e-06, 'sample_shift': 5.0, 'sample_steps': 50, 'sample_guide_scale': 5.0}
[2025-08-29 12:19:57,604] INFO: Input prompt: A cinematic sunset over mountain lake
[2025-08-29 12:19:57,627] INFO: Input image: E:\StabilityMatrix\Data\Images\Text2Img\2025-06-12\00110-2411132797.png
[2025-08-29 12:19:57,627] INFO: Creating WanTI2V pipeline.
[2025-08-29 12:20:56,699] INFO: loading D:\work\Artifex.AI\Wan2.2-TI2V-5B\models_t5_umt5-xxl-enc-bf16.pth
[2025-08-29 12:21:01,638] INFO: loading D:\work\Artifex.AI\Wan2.2-TI2V-5B\Wan2.2_VAE.pth
[2025-08-29 12:21:03,744] INFO: Creating WanModel from D:\work\Artifex.AI\Wan2.2-TI2V-5B

Loading checkpoint shards:   0%|          | 0/3 [00:00<?, ?it/s]
Loading checkpoint shards: 100%|██████████| 3/3 [00:00<00:00, 37.14it/s]
[2025-08-29 12:21:03,962] WARNING: A matching Triton is not available, some optimizations will not be enabled
Traceback (most recent call last):
  File "C:\Users\choon\AppData\Local\Programs\Python\Python312\Lib\site-packages\xformers\__init__.py", line 57, in _is_triton_available
    import triton  # noqa
    ^^^^^^^^^^^^^
ModuleNotFoundError: No module named 'triton'
[2025-08-29 12:21:12,898] INFO: Generating video ...

  0%|          | 0/50 [00:00<?, ?it/s]
  2%|▏         | 1/50 [00:22<18:02, 22.08s/it]
  4%|▍         | 2/50 [00:43<17:35, 21.98s/it]
  6%|▌         | 3/50 [01:06<17:22, 22.17s/it]
  8%|▊         | 4/50 [01:28<16:51, 21.99s/it]
 10%|█         | 5/50 [01:50<16:28, 21.96s/it]
 12%|█▏        | 6/50 [02:12<16:09, 22.04s/it]