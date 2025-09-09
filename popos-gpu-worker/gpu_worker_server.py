#!/usr/bin/env python3
"""
Pop!_OS GPU Worker Server
Artifex.AI 분산 GPU 처리를 위한 워커 서버
"""

import os
import sys
import json
import asyncio
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime
import nvidia_ml_py as nvml

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
import uvicorn

# GPU 모니터링 초기화
nvml.nvmlInit()

app = FastAPI(title="PopOS GPU Worker", version="0.1.0")

# CORS 설정 (Windows PC에서 접근 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://10.0.0.1:*", "http://localhost:*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 작업 큐
task_queue = asyncio.Queue()
processing_tasks = {}

class GPUInfo(BaseModel):
    name: str
    memory_total: int
    memory_used: int
    memory_free: int
    utilization: int
    temperature: int
    power_draw: float

class VideoGenerationRequest(BaseModel):
    task_id: str
    model_type: str  # T2V, I2V, TI2V, S2V
    prompt: Optional[str] = None
    image_path: Optional[str] = None
    audio_path: Optional[str] = None
    parameters: Dict[str, Any] = {}

class TaskStatus(BaseModel):
    task_id: str
    status: str  # pending, processing, completed, failed
    progress: float
    message: str
    result_path: Optional[str] = None
    error: Optional[str] = None

@app.get("/")
async def root():
    """헬스체크 엔드포인트"""
    return {
        "status": "online",
        "worker": "PopOS GPU Worker",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/gpu/info")
async def get_gpu_info():
    """GPU 정보 조회"""
    try:
        device_count = nvml.nvmlDeviceGetCount()
        gpus = []
        
        for i in range(device_count):
            handle = nvml.nvmlDeviceGetHandleByIndex(i)
            
            # GPU 정보 수집
            name = nvml.nvmlDeviceGetName(handle).decode('utf-8')
            mem_info = nvml.nvmlDeviceGetMemoryInfo(handle)
            utilization = nvml.nvmlDeviceGetUtilizationRates(handle)
            temperature = nvml.nvmlDeviceGetTemperature(handle, nvml.NVML_TEMPERATURE_GPU)
            power = nvml.nvmlDeviceGetPowerUsage(handle) / 1000.0  # mW to W
            
            gpus.append(GPUInfo(
                name=name,
                memory_total=mem_info.total,
                memory_used=mem_info.used,
                memory_free=mem_info.free,
                utilization=utilization.gpu,
                temperature=temperature,
                power_draw=power
            ))
        
        return {"gpus": gpus, "count": device_count}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/gpu/cuda")
async def check_cuda():
    """CUDA 환경 확인"""
    try:
        # CUDA 버전 확인
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=driver_version,cuda_version", "--format=csv,noheader"],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            raise Exception("nvidia-smi failed")
        
        driver_version, cuda_version = result.stdout.strip().split(", ")
        
        # PyTorch CUDA 확인
        import torch
        pytorch_cuda = torch.cuda.is_available()
        pytorch_version = torch.__version__
        
        return {
            "driver_version": driver_version,
            "cuda_version": cuda_version,
            "pytorch_cuda_available": pytorch_cuda,
            "pytorch_version": pytorch_version,
            "cuda_device_count": torch.cuda.device_count() if pytorch_cuda else 0
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/task/submit")
async def submit_task(request: VideoGenerationRequest, background_tasks: BackgroundTasks):
    """비디오 생성 작업 제출"""
    try:
        # 작업을 큐에 추가
        await task_queue.put(request)
        
        # 작업 상태 초기화
        processing_tasks[request.task_id] = TaskStatus(
            task_id=request.task_id,
            status="pending",
            progress=0.0,
            message="Task queued for processing"
        )
        
        # 백그라운드에서 작업 처리 시작
        background_tasks.add_task(process_video_task, request)
        
        return {"task_id": request.task_id, "status": "queued"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/task/status/{task_id}")
async def get_task_status(task_id: str):
    """작업 상태 조회"""
    if task_id not in processing_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return processing_tasks[task_id]

@app.get("/task/result/{task_id}")
async def get_task_result(task_id: str):
    """작업 결과 다운로드"""
    if task_id not in processing_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = processing_tasks[task_id]
    
    if task.status != "completed":
        raise HTTPException(status_code=400, detail="Task not completed")
    
    if not task.result_path or not os.path.exists(task.result_path):
        raise HTTPException(status_code=404, detail="Result file not found")
    
    return FileResponse(
        task.result_path,
        media_type="video/mp4",
        filename=f"result_{task_id}.mp4"
    )

async def process_video_task(request: VideoGenerationRequest):
    """비디오 생성 작업 처리 (백그라운드)"""
    task_id = request.task_id
    
    try:
        # 상태 업데이트: 처리 중
        processing_tasks[task_id].status = "processing"
        processing_tasks[task_id].message = f"Processing {request.model_type} task"
        processing_tasks[task_id].progress = 0.1
        
        # 모델별 처리 로직
        if request.model_type == "T2V":
            result_path = await process_text_to_video(request)
        elif request.model_type == "I2V":
            result_path = await process_image_to_video(request)
        elif request.model_type == "TI2V":
            result_path = await process_text_image_to_video(request)
        elif request.model_type == "S2V":
            result_path = await process_speech_to_video(request)
        else:
            raise ValueError(f"Unknown model type: {request.model_type}")
        
        # 상태 업데이트: 완료
        processing_tasks[task_id].status = "completed"
        processing_tasks[task_id].progress = 1.0
        processing_tasks[task_id].message = "Task completed successfully"
        processing_tasks[task_id].result_path = result_path
        
    except Exception as e:
        # 상태 업데이트: 실패
        processing_tasks[task_id].status = "failed"
        processing_tasks[task_id].progress = 0.0
        processing_tasks[task_id].message = "Task failed"
        processing_tasks[task_id].error = str(e)

async def process_text_to_video(request: VideoGenerationRequest) -> str:
    """Text to Video 처리"""
    # TODO: 실제 Wan2.2-T2V 모델 처리 로직 구현
    await asyncio.sleep(5)  # 시뮬레이션
    
    # 임시 결과 파일 경로
    result_path = f"/tmp/t2v_{request.task_id}.mp4"
    
    # 실제로는 여기서 모델 실행
    # model = load_model("Wan2.2-T2V-A14B")
    # video = model.generate(prompt=request.prompt, **request.parameters)
    # video.save(result_path)
    
    return result_path

async def process_image_to_video(request: VideoGenerationRequest) -> str:
    """Image to Video 처리"""
    # TODO: 실제 Wan2.2-I2V 모델 처리 로직 구현
    await asyncio.sleep(5)  # 시뮬레이션
    
    result_path = f"/tmp/i2v_{request.task_id}.mp4"
    return result_path

async def process_text_image_to_video(request: VideoGenerationRequest) -> str:
    """Text+Image to Video 처리"""
    # TODO: 실제 Wan2.2-TI2V 모델 처리 로직 구현
    await asyncio.sleep(5)  # 시뮬레이션
    
    result_path = f"/tmp/ti2v_{request.task_id}.mp4"
    return result_path

async def process_speech_to_video(request: VideoGenerationRequest) -> str:
    """Speech to Video 처리"""
    # TODO: 실제 Wan2.2-S2V 모델 처리 로직 구현
    await asyncio.sleep(5)  # 시뮬레이션
    
    result_path = f"/tmp/s2v_{request.task_id}.mp4"
    return result_path

@app.on_event("startup")
async def startup_event():
    """서버 시작 시 초기화"""
    print("Pop!_OS GPU Worker Server started")
    print(f"Listening on http://10.0.0.2:8000")
    
    # GPU 정보 출력
    try:
        gpu_info = await get_gpu_info()
        print(f"Available GPUs: {gpu_info['count']}")
        for gpu in gpu_info['gpus']:
            print(f"  - {gpu.name}: {gpu.memory_free / 1024**3:.1f}GB free")
    except:
        print("Failed to get GPU info")

@app.on_event("shutdown")
async def shutdown_event():
    """서버 종료 시 정리"""
    nvml.nvmlShutdown()
    print("Pop!_OS GPU Worker Server stopped")

if __name__ == "__main__":
    # 서버 실행
    uvicorn.run(
        app,
        host="10.0.0.2",
        port=8000,
        reload=False,
        log_level="info"
    )