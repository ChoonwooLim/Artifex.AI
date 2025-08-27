"""
Compile the model for faster inference using torch.compile
This can provide 20-30% speedup
"""
import torch
import sys
import os

# Check PyTorch version
print(f"PyTorch version: {torch.__version__}")

if torch.__version__ >= "2.0":
    print("✓ PyTorch 2.0+ detected, compilation available")
    
    # Test compilation
    @torch.compile(mode="reduce-overhead")
    def dummy_model(x):
        return x * 2 + 1
    
    test = torch.randn(1, 3, 224, 224).cuda()
    result = dummy_model(test)
    print("✓ Compilation test successful")
    
    print("\nTo use compiled mode, add this to generate.py:")
    print("model = torch.compile(model, mode='reduce-overhead')")
else:
    print("✗ PyTorch 2.0+ required for compilation")
    print("Current version:", torch.__version__)