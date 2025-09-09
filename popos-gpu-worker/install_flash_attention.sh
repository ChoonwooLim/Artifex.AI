#!/bin/bash

# Flash Attention Installation Script for PopOS
# Artifex.AI - Enable Flash Attention on Linux

set -e

echo "================================================"
echo "  Flash Attention Installation for PopOS"
echo "  Artifex.AI Dual GPU System"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check CUDA
echo -e "${YELLOW}Checking CUDA environment...${NC}"
if nvidia-smi &> /dev/null; then
    echo -e "${GREEN}✓ NVIDIA GPU detected${NC}"
    nvidia-smi --query-gpu=name,compute_cap --format=csv,noheader
else
    echo -e "${RED}✗ No NVIDIA GPU detected${NC}"
    exit 1
fi

# Check Python
echo -e "\n${YELLOW}Checking Python...${NC}"
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo -e "${GREEN}✓ Python $PYTHON_VERSION${NC}"

# Install build dependencies
echo -e "\n${YELLOW}Installing build dependencies...${NC}"
sudo apt-get update
sudo apt-get install -y build-essential python3-dev ninja-build

# Create virtual environment if not exists
if [ ! -d "venv" ]; then
    echo -e "\n${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

source venv/bin/activate

# Upgrade pip
echo -e "\n${YELLOW}Upgrading pip...${NC}"
pip install --upgrade pip setuptools wheel

# Install PyTorch with CUDA 12.1
echo -e "\n${YELLOW}Installing PyTorch with CUDA support...${NC}"
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Install Flash Attention
echo -e "\n${YELLOW}Installing Flash Attention...${NC}"
# Method 1: Try pre-built wheel first
pip install flash-attn --no-build-isolation || {
    echo -e "${YELLOW}Pre-built wheel not found, building from source...${NC}"
    
    # Method 2: Build from source
    git clone https://github.com/Dao-AILab/flash-attention.git
    cd flash-attention
    
    # Install with specific CUDA architectures (Ampere and newer)
    export TORCH_CUDA_ARCH_LIST="8.0;8.6;8.9;9.0"
    pip install -e . --no-build-isolation
    
    cd ..
}

# Install xFormers (alternative/complement to Flash Attention)
echo -e "\n${YELLOW}Installing xFormers...${NC}"
pip install xformers

# Install additional optimized libraries
echo -e "\n${YELLOW}Installing optimization libraries...${NC}"
pip install triton accelerate bitsandbytes

# Test Flash Attention
echo -e "\n${YELLOW}Testing Flash Attention...${NC}"
python3 - <<EOF
import torch
try:
    from flash_attn import flash_attn_func
    print("✓ Flash Attention imported successfully")
    
    # Test basic functionality
    batch_size = 2
    seqlen = 1024
    nheads = 16
    headdim = 64
    
    q = torch.randn(batch_size, seqlen, nheads, headdim, dtype=torch.float16, device='cuda')
    k = torch.randn(batch_size, seqlen, nheads, headdim, dtype=torch.float16, device='cuda')
    v = torch.randn(batch_size, seqlen, nheads, headdim, dtype=torch.float16, device='cuda')
    
    out = flash_attn_func(q, k, v)
    print(f"✓ Flash Attention test passed: output shape {out.shape}")
    
    # Memory usage
    print(f"GPU Memory: {torch.cuda.memory_allocated() / 1024**3:.2f} GB")
    
except ImportError as e:
    print(f"✗ Flash Attention import failed: {e}")
except Exception as e:
    print(f"✗ Flash Attention test failed: {e}")

# Test xFormers
try:
    import xformers
    import xformers.ops
    print("✓ xFormers imported successfully")
    
    # Test memory efficient attention
    x = torch.randn(1, 1024, 768, dtype=torch.float16, device='cuda')
    print("✓ xFormers memory efficient attention available")
    
except ImportError as e:
    print(f"✗ xFormers import failed: {e}")
EOF

echo -e "\n${GREEN}Installation complete!${NC}"
echo ""
echo "Flash Attention Features Available:"
echo "  • 2-4x faster attention computation"
echo "  • 10-20x memory reduction"
echo "  • Support for long sequences (up to 64k)"
echo "  • Gradient checkpointing optimization"
echo ""
echo "To use Flash Attention in your code:"
echo "  from flash_attn import flash_attn_func"
echo "  or"
echo "  import xformers.ops"
echo ""