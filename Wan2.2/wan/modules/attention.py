# Copyright 2024-2025 The Alibaba Wan Team Authors. All rights reserved.
import torch
import platform
import os

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

# Import Windows-optimized Flash Attention if on Windows
IS_WINDOWS = platform.system() == 'Windows'
if IS_WINDOWS:
    try:
        from .windows_flash_attention import windows_flash_attention_wrapper
        WINDOWS_FLASH_AVAILABLE = True
    except ImportError:
        WINDOWS_FLASH_AVAILABLE = False
else:
    WINDOWS_FLASH_AVAILABLE = False

# Environment variable for backend selection
# USE_ATTENTION_BACKEND: auto | sdpa | fa2 | fa3
ATTENTION_BACKEND = os.getenv("USE_ATTENTION_BACKEND", "auto").lower()
# Force SDPA if explicitly set
FORCE_SDPA = os.getenv("USE_SDPA", "0") == "1"

# Set float32 matmul precision for better performance on Ampere+
if torch.cuda.is_available():
    torch.set_float32_matmul_precision('high')

# Track warning state to show only once
_attention_warning_shown = False

import warnings

__all__ = [
    'flash_attention',
    'attention',
]


def get_attention_backend():
    """Determine which attention backend to use based on availability and settings"""
    global _attention_warning_shown
    
    # Determine dropout mode
    dropout_mode = "enabled" if torch.is_grad_enabled() else "disabled (inference)"
    
    # Force SDPA if environment variable is set
    if FORCE_SDPA:
        if not _attention_warning_shown:
            print(f"[Attention] Using SDPA backend (forced by USE_SDPA=1), dropout={dropout_mode}")
            _attention_warning_shown = True
        return "sdpa"
    
    # Check for specific backend request
    if ATTENTION_BACKEND != "auto":
        if ATTENTION_BACKEND == "fa3" and FLASH_ATTN_3_AVAILABLE:
            if not _attention_warning_shown:
                print(f"[Attention] Using Flash Attention 3, dropout={dropout_mode}")
                _attention_warning_shown = True
            return "fa3"
        elif ATTENTION_BACKEND == "fa2" and FLASH_ATTN_2_AVAILABLE:
            if not _attention_warning_shown:
                print(f"[Attention] Using Flash Attention 2, dropout={dropout_mode}")
                _attention_warning_shown = True
            return "fa2"
        elif ATTENTION_BACKEND == "sdpa":
            if not _attention_warning_shown:
                print(f"[Attention] Using PyTorch SDPA, dropout={dropout_mode}")
                _attention_warning_shown = True
            return "sdpa"
    
    # Auto mode: FA3 > FA2 > SDPA
    if FLASH_ATTN_3_AVAILABLE:
        if not _attention_warning_shown:
            print(f"[Attention] Auto-selected Flash Attention 3, dropout={dropout_mode}")
            _attention_warning_shown = True
        return "fa3"
    elif FLASH_ATTN_2_AVAILABLE:
        if not _attention_warning_shown:
            print(f"[Attention] Auto-selected Flash Attention 2, dropout={dropout_mode}")
            _attention_warning_shown = True
        return "fa2"
    else:
        if not _attention_warning_shown:
            print(f"[Attention] Using PyTorch SDPA (Flash Attention not available), dropout={dropout_mode}")
            _attention_warning_shown = True
        return "sdpa"


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
    Enhanced attention with backend auto-selection and optimization.
    
    q:              [B, Lq, Nq, C1].
    k:              [B, Lk, Nk, C1].
    v:              [B, Lk, Nk, C2]. Nq must be divisible by Nk.
    q_lens:         [B].
    k_lens:         [B].
    dropout_p:      float. Dropout probability.
    softmax_scale:  float. The scaling of QK^T before applying softmax.
    causal:         bool. Whether to apply causal attention mask.
    window_size:    (left right). If not (-1, -1), apply sliding window local attention.
    deterministic:  bool. If True, slightly slower and uses more memory.
    dtype:          torch.dtype. Apply when dtype of q/k/v is not float16/bfloat16.
    """
    half_dtypes = (torch.float16, torch.bfloat16)
    assert dtype in half_dtypes
    assert q.device.type == 'cuda' and q.size(-1) <= 256
    
    # Ensure contiguous tensors for better performance
    q = q.contiguous()
    k = k.contiguous()
    v = v.contiguous()

    # params
    b, lq, lk, out_dtype = q.size(0), q.size(1), k.size(1), q.dtype
    
    # Get backend selection
    backend = get_attention_backend()

    def half(x):
        return x if x.dtype in half_dtypes else x.to(dtype)

    # preprocess query
    if q_lens is None:
        q = half(q.flatten(0, 1))
        q_lens = torch.tensor(
            [lq] * b, dtype=torch.int32).to(
                device=q.device, non_blocking=True)
    else:
        q = half(torch.cat([u[:v] for u, v in zip(q, q_lens)]))

    # preprocess key, value
    if k_lens is None:
        k = half(k.flatten(0, 1))
        v = half(v.flatten(0, 1))
        k_lens = torch.tensor(
            [lk] * b, dtype=torch.int32).to(
                device=k.device, non_blocking=True)
    else:
        k = half(torch.cat([u[:v] for u, v in zip(k, k_lens)]))
        v = half(torch.cat([u[:v] for u, v in zip(v, k_lens)]))

    q = q.to(v.dtype)
    k = k.to(v.dtype)

    if q_scale is not None:
        q = q * q_scale

    # Apply attention based on backend selection
    if backend == "fa3" and FLASH_ATTN_3_AVAILABLE:
        # Flash Attention 3
        x = flash_attn_interface.flash_attn_varlen_func(
            q=q,
            k=k,
            v=v,
            cu_seqlens_q=torch.cat([q_lens.new_zeros([1]), q_lens]).cumsum(
                0, dtype=torch.int32).to(q.device, non_blocking=True),
            cu_seqlens_k=torch.cat([k_lens.new_zeros([1]), k_lens]).cumsum(
                0, dtype=torch.int32).to(q.device, non_blocking=True),
            seqused_q=None,
            seqused_k=None,
            max_seqlen_q=lq,
            max_seqlen_k=lk,
            softmax_scale=softmax_scale,
            causal=causal,
            deterministic=deterministic)[0].unflatten(0, (b, lq))
    elif backend == "fa2" and FLASH_ATTN_2_AVAILABLE:
        # Flash Attention 2
        x = flash_attn.flash_attn_varlen_func(
            q=q,
            k=k,
            v=v,
            cu_seqlens_q=torch.cat([q_lens.new_zeros([1]), q_lens]).cumsum(
                0, dtype=torch.int32).to(q.device, non_blocking=True),
            cu_seqlens_k=torch.cat([k_lens.new_zeros([1]), k_lens]).cumsum(
                0, dtype=torch.int32).to(q.device, non_blocking=True),
            max_seqlen_q=lq,
            max_seqlen_k=lk,
            dropout_p=dropout_p,
            softmax_scale=softmax_scale,
            causal=causal,
            window_size=window_size,
            deterministic=deterministic).unflatten(0, (b, lq))
    else:
        # Use PyTorch's optimized SDPA (Scaled Dot Product Attention)
        # Reshape back to batch format
        q = q.unflatten(0, (b, lq))
        k = k.unflatten(0, (b, lk))
        v = v.unflatten(0, (b, lk))
        
        # Ensure contiguous for SDPA
        q = q.contiguous()
        k = k.contiguous()
        v = v.contiguous()
        
        # Transpose for scaled_dot_product_attention
        q = q.transpose(1, 2)  # [B, Nq, Lq, C1]
        k = k.transpose(1, 2)  # [B, Nk, Lk, C1]
        v = v.transpose(1, 2)  # [B, Nk, Lk, C2]
        
        # Use PyTorch's optimized SDPA with backend hints
        with torch.backends.cuda.sdp_kernel(
            enable_flash=False,  # Flash not available on Windows
            enable_math=True,    # Enable math backend as fallback
            enable_mem_efficient=True  # Prioritize memory efficient backend
        ):
            # Use torch.is_grad_enabled() to determine if we're in training mode
            effective_dropout = dropout_p if torch.is_grad_enabled() else 0.0
            x = torch.nn.functional.scaled_dot_product_attention(
                q, k, v,
                attn_mask=None,
                dropout_p=effective_dropout,
                scale=softmax_scale,
                is_causal=causal
            )
        
        # Transpose back
        x = x.transpose(1, 2).contiguous()  # [B, Lq, Nq, C2]

    # output
    return x.type(out_dtype)


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
    if FLASH_ATTN_2_AVAILABLE or FLASH_ATTN_3_AVAILABLE:
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
    else:
        if q_lens is not None or k_lens is not None:
            warnings.warn(
                'Padding mask is disabled when using scaled_dot_product_attention. It can have a significant impact on performance.'
            )
        attn_mask = None

        q = q.transpose(1, 2).to(dtype)
        k = k.transpose(1, 2).to(dtype)
        v = v.transpose(1, 2).to(dtype)

        # Use torch.is_grad_enabled() for dropout decision
        effective_dropout = dropout_p if torch.is_grad_enabled() else 0.0
        out = torch.nn.functional.scaled_dot_product_attention(
            q, k, v, attn_mask=attn_mask, is_causal=causal, dropout_p=effective_dropout)

        out = out.transpose(1, 2).contiguous()
        return out
