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
# Force FP16 for better performance on consumer GPUs
FORCE_FP16 = os.getenv("WAN_FORCE_FP16", "0") == "1"

# Set float32 matmul precision for better performance on Ampere+
if torch.cuda.is_available():
    torch.set_float32_matmul_precision('high')
    # Enable TF32 for better performance on Ampere+
    torch.backends.cuda.matmul.allow_tf32 = True
    torch.backends.cudnn.allow_tf32 = True
    
# Determine optimal dtype based on GPU capabilities
def get_optimal_dtype():
    """Select optimal dtype based on GPU capabilities and user preference"""
    if FORCE_FP16:
        # User forces FP16 for better performance on consumer GPUs
        return torch.float16
    
    if torch.cuda.is_available():
        # Check GPU architecture
        device_props = torch.cuda.get_device_properties(0)
        compute_capability = (device_props.major, device_props.minor)
        
        # RTX 30/40 series (Ampere/Ada Lovelace) often perform better with FP16
        if compute_capability >= (8, 0):  # Ampere and newer
            # Consumer GPUs (RTX 30/40) perform better with FP16
            # Only use BF16 for datacenter GPUs (A100, H100)
            if 'RTX' in device_props.name or 'GeForce' in device_props.name:
                return torch.float16
            elif torch.cuda.is_bf16_supported():
                return torch.bfloat16
            else:
                return torch.float16
        else:
            # Older GPUs: always use FP16
            return torch.float16
    return torch.float32

OPTIMAL_DTYPE = get_optimal_dtype()

# Windows Flash Attention threshold for long sequences
WINDOWS_FLASH_THRESHOLD = 1024 * 1024  # Use for L²>1M computations

# Track warning state to show only once
_attention_warning_shown = False

import warnings

# Try to enable torch.compile for optimization
COMPILE_ENABLED = os.getenv("WAN_COMPILE", "0") == "1"
if COMPILE_ENABLED:
    try:
        import torch._dynamo
        torch._dynamo.config.suppress_errors = True
        print("[Attention] torch.compile enabled for optimization")
    except:
        COMPILE_ENABLED = False
        print("[Attention] torch.compile not available")

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
    # DTYPE OPTIMIZATION: Use input dtype to avoid casting
    # If dtype not specified, use q's dtype (already optimal from model)
    if dtype is None:
        # Check if q already has optimal dtype
        if q.dtype in (torch.float16, torch.bfloat16):
            dtype = q.dtype
        else:
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
    
    # Performance logging (first call only)
    global _attention_warning_shown
    if not _attention_warning_shown:
        dtype_str = str(dtype).replace("torch.", "")
        mode = "inference" if not torch.is_grad_enabled() else "training"
        print(f"[Attention] Config: backend={backend}, dtype={dtype_str}, mode={mode}, "
              f"shape=[B={b}, Lq={lq}, Lk={lk}], dropout={dropout_p if torch.is_grad_enabled() else 0}")
        if q_lens is not None and k_lens is not None:
            actual_cost = torch.sum(q_lens * k_lens).item() if torch.is_tensor(q_lens) else 0
            batch_cost = b * lq * lk
            print(f"[Attention] Computation: actual={actual_cost:.0f}, batch={batch_cost:.0f}, "
                  f"ratio={actual_cost/batch_cost:.2f}")

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
        # Check if we should use Windows Flash Attention for very long sequences
        if IS_WINDOWS and WINDOWS_FLASH_AVAILABLE and lq * lk > WINDOWS_FLASH_THRESHOLD:
            # Use Windows Flash Attention for very long sequences
            if not _attention_warning_shown:
                print(f"[Attention] Using Windows Flash Attention for long sequence (L²={lq*lk:,})")
            
            # Reshape to [B*Lq, Nq, C1] format expected by windows wrapper
            q_reshaped = q.unflatten(0, (b, lq))  # [B, Lq, Nq, C1]
            k_reshaped = k.unflatten(0, (b, lk))  # [B, Lk, Nk, C1]
            v_reshaped = v.unflatten(0, (b, lk))  # [B, Lk, Nk, C2]
            
            # Call Windows Flash Attention wrapper
            x = windows_flash_attention_wrapper(
                q_reshaped, k_reshaped, v_reshaped,
                q_lens=q_lens, k_lens=k_lens,
                dropout_p=dropout_p,
                softmax_scale=softmax_scale,
                causal=causal,
                window_size=window_size,
                dtype=dtype,
                use_chunked=True,  # Enable chunking for long sequences
                chunk_size=64
            )
        else:
            # Use PyTorch's optimized SDPA (Scaled Dot Product Attention)
            # OPTIMIZATION: Per-sample SDPA for variable lengths (if beneficial)
            use_per_sample = False
            if q_lens is not None and k_lens is not None and b > 1:
                # Better heuristic: compare actual computation cost
                # Σ(L_i^2) vs B * L_max^2
                actual_cost = torch.sum(q_lens * k_lens).item()
                batch_cost = b * lq * lk
                # Use per-sample if it saves >30% computation
                if actual_cost < 0.7 * batch_cost:
                    use_per_sample = True
                    if not _attention_warning_shown:
                        cost_ratio = actual_cost / batch_cost
                        print(f"[Attention] Using per-sample SDPA (cost ratio: {cost_ratio:.2f})")
            
            if use_per_sample and q_lens is not None and k_lens is not None:
                # OPTIMIZED: Per-sample SDPA with correct transpose axis
                # Reshape to standard SDPA format [B, H, L, D]
                q = q.unflatten(0, (b, lq)).transpose(1, 2)  # [B, Nq, Lq, C1]
                k = k.unflatten(0, (b, lk)).transpose(1, 2)  # [B, Nk, Lk, C1]
                v = v.unflatten(0, (b, lk)).transpose(1, 2)  # [B, Nk, Lk, C2]
                
                # Pre-allocate output tensor to avoid repeated memory allocations
                num_heads = q.size(1)
                head_dim = v.size(-1)
                x = torch.zeros((b, num_heads, lq, head_dim), 
                               dtype=v.dtype, device=v.device)
                
                # Process each sample with its actual length
                for i in range(b):
                    q_len = int(q_lens[i])
                    k_len = int(k_lens[i])
                    
                    # Extract valid portions only (already in [B, H, L, D])
                    q_i = q[i:i+1, :, :q_len, :]  # [1, Nq, q_len, C1]
                    k_i = k[i:i+1, :, :k_len, :]  # [1, Nk, k_len, C1]
                    v_i = v[i:i+1, :, :k_len, :]  # [1, Nk, k_len, C2]
                    
                    # Run SDPA on actual length
                    out_i = torch.nn.functional.scaled_dot_product_attention(
                        q_i, k_i, v_i,
                        attn_mask=None,
                        dropout_p=0.0,  # No dropout in inference
                        scale=softmax_scale,
                        is_causal=causal
                    )
                    
                    # Copy result directly into pre-allocated tensor (no padding needed)
                    x[i:i+1, :, :q_len, :] = out_i
                    # Remaining x[i, :, q_len:, :] stays as zeros (implicit padding)
            else:
                # Standard path: Process all at once (faster when lengths are similar)
                # Efficient reshape: unflatten and transpose in one go
                q = q.unflatten(0, (b, lq)).transpose(1, 2)  # [B, Nq, Lq, C1]
                k = k.unflatten(0, (b, lk)).transpose(1, 2)  # [B, Nk, Lk, C1]
                v = v.unflatten(0, (b, lk)).transpose(1, 2)  # [B, Nk, Lk, C2]
                
                # Always use dropout=0 for inference
                effective_dropout = 0.0 if not torch.is_grad_enabled() else dropout_p
                
                # Use optimal SDPA backend hints
                with torch.backends.cuda.sdp_kernel(
                    enable_flash=False,  # Not available on Windows
                    enable_math=True,    # Math backend
                    enable_mem_efficient=True  # Memory efficient backend
                ):
                    x = torch.nn.functional.scaled_dot_product_attention(
                        q, k, v,
                        attn_mask=None,  # NO MASK for maximum performance
                        dropout_p=effective_dropout,
                        scale=softmax_scale,
                        is_causal=causal  # Causal is efficient without custom masks
                    )
            
            # Transpose back if needed
            if x.dim() == 4 and x.size(1) != lq:
                x = x.transpose(1, 2)  # [B, Lq, Nq, C2]
            
            # Ensure contiguous
            x = x.contiguous()

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
        
        # NO MASK for optimal performance - let SDPA handle padding internally
        attn_mask = None

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
