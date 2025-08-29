#!/usr/bin/env python
"""
Direct test to find the real difference between well and main branches
"""
import sys
import os
import time
import torch

# Set environment variables BEFORE imports
os.environ['WAN_FORCE_FP16'] = '1'
os.environ['WAN_COMPILE'] = '0'  # Disable compile for testing
os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'expandable_segments:True'

sys.path.insert(0, r'D:\work\Artifex.AI\Wan2.2')

print("=" * 80)
print("DIRECT PERFORMANCE TEST")
print("=" * 80)

# Import and test
from wan.modules.attention import flash_attention

# Get current branch
import subprocess
branch = subprocess.run(['git', 'branch', '--show-current'], 
                       capture_output=True, text=True).stdout.strip()
print(f"Current branch: {branch}")
print(f"Attention docstring: {flash_attention.__doc__[:100]}")

# Test with actual video generation dimensions
device = 'cuda'
batch_sizes = [1]
seq_lens = [256, 512, 1024, 2048]  # Actual sequence lengths in video generation
heads = [32]
dims = [128]

print("\nTesting with video generation dimensions:")
print("-" * 40)

for b in batch_sizes:
    for l in seq_lens:
        for h in heads:
            for d in dims:
                q = torch.randn(b, l, h, d, device=device, dtype=torch.bfloat16)
                k = torch.randn(b, l, h, d, device=device, dtype=torch.bfloat16)
                v = torch.randn(b, l, h, d, device=device, dtype=torch.bfloat16)
                
                # Warmup
                for _ in range(3):
                    _ = flash_attention(q, k, v, dtype=torch.bfloat16)
                torch.cuda.synchronize()
                
                # Measure
                torch.cuda.synchronize()
                start = time.time()
                for _ in range(10):
                    result = flash_attention(q, k, v, dtype=torch.bfloat16)
                torch.cuda.synchronize()
                elapsed = (time.time() - start) / 10
                
                print(f"[B={b}, L={l:4d}, H={h}, D={d}] Time: {elapsed*1000:6.2f}ms")

# Now test the actual generate.py script
print("\n" + "=" * 80)
print("Testing actual generation script...")
print("-" * 40)

test_cmd = [
    'python', 'Wan2.2/scripts/generate.py',
    '--task', 't2v-A14B',
    '--size', '256*256',  # Small size for testing
    '--ckpt_dir', 'D:/mnt/d/XX-v01',
    '--prompt', 'test',
    '--frame_num', '5',  # Only 5 frames
    '--sample_steps', '1',  # Only 1 step
    '--sample_guide_scale', '7.5',
    '--base_seed', '42',
    '--sample_solver', 'dpm++',
    '--offload_model', 'False',
    '--dry_run'  # If this option exists
]

print(f"Command: {' '.join(test_cmd)}")
print("\nNote: Run this command manually to see where the slowdown occurs")
print("=" * 80)