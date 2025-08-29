#!/usr/bin/env python
"""
Performance comparison test to identify the root cause of slowdown
"""
import sys
import os
import time
import torch
import psutil
import GPUtil

sys.path.insert(0, r'D:\work\Artifex.AI\Wan2.2')

print("=" * 80)
print("PERFORMANCE ISSUE DIAGNOSIS")
print("=" * 80)

# 1. System Information
print("\n1. SYSTEM INFORMATION")
print("-" * 40)
print(f"Python: {sys.version}")
print(f"PyTorch: {torch.__version__}")
print(f"CUDA Available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"CUDA Version: {torch.version.cuda}")
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
    print(f"GPU Memory Allocated: {torch.cuda.memory_allocated() / 1e9:.3f} GB")
    print(f"GPU Memory Reserved: {torch.cuda.memory_reserved() / 1e9:.3f} GB")

# 2. Check CPU/RAM
print("\n2. CPU/RAM STATUS")
print("-" * 40)
print(f"CPU Usage: {psutil.cpu_percent()}%")
print(f"RAM Usage: {psutil.virtual_memory().percent}%")
print(f"Available RAM: {psutil.virtual_memory().available / 1e9:.1f} GB")

# 3. Check GPU Status
print("\n3. GPU DETAILED STATUS")
print("-" * 40)
try:
    gpus = GPUtil.getGPUs()
    for gpu in gpus:
        print(f"GPU {gpu.id}: {gpu.name}")
        print(f"  Load: {gpu.load * 100:.1f}%")
        print(f"  Memory: {gpu.memoryUsed}/{gpu.memoryTotal} MB ({gpu.memoryUtil * 100:.1f}%)")
        print(f"  Temperature: {gpu.temperature}°C")
except:
    print("GPUtil not available")

# 4. Test Attention Module
print("\n4. TESTING ATTENTION MODULE")
print("-" * 40)

from wan.modules.attention import flash_attention, attention

# Check which implementation is being used
print(f"Attention module file: {attention.__module__}")
print(f"Flash attention docstring: {flash_attention.__doc__[:100]}...")

# Performance test
device = 'cuda'
b, l, h, d = 2, 256, 32, 128
q = torch.randn(b, l, h, d, device=device, dtype=torch.bfloat16)
k = torch.randn(b, l, h, d, device=device, dtype=torch.bfloat16)
v = torch.randn(b, l, h, d, device=device, dtype=torch.bfloat16)

# Warmup
for _ in range(3):
    _ = flash_attention(q, k, v, dtype=torch.bfloat16)
    torch.cuda.synchronize()

# Benchmark
times = []
for i in range(10):
    torch.cuda.synchronize()
    start = time.time()
    result = flash_attention(q, k, v, dtype=torch.bfloat16)
    torch.cuda.synchronize()
    elapsed = time.time() - start
    times.append(elapsed)
    print(f"  Run {i+1}: {elapsed*1000:.2f}ms")

avg_time = sum(times) / len(times)
print(f"\nAverage time: {avg_time*1000:.2f}ms")
print(f"Min time: {min(times)*1000:.2f}ms")
print(f"Max time: {max(times)*1000:.2f}ms")

# 5. Check for torch.compile
print("\n5. TORCH COMPILE STATUS")
print("-" * 40)
print(f"Torch dynamo enabled: {torch._dynamo.is_compiling()}")
print(f"Torch compile backend: {torch._dynamo.config.cache_size_limit}")

# 6. Check environment variables
print("\n6. ENVIRONMENT VARIABLES")
print("-" * 40)
important_vars = ['CUDA_VISIBLE_DEVICES', 'PYTORCH_CUDA_ALLOC_CONF', 
                  'WAN_FORCE_FP16', 'WAN_COMPILE', 'TORCH_CUDNN_V8_API_ENABLED']
for var in important_vars:
    value = os.environ.get(var, 'Not set')
    print(f"{var}: {value}")

# 7. Import time check
print("\n7. MODULE IMPORT TIME CHECK")
print("-" * 40)
import importlib
import time

modules_to_check = [
    'wan.modules.model',
    'wan.modules.attention',
    'wan.modules.scheduler',
]

for module_name in modules_to_check:
    if module_name in sys.modules:
        del sys.modules[module_name]
    
    start = time.time()
    importlib.import_module(module_name)
    elapsed = time.time() - start
    print(f"{module_name}: {elapsed:.3f}s")

print("\n" + "=" * 80)
print("DIAGNOSIS COMPLETE")
print("=" * 80)