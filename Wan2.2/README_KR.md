# Wan2.2

<p align="center">
    <img src="assets/logo.png" width="400"/>
<p>

<p align="center">
    💜 <a href="https://wan.video"><b>Wan</b></a> &nbsp&nbsp ｜ &nbsp&nbsp 🖥️ <a href="https://github.com/Wan-Video/Wan2.2">GitHub</a> &nbsp&nbsp  | &nbsp&nbsp🤗 <a href="https://huggingface.co/Wan-AI/">Hugging Face</a>&nbsp&nbsp | &nbsp&nbsp🤖 <a href="https://modelscope.cn/organization/Wan-AI">ModelScope</a>&nbsp&nbsp | &nbsp&nbsp 📑 <a href="https://arxiv.org/abs/2503.20314">논문</a> &nbsp&nbsp | &nbsp&nbsp 📑 <a href="https://wan.video/welcome?spm=a2ty_o02.30011076.0.0.6c9ee41eCcluqg">블로그</a> &nbsp&nbsp |  &nbsp&nbsp 💬  <a href="https://discord.gg/AKNgpMK4Yj">Discord</a>&nbsp&nbsp
    <br>
    📕 <a href="https://alidocs.dingtalk.com/i/nodes/jb9Y4gmKWrx9eo4dCql9LlbYJGXn6lpz">사용 가이드(중국어)</a>&nbsp&nbsp | &nbsp&nbsp 📘 <a href="https://alidocs.dingtalk.com/i/nodes/EpGBa2Lm8aZxe5myC99MelA2WgN7R35y">사용 가이드(영어)</a>&nbsp&nbsp | &nbsp&nbsp💬 <a href="https://gw.alicdn.com/imgextra/i2/O1CN01tqjWFi1ByuyehkTSB_!!6000000000015-0-tps-611-1279.jpg">WeChat(위챗)</a>&nbsp&nbsp
<br>

-----

[**Wan: 오픈소스 고급 대규모 비디오 생성 모델**](https://arxiv.org/abs/2503.20314) <be>


**Wan2.2**를 소개하게 되어 기쁩니다. 이는 기초 비디오 모델의 주요 업그레이드입니다. **Wan2.2**에서는 다음과 같은 혁신에 중점을 두었습니다:

- 👍 **효과적인 MoE 아키텍처**: Wan2.2는 비디오 확산 모델에 전문가 혼합(MoE) 아키텍처를 도입합니다. 타임스텝별로 특화된 강력한 전문가 모델로 노이즈 제거 프로세스를 분리함으로써, 동일한 계산 비용을 유지하면서 전체 모델 용량을 확장합니다.

- 👍 **영화 수준의 미학**: Wan2.2는 조명, 구성, 대비, 색조 등의 상세한 레이블이 포함된 세심하게 선별된 미학 데이터를 통합합니다. 이를 통해 더 정확하고 제어 가능한 영화 스타일 생성이 가능하며, 사용자 정의 가능한 미적 선호도로 비디오를 생성할 수 있습니다.

- 👍 **복잡한 모션 생성**: Wan2.1과 비교하여 Wan2.2는 이미지 65.6% 증가, 비디오 83.2% 증가로 훨씬 더 큰 데이터로 훈련되었습니다. 이러한 확장은 모션, 의미론, 미학 등 여러 차원에서 모델의 일반화를 크게 향상시켜, 모든 오픈소스 및 클로즈드소스 모델 중에서 최고의 성능을 달성합니다.

- 👍 **효율적인 고화질 하이브리드 TI2V**: Wan2.2는 **16×16×4**의 압축 비율을 달성하는 고급 Wan2.2-VAE로 구축된 5B 모델을 오픈소스로 제공합니다. 이 모델은 720P 해상도 24fps에서 텍스트-투-비디오 및 이미지-투-비디오 생성을 모두 지원하며 4090과 같은 소비자급 그래픽 카드에서도 실행할 수 있습니다. 현재 이용 가능한 가장 빠른 **720P@24fps** 모델 중 하나로, 산업 및 학술 부문을 동시에 지원할 수 있습니다.


## 비디오 데모

<div align="center">
  <video src="https://github.com/user-attachments/assets/b63bfa58-d5d7-4de6-a1a2-98970b06d9a7" width="70%" poster=""> </video>
</div>

## 🔥 최신 소식!!

* 2025년 8월 26일: 🎵 오디오 기반 영화 비디오 생성 모델인 **[Wan2.2-S2V-14B](https://humanaigc.github.io/wan-s2v-webpage)**를 소개합니다. [추론 코드](#음성-투-비디오-생성-실행), [모델 가중치](#모델-다운로드), [기술 보고서](https://humanaigc.github.io/wan-s2v-webpage/content/wan-s2v.pdf)를 포함합니다! 지금 [wan.video](https://wan.video/), [ModelScope Gradio](https://www.modelscope.cn/studios/Wan-AI/Wan2.2-S2V) 또는 [HuggingFace Gradio](https://huggingface.co/spaces/Wan-AI/Wan2.2-S2V)에서 사용해보세요!
* 2025년 7월 28일: 👋 TI2V-5B 모델을 사용하는 [HF 스페이스](https://huggingface.co/spaces/Wan-AI/Wan-2.2-5B)를 공개했습니다. 즐겨보세요!
* 2025년 7월 28일: 👋 Wan2.2가 ComfyUI에 통합되었습니다 ([중국어](https://docs.comfy.org/zh-CN/tutorials/video/wan/wan2_2) | [영어](https://docs.comfy.org/tutorials/video/wan/wan2_2)). 즐겨보세요!
* 2025년 7월 28일: 👋 Wan2.2의 T2V, I2V, TI2V가 Diffusers에 통합되었습니다 ([T2V-A14B](https://huggingface.co/Wan-AI/Wan2.2-T2V-A14B-Diffusers) | [I2V-A14B](https://huggingface.co/Wan-AI/Wan2.2-I2V-A14B-Diffusers) | [TI2V-5B](https://huggingface.co/Wan-AI/Wan2.2-TI2V-5B-Diffusers)). 자유롭게 사용해보세요!
* 2025년 7월 28일: 👋 **Wan2.2**의 추론 코드와 모델 가중치를 릴리스했습니다.


## 커뮤니티 작품
[**Wan2.1**](https://github.com/Wan-Video/Wan2.1) 또는 [**Wan2.2**](https://github.com/Wan-Video/Wan2.2)를 기반으로 한 연구나 프로젝트가 있고, 더 많은 사람들이 보길 원한다면 알려주세요.

- [DiffSynth-Studio](https://github.com/modelscope/DiffSynth-Studio)는 저GPU 메모리 레이어별 오프로드, FP8 양자화, 시퀀스 병렬 처리, LoRA 훈련, 전체 훈련을 포함한 Wan 2.2에 대한 포괄적인 지원을 제공합니다.
- [Kijai의 ComfyUI WanVideoWrapper](https://github.com/kijai/ComfyUI-WanVideoWrapper)는 ComfyUI용 Wan 모델의 대체 구현입니다. Wan에만 집중하여 최첨단 최적화와 핫 리서치 기능을 가장 먼저 적용합니다.


## 📑 할 일 목록
- Wan2.2 텍스트-투-비디오
    - [x] A14B 및 14B 모델의 멀티-GPU 추론 코드
    - [x] A14B 및 14B 모델의 체크포인트
    - [x] ComfyUI 통합
    - [x] Diffusers 통합
- Wan2.2 이미지-투-비디오
    - [x] A14B 모델의 멀티-GPU 추론 코드
    - [x] A14B 모델의 체크포인트
    - [x] ComfyUI 통합
    - [x] Diffusers 통합
- Wan2.2 텍스트-이미지-투-비디오
    - [x] 5B 모델의 멀티-GPU 추론 코드
    - [x] 5B 모델의 체크포인트
    - [x] ComfyUI 통합
    - [x] Diffusers 통합
- Wan2.2-S2V 음성-투-비디오
    - [x] Wan2.2-S2V의 추론 코드
    - [x] Wan2.2-S2V-14B의 체크포인트
    - [ ] ComfyUI 통합
    - [ ] Diffusers 통합

## Wan2.2 실행하기

#### 설치
레포지토리 복제:
```sh
git clone https://github.com/Wan-Video/Wan2.2.git
cd Wan2.2
```

의존성 설치:
```sh
# torch >= 2.4.0 확인
# `flash_attn` 설치가 실패하면 다른 패키지를 먼저 설치하고 `flash_attn`을 마지막에 설치해 보세요
pip install -r requirements.txt
```


#### 모델 다운로드

| 모델                | 다운로드 링크                                                                                                                              | 설명 |
|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------|-------------|
| T2V-A14B    | 🤗 [Huggingface](https://huggingface.co/Wan-AI/Wan2.2-T2V-A14B)    🤖 [ModelScope](https://modelscope.cn/models/Wan-AI/Wan2.2-T2V-A14B)    | 텍스트-투-비디오 MoE 모델, 480P & 720P 지원 |
| I2V-A14B    | 🤗 [Huggingface](https://huggingface.co/Wan-AI/Wan2.2-I2V-A14B)    🤖 [ModelScope](https://modelscope.cn/models/Wan-AI/Wan2.2-I2V-A14B)    | 이미지-투-비디오 MoE 모델, 480P & 720P 지원 |
| TI2V-5B     | 🤗 [Huggingface](https://huggingface.co/Wan-AI/Wan2.2-TI2V-5B)     🤖 [ModelScope](https://modelscope.cn/models/Wan-AI/Wan2.2-TI2V-5B)     | 고압축 VAE, T2V+I2V, 720P 지원 |
| S2V-14B     | 🤗 [Huggingface](https://huggingface.co/Wan-AI/Wan2.2-S2V-14B)     🤖 [ModelScope](https://modelscope.cn/models/Wan-AI/Wan2.2-S2V-14B)     | 음성-투-비디오 모델, 480P & 720P 지원 |



> 💡참고: 
> TI2V-5B 모델은 **24 FPS**로 720P 비디오 생성을 지원합니다.


huggingface-cli를 사용한 모델 다운로드:
``` sh
pip install "huggingface_hub[cli]"
huggingface-cli download Wan-AI/Wan2.2-T2V-A14B --local-dir ./Wan2.2-T2V-A14B
```

modelscope-cli를 사용한 모델 다운로드:
``` sh
pip install modelscope
modelscope download Wan-AI/Wan2.2-T2V-A14B --local_dir ./Wan2.2-T2V-A14B
```

#### 텍스트-투-비디오 생성 실행

이 레포지토리는 `Wan2.2-T2V-A14B` 텍스트-투-비디오 모델을 지원하며 480P와 720P 해상도에서 동시에 비디오 생성을 지원할 수 있습니다.


##### (1) 프롬프트 확장 없이

구현을 용이하게 하기 위해 [프롬프트 확장](#2-프롬프트-확장-사용) 단계를 건너뛰는 기본 버전의 추론 프로세스로 시작합니다.

- 단일 GPU 추론

``` sh
python generate.py  --task t2v-A14B --size 1280*720 --ckpt_dir ./Wan2.2-T2V-A14B --offload_model True --convert_model_dtype --prompt "편안한 복싱 장비와 밝은 장갑을 착용한 두 의인화된 고양이가 스포트라이트를 받는 무대에서 격렬하게 싸운다."
```

> 💡 이 명령은 최소 80GB VRAM이 있는 GPU에서 실행할 수 있습니다.

> 💡OOM(Out-of-Memory) 문제가 발생하면 `--offload_model True`, `--convert_model_dtype`, `--t5_cpu` 옵션을 사용하여 GPU 메모리 사용량을 줄일 수 있습니다.


- FSDP + DeepSpeed Ulysses를 사용한 멀티-GPU 추론

  추론을 가속화하기 위해 [PyTorch FSDP](https://docs.pytorch.org/docs/stable/fsdp.html)와 [DeepSpeed Ulysses](https://arxiv.org/abs/2309.14509)를 사용합니다.


``` sh
torchrun --nproc_per_node=8 generate.py --task t2v-A14B --size 1280*720 --ckpt_dir ./Wan2.2-T2V-A14B --dit_fsdp --t5_fsdp --ulysses_size 8 --prompt "편안한 복싱 장비와 밝은 장갑을 착용한 두 의인화된 고양이가 스포트라이트를 받는 무대에서 격렬하게 싸운다."
```


##### (2) 프롬프트 확장 사용

프롬프트를 확장하면 생성된 비디오의 디테일을 효과적으로 풍부하게 하여 비디오 품질을 더욱 향상시킬 수 있습니다. 따라서 프롬프트 확장을 활성화하는 것을 권장합니다. 프롬프트 확장을 위해 다음 두 가지 방법을 제공합니다:

- Dashscope API를 사용한 확장
  - 사전에 `dashscope.api_key`를 신청하세요 ([영어](https://www.alibabacloud.com/help/en/model-studio/getting-started/first-api-call-to-qwen) | [중국어](https://help.aliyun.com/zh/model-studio/getting-started/first-api-call-to-qwen)).
  - Dashscope API 키를 지정하기 위해 환경 변수 `DASH_API_KEY`를 설정하세요. 알리바바 클라우드 국제 사이트 사용자의 경우 환경 변수 `DASH_API_URL`을 'https://dashscope-intl.aliyuncs.com/api/v1'로 설정해야 합니다. 더 자세한 지침은 [dashscope 문서](https://www.alibabacloud.com/help/en/model-studio/developer-reference/use-qwen-by-calling-api?spm=a2c63.p38356.0.i1)를 참조하세요.
  - 텍스트-투-비디오 작업에는 `qwen-plus` 모델을, 이미지-투-비디오 작업에는 `qwen-vl-max`를 사용합니다.
  - `--prompt_extend_model` 매개변수로 확장에 사용되는 모델을 수정할 수 있습니다. 예:
```sh
DASH_API_KEY=your_key torchrun --nproc_per_node=8 generate.py  --task t2v-A14B --size 1280*720 --ckpt_dir ./Wan2.2-T2V-A14B --dit_fsdp --t5_fsdp --ulysses_size 8 --prompt "편안한 복싱 장비와 밝은 장갑을 착용한 두 의인화된 고양이가 스포트라이트를 받는 무대에서 격렬하게 싸운다" --use_prompt_extend --prompt_extend_method 'dashscope' --prompt_extend_target_lang 'ko'
```

- 로컬 모델을 사용한 확장

  - 기본적으로 HuggingFace의 Qwen 모델이 이 확장에 사용됩니다. 사용자는 사용 가능한 GPU 메모리 크기에 따라 Qwen 모델이나 다른 모델을 선택할 수 있습니다.
  - 텍스트-투-비디오 작업의 경우 `Qwen/Qwen2.5-14B-Instruct`, `Qwen/Qwen2.5-7B-Instruct`, `Qwen/Qwen2.5-3B-Instruct`와 같은 모델을 사용할 수 있습니다.
  - 이미지-투-비디오 작업의 경우 `Qwen/Qwen2.5-VL-7B-Instruct`, `Qwen/Qwen2.5-VL-3B-Instruct`와 같은 모델을 사용할 수 있습니다.
  - 더 큰 모델은 일반적으로 더 나은 확장 결과를 제공하지만 더 많은 GPU 메모리가 필요합니다.
  - `--prompt_extend_model` 매개변수로 확장에 사용되는 모델을 수정할 수 있으며, 로컬 모델 경로나 Hugging Face 모델을 지정할 수 있습니다. 예:

``` sh
torchrun --nproc_per_node=8 generate.py  --task t2v-A14B --size 1280*720 --ckpt_dir ./Wan2.2-T2V-A14B --dit_fsdp --t5_fsdp --ulysses_size 8 --prompt "편안한 복싱 장비와 밝은 장갑을 착용한 두 의인화된 고양이가 스포트라이트를 받는 무대에서 격렬하게 싸운다" --use_prompt_extend --prompt_extend_method 'local_qwen' --prompt_extend_target_lang 'ko'
```


#### 이미지-투-비디오 생성 실행

이 레포지토리는 `Wan2.2-I2V-A14B` 이미지-투-비디오 모델을 지원하며 480P와 720P 해상도에서 동시에 비디오 생성을 지원할 수 있습니다.


- 단일 GPU 추론
```sh
python generate.py --task i2v-A14B --size 1280*720 --ckpt_dir ./Wan2.2-I2V-A14B --offload_model True --convert_model_dtype --image examples/i2v_input.JPG --prompt "여름 해변 휴가 스타일, 선글라스를 쓴 하얀 고양이가 서프보드에 앉아 있다. 털이 보송보송한 고양이가 편안한 표정으로 카메라를 직접 바라본다. 맑은 물, 먼 녹색 언덕, 흰 구름이 점재한 푸른 하늘이 배경을 이룬다. 고양이는 바닷바람과 따뜻한 햇빛을 즐기는 듯 자연스럽게 편안한 자세를 취한다. 클로즈업 샷이 고양이의 섬세한 디테일과 해변의 상쾌한 분위기를 강조한다."
```

> 이 명령은 최소 80GB VRAM이 있는 GPU에서 실행할 수 있습니다.

> 💡이미지-투-비디오 작업의 경우 `size` 매개변수는 생성된 비디오의 영역을 나타내며, 종횡비는 원본 입력 이미지를 따릅니다.


- FSDP + DeepSpeed Ulysses를 사용한 멀티-GPU 추론

```sh
torchrun --nproc_per_node=8 generate.py --task i2v-A14B --size 1280*720 --ckpt_dir ./Wan2.2-I2V-A14B --image examples/i2v_input.JPG --dit_fsdp --t5_fsdp --ulysses_size 8 --prompt "여름 해변 휴가 스타일, 선글라스를 쓴 하얀 고양이가 서프보드에 앉아 있다. 털이 보송보송한 고양이가 편안한 표정으로 카메라를 직접 바라본다. 맑은 물, 먼 녹색 언덕, 흰 구름이 점재한 푸른 하늘이 배경을 이룬다. 고양이는 바닷바람과 따뜻한 햇빛을 즐기는 듯 자연스럽게 편안한 자세를 취한다. 클로즈업 샷이 고양이의 섬세한 디테일과 해변의 상쾌한 분위기를 강조한다."
```

- 프롬프트 없이 이미지-투-비디오 생성

```sh
DASH_API_KEY=your_key torchrun --nproc_per_node=8 generate.py --task i2v-A14B --size 1280*720 --ckpt_dir ./Wan2.2-I2V-A14B --prompt '' --image examples/i2v_input.JPG --dit_fsdp --t5_fsdp --ulysses_size 8 --use_prompt_extend --prompt_extend_method 'dashscope'
```

> 💡모델은 입력 이미지만으로 비디오를 생성할 수 있습니다. 프롬프트 확장을 사용하여 이미지에서 프롬프트를 생성할 수 있습니다.

> 프롬프트 확장 프로세스는 [여기](#2-프롬프트-확장-사용)를 참조할 수 있습니다.

#### 텍스트-이미지-투-비디오 생성 실행

이 레포지토리는 `Wan2.2-TI2V-5B` 텍스트-이미지-투-비디오 모델을 지원하며 720P 해상도에서 비디오 생성을 지원할 수 있습니다.


- 단일 GPU 텍스트-투-비디오 추론
```sh
python generate.py --task ti2v-5B --size 1280*704 --ckpt_dir ./Wan2.2-TI2V-5B --offload_model True --convert_model_dtype --t5_cpu --prompt "편안한 복싱 장비와 밝은 장갑을 착용한 두 의인화된 고양이가 스포트라이트를 받는 무대에서 격렬하게 싸운다"
```

> 💡다른 작업과 달리 텍스트-이미지-투-비디오 작업의 720P 해상도는 `1280*704` 또는 `704*1280`입니다.

> 이 명령은 최소 24GB VRAM이 있는 GPU(예: RTX 4090 GPU)에서 실행할 수 있습니다.

> 💡최소 80GB VRAM이 있는 GPU에서 실행하는 경우 실행 속도를 높이기 위해 `--offload_model True`, `--convert_model_dtype`, `--t5_cpu` 옵션을 제거할 수 있습니다.


- 단일 GPU 이미지-투-비디오 추론
```sh
python generate.py --task ti2v-5B --size 1280*704 --ckpt_dir ./Wan2.2-TI2V-5B --offload_model True --convert_model_dtype --t5_cpu --image examples/i2v_input.JPG --prompt "여름 해변 휴가 스타일, 선글라스를 쓴 하얀 고양이가 서프보드에 앉아 있다. 털이 보송보송한 고양이가 편안한 표정으로 카메라를 직접 바라본다. 맑은 물, 먼 녹색 언덕, 흰 구름이 점재한 푸른 하늘이 배경을 이룬다. 고양이는 바닷바람과 따뜻한 햇빛을 즐기는 듯 자연스럽게 편안한 자세를 취한다. 클로즈업 샷이 고양이의 섬세한 디테일과 해변의 상쾌한 분위기를 강조한다."
```

> 💡이미지 매개변수가 설정된 경우 이미지-투-비디오 생성이며, 그렇지 않으면 기본적으로 텍스트-투-비디오 생성입니다.

> 💡이미지-투-비디오와 마찬가지로 `size` 매개변수는 생성된 비디오의 영역을 나타내며, 종횡비는 원본 입력 이미지를 따릅니다.


- FSDP + DeepSpeed Ulysses를 사용한 멀티-GPU 추론

```sh
torchrun --nproc_per_node=8 generate.py --task ti2v-5B --size 1280*704 --ckpt_dir ./Wan2.2-TI2V-5B --dit_fsdp --t5_fsdp --ulysses_size 8 --image examples/i2v_input.JPG --prompt "여름 해변 휴가 스타일, 선글라스를 쓴 하얀 고양이가 서프보드에 앉아 있다. 털이 보송보송한 고양이가 편안한 표정으로 카메라를 직접 바라본다. 맑은 물, 먼 녹색 언덕, 흰 구름이 점재한 푸른 하늘이 배경을 이룬다. 고양이는 바닷바람과 따뜻한 햇빛을 즐기는 듯 자연스럽게 편안한 자세를 취한다. 클로즈업 샷이 고양이의 섬세한 디테일과 해변의 상쾌한 분위기를 강조한다."
```

> 프롬프트 확장 프로세스는 [여기](#2-프롬프트-확장-사용)를 참조할 수 있습니다.

#### 음성-투-비디오 생성 실행

이 레포지토리는 `Wan2.2-S2V-14B` 음성-투-비디오 모델을 지원하며 480P와 720P 해상도에서 동시에 비디오 생성을 지원할 수 있습니다.

- 단일 GPU 음성-투-비디오 추론

```sh
python generate.py  --task s2v-14B --size 1024*704 --ckpt_dir ./Wan2.2-S2V-14B/ --offload_model True --convert_model_dtype --prompt "여름 해변 휴가 스타일, 선글라스를 쓴 하얀 고양이가 서프보드에 앉아 있다."  --image "examples/i2v_input.JPG" --audio "examples/talk.wav"
# --num_clip을 설정하지 않으면 생성된 비디오 길이는 입력 오디오 길이에 따라 자동으로 조정됩니다
```

> 💡 이 명령은 최소 80GB VRAM이 있는 GPU에서 실행할 수 있습니다.

- FSDP + DeepSpeed Ulysses를 사용한 멀티-GPU 추론

```sh
torchrun --nproc_per_node=8 generate.py --task s2v-14B --size 1024*704 --ckpt_dir ./Wan2.2-S2V-14B/ --dit_fsdp --t5_fsdp --ulysses_size 8 --prompt "여름 해변 휴가 스타일, 선글라스를 쓴 하얀 고양이가 서프보드에 앉아 있다." --image "examples/i2v_input.JPG" --audio "examples/talk.wav"
```

- 포즈 + 오디오 기반 생성

```sh
torchrun --nproc_per_node=8 generate.py --task s2v-14B --size 1024*704 --ckpt_dir ./Wan2.2-S2V-14B/ --dit_fsdp --t5_fsdp --ulysses_size 8 --prompt "사람이 노래를 부르고 있다" --image "examples/pose.png" --audio "examples/sing.MP3" --pose_video "./examples/pose.mp4" 
```

> 💡음성-투-비디오 작업의 경우 `size` 매개변수는 생성된 비디오의 영역을 나타내며, 종횡비는 원본 입력 이미지를 따릅니다.

> 💡모델은 참조 이미지와 선택적 텍스트 프롬프트와 결합된 오디오 입력에서 비디오를 생성할 수 있습니다.

> 💡`--pose_video` 매개변수는 포즈 기반 생성을 활성화하여 모델이 오디오 입력과 동기화된 비디오를 생성하면서 특정 포즈 시퀀스를 따를 수 있게 합니다.

> 💡`--num_clip` 매개변수는 생성되는 비디오 클립 수를 제어하며, 더 짧은 생성 시간으로 빠른 미리보기에 유용합니다.

## 다양한 GPU에서의 계산 효율성

다음 표에서 다양한 GPU에서 서로 다른 **Wan2.2** 모델의 계산 효율성을 테스트했습니다. 결과는 **총 시간(초) / 최대 GPU 메모리(GB)** 형식으로 제시됩니다.


<div align="center">
    <img src="assets/comp_effic.png" alt="" style="width: 80%;" />
</div>

> 이 표에 제시된 테스트의 매개변수 설정은 다음과 같습니다:
> (1) 멀티-GPU: 14B: `--ulysses_size 4/8 --dit_fsdp --t5_fsdp`, 5B: `--ulysses_size 4/8 --offload_model True --convert_model_dtype --t5_cpu`; 단일-GPU: 14B: `--offload_model True --convert_model_dtype`, 5B: `--offload_model True --convert_model_dtype --t5_cpu`
(--convert_model_dtype는 모델 매개변수 유형을 config.param_dtype로 변환);
> (2) 분산 테스트는 내장 FSDP와 Ulysses 구현을 활용하며, Hopper 아키텍처 GPU에 FlashAttention3가 배포됨;
> (3) 테스트는 `--use_prompt_extend` 플래그 없이 실행됨;
> (4) 보고된 결과는 워밍업 단계 후 여러 샘플의 평균값.


-------

## Wan2.2 소개

**Wan2.2**는 Wan2.1을 기반으로 생성 품질과 모델 기능이 눈에 띄게 향상되었습니다. 이 업그레이드는 주로 전문가 혼합(MoE) 아키텍처, 업그레이드된 훈련 데이터, 고압축 비디오 생성을 포함한 일련의 핵심 기술 혁신에 의해 구동됩니다.

##### (1) 전문가 혼합(MoE) 아키텍처

Wan2.2는 비디오 생성 확산 모델에 전문가 혼합(MoE) 아키텍처를 도입합니다. MoE는 대규모 언어 모델에서 추론 비용을 거의 변경하지 않으면서 총 모델 매개변수를 증가시키는 효율적인 접근 방식으로 널리 검증되었습니다. Wan2.2에서 A14B 모델 시리즈는 확산 모델의 노이즈 제거 프로세스에 맞춤화된 두 전문가 설계를 채택합니다: 초기 단계를 위한 고노이즈 전문가(전체 레이아웃에 중점)와 후기 단계를 위한 저노이즈 전문가(비디오 디테일 개선). 각 전문가 모델은 약 14B 매개변수를 가지고 있어 총 27B 매개변수이지만 단계당 14B 활성 매개변수만 있어 추론 계산과 GPU 메모리가 거의 변경되지 않습니다.

<div align="center">
    <img src="assets/moe_arch.png" alt="" style="width: 90%;" />
</div>

두 전문가 간의 전환점은 노이즈 제거 단계 $t$가 증가함에 따라 단조롭게 감소하는 지표인 신호 대 잡음비(SNR)에 의해 결정됩니다. 노이즈 제거 프로세스 시작 시 $t$가 크고 노이즈 레벨이 높으므로 SNR은 최소값 ${SNR}_{min}$에 있습니다. 이 단계에서는 고노이즈 전문가가 활성화됩니다. ${SNR}_{min}$의 절반에 해당하는 임계 단계 ${t}_{moe}$를 정의하고, $t<{t}_{moe}$일 때 저노이즈 전문가로 전환합니다.

<div align="center">
    <img src="assets/moe_2.png" alt="" style="width: 90%;" />
</div>

MoE 아키텍처의 효과를 검증하기 위해 검증 손실 곡선을 기반으로 네 가지 설정을 비교합니다. 기준 **Wan2.1** 모델은 MoE 아키텍처를 사용하지 않습니다. MoE 기반 변형 중 **Wan2.1 & 고노이즈 전문가**는 Wan2.1 모델을 저노이즈 전문가로 재사용하고 Wan2.2의 고노이즈 전문가를 사용하며, **Wan2.1 & 저노이즈 전문가**는 Wan2.1을 고노이즈 전문가로 사용하고 Wan2.2의 저노이즈 전문가를 사용합니다. **Wan2.2 (MoE)**(최종 버전)는 가장 낮은 검증 손실을 달성하여 생성된 비디오 분포가 실제 데이터에 가장 가깝고 우수한 수렴을 나타냅니다.


##### (2) 효율적인 고화질 하이브리드 TI2V
더 효율적인 배포를 가능하게 하기 위해 Wan2.2는 고압축 설계도 탐구합니다. 27B MoE 모델 외에도 5B 밀집 모델, 즉 TI2V-5B가 릴리스됩니다. $T\times H\times W$ 압축 비율 $4\times16\times16$을 달성하는 고압축 Wan2.2-VAE가 지원하여 고품질 비디오 재구성을 유지하면서 전체 압축률을 64로 증가시킵니다. 추가 패치화 레이어를 사용하면 TI2V-5B의 총 압축 비율이 $4\times32\times32$에 도달합니다. 특별한 최적화 없이도 TI2V-5B는 단일 소비자급 GPU에서 5초 720P 비디오를 9분 이내에 생성할 수 있어 가장 빠른 720P@24fps 비디오 생성 모델 중 하나입니다. 이 모델은 또한 단일 통합 프레임워크 내에서 텍스트-투-비디오와 이미지-투-비디오 작업을 모두 기본적으로 지원하여 학술 연구와 실용적인 응용 프로그램을 모두 다룹니다.


<div align="center">
    <img src="assets/vae.png" alt="" style="width: 80%;" />
</div>



##### 최신 기술과의 비교
새로운 Wan-Bench 2.0에서 선도적인 클로즈드소스 상용 모델과 Wan2.2를 비교하여 여러 중요한 차원에서 성능을 평가했습니다. 결과는 Wan2.2가 이러한 선도 모델과 비교하여 우수한 성능을 달성함을 보여줍니다.


<div align="center">
    <img src="assets/performance.png" alt="" style="width: 90%;" />
</div>

## 인용
우리의 작업이 도움이 되셨다면 인용해 주세요.

```
@article{wan2025,
      title={Wan: Open and Advanced Large-Scale Video Generative Models}, 
      author={Team Wan and Ang Wang and Baole Ai and Bin Wen and Chaojie Mao and Chen-Wei Xie and Di Chen and Feiwu Yu and Haiming Zhao and Jianxiao Yang and Jianyuan Zeng and Jiayu Wang and Jingfeng Zhang and Jingren Zhou and Jinkai Wang and Jixuan Chen and Kai Zhu and Kang Zhao and Keyu Yan and Lianghua Huang and Mengyang Feng and Ningyi Zhang and Pandeng Li and Pingyu Wu and Ruihang Chu and Ruili Feng and Shiwei Zhang and Siyang Sun and Tao Fang and Tianxing Wang and Tianyi Gui and Tingyu Weng and Tong Shen and Wei Lin and Wei Wang and Wei Wang and Wenmeng Zhou and Wente Wang and Wenting Shen and Wenyuan Yu and Xianzhong Shi and Xiaoming Huang and Xin Xu and Yan Kou and Yangyu Lv and Yifei Li and Yijing Liu and Yiming Wang and Yingya Zhang and Yitong Huang and Yong Li and You Wu and Yu Liu and Yulin Pan and Yun Zheng and Yuntao Hong and Yupeng Shi and Yutong Feng and Zeyinzi Jiang and Zhen Han and Zhi-Fan Wu and Ziyu Liu},
      journal = {arXiv preprint arXiv:2503.20314},
      year={2025}
}
```

## 라이선스 계약
이 레포지토리의 모델은 Apache 2.0 라이선스에 따라 라이선스가 부여됩니다. 우리는 생성된 콘텐츠에 대한 어떠한 권리도 주장하지 않으며, 이 라이선스 조항을 준수하는 한 자유롭게 사용할 수 있습니다. 모델 사용에 대해 전적으로 책임을 지며, 적용 가능한 법률을 위반하거나 개인이나 그룹에 해를 끼치거나 해를 끼칠 목적으로 개인 정보를 유포하거나 잘못된 정보를 퍼뜨리거나 취약한 인구를 대상으로 하는 콘텐츠를 공유하는 것을 포함해서는 안 됩니다. 제한 사항 및 권리에 대한 전체 목록은 [라이선스](LICENSE.txt)의 전체 텍스트를 참조하세요.


## 감사의 말

[SD3](https://huggingface.co/stabilityai/stable-diffusion-3-medium), [Qwen](https://huggingface.co/Qwen), [umt5-xxl](https://huggingface.co/google/umt5-xxl), [diffusers](https://github.com/huggingface/diffusers), [HuggingFace](https://huggingface.co) 레포지토리의 기여자들께 오픈 리서치에 대해 감사드립니다.



## 연락처
연구 또는 제품 팀에 메시지를 남기고 싶으시다면 [Discord](https://discord.gg/AKNgpMK4Yj) 또는 [WeChat 그룹](https://gw.alicdn.com/imgextra/i2/O1CN01tqjWFi1ByuyehkTSB_!!6000000000015-0-tps-611-1279.jpg)에 참여하세요!