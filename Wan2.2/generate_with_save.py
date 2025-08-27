"""
Fixed generate script with explicit save path
"""
import sys
import os

# Force output directory
os.makedirs("D:\\XX-v01\\output", exist_ok=True)

# Set arguments with explicit save file
sys.argv = [
    'generate.py',
    '--task', 'ti2v-5B',
    '--size', '1280*704',
    '--ckpt_dir', 'D:\\XX-v01\\Wan2.2-TI2V-5B',
    '--offload_model', 'False',  # GPU에 유지
    '--convert_model_dtype',
    '--t5_cpu', 'False',  # T5도 GPU
    '--prompt', 'A cinematic sunset over mountain lake',
    '--frame_num', '49',
    '--sample_steps', '30',
    '--save_file', 'D:\\XX-v01\\output\\generated_video.mp4'  # 명시적 저장 경로
]

# Add image if needed
if len(sys.argv) > 1 and sys.argv[1].endswith('.png'):
    sys.argv.extend(['--image', sys.argv[1]])

print("Starting generation with explicit save path...")
print(f"Output will be saved to: D:\\XX-v01\\output\\generated_video.mp4")

# Run generate.py
exec(open('generate.py').read())