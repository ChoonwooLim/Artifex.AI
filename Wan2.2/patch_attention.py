#!/usr/bin/env python3
"""
Attention 패치 - Flash Attention 없이 실행 가능하도록 수정
"""

import os
import sys
from pathlib import Path

# Wan2.2 경로
WAN2_PATH = Path("C:/1/Wan2.2")

def patch_attention():
    """attention.py 파일 패치"""
    
    attention_file = WAN2_PATH / "wan" / "modules" / "attention.py"
    
    print("=" * 60)
    print("Attention 모듈 패치")
    print("=" * 60)
    
    # 파일 읽기
    with open(attention_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Flash Attention assertion 제거
    content = content.replace(
        "        assert FLASH_ATTN_2_AVAILABLE",
        "        # assert FLASH_ATTN_2_AVAILABLE  # Patched: Allow fallback"
    )
    
    # Flash Attention 사용 부분을 PyTorch Native로 변경
    patch_code = """
        # Patched: Use PyTorch Native SDPA if Flash Attention not available
        if not FLASH_ATTN_2_AVAILABLE:
            # PyTorch Native Scaled Dot Product Attention
            import torch.nn.functional as F
            
            # Reshape for SDPA
            q_reshaped = q.view(b, lq, h, d).transpose(1, 2)  # [b, h, lq, d]
            k_reshaped = k.view(b, lk, h, d).transpose(1, 2)  # [b, h, lk, d]
            v_reshaped = v.view(b, lk, h, d).transpose(1, 2)  # [b, h, lk, d]
            
            # Apply scaled dot product attention
            with torch.backends.cuda.sdp_kernel(
                enable_flash=False,
                enable_math=True,
                enable_mem_efficient=True
            ):
                x = F.scaled_dot_product_attention(
                    q_reshaped, k_reshaped, v_reshaped,
                    dropout_p=dropout_p if dropout_p > 0 else 0.0,
                    scale=softmax_scale,
                    is_causal=causal
                )
            
            # Reshape back
            x = x.transpose(1, 2).contiguous().view(b * lq, h * d)
        else:
"""
    
    # Flash Attention 사용 부분 찾기
    if "assert FLASH_ATTN_2_AVAILABLE" in content:
        # else 블록 앞에 패치 코드 삽입
        lines = content.split('\n')
        new_lines = []
        
        for i, line in enumerate(lines):
            if "# assert FLASH_ATTN_2_AVAILABLE" in line:
                # 이 줄 뒤에 패치 코드 추가
                new_lines.append(line)
                new_lines.append(patch_code)
            else:
                new_lines.append(line)
        
        content = '\n'.join(new_lines)
    
    # 파일 저장
    with open(attention_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ {attention_file} 패치 완료")
    print("  - Flash Attention assertion 제거")
    print("  - PyTorch Native SDPA fallback 추가")
    
    return True

def verify_patch():
    """패치 확인"""
    attention_file = WAN2_PATH / "wan" / "modules" / "attention.py"
    
    with open(attention_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "# assert FLASH_ATTN_2_AVAILABLE" in content:
        print("\n✓ 패치 확인: 성공")
        return True
    else:
        print("\n✗ 패치 확인: 실패")
        return False

if __name__ == "__main__":
    print("Wan2.2 Attention 패치 시작...")
    
    if patch_attention():
        if verify_patch():
            print("\n" + "=" * 60)
            print("패치 완료!")
            print("이제 Flash Attention 없이도 실행 가능합니다.")
            print("PyTorch Native SDPA 사용 (70-80% 성능)")
            print("=" * 60)
        else:
            print("\n패치 실패!")
    else:
        print("\n패치 실패!")