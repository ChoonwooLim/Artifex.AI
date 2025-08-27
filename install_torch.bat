@echo off
echo Installing PyTorch for CUDA 12.1...
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
echo.
echo Installation complete!
echo.
echo Testing PyTorch...
python check_torch.py
pause