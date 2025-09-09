#!/usr/bin/env python3
"""
Dual GPU Client for Windows
PopOS GPU Worker와 통신하여 분산 처리를 수행하는 클라이언트
"""

import os
import sys
import json
import time
import uuid
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any, List
import logging

import aiohttp
import numpy as np
from tqdm import tqdm

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DualGPUClient:
    """듀얼 GPU 분산 처리 클라이언트"""
    
    def __init__(self, worker_url: str = "http://10.0.0.2:8000"):
        self.worker_url = worker_url
        self.session = None
        self.is_connected = False
        
    async def __aenter__(self):
        """비동기 컨텍스트 매니저 진입"""
        self.session = aiohttp.ClientSession()
        await self.connect()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """비동기 컨텍스트 매니저 종료"""
        await self.close()
        
    async def connect(self) -> bool:
        """워커 서버 연결 확인"""
        try:
            async with self.session.get(f"{self.worker_url}/") as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"Connected to worker: {data}")
                    self.is_connected = True
                    return True
        except Exception as e:
            logger.error(f"Failed to connect to worker: {e}")
            self.is_connected = False
        return False
        
    async def close(self):
        """세션 종료"""
        if self.session:
            await self.session.close()
            
    async def get_gpu_info(self) -> Dict[str, Any]:
        """워커 GPU 정보 조회"""
        try:
            async with self.session.get(f"{self.worker_url}/gpu/info") as response:
                if response.status == 200:
                    return await response.json()
        except Exception as e:
            logger.error(f"Failed to get GPU info: {e}")
        return None
        
    async def check_cuda(self) -> Dict[str, Any]:
        """워커 CUDA 환경 확인"""
        try:
            async with self.session.get(f"{self.worker_url}/gpu/cuda") as response:
                if response.status == 200:
                    return await response.json()
        except Exception as e:
            logger.error(f"Failed to check CUDA: {e}")
        return None
        
    async def submit_task(
        self,
        model_type: str,
        prompt: Optional[str] = None,
        image_path: Optional[str] = None,
        audio_path: Optional[str] = None,
        parameters: Dict[str, Any] = None
    ) -> str:
        """비디오 생성 작업 제출"""
        task_id = str(uuid.uuid4())
        
        request_data = {
            "task_id": task_id,
            "model_type": model_type,
            "prompt": prompt,
            "image_path": image_path,
            "audio_path": audio_path,
            "parameters": parameters or {}
        }
        
        try:
            async with self.session.post(
                f"{self.worker_url}/task/submit",
                json=request_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"Task submitted: {data}")
                    return task_id
                else:
                    logger.error(f"Failed to submit task: {response.status}")
        except Exception as e:
            logger.error(f"Error submitting task: {e}")
        return None
        
    async def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """작업 상태 조회"""
        try:
            async with self.session.get(f"{self.worker_url}/task/status/{task_id}") as response:
                if response.status == 200:
                    return await response.json()
        except Exception as e:
            logger.error(f"Failed to get task status: {e}")
        return None
        
    async def wait_for_task(
        self,
        task_id: str,
        timeout: int = 600,
        poll_interval: float = 1.0
    ) -> Dict[str, Any]:
        """작업 완료 대기"""
        start_time = time.time()
        
        with tqdm(total=100, desc="Processing") as pbar:
            last_progress = 0
            
            while time.time() - start_time < timeout:
                status = await self.get_task_status(task_id)
                
                if status:
                    # 진행률 업데이트
                    progress = status.get("progress", 0) * 100
                    pbar.update(progress - last_progress)
                    last_progress = progress
                    
                    # 상태 확인
                    if status["status"] == "completed":
                        pbar.update(100 - last_progress)
                        return status
                    elif status["status"] == "failed":
                        logger.error(f"Task failed: {status.get('error')}")
                        return status
                        
                await asyncio.sleep(poll_interval)
                
        logger.error("Task timeout")
        return None
        
    async def download_result(self, task_id: str, output_path: str) -> bool:
        """작업 결과 다운로드"""
        try:
            async with self.session.get(f"{self.worker_url}/task/result/{task_id}") as response:
                if response.status == 200:
                    with open(output_path, 'wb') as f:
                        async for chunk in response.content.iter_chunked(8192):
                            f.write(chunk)
                    logger.info(f"Result saved to: {output_path}")
                    return True
        except Exception as e:
            logger.error(f"Failed to download result: {e}")
        return False

class DualGPUVideoGenerator:
    """듀얼 GPU를 활용한 비디오 생성기"""
    
    def __init__(self, local_gpu: bool = True, remote_gpu: bool = True):
        self.local_gpu = local_gpu
        self.remote_gpu = remote_gpu
        self.worker_client = DualGPUClient() if remote_gpu else None
        
    async def generate_video_distributed(
        self,
        model_type: str,
        prompt: str,
        output_path: str,
        split_frames: bool = True
    ) -> str:
        """분산 비디오 생성"""
        
        if not self.remote_gpu:
            # 로컬 GPU만 사용
            return await self.generate_video_local(model_type, prompt, output_path)
            
        async with self.worker_client as client:
            # 워커 연결 확인
            if not await client.connect():
                logger.warning("Worker not available, falling back to local GPU")
                return await self.generate_video_local(model_type, prompt, output_path)
                
            # GPU 정보 확인
            gpu_info = await client.get_gpu_info()
            if gpu_info:
                logger.info(f"Worker GPUs: {gpu_info['count']}")
                
            if split_frames:
                # 프레임 분할 방식
                return await self.generate_split_frames(
                    client, model_type, prompt, output_path
                )
            else:
                # 전체 작업 위임
                return await self.generate_delegated(
                    client, model_type, prompt, output_path
                )
                
    async def generate_split_frames(
        self,
        client: DualGPUClient,
        model_type: str,
        prompt: str,
        output_path: str
    ) -> str:
        """프레임을 분할하여 두 GPU에서 처리"""
        
        # 프롬프트 분할 (첫 절반, 둘째 절반)
        prompt_first_half = f"{prompt} [first half]"
        prompt_second_half = f"{prompt} [second half]"
        
        # 로컬 GPU 작업
        local_task = asyncio.create_task(
            self.generate_video_local(model_type, prompt_first_half, "temp_local.mp4")
        )
        
        # 원격 GPU 작업
        task_id = await client.submit_task(
            model_type=model_type,
            prompt=prompt_second_half
        )
        
        if not task_id:
            logger.error("Failed to submit remote task")
            return await local_task
            
        # 두 작업 완료 대기
        local_result = await local_task
        remote_status = await client.wait_for_task(task_id)
        
        if remote_status and remote_status["status"] == "completed":
            # 원격 결과 다운로드
            await client.download_result(task_id, "temp_remote.mp4")
            
            # 두 비디오 병합
            await self.merge_videos("temp_local.mp4", "temp_remote.mp4", output_path)
            
            # 임시 파일 정리
            os.remove("temp_local.mp4")
            os.remove("temp_remote.mp4")
            
            return output_path
        else:
            # 원격 실패 시 로컬 결과만 사용
            os.rename("temp_local.mp4", output_path)
            return output_path
            
    async def generate_delegated(
        self,
        client: DualGPUClient,
        model_type: str,
        prompt: str,
        output_path: str
    ) -> str:
        """전체 작업을 원격 GPU에 위임"""
        
        # 작업 제출
        task_id = await client.submit_task(
            model_type=model_type,
            prompt=prompt
        )
        
        if not task_id:
            logger.error("Failed to submit task, falling back to local")
            return await self.generate_video_local(model_type, prompt, output_path)
            
        # 작업 완료 대기
        status = await client.wait_for_task(task_id)
        
        if status and status["status"] == "completed":
            # 결과 다운로드
            if await client.download_result(task_id, output_path):
                return output_path
                
        # 실패 시 로컬 폴백
        logger.warning("Remote processing failed, falling back to local")
        return await self.generate_video_local(model_type, prompt, output_path)
        
    async def generate_video_local(
        self,
        model_type: str,
        prompt: str,
        output_path: str
    ) -> str:
        """로컬 GPU에서 비디오 생성"""
        
        logger.info(f"Generating video locally: {model_type}")
        
        # TODO: 실제 로컬 모델 처리 로직
        # 여기서는 시뮬레이션
        await asyncio.sleep(3)
        
        # 임시 파일 생성 (실제로는 모델 출력)
        with open(output_path, 'wb') as f:
            f.write(b"LOCAL_VIDEO_DATA")
            
        return output_path
        
    async def merge_videos(self, video1: str, video2: str, output: str):
        """두 비디오 파일 병합"""
        
        # FFmpeg를 사용한 비디오 병합
        import subprocess
        
        cmd = [
            "ffmpeg",
            "-i", video1,
            "-i", video2,
            "-filter_complex", "[0:v][1:v]concat=n=2:v=1[outv]",
            "-map", "[outv]",
            output
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        await process.communicate()
        
        logger.info(f"Videos merged: {output}")

# CLI 테스트
async def main():
    """테스트 메인 함수"""
    
    generator = DualGPUVideoGenerator(local_gpu=True, remote_gpu=True)
    
    # 분산 비디오 생성 테스트
    result = await generator.generate_video_distributed(
        model_type="T2V",
        prompt="A beautiful sunset over the ocean",
        output_path="output_dual_gpu.mp4",
        split_frames=True
    )
    
    print(f"Video generated: {result}")

if __name__ == "__main__":
    asyncio.run(main())