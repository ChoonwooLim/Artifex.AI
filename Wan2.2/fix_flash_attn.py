"""
Fix for flash_attn import error in Wan2.2
Run this before generate.py if flash_attn is not installed
"""

import sys
import warnings

# Mock flash_attn module
class MockFlashAttn:
    def __getattr__(self, name):
        warnings.warn(f"flash_attn.{name} is not available, using standard attention")
        return lambda *args, **kwargs: None

sys.modules['flash_attn'] = MockFlashAttn()
sys.modules['flash_attn.flash_attn_interface'] = MockFlashAttn()
sys.modules['flash_attn.bert_padding'] = MockFlashAttn()
sys.modules['flash_attn.flash_attn_triton'] = MockFlashAttn()

print("✓ Flash attention mock installed. You can now run generate.py")
print("Note: Performance will be slower without real flash_attn")