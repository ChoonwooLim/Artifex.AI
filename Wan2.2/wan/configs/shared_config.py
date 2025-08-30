# Copyright 2024-2025 The Alibaba Wan Team Authors. All rights reserved.
import torch
from easydict import EasyDict

#------------------------ Wan shared config ------------------------#
wan_shared_cfg = EasyDict()

# t5
wan_shared_cfg.t5_model = 'umt5_xxl'
wan_shared_cfg.t5_dtype = torch.bfloat16
wan_shared_cfg.text_len = 512

# transformer
wan_shared_cfg.param_dtype = torch.bfloat16

# inference
wan_shared_cfg.num_train_timesteps = 1000
wan_shared_cfg.sample_fps = 16
wan_shared_cfg.sample_neg_prompt = ('static, blurry, low quality, worst quality, JPEG artifacts, '
                                     'extra fingers, extra limbs, extra body parts, multiple heads, '
                                     'fused fingers, malformed hands, distorted fingers, broken fingers, '
                                     'anatomically impossible, body horror, '
                                     'new objects appearing, floating objects, unrelated objects, '
                                     'low resolution, compression artifacts')
wan_shared_cfg.frame_num = 81

# Object consistency and preservation settings
wan_shared_cfg.consistency_mode = True
wan_shared_cfg.motion_bucket_id = 127  # Balanced motion (default range: 1-255)
wan_shared_cfg.noise_aug_strength = 0.05  # Balanced noise for natural motion
wan_shared_cfg.decoding_t = 5  # Standard decoding steps
wan_shared_cfg.cfg_scale = 9.5  # High guidance for accurate prompt following
wan_shared_cfg.sampler_algorithm = 'DPM++_2M_Karras'  # Better sampler for detail preservation
wan_shared_cfg.preserve_original_objects = True
wan_shared_cfg.suppress_new_objects = True
wan_shared_cfg.temporal_consistency_weight = 0.75  # Balanced temporal consistency

# Prompt adherence settings
wan_shared_cfg.prompt_adherence_weight = 0.95  # Very high prompt following
wan_shared_cfg.action_recognition_threshold = 0.9  # Accurate action detection
wan_shared_cfg.motion_guidance_scale = 8.0  # Strong motion guidance
wan_shared_cfg.semantic_consistency = 0.9  # High semantic accuracy
wan_shared_cfg.instruction_priority = True  # Prioritize user instructions
wan_shared_cfg.action_completion_weight = 0.9  # Ensure actions are completed
wan_shared_cfg.prompt_interpretation_mode = 'literal'  # Literal interpretation of prompts
wan_shared_cfg.motion_amplification = 1.2  # Slightly amplify requested motions
wan_shared_cfg.action_confidence_threshold = 0.8  # Execute actions with high confidence

# Anatomical accuracy settings for hands and body parts
wan_shared_cfg.anatomical_consistency = True
wan_shared_cfg.hand_detection_threshold = 0.7  # Moderate threshold for natural movement
wan_shared_cfg.body_part_coherence = 0.85  # Good coherence while allowing motion
wan_shared_cfg.motion_smoothing = 0.7  # Allow more natural transitions
wan_shared_cfg.detail_preservation_weight = 0.85  # Good detail preservation with flexibility
wan_shared_cfg.pose_consistency_check = True  # Enable pose consistency checking
wan_shared_cfg.max_deformation_threshold = 0.15  # Allow some natural deformation

# High-frequency detail preservation (for skin texture, edges, etc.)
wan_shared_cfg.high_freq_preservation = True
wan_shared_cfg.edge_sharpness_weight = 0.75  # Good edge definition with flexibility
wan_shared_cfg.texture_consistency = 0.8  # Maintain texture with natural variation
wan_shared_cfg.detail_enhancement_steps = 2  # Moderate enhancement steps
wan_shared_cfg.anti_blur_strength = 0.6  # Balanced blur prevention
wan_shared_cfg.local_detail_weight = 0.75  # Preserve important details
wan_shared_cfg.structural_integrity = 0.8  # Good structure with natural movement
