@echo off
echo Testing Wan2.2 TI2V-5B (RTX 3090 24GB)...
echo ==========================================
echo.

cd Wan2.2

python generate.py ^
  --task ti2v-5B ^
  --size 1280*704 ^
  --ckpt_dir "../Wan2.2-TI2V-5B" ^
  --offload_model True ^
  --convert_model_dtype ^
  --t5_cpu ^
  --prompt "A cute cat playing with a ball" ^
  --frame_num 25 ^
  --sample_steps 20

echo.
echo ==========================================
echo Test completed! Check for output video file.
pause