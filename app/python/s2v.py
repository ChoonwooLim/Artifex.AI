#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Speech to Video Generation Backend
Handles S2V model inference for Wan2.2
"""

import os
import sys
import json
import torch
import tempfile
import traceback
from pathlib import Path

# Add parent directories to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'Wan2.2'))

from Wan2.2.wan.speech2video import WanS2V
from Wan2.2.wan.configs.wan_s2v_14B import s2v_14B
from Wan2.2.wan.utils.utils import save_video

class S2VGenerator:
    def __init__(self):
        self.model = None
        self.config = s2v_14B
        self.checkpoint_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            'Wan2.2-TI2V-5B'
        )
        
    def initialize(self):
        """Initialize the S2V model"""
        if self.model is None:
            try:
                device_id = 0 if torch.cuda.is_available() else -1
                
                # Initialize model
                self.model = WanS2V(
                    config=self.config,
                    checkpoint_dir=self.checkpoint_dir,
                    device_id=device_id,
                    init_on_cpu=not torch.cuda.is_available(),
                    convert_model_dtype=True
                )
                
                return {"success": True, "message": "Model initialized successfully"}
            except Exception as e:
                return {"success": False, "error": str(e)}
        return {"success": True, "message": "Model already initialized"}
    
    def generate(self, params):
        """Generate video from speech and reference image"""
        try:
            # Initialize model if needed
            init_result = self.initialize()
            if not init_result["success"]:
                return init_result
            
            # Extract parameters
            ref_image_path = params.get('reference_image')
            audio_path = params.get('audio')
            pose_video = params.get('pose_video', None)
            prompt = params.get('prompt', 'A person speaking naturally')
            negative_prompt = params.get('negative_prompt', '')
            infer_frames = int(params.get('infer_frames', 80))
            num_repeat = int(params.get('num_repeat', 1))
            steps = int(params.get('steps', 40))
            guide_scale = float(params.get('guide_scale', 5.0))
            seed = int(params.get('seed', -1))
            fps = int(params.get('fps', 16))
            
            # Update config with FPS
            self.config.sample_fps = fps
            
            # Generate video
            video_tensor = self.model.generate(
                input_prompt=prompt,
                ref_image_path=ref_image_path,
                audio_path=audio_path,
                num_repeat=num_repeat,
                pose_video=pose_video,
                max_area=720 * 1280,
                infer_frames=infer_frames,
                shift=3.0 if infer_frames <= 80 else 5.0,
                sample_solver='unipc',
                sampling_steps=steps,
                guide_scale=guide_scale,
                n_prompt=negative_prompt,
                seed=seed,
                offload_model=True,
                init_first_frame=False
            )
            
            # Save video
            output_dir = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                'output', 's2v'
            )
            os.makedirs(output_dir, exist_ok=True)
            
            output_path = os.path.join(output_dir, f"s2v_{os.getpid()}.mp4")
            save_video(video_tensor, output_path, fps=fps)
            
            return {
                "success": True,
                "videoPath": output_path,
                "message": "Video generated successfully"
            }
            
        except Exception as e:
            traceback.print_exc()
            return {"success": False, "error": str(e)}
    
    def cleanup(self):
        """Clean up model from memory"""
        if self.model is not None:
            del self.model
            self.model = None
            torch.cuda.empty_cache()
        return {"success": True, "message": "Model cleaned up"}

def main():
    """Main entry point for IPC communication"""
    generator = S2VGenerator()
    
    while True:
        try:
            # Read command from stdin
            line = sys.stdin.readline()
            if not line:
                break
                
            # Parse JSON command
            command = json.loads(line.strip())
            action = command.get('action')
            
            # Process command
            if action == 'initialize':
                result = generator.initialize()
            elif action == 'generate':
                result = generator.generate(command.get('params', {}))
            elif action == 'cleanup':
                result = generator.cleanup()
            else:
                result = {"success": False, "error": f"Unknown action: {action}"}
            
            # Send response
            print(json.dumps(result))
            sys.stdout.flush()
            
        except json.JSONDecodeError as e:
            print(json.dumps({"success": False, "error": f"Invalid JSON: {e}"}))
            sys.stdout.flush()
        except Exception as e:
            print(json.dumps({"success": False, "error": str(e)}))
            sys.stdout.flush()

if __name__ == "__main__":
    main()