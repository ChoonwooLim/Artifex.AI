#!/usr/bin/env python
"""
Debug script to find why generation is slow
"""
import sys
import os
import time
import torch
import subprocess
import psutil
import GPUtil

sys.path.insert(0, r'D:\work\Artifex.AI\Wan2.2')

print("=" * 80)
print("GENERATION DEBUG - Finding the real issue")
print("=" * 80)

# Check current branch
branch = subprocess.run(['git', 'branch', '--show-current'], 
                       capture_output=True, text=True).stdout.strip()
print(f"\n1. Current Branch: {branch}")
print("-" * 40)

# Check environment variables
print("\n2. Environment Variables:")
print("-" * 40)
print(f"WAN_FORCE_FP16: {os.environ.get('WAN_FORCE_FP16', 'NOT SET')}")
print(f"WAN_COMPILE: {os.environ.get('WAN_COMPILE', 'NOT SET')}")
print(f"CUDA_VISIBLE_DEVICES: {os.environ.get('CUDA_VISIBLE_DEVICES', 'NOT SET')}")

# Check GPU status
print("\n3. GPU Status:")
print("-" * 40)
if torch.cuda.is_available():
    print(f"CUDA Available: Yes")
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"Memory Total: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
    
    # Current memory usage
    print(f"Memory Allocated: {torch.cuda.memory_allocated() / 1e9:.3f} GB")
    print(f"Memory Reserved: {torch.cuda.memory_reserved() / 1e9:.3f} GB")
    
    # GPU utilization
    try:
        gpus = GPUtil.getGPUs()
        for gpu in gpus:
            print(f"GPU Load: {gpu.load * 100:.1f}%")
            print(f"GPU Memory Used: {gpu.memoryUsed} MB ({gpu.memoryUtil * 100:.1f}%)")
    except:
        pass

# Import and check model loading
print("\n4. Testing Model Loading:")
print("-" * 40)

# Check what happens during import
start = time.time()
from wan.modules.attention import flash_attention
print(f"Attention import time: {time.time() - start:.3f}s")

# Check the actual attention being used
import inspect
source = inspect.getsource(flash_attention)
if "WELL BRANCH" in source:
    print("Using: WELL BRANCH simple attention")
elif "PATCHED" in source:
    print("Using: PATCHED complex attention")
else:
    print("Using: Unknown attention implementation")

# Test a minimal generation
print("\n5. Testing Minimal Generation:")
print("-" * 40)

# Create test tensors
device = 'cuda'
q = torch.randn(1, 256, 32, 128, device=device, dtype=torch.bfloat16)
k = torch.randn(1, 256, 32, 128, device=device, dtype=torch.bfloat16)
v = torch.randn(1, 256, 32, 128, device=device, dtype=torch.bfloat16)

# Run attention
torch.cuda.synchronize()
start = time.time()
result = flash_attention(q, k, v, dtype=torch.bfloat16)
torch.cuda.synchronize()
print(f"Single attention call: {(time.time() - start) * 1000:.2f}ms")

# Check memory after
print(f"Memory after attention: {torch.cuda.memory_allocated() / 1e9:.3f} GB")

# Now check the actual issue - offload_model
print("\n6. Checking offload_model behavior:")
print("-" * 40)

# Check generate.py for offload_model default
generate_path = os.path.join(r'D:\work\Artifex.AI\Wan2.2', 'generate.py')
with open(generate_path, 'r') as f:
    content = f.read()
    
# Find offload_model default value
import re
offload_match = re.search(r'--offload_model.*?default=([^,\)]+)', content, re.DOTALL)
if offload_match:
    print(f"offload_model default in generate.py: {offload_match.group(1)}")

# Check if offload is being forced somewhere
if 'offload_model=True' in content:
    print("WARNING: offload_model=True found in code!")
    
# Check the actual pipeline files
print("\n7. Checking Pipeline Configuration:")
print("-" * 40)

wan_init = os.path.join(r'D:\work\Artifex.AI\Wan2.2\wan', '__init__.py')
if os.path.exists(wan_init):
    with open(wan_init, 'r') as f:
        wan_content = f.read()
        if 'offload' in wan_content.lower():
            print("Offload mentioned in wan/__init__.py")

# Most important: Check if models are on GPU
print("\n8. Model Device Placement Test:")
print("-" * 40)

# This is the key test
import wan
from wan.configs import WAN_CONFIGS

cfg = WAN_CONFIGS.get('t2v-A14B')
if cfg:
    print(f"Config found for t2v-A14B")
    print(f"Sample steps: {cfg.sample_steps}")
    print(f"Frame num: {cfg.frame_num}")
    
# Summary
print("\n" + "=" * 80)
print("DIAGNOSIS SUMMARY")
print("=" * 80)

issues = []

if os.environ.get('WAN_FORCE_FP16') != '1':
    issues.append("WAN_FORCE_FP16 not set to 1")
if os.environ.get('WAN_COMPILE') != '1':
    issues.append("WAN_COMPILE not set to 1")
    
if torch.cuda.is_available():
    if torch.cuda.memory_allocated() < 1e9:  # Less than 1GB
        issues.append("GPU memory usage too low - model might be on CPU")
        
if issues:
    print("FOUND ISSUES:")
    for issue in issues:
        print(f"  - {issue}")
else:
    print("No obvious issues found. Need deeper investigation.")
    
print("\nNext step: Run actual generation with monitoring")
print("=" * 80)