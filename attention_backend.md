## Attention Backend Guide (Code Map & Runtime Analysis)

본 문서는 main 브랜치에서 영상 생성 경로를 비교·분석하기 위한 “코드 맵 + 실행 분석”을 제공합니다. WELL 브랜치에서 검증된 전략을 기준으로, main에서 필요한 코드 지점과 설정, 런타임 기록을 한 곳에 모읍니다.

### 1) 영상 생성 관련 코드 맵

- 엔트리
  - `Wan2.2/generate.py`: 실행 인자 파싱, 파이프라인 생성/호출
  - `Wan2.2/wan/textimage2video.py`: TI2V 파이프라인 로직

- 백본 모델
  - `Wan2.2/wan/modules/model.py`
    - `WanModel.forward` → `WanAttentionBlock` → `WanSelfAttention`/`WanCrossAttention` → `flash_attention(...)`
    - 입력 임베딩(패치, 텍스트), 시간 임베딩, 블록 반복, 헤드/Unpatchify
    - 주의: `seq_len`까지 패딩하는 로직 존재

- 어텐션 구현(핵심)
  - `Wan2.2/wan/modules/attention.py`
    - 백엔드 선택: FA3/FA2/SDPA(현재 Windows는 SDPA)
    - SDPA 호출: 텐서 `[B, N, L, D]` 전치 후 `scaled_dot_product_attention`
    - 추론 시 dropout=0, 커널 힌트 사용(`enable_flash=False, enable_mem_efficient=True, enable_math=True`)
    - 길이 분산이 큰 경우 per-sample SDPA 분기(옵션)
    - 매우 긴 시퀀스에서는 Windows 전용 래퍼(옵션)

- Windows 전용 대안(옵션)
  - `Wan2.2/wan/modules/windows_flash_attention.py`: Chunked/Ring/xformers 스타일 대안

- 설정
  - `Wan2.2/wan/configs/shared_config.py`: dtype, text_len, frame_num 등 공통 설정
  - `Wan2.2/wan/configs/wan_ti2v_5B.py` 등: 모델 스펙(dim, heads, layers 등)

### 2) 실행 흐름(요점)

1. `generate.py` → 인자/설정 로딩 → TI2V 파이프라인 구성
2. `textimage2video.py` → 이미지/텍스트 준비 → `WanModel` 호출 루프(steps)
3. `WanModel.forward` → 패치/텍스트/시간 임베딩 → 블록 반복
4. 각 블록의 Self/Cross Attention에서 `flash_attention(...)` 호출
5. SDPA 수행 → 출력 결합 → Unpatchify → 비디오 저장

환경변수(백엔드/정밀도)
- `USE_ATTENTION_BACKEND=auto|sdpa|fa2|fa3`
- `USE_SDPA=1`(SDPA 강제)
- `WAN_FORCE_FP16=1`(RTX 권장)
- `WAN_COMPILE=1`(실험적)

### 3) WELL vs main 차이(핵심 체크)

- 패딩 전략
  - WELL: 실제 길이만 계산(고정 패딩/마스크 최소)
  - main: `WanModel.forward`에서 `seq_len`까지 패딩 → O(Lmax²) 연산 증가

- dtype 일관성
  - WELL: 모델/입력/SDPA dtype 일치(BF16 또는 FP16 일관)
  - main: `OPTIMAL_DTYPE`와 모델 파라미터 dtype 불일치 시 캐스팅 비용 발생 가능

- 경로 단순성
  - WELL: SDPA 단일 경로, dropout=0, 마스크 없음, 최소 전치/전처리
  - main: per-sample/Windows 래퍼/로깅 등 분기 추가 → 경로 복잡성 증가(성능에 직접적 영향은 제한적이나 유지관리 변수 증가)

권장 정렬 포인트(설계 제안)
- `WanModel.forward`에서 고정 패딩 최소화(실제 길이 기반 처리 유지)
- dtype을 FP16(또는 BF16)로 단일화하여 캐스팅 제거
- 백엔드 `sdpa` 단일 경로 유지, dropout=0 보장

### 4) 현재 런타임 분석(2025-08-29 TI2V-5B)

인자/설정
- size: 1280x704, frames: 121, steps: 50, guide_scale: 5.0
- offload_model: True, convert_model_dtype: True
- shared_config: param_dtype/t5_dtype = bfloat16, sample_fps=24

로그 포인트
- Triton 미존재 경고(xformers 최적화 미사용) – SDPA 경로에는 영향 제한적
- 진행 속도: 초반 ~22s/step → 34~36% 구간 30~40s/step 스파이크 → 이후 24~26s/step 안정

해석
- 해상도/프레임이 커서 L² 연산이 크고, offload_model=True로 H2D/D2H 전송 지연이 간헐적으로 스파이크 유발 가능
- 캐시 워밍업 이후 안정화(메모리/커널 캐시 히트)

튜닝 가이드(선택)
- `WAN_FORCE_FP16=1` → RTX 환경에서 커널 효율 개선
- VRAM 여유 시 `offload_model=False` 시도 → 전송 스파이크 감소
- steps 50→40/35 조정 → 총시간 단축
- size 1152x640 등으로 조정(연산량 절감, 16배수 유지)

#### 실제 실행 로그(원문)
실험 조건: 5초, 24FPS, 50 steps, 1280x704, TI2V-5B

```text
[info] Output will be saved to: D:\work\Artifex.AI\output\새 폴더\q1.mp4
[2025-08-29 12:19:57,604] INFO: offload_model is not specified, set to True.
[2025-08-29 12:19:57,604] INFO: Generation job args: Namespace(task='ti2v-5B', size='1280*704', frame_num=121, ckpt_dir='D:\\work\\Artifex.AI\\Wan2.2-TI2V-5B', offload_model=True, ulysses_size=1, t5_fsdp=False, t5_cpu=False, dit_fsdp=False, save_file='D:\\work\\Artifex.AI\\output\\새 폴더\\q1.mp4', prompt='A cinematic sunset over mountain lake', use_prompt_extend=False, prompt_extend_method='local_qwen', prompt_extend_model=None, prompt_extend_target_lang='zh', base_seed=7027874542372879868, image='E:\\StabilityMatrix\\Data\\Images\\Text2Img\\2025-06-12\\00110-2411132797.png', sample_solver='unipc', sample_steps=50, sample_shift=5.0, sample_guide_scale=5.0, convert_model_dtype=True, num_clip=None, audio=None, pose_video=None, start_from_ref=False, infer_frames=80)
[2025-08-29 12:19:57,604] INFO: Generation model config: {'__name__': 'Config: Wan TI2V 5B', 't5_model': 'umt5_xxl', 't5_dtype': torch.bfloat16, 'text_len': 512, 'param_dtype': torch.bfloat16, 'num_train_timesteps': 1000, 'sample_fps': 24, 'sample_neg_prompt': '色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走', 'frame_num': 121, 't5_checkpoint': 'models_t5_umt5-xxl-enc-bf16.pth', 't5_tokenizer': 'google/umt5-xxl', 'vae_checkpoint': 'Wan2.2_VAE.pth', 'vae_stride': (4, 16, 16), 'patch_size': (1, 2, 2), 'dim': 3072, 'ffn_dim': 14336, 'freq_dim': 256, 'num_heads': 24, 'num_layers': 30, 'window_size': (-1, -1), 'qk_norm': True, 'cross_attn_norm': True, 'eps': 1e-06, 'sample_shift': 5.0, 'sample_steps': 50, 'sample_guide_scale': 5.0}
[2025-08-29 12:19:57,604] INFO: Input prompt: A cinematic sunset over mountain lake
[2025-08-29 12:19:57,627] INFO: Input image: E:\\StabilityMatrix\\Data\\Images\\Text2Img\\2025-06-12\\00110-2411132797.png
[2025-08-29 12:19:57,627] INFO: Creating WanTI2V pipeline.
[2025-08-29 12:20:56,699] INFO: loading D:\\work\\Artifex.AI\\Wan2.2-TI2V-5B\\models_t5_umt5-xxl-enc-bf16.pth
[2025-08-29 12:21:01,638] INFO: loading D:\\work\\Artifex.AI\\Wan2.2-TI2V-5B\\Wan2.2_VAE.pth
[2025-08-29 12:21:03,744] INFO: Creating WanModel from D:\\work\\Artifex.AI\\Wan2.2-TI2V-5B

Loading checkpoint shards:   0%|          | 0/3 [00:00<?, ?it/s]
Loading checkpoint shards: 100%|██████████| 3/3 [00:00<00:00, 37.14it/s]
[2025-08-29 12:21:03,962] WARNING: A matching Triton is not available, some optimizations will not be enabled
Traceback (most recent call last):
  File "C:\\Users\\choon\\AppData\\Local\\Programs\\Python\\Python312\\Lib\\site-packages\\xformers\\__init__.py", line 57, in _is_triton_available
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
 14%|█▍        | 7/50 [02:34<15:47, 22.03s/it]
 16%|█▌        | 8/50 [02:59<16:12, 23.15s/it]
 18%|█▊        | 9/50 [03:23<16:02, 23.49s/it]
 20%|██        | 10/50 [03:46<15:22, 23.07s/it]
 22%|██▏       | 11/50 [04:08<14:54, 22.93s/it]
 24%|██▍       | 12/50 [04:50<18:11, 28.72s/it]
 26%|██▌       | 13/50 [05:26<18:57, 30.75s/it]
 28%|██▊       | 14/50 [05:49<17:09, 28.59s/it]
 30%|███       | 15/50 [06:14<16:05, 27.58s/it]
 32%|███▏      | 16/50 [06:36<14:40, 25.90s/it]
 34%|███▍      | 17/50 [07:49<21:54, 39.82s/it]
 36%|███▌      | 18/50 [08:16<19:11, 36.00s/it]
 38%|███▊      | 19/50 [08:39<16:40, 32.29s/it]
 40%|████      | 20/50 [09:07<15:25, 30.84s/it]
 42%|████▏     | 21/50 [09:43<15:44, 32.57s/it]
 44%|████▍     | 22/50 [10:07<13:56, 29.87s/it]
 46%|████▌     | 23/50 [10:30<12:34, 27.95s/it]
 48%|████▊     | 24/50 [10:52<11:19, 26.15s/it]
 50%|█████     | 25/50 [11:14<10:21, 24.84s/it]
 52%|█████▏    | 26/50 [11:36<09:34, 23.94s/it]
 54%|█████▍    | 27/50 [11:58<08:56, 23.33s/it]
 56%|█████▌    | 28/50 [12:23<08:47, 23.97s/it]
 58%|█████▊    | 29/50 [12:51<08:47, 25.10s/it]
 60%|██████    | 30/50 [13:15<08:13, 24.67s/it]
 62%|██████▏   | 31/50 [13:41<07:55, 25.04s/it]
 64%|██████▍   | 32/50 [14:07<07:38, 25.45s/it]
 66%|██████▌   | 33/50 [14:33<07:12, 25.41s/it]
 68%|██████▊   | 34/50 [14:58<06:45, 25.37s/it]
 70%|███████   | 35/50 [15:23<06:20, 25.36s/it]
 72%|███████▏  | 36/50 [15:45<05:40, 24.29s/it]
 74%|███████▍  | 37/50 [16:07<05:06, 23.56s/it]
 76%|███████▌  | 38/50 [16:31<04:43, 23.63s/it]
 78%|███████▊  | 39/50 [17:00<04:38, 25.36s/it]
 80%|████████  | 40/50 [17:25<04:13, 25.34s/it]
 82%|████████▏ | 41/50 [17:49<03:43, 24.80s/it]
 84%|████████▍ | 42/50 [18:11<03:11, 23.97s/it]
 86%|████████▌ | 43/50 [18:33<02:43, 23.34s/it]
 88%|████████▊ | 44/50 [18:55<02:17, 22.89s/it]
 90%|█████████ | 45/50 [19:16<01:52, 22.58s/it]
 92%|█████████▏| 46/50 [19:38<01:29, 22.35s/it]
 94%|█████████▍| 47/50 [20:00<01:06, 22.19s/it]
 96%|█████████▌| 48/50 [20:22<00:44, 22.07s/it]
 98%|█████████▊| 49/50 [20:54<00:25, 25.06s/it]
100%|██████████| 50/50 [21:20<00:00, 25.44s/it]
100%|██████████| 50/50 [21:20<00:00, 25.61s/it]
[2025-08-29 12:50:14,691] INFO: Saving generated video to D:\\work\\Artifex.AI\\output\\새 폴더\\q1.mp4
[2025-08-29 12:50:16,534] INFO: [progress] saved=D:\\work\\Artifex.AI\\output\\새 폴더\\q1.mp4
[2025-08-29 12:50:16,535] INFO: Finished.

[closed] code=0
```

요약
- 총 소요 약 21분 20초(50 steps), 평균 약 25.6s/step 수준
- 초반 ~22s/step, 34~36% 구간 스파이크(30~40s/step), 이후 24~26s/step대로 안정화
- xformers/Triton 부재 경고는 SDPA 경로에 직접 영향은 제한적(참고용)

### 5) 디버그/검증 체크리스트

1. 로그에 backend=sdpa, dropout=0, dtype=fp16/bf16 1회 출력 확인
2. Lq/Lk, actual vs batch cost(비율) 확인
3. 첫 스텝 과도지연 시 길이 분산/패딩 여부 확인(가능하면 실제 길이 처리)
4. VRAM 피크, offload 전송 이벤트 추적

### 6) 참고 파일 위치

- `Wan2.2/wan/modules/attention.py` – 백엔드/SDPA 호출
- `Wan2.2/wan/modules/model.py` – 패딩/블록 반복
- `Wan2.2/wan/modules/windows_flash_attention.py` – Windows 대안(옵션)
- `Wan2.2/wan/configs/shared_config.py` – dtype 등 공통 설정
- `Wan2.2/wan/configs/wan_ti2v_5B.py` – TI2V 5B 모델 스펙


