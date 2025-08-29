@echo off
REM Setup Python virtual environment during installation

set INSTALL_DIR=%~dp0..
cd /d "%INSTALL_DIR%\resources\wan22"

REM Create virtual environment
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate and install packages
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
pip install opencv-python>=4.9.0.80
pip install diffusers>=0.31.0
pip install transformers>=4.49.0
pip install tokenizers>=0.20.3
pip install accelerate>=1.1.1
pip install tqdm
pip install imageio[ffmpeg]
pip install easydict
pip install ftfy
pip install dashscope
pip install imageio-ffmpeg
pip install flash-attn --no-build-isolation
pip install "numpy>=1.23.5,<2"

echo Python environment setup complete!