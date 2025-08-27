import sys

packages = {
    'torch': None,
    'diffusers': None,
    'transformers': None,
    'accelerate': None,
    'opencv-python': 'cv2',
    'imageio': None,
    'tqdm': None,
    'flash_attn': None,
    'easydict': None,
    'ftfy': None,
    'dashscope': None,
}

print("Checking required packages for Wan2.2...\n")
print("-" * 50)

missing = []
installed = []

for package, import_name in packages.items():
    try:
        if import_name:
            exec(f"import {import_name}")
        else:
            exec(f"import {package.replace('-', '_')}")
        
        # Get version if possible
        try:
            if import_name:
                version = eval(f"{import_name}.__version__")
            else:
                version = eval(f"{package.replace('-', '_')}.__version__")
            installed.append(f"✓ {package:20} {version}")
        except:
            installed.append(f"✓ {package:20} (installed)")
    except ImportError:
        missing.append(package)
        print(f"✗ {package:20} NOT INSTALLED")

for item in installed:
    print(item)

if missing:
    print("\n" + "="*50)
    print("Missing packages detected!")
    print("="*50)
    print("\nInstall missing packages with:")
    print(f"pip install {' '.join(missing)}")
else:
    print("\n✅ All packages are installed!")

print("\n" + "-"*50)
print("Checking Wan2.2 models...")
print("-"*50)

import os

models = [
    "Wan2.2-T2V-A14B",
    "Wan2.2-I2V-A14B", 
    "Wan2.2-TI2V-5B"
]

for model in models:
    model_path = os.path.join("D:\\XX-v01", model)
    if os.path.exists(model_path):
        # Check for key files
        config_exists = os.path.exists(os.path.join(model_path, "configuration.json")) or \
                       os.path.exists(os.path.join(model_path, "config.json"))
        vae_exists = os.path.exists(os.path.join(model_path, "Wan2.1_VAE.pth")) or \
                    os.path.exists(os.path.join(model_path, "Wan2.2_VAE.pth"))
        
        if config_exists:
            print(f"✓ {model:20} Found (config: {'✓' if config_exists else '✗'}, VAE: {'✓' if vae_exists else '✗'})")
        else:
            print(f"⚠ {model:20} Found but may be incomplete")
    else:
        print(f"✗ {model:20} Not found at {model_path}")