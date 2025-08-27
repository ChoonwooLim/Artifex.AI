@echo off
echo RTX 3090 Speed Test - Minimal Settings
echo ======================================
cd D:\XX-v01\Wan2.2

REM 최소 설정으로 빠른 테스트
python generate.py ^
  --task ti2v-5B ^
  --size 704*480 ^
  --ckpt_dir "../Wan2.2-TI2V-5B" ^
  --offload_model True ^
  --convert_model_dtype ^
  --t5_cpu ^
  --prompt "cat" ^
  --frame_num 13 ^
  --sample_steps 10 ^
  --sample_solver dpm++ ^
  --save_file "test_speed.mp4"

echo.
echo Test completed. Check test_speed.mp4
pause