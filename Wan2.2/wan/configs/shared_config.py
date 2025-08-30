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
wan_shared_cfg.sample_neg_prompt = ('vivid colors, static, blurry details, subtitles, style, artwork, painting, picture, still, overall gray, worst '
                                     'quality, low quality, JPEG compression artifacts, ugly, incomplete, extra fingers, '
                                     'poorly drawn hands, poorly drawn face, deformed, disfigured, malformed limbs, fused '
                                     'fingers, static image, cluttered background, three legs, crowded background, walking '
                                     'backwards, new objects appearing, floating objects, unrelated objects, random objects, '
                                     'inconsistent objects, object duplication, unwanted elements, artifacts, morphing objects, '
                                     'extra limbs, extra body parts, multiple heads, distorted anatomy, unnatural poses, '
                                     'object transformation, sudden appearance, materialization, spawning objects, '
                                     'distorted fingers, broken fingers, twisted hands, malformed hands, impossible hand positions, '
                                     'anatomically incorrect hands, merged fingers, missing fingers, floating hands, disconnected hands, '
                                     'warped anatomy, body horror, melting features, impossible anatomy, broken limbs')
wan_shared_cfg.frame_num = 81

# Object consistency and preservation settings
wan_shared_cfg.consistency_mode = True
wan_shared_cfg.motion_bucket_id = 50  # Lower value for less motion
wan_shared_cfg.noise_aug_strength = 0.02  # Lower noise for stability
wan_shared_cfg.decoding_t = 5  # More decoding steps for quality
wan_shared_cfg.preserve_original_objects = True
wan_shared_cfg.suppress_new_objects = True
wan_shared_cfg.temporal_consistency_weight = 0.9  # High weight for temporal consistency

# Anatomical accuracy settings for hands and body parts
wan_shared_cfg.anatomical_consistency = True
wan_shared_cfg.hand_detection_threshold = 0.8  # Higher threshold for hand detection
wan_shared_cfg.body_part_coherence = 0.95  # Very high coherence for body parts
wan_shared_cfg.motion_smoothing = 0.85  # Smooth transitions between frames
wan_shared_cfg.detail_preservation_weight = 0.9  # Preserve fine details like fingers
wan_shared_cfg.pose_consistency_check = True  # Enable pose consistency checking
wan_shared_cfg.max_deformation_threshold = 0.1  # Limit maximum deformation allowed
