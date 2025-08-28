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
    
# Determine optimal dtype based on GPU capabilities
def get_optimal_dtype():
    """Select optimal dtype based on GPU capabilities"""
    if torch.cuda.is_available():
        # Check for BF16 support
        if torch.cuda.is_bf16_supported():
            return torch.bfloat16
        else:
            # Use FP16 for GPUs without BF16 support (better performance)
            return torch.float16
    return torch.float32

OPTIMAL_DTYPE = get_optimal_dtype()

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
    dtype_str = str(OPTIMAL_DTYPE).replace("torch.", "")
    
    # Force SDPA if environment variable is set
    if FORCE_SDPA:
        if not _attention_warning_shown:
            print(f"[Attention] Using SDPA backend (forced by USE_SDPA=1)")
            print(f"[Attention] Config: dtype={dtype_str}, dropout={dropout_mode}")
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
    dtype=None,
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
    # Use optimal dtype if not specified
    if dtype is None:
        dtype = OPTIMAL_DTYPE
    
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
        
        # Create attention mask for padding and window if needed
        attn_mask = None
        
        # Apply padding mask if sequence lengths are specified
        if q_lens is not None and k_lens is not None:
            # Create block-diagonal attention mask for valid tokens only
            max_q_len = q.size(2)
            max_k_len = k.size(2)
            attn_mask = torch.zeros((b, 1, max_q_len, max_k_len), 
                                   dtype=q.dtype, device=q.device)
            
            for i in range(b):
                q_len = min(q_lens[i].item(), max_q_len)
                k_len = min(k_lens[i].item(), max_k_len)
                attn_mask[i, 0, :q_len, :k_len] = 1.0
            
            # Convert to additive mask (0 for valid, -inf for invalid)
            attn_mask = (1.0 - attn_mask) * -10000.0
        
        # Apply window attention if specified
        if window_size != (-1, -1) and window_size[0] > 0:
            window_left, window_right = window_size
            if attn_mask is None:
                attn_mask = torch.zeros((1, 1, q.size(2), k.size(2)), 
                                       dtype=q.dtype, device=q.device)
            
            # Create window mask
            for i in range(q.size(2)):
                start = max(0, i - window_left)
                end = min(k.size(2), i + window_right + 1)
                if start > 0:
                    attn_mask[:, :, i, :start] = -10000.0
                if end < k.size(2):
                    attn_mask[:, :, i, end:] = -10000.0
        
        # Use PyTorch's optimized SDPA with backend hints
        with torch.backends.cuda.sdp_kernel(
            enable_flash=False,  # Flash not available on Windows
            enable_math=True,    # Enable math backend as fallback
            enable_mem_efficient=True  # Prioritize memory efficient backend
        ):
            # Always use dropout=0 for inference
            effective_dropout = 0.0 if not torch.is_grad_enabled() else dropout_p
            
            x = torch.nn.functional.scaled_dot_product_attention(
                q, k, v,
                attn_mask=attn_mask,
                dropout_p=effective_dropout,
                scale=softmax_scale,
                is_causal=causal and attn_mask is None  # Only use causal if no custom mask
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
    dtype=None,
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
        # Use optimal dtype if not specified
        if dtype is None:
            dtype = OPTIMAL_DTYPE
            
        # Ensure proper dtype
        q = q.transpose(1, 2).to(dtype)
        k = k.transpose(1, 2).to(dtype)
        v = v.transpose(1, 2).to(dtype)
        
        # Create attention mask for padding if needed
        attn_mask = None
        if q_lens is not None or k_lens is not None:
            # Create proper padding mask instead of ignoring it
            if q_lens is not None and k_lens is not None:
                batch_size = q.size(0)
                max_q_len = q.size(2)
                max_k_len = k.size(2)
                attn_mask = torch.zeros((batch_size, 1, max_q_len, max_k_len), 
                                       dtype=dtype, device=q.device)
                
                for i in range(batch_size):
                    q_len = min(q_lens[i].item() if hasattr(q_lens[i], 'item') else q_lens[i], max_q_len)
                    k_len = min(k_lens[i].item() if hasattr(k_lens[i], 'item') else k_lens[i], max_k_len)
                    attn_mask[i, 0, :q_len, :k_len] = 1.0
                
                # Convert to additive mask
                attn_mask = (1.0 - attn_mask) * -10000.0

        # Use PyTorch's optimized SDPA with backend hints
        with torch.backends.cuda.sdp_kernel(
            enable_flash=False,
            enable_math=True,
            enable_mem_efficient=True
        ):
            # Always use dropout=0 for inference
            effective_dropout = 0.0 if not torch.is_grad_enabled() else dropout_p
            out = torch.nn.functional.scaled_dot_product_attention(
                q, k, v, 
                attn_mask=attn_mask, 
                is_causal=causal and attn_mask is None,
                dropout_p=effective_dropout
            )

        out = out.transpose(1, 2).contiguous()
        return out
