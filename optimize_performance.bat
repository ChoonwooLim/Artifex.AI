@echo off
echo RTX 3090 Performance Optimization Script
echo ========================================

echo 1. Setting environment variables for maximum performance...
set CUDA_LAUNCH_BLOCKING=0
set TORCH_CUDNN_V8_API_ENABLED=1
set TORCH_ALLOW_TF32_CUBLAS_OVERRIDE=1
set TORCH_USE_CUDA_DSA=1

echo 2. Testing optimized settings...
cd D:\XX-v01\Wan2.2

echo Running with optimizations (no quality loss)...
python generate.py ^
  --task ti2v-5B ^
  --size 1280*704 ^
  --ckpt_dir "../Wan2.2-TI2V-5B" ^
  --offload_model False ^
  --convert_model_dtype ^
  --t5_cpu False ^
  --prompt "A cinematic sunset over mountain lake" ^
  --frame_num 121 ^
  --sample_steps 50 ^
  --sample_solver dpm++ ^
  --save_file "optimized_output.mp4"

pause