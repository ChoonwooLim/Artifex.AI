@echo off
echo Setting up PopOS GPU Worker...
echo.

REM Create worker script on PopOS
echo Creating worker script...
powershell -Command ^
"$script = @'^
#!/usr/bin/env python3^
import os^
import sys^
import json^
import asyncio^
from pathlib import Path^
from typing import Optional, Dict, Any^
from datetime import datetime^
^
from fastapi import FastAPI, HTTPException^
from fastapi.middleware.cors import CORSMiddleware^
from fastapi.responses import FileResponse^
from pydantic import BaseModel^
import uvicorn^
^
app = FastAPI(title=\"PopOS GPU Worker\", version=\"0.1.0\")^
^
app.add_middleware(^
    CORSMiddleware,^
    allow_origins=[\"*\"],^
    allow_credentials=True,^
    allow_methods=[\"*\"],^
    allow_headers=[\"*\"],^
)^
^
class GPUInfo(BaseModel):^
    name: str^
    memory_total: int^
    memory_free: int^
    utilization: int^
^
class VideoGenerationRequest(BaseModel):^
    task_id: str^
    model_type: str^
    prompt: Optional[str] = None^
    parameters: Dict[str, Any] = {}^
^
class TaskStatus(BaseModel):^
    task_id: str^
    status: str^
    progress: float^
    message: str^
^
processing_tasks = {}^
^
@app.get(\"/\")^
async def root():^
    return {^
        \"status\": \"online\",^
        \"worker\": \"PopOS GPU Worker\",^
        \"timestamp\": datetime.now().isoformat()^
    }^
^
@app.get(\"/gpu/info\")^
async def get_gpu_info():^
    import subprocess^
    try:^
        result = subprocess.run([\"nvidia-smi\", \"--query-gpu=name,memory.total,memory.free,utilization.gpu\", \"--format=csv,noheader,nounits\"], capture_output=True, text=True)^
        if result.returncode == 0:^
            line = result.stdout.strip().split(\", \")^
            return {^
                \"gpus\": [{^
                    \"name\": line[0],^
                    \"memory_total\": int(line[1]) * 1024 * 1024,^
                    \"memory_free\": int(line[2]) * 1024 * 1024,^
                    \"utilization\": int(line[3])^
                }],^
                \"count\": 1^
            }^
    except Exception as e:^
        raise HTTPException(status_code=500, detail=str(e))^
^
@app.post(\"/task/submit\")^
async def submit_task(request: VideoGenerationRequest):^
    processing_tasks[request.task_id] = TaskStatus(^
        task_id=request.task_id,^
        status=\"processing\",^
        progress=0.5,^
        message=\"Processing on PopOS GPU\"^
    )^
    await asyncio.sleep(2)^
    processing_tasks[request.task_id].status = \"completed\"^
    processing_tasks[request.task_id].progress = 1.0^
    return {\"task_id\": request.task_id, \"status\": \"queued\"}^
^
@app.get(\"/task/status/{task_id}\")^
async def get_task_status(task_id: str):^
    if task_id not in processing_tasks:^
        raise HTTPException(status_code=404, detail=\"Task not found\")^
    return processing_tasks[task_id]^
^
if __name__ == \"__main__\":^
    uvicorn.run(app, host=\"10.0.0.2\", port=8000, reload=False)^
'@; echo $script | popOS 'cat > ~/artifex-worker/gpu_worker_server.py'"

echo Worker script created!
echo.

REM Create setup script on PopOS
echo Creating setup script...
powershell -Command ^
"$setup = @'^
#!/bin/bash^
echo \"Installing PopOS GPU Worker...\"^
echo \"\"^
^
# Update system^
echo \"Updating system packages...\"^
sudo apt update^
^
# Install Python packages^
echo \"Installing Python packages...\"^
pip3 install --user fastapi uvicorn[standard] pydantic^
pip3 install --user nvidia-ml-py^
^
# Install PyTorch^
echo \"Installing PyTorch with CUDA support...\"^
pip3 install --user torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121^
^
echo \"\"^
echo \"Installation complete!\"^
echo \"\"^
echo \"To start the worker:\"^
echo \"  cd ~/artifex-worker\"^
echo \"  python3 gpu_worker_server.py\"^
'@; echo $setup | popOS 'cat > ~/artifex-worker/setup.sh && chmod +x ~/artifex-worker/setup.sh'"

echo Setup script created!
echo.
echo Now run the setup on PopOS:
echo   1. Open PowerShell
echo   2. Type: popOS
echo   3. Run: cd ~/artifex-worker ^&^& ./setup.sh
echo   4. Start worker: python3 gpu_worker_server.py
pause