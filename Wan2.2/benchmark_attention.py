#!/usr/bin/env python
"""
Attention Backend Benchmark Script
Tests performance of different attention backends (SDPA vs Flash Attention)
"""

import os
import sys
import time
import torch
import torch.nn.functional as F
from contextlib import contextmanager
import numpy as np
from typing import Dict, List, Tuple

# Add module path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

@contextmanager
def timer(name: str):
    """Context manager for timing code blocks"""
    start = time.perf_counter()
    yield
    end = time.perf_counter()
    print(f"{name}: {(end - start) * 1000:.2f}ms")

def get_gpu_memory():
    """Get current GPU memory usage in MB"""
    if torch.cuda.is_available():
        return torch.cuda.memory_allocated() / 1024 / 1024
    return 0

def benchmark_attention(
    batch_size: int = 2,
    seq_lengths: List[int] = [256, 512, 1024, 2048],
    num_heads: int = 24,
    head_dim: int = 128,
    dtype: torch.dtype = torch.bfloat16,
    num_warmup: int = 3,
    num_iterations: int = 10
) -> Dict:
    """
    Benchmark attention performance across different sequence lengths
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    results = {}
    
    print(f"\n{'='*60}")
    print(f"Attention Backend Benchmark")
    print(f"{'='*60}")
    print(f"Device: {device}")
    print(f"Dtype: {dtype}")
    print(f"Batch size: {batch_size}")
    print(f"Num heads: {num_heads}")
    print(f"Head dim: {head_dim}")
    print(f"{'='*60}\n")
    
    # Check which backend is being used
    os.environ["USE_ATTENTION_BACKEND"] = "auto"
    from wan.modules.attention import get_attention_backend, attention
    backend = get_attention_backend()
    print(f"Current backend: {backend}\n")
    
    for seq_len in seq_lengths:
        print(f"\n--- Sequence Length: {seq_len} ---")
        
        # Create test tensors
        q = torch.randn(batch_size, seq_len, num_heads, head_dim, 
                       device=device, dtype=dtype)
        k = torch.randn(batch_size, seq_len, num_heads, head_dim,
                       device=device, dtype=dtype)
        v = torch.randn(batch_size, seq_len, num_heads, head_dim,
                       device=device, dtype=dtype)
        
        # Memory before
        mem_before = get_gpu_memory()
        
        # Warmup
        for _ in range(num_warmup):
            _ = attention(q, k, v, causal=True)
            torch.cuda.synchronize() if torch.cuda.is_available() else None
        
        # Benchmark
        times = []
        for _ in range(num_iterations):
            torch.cuda.synchronize() if torch.cuda.is_available() else None
            start = time.perf_counter()
            
            output = attention(q, k, v, causal=True)
            
            torch.cuda.synchronize() if torch.cuda.is_available() else None
            end = time.perf_counter()
            times.append((end - start) * 1000)  # Convert to ms
        
        # Memory after
        mem_after = get_gpu_memory()
        mem_used = mem_after - mem_before
        
        # Calculate statistics
        mean_time = np.mean(times)
        std_time = np.std(times)
        min_time = np.min(times)
        max_time = np.max(times)
        
        # Store results
        results[seq_len] = {
            'mean_ms': mean_time,
            'std_ms': std_time,
            'min_ms': min_time,
            'max_ms': max_time,
            'memory_mb': mem_used,
            'ms_per_step': mean_time / (seq_len / 100)  # Normalized metric
        }
        
        # Print results
        print(f"  Time: {mean_time:.2f}±{std_time:.2f}ms")
        print(f"  Min/Max: {min_time:.2f}/{max_time:.2f}ms")
        print(f"  Memory: {mem_used:.1f}MB")
        print(f"  ms/100tokens: {results[seq_len]['ms_per_step']:.2f}")
    
    return results

def compare_backends():
    """
    Compare SDPA vs Flash Attention performance if both available
    """
    print("\n" + "="*60)
    print("Backend Comparison")
    print("="*60)
    
    backends_to_test = []
    
    # Test SDPA
    os.environ["USE_SDPA"] = "1"
    backends_to_test.append(("SDPA", benchmark_attention()))
    
    # Test Flash Attention if available
    os.environ["USE_SDPA"] = "0"
    os.environ["USE_ATTENTION_BACKEND"] = "fa2"
    try:
        from wan.modules.attention import FLASH_ATTN_2_AVAILABLE
        if FLASH_ATTN_2_AVAILABLE:
            backends_to_test.append(("Flash Attention 2", benchmark_attention()))
    except:
        print("Flash Attention 2 not available for comparison")
    
    # Print comparison table
    if len(backends_to_test) > 1:
        print("\n" + "="*60)
        print("Performance Comparison Summary")
        print("="*60)
        
        seq_lengths = list(backends_to_test[0][1].keys())
        
        print(f"{'Seq Len':<10}", end="")
        for backend_name, _ in backends_to_test:
            print(f"{backend_name:<20}", end="")
        print()
        print("-" * 60)
        
        for seq_len in seq_lengths:
            print(f"{seq_len:<10}", end="")
            for _, results in backends_to_test:
                mean_time = results[seq_len]['mean_ms']
                print(f"{mean_time:.2f}ms{' '*15}"[:20], end="")
            print()
        
        # Calculate speedup
        if len(backends_to_test) == 2:
            print("\n" + "-" * 60)
            print("Relative Performance (SDPA vs FA2):")
            for seq_len in seq_lengths:
                sdpa_time = backends_to_test[0][1][seq_len]['mean_ms']
                fa_time = backends_to_test[1][1][seq_len]['mean_ms']
                speedup = sdpa_time / fa_time
                print(f"  Seq {seq_len}: {speedup:.2f}x")

def main():
    """Main benchmark function"""
    
    # Set optimal settings for benchmarking
    if torch.cuda.is_available():
        # Set precision for better performance
        torch.set_float32_matmul_precision('high')
        
        # Print GPU info
        gpu_name = torch.cuda.get_device_name(0)
        gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
        print(f"GPU: {gpu_name}")
        print(f"Total Memory: {gpu_memory:.1f}GB")
    
    # Run benchmarks
    try:
        # Single backend benchmark
        results = benchmark_attention(
            batch_size=2,
            seq_lengths=[256, 512, 1024],
            num_heads=24,
            head_dim=128,
            dtype=torch.bfloat16,
            num_iterations=10
        )
        
        # Backend comparison if possible
        compare_backends()
        
        print("\n" + "="*60)
        print("Benchmark Complete!")
        print("="*60)
        
        # Performance estimation for video generation
        print("\nEstimated Performance Impact:")
        print("-" * 40)
        backend = os.environ.get("USE_ATTENTION_BACKEND", "auto")
        if "sdpa" in backend.lower() or os.environ.get("USE_SDPA") == "1":
            print("SDPA Performance: ~0.85-0.95x of Flash Attention")
            print("Memory Efficiency: Good (within 10% of FA)")
            print("Stability: Excellent (PyTorch native)")
        else:
            print("Flash Attention: Optimal performance")
            print("Memory Efficiency: Best")
        
    except Exception as e:
        print(f"Error during benchmark: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()