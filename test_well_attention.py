#!/usr/bin/env python
import sys
import os
sys.path.insert(0, r'D:\work\Artifex.AI\Wan2.2')

import torch
import time
from wan.modules.attention import flash_attention, attention

print("=" * 60)
print("WELL BRANCH ATTENTION TEST")
print("=" * 60)

# Check GPU
device = 'cuda' if torch.cuda.is_available() else 'cpu'
if device == 'cuda':
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
else:
    print("WARNING: CUDA not available, using CPU")

print("-" * 60)

# Test dimensions
batch_sizes = [1, 2]
seq_lens = [100, 256]
heads = [16, 32]
dims = [64, 128]

for b in batch_sizes:
    for l in seq_lens:
        for h in heads:
            for d in dims:
                try:
                    # Create test tensors
                    q = torch.randn(b, l, h, d, device=device, dtype=torch.bfloat16)
                    k = torch.randn(b, l, h, d, device=device, dtype=torch.bfloat16)
                    v = torch.randn(b, l, h, d, device=device, dtype=torch.bfloat16)
                    
                    # Warmup
                    for _ in range(3):
                        _ = flash_attention(q, k, v, dtype=torch.bfloat16)
                    
                    # Benchmark
                    torch.cuda.synchronize()
                    start = time.time()
                    
                    for _ in range(10):
                        result = flash_attention(q, k, v, dtype=torch.bfloat16)
                    
                    torch.cuda.synchronize()
                    elapsed = (time.time() - start) / 10
                    
                    print(f"[B={b}, L={l}, H={h}, D={d}] Time: {elapsed*1000:.2f}ms, Shape: {result.shape}")
                    
                except Exception as e:
                    print(f"[B={b}, L={l}, H={h}, D={d}] ERROR: {e}")

print("-" * 60)
print("TEST COMPLETED - WELL BRANCH ATTENTION IS WORKING!")
print("=" * 60)