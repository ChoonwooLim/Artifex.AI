"""
Patch for Flash Attention fallback
"""
import torch
import torch.nn.functional as F

# Set Flash Attention as unavailable to force fallback
FLASH_ATTN_2_AVAILABLE = False

def scaled_dot_product_attention(q, k, v, attn_mask=None, dropout_p=0.0, is_causal=False):
    """
    Fallback implementation when Flash Attention is not available
    """
    # Calculate attention scores
    d_k = q.size(-1)
    scores = torch.matmul(q, k.transpose(-2, -1)) / (d_k ** 0.5)
    
    # Apply mask if provided
    if attn_mask is not None:
        scores = scores.masked_fill(attn_mask == 0, -1e9)
    
    # Apply causal mask if needed
    if is_causal:
        seq_len = scores.size(-1)
        causal_mask = torch.triu(torch.ones(seq_len, seq_len, device=scores.device), diagonal=1).bool()
        scores = scores.masked_fill(causal_mask, -1e9)
    
    # Apply softmax
    attn_weights = F.softmax(scores, dim=-1)
    
    # Apply dropout
    if dropout_p > 0:
        attn_weights = F.dropout(attn_weights, p=dropout_p)
    
    # Apply attention to values
    output = torch.matmul(attn_weights, v)
    
    return output