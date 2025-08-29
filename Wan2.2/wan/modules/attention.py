# Copyright 2024-2025 The Alibaba Wan Team Authors. All rights reserved.
# PATCHED VERSION - Using PyTorch Native Attention

import torch
import warnings

try:
    import flash_attn_interface
    FLASH_ATTN_3_AVAILABLE = True
except ModuleNotFoundError:
    FLASH_ATTN_3_AVAILABLE = False

try:
    import flash_attn
    FLASH_ATTN_2_AVAILABLE = True
except ModuleNotFoundError:
    FLASH_ATTN_2_AVAILABLE = False

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
    PATCHED: Uses PyTorch native attention instead of Flash Attention
    """
    half_dtypes = (torch.float16, torch.bfloat16)
    assert dtype in half_dtypes
    assert q.device.type == 'cuda' and q.size(-1) <= 256
    
    # params
    b, lq, lk, out_dtype = q.size(0), q.size(1), k.size(1), q.dtype
    
    def half(x):
        return x if x.dtype in half_dtypes else x.to(dtype)
    
    # preprocess query
    if q_lens is None:
        q_flat = half(q.flatten(0, 1))
        q_lens = torch.tensor(
            [lq] * b, dtype=torch.int32).to(
                device=q.device, non_blocking=True)
    else:
        q_flat = half(torch.cat([u[:v] for u, v in zip(q, q_lens)]))
    
    # preprocess key, value
    if k_lens is None:
        k_flat = half(k.flatten(0, 1))
        v_flat = half(v.flatten(0, 1))
        k_lens = torch.tensor(
            [lk] * b, dtype=torch.int32).to(
                device=k.device, non_blocking=True)
    else:
        k_flat = half(torch.cat([u[:v] for u, v in zip(k, k_lens)]))
        v_flat = half(torch.cat([u[:v] for u, v in zip(v, k_lens)]))
    
    q_flat = q_flat.to(v_flat.dtype)
    k_flat = k_flat.to(v_flat.dtype)
    
    if q_scale is not None:
        q_flat = q_flat * q_scale
    
    # PATCHED: Use PyTorch native attention
    # Simply reshape and use basic attention
    try:
        # Reshape back to batch format
        q_batch = q.to(dtype)
        k_batch = k.to(dtype)
        v_batch = v.to(dtype)
        
        # Transpose for attention: [B, L, H, D] -> [B, H, L, D]
        q_batch = q_batch.transpose(1, 2)
        k_batch = k_batch.transpose(1, 2)
        v_batch = v_batch.transpose(1, 2)
        
        # Use PyTorch native scaled_dot_product_attention
        x = torch.nn.functional.scaled_dot_product_attention(
            q_batch, k_batch, v_batch,
            attn_mask=None,
            dropout_p=dropout_p if training else 0.0,
            is_causal=causal,
            scale=softmax_scale
        )
        
        # Transpose back: [B, H, L, D] -> [B, L, H, D]
        x = x.transpose(1, 2).contiguous()
        
    except:
        # Fallback to basic attention
        q_batch = q.to(dtype)
        k_batch = k.to(dtype)
        v_batch = v.to(dtype)
        
        # Manual attention calculation
        d_k = q_batch.size(-1)
        scale = softmax_scale if softmax_scale is not None else (1.0 / (d_k ** 0.5))
        
        # [B, L, H, D] -> [B, H, L, D]
        q_batch = q_batch.transpose(1, 2)
        k_batch = k_batch.transpose(1, 2)
        v_batch = v_batch.transpose(1, 2)
        
        # Compute attention scores
        scores = torch.matmul(q_batch, k_batch.transpose(-2, -1)) * scale
        
        # Apply causal mask if needed
        if causal:
            mask = torch.triu(torch.ones_like(scores) * float('-inf'), diagonal=1)
            scores = scores + mask
        
        # Softmax
        attn_weights = torch.nn.functional.softmax(scores, dim=-1)
        
        # Apply dropout
        if dropout_p > 0 and training:
            attn_weights = torch.nn.functional.dropout(attn_weights, p=dropout_p)
        
        # Apply attention to values
        x = torch.matmul(attn_weights, v_batch)
        
        # Transpose back
        x = x.transpose(1, 2).contiguous()
    
    # output
    return x.type(out_dtype)

# For global training flag
training = False

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
    PATCHED: Always use PyTorch native attention
    """
    # Always use our patched version
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
