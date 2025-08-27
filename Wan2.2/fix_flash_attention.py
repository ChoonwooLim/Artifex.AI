"""
Fix Flash Attention requirement by patching the module
"""
import sys
import torch
import torch.nn.functional as F

# Disable Flash Attention
import wan.modules.attention as attention_module
attention_module.FLASH_ATTN_2_AVAILABLE = False
attention_module.FLASH_ATTN_3_AVAILABLE = False

# Replace flash_attention with PyTorch's native implementation
def flash_attention_fallback(
    q, k, v,
    q_lens=None, k_lens=None,
    dropout_p=0., softmax_scale=None, q_scale=None,
    causal=False, window_size=(-1, -1),
    deterministic=False, dtype=torch.bfloat16, version=None
):
    """Fallback implementation using PyTorch's scaled_dot_product_attention"""
    
    # Get dimensions
    b, lq, nq, c1 = q.shape
    b, lk, nk, c2 = k.shape
    
    # Apply scaling if needed
    if q_scale is not None:
        q = q * q_scale
    
    # Reshape for batch processing
    q = q.transpose(1, 2).contiguous()  # [B, Nq, Lq, C1]
    k = k.transpose(1, 2).contiguous()  # [B, Nk, Lk, C1]
    v = v.transpose(1, 2).contiguous()  # [B, Nk, Lk, C2]
    
    # Use PyTorch's efficient attention (available in PyTorch 2.0+)
    with torch.backends.cuda.sdp_kernel(
        enable_flash=False,  # Don't use Flash Attention
        enable_math=True,    # Use math implementation
        enable_mem_efficient=True  # Use memory efficient implementation
    ):
        output = F.scaled_dot_product_attention(
            q, k, v,
            dropout_p=dropout_p if q.training else 0.0,
            is_causal=causal,
            scale=softmax_scale
        )
    
    # Reshape back
    output = output.transpose(1, 2).contiguous()  # [B, Lq, Nq, C2]
    
    return output

# Monkey patch the function
attention_module.flash_attention = flash_attention_fallback

# Also patch the main attention function to bypass Flash Attention check
original_attention = attention_module.attention

def attention_fallback(
    q, k, v,
    q_lens=None, k_lens=None,
    dropout_p=0., softmax_scale=None, q_scale=None,
    causal=False, window_size=(-1, -1),
    deterministic=False, dtype=torch.bfloat16, fa_version=None
):
    """Direct fallback without Flash Attention check"""
    return flash_attention_fallback(
        q=q, k=k, v=v,
        q_lens=q_lens, k_lens=k_lens,
        dropout_p=dropout_p, softmax_scale=softmax_scale, q_scale=q_scale,
        causal=causal, window_size=window_size,
        deterministic=deterministic, dtype=dtype, version=fa_version
    )

attention_module.attention = attention_fallback

print("[PATCH] Flash Attention disabled - using PyTorch fallback")