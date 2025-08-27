import argparse
import os
from datetime import datetime

import torch
from diffusers import StableDiffusionPipeline, StableDiffusionXLPipeline
from diffusers.schedulers import DPMSolverMultistepScheduler
from PIL import Image


def parse_args():
    p = argparse.ArgumentParser(description="Simple T2I using diffusers (SDXL/SD1.5)")
    p.add_argument("--model", type=str, choices=["sdxl", "sd15"], default="sdxl")
    p.add_argument("--prompt", type=str, required=True)
    p.add_argument("--negative", type=str, default="")
    p.add_argument("--width", type=int, default=1024)
    p.add_argument("--height", type=int, default=1024)
    p.add_argument("--steps", type=int, default=30)
    p.add_argument("--cfg", type=float, default=6.5)
    p.add_argument("--seed", type=int, default=-1)
    p.add_argument("--output", type=str, default=None, help="Output file path (.png)")
    return p.parse_args()


def ensure_dir(path: str):
    d = os.path.dirname(path)
    if d and not os.path.exists(d):
        os.makedirs(d, exist_ok=True)


def main():
    args = parse_args()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    dtype = torch.float16 if device.type == "cuda" else torch.float32

    if args.model == "sdxl":
        model_id = "stabilityai/stable-diffusion-xl-base-1.0"
        pipe = StableDiffusionXLPipeline.from_pretrained(model_id, torch_dtype=dtype)
    else:
        model_id = "runwayml/stable-diffusion-v1-5"
        pipe = StableDiffusionPipeline.from_pretrained(model_id, torch_dtype=dtype)

    pipe = pipe.to(device)
    try:
        pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
    except Exception:
        pass

    if hasattr(pipe, "safety_checker") and pipe.safety_checker is not None:
        # Disable safety checker for speed and to avoid blocking
        pipe.safety_checker = None

    generator = None
    if args.seed >= 0:
        generator = torch.Generator(device=device).manual_seed(args.seed)

    print(f"[info] Running {args.model} on {device}, steps={args.steps}, cfg={args.cfg}")

    with torch.autocast(device_type=device.type if device.type == "cuda" else "cpu"):
        if args.model == "sdxl":
            image = pipe(
                prompt=args.prompt,
                negative_prompt=args.negative,
                width=args.width,
                height=args.height,
                guidance_scale=args.cfg,
                num_inference_steps=args.steps,
                generator=generator,
            ).images[0]
        else:
            image = pipe(
                prompt=args.prompt,
                negative_prompt=args.negative,
                width=args.width,
                height=args.height,
                guidance_scale=args.cfg,
                num_inference_steps=args.steps,
                generator=generator,
            ).images[0]

    if args.output is None:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe = args.prompt.replace("/", "_").replace("\\", "_").replace(" ", "_")[:40]
        args.output = f"t2i_{args.model}_{args.width}x{args.height}_{safe}_{ts}.png"

    ensure_dir(args.output)
    image.save(args.output)
    print(f"Saving generated image to {args.output}")


if __name__ == "__main__":
    main()



