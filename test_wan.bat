@echo off
echo Testing Wan2.2 with TI2V-5B model (RTX 3090 optimized)...
echo.

cd Wan2.2

python generate.py ^
  --task ti2v-5B ^
  --size 1280*704 ^
  --ckpt_dir ..\Wan2.2-TI2V-5B ^
  --offload_model True ^
  --convert_model_dtype ^
  --t5_cpu ^
  --prompt "A beautiful sunset over mountains" ^
  --frame_num 25 ^
  --sample_steps 30

pause