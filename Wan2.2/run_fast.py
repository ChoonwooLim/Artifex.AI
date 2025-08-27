"""
Fast inference script with all optimizations
"""
import os
import torch

# Enable all optimizations
os.environ['CUDA_LAUNCH_BLOCKING'] = '0'
os.environ['TORCH_CUDNN_V8_API_ENABLED'] = '1'
os.environ['TORCH_ALLOW_TF32_CUBLAS_OVERRIDE'] = '1'

# Enable CUDA graphs for faster kernel launches
torch.cuda.set_sync_debug_mode(0)
torch.backends.cudnn.benchmark = True
torch.backends.cuda.matmul.allow_tf32 = True
torch.backends.cudnn.allow_tf32 = True

# Import and run generate
import sys
sys.argv = [
    'generate.py',
    '--task', 'ti2v-5B',
    '--size', '1280*704',
    '--ckpt_dir', '../Wan2.2-TI2V-5B',
    '--offload_model', 'False',  # Keep model in GPU
    '--convert_model_dtype',
    '--t5_cpu', 'False',  # Keep T5 in GPU too
    '--prompt', 'A cinematic sunset over mountain lake',
    '--frame_num', '121',
    '--sample_steps', '50',
    '--sample_solver', 'dpm++',
    '--save_file', 'fast_output.mp4'
]

# Run with optimizations
exec(open('generate.py').read())