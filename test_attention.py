#!/usr/bin/env python
import sys
import os
sys.path.insert(0, r'D:\work\Artifex.AI\Wan2.2')

import torch
from wan.modules.attention import flash_attention, attention

print("Testing WELL branch attention implementation...")
print("-" * 50)

# Create test tensors
device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"Using device: {device}")

b, l, h, d = 1, 100, 16, 64
q = torch.randn(b, l, h, d, device=device, dtype=torch.bfloat16)
k = torch.randn(b, l, h, d, device=device, dtype=torch.bfloat16)
v = torch.randn(b, l, h, d, device=device, dtype=torch.bfloat16)

print(f"Test tensors shape: q={q.shape}, k={k.shape}, v={v.shape}")
print("-" * 50)

# Test flash_attention
print("Calling flash_attention...")
result = flash_attention(q, k, v, dtype=torch.bfloat16)
print(f"Result shape: {result.shape}")
print("-" * 50)

# Test attention wrapper
print("Calling attention wrapper...")
result2 = attention(q, k, v, dtype=torch.bfloat16)
print(f"Result shape: {result2.shape}")

print("\nTest completed successfully!")