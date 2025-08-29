# Copyright 2024-2025 The Alibaba Wan Team Authors. All rights reserved.
# WELL BRANCH - Simplified PyTorch Native Attention Implementation

import torch

__all__ = [
    'flash_attention',
    'attention',
]

def flash_attention(
    q,
    k,
    v,
    q_lens=None,
    k_lens=None,
    dropout_p=0.,
    softmax_scale=None,
    q_scale=None,
    causal=False,
    window_size=(-1, -1),
    deterministic=False,
    dtype=torch.bfloat16,
    version=None,
):
    """
    WELL BRANCH: Simplified PyTorch native attention
    This is the fast and stable implementation from the well branch
    """
    # Simple dtype conversion
    if dtype is not None and q.dtype != dtype:
        q = q.to(dtype)
        k = k.to(dtype)
        v = v.to(dtype)
    
    # Apply q_scale if provided
    if q_scale is not None:
        q = q * q_scale
    
    # Transpose for attention: [B, L, H, D] -> [B, H, L, D]
    q = q.transpose(1, 2)
    k = k.transpose(1, 2)
    v = v.transpose(1, 2)
    
    # Use PyTorch's optimized SDPA
    with torch.backends.cuda.sdp_kernel(
        enable_flash=True,
        enable_math=True,
        enable_mem_efficient=True
    ):
        x = torch.nn.functional.scaled_dot_product_attention(
            q, k, v,
            attn_mask=None,
            dropout_p=dropout_p if dropout_p > 0 else 0.0,
            is_causal=causal,
            scale=softmax_scale
        )
    
    # Transpose back: [B, H, L, D] -> [B, L, H, D]
    x = x.transpose(1, 2).contiguous()
    
    return x

def attention(
    q,
    k,
    v,
    q_lens=None,
    k_lens=None,
    dropout_p=0.,
    softmax_scale=None,
    q_scale=None,
    causal=False,
    window_size=(-1, -1),
    deterministic=False,
    dtype=torch.bfloat16,
    fa_version=None,
):
    """
    WELL BRANCH: Direct wrapper to flash_attention
    """
    return flash_attention(
        q=q,
        k=k,
        v=v,
        q_lens=q_lens,
        k_lens=k_lens,
        dropout_p=dropout_p,
        softmax_scale=softmax_scale,
        q_scale=q_scale,
        causal=causal,
        window_size=window_size,
        deterministic=deterministic,
        dtype=dtype,
        version=fa_version,
    )