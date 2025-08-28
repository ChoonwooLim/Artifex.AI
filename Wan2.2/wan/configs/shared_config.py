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
wan_shared_cfg.sample_neg_prompt = 'oversaturated colors, static, blurry details, subtitles, artistic style, artwork, painting, still frame, static image, overall grayish, worst quality, low quality, JPEG compression artifacts, ugly, incomplete, extra fingers, poorly drawn hands, poorly drawn face, deformed, disfigured, malformed limbs, fused fingers, motionless frame, cluttered background, three legs, crowded background, walking backwards, watermark, logo, text overlay, cropped, out of frame, cut off, bad anatomy, duplicate, morbid, mutilated, mutation, distorted, bad proportions, cloned face, long neck, bad composition, compressed, low resolution, bad lighting, backlit, bad shadow, unnatural colors, unnatural lighting, bad physics, floating objects, disconnected limbs, missing arms, missing legs, extra arms, extra legs, extra limbs, broken limbs, bad perspective, bad angle, bad posing, unnatural expressions, unnatural poses, cartoon, anime, sketch, drawing, CGI, 3D render, illustration, unrealistic, black and white, monochrome, over sharpened, over smoothed, plastic skin, wax figure, mannequin, doll-like, uncanny valley, sudden objects appearing, objects materializing in hands, random objects in hands, inconsistent hand contents, spontaneous object generation, unintended handheld items, phantom objects, appearing props, temporal inconsistency, continuity errors, object popping, sudden item appearance'
wan_shared_cfg.frame_num = 81
