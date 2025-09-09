#!/usr/bin/env python3
"""
Flash Attention Client for Windows
Connects to PopOS worker for Flash Attention optimized inference
"""

import json
import time
import asyncio
import aiohttp
from typing import Optional, Dict, Any, List
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FlashAttentionClient:
    """Client for Flash Attention operations on PopOS worker"""
    
    def __init__(self, worker_url: str = "http://10.0.0.2:8000"):
        self.worker_url = worker_url
        self.session = None
        self.flash_available = False
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        await self.check_flash_status()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def check_connection(self) -> bool:
        """Check connection to PopOS worker"""
        try:
            async with self.session.get(f"{self.worker_url}/") as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"Connected to: {data['worker']}")
                    logger.info(f"Features: {data.get('features', [])}")
                    return True
        except Exception as e:
            logger.error(f"Connection failed: {e}")
        return False
    
    async def check_flash_status(self) -> Dict[str, Any]:
        """Check Flash Attention availability"""
        try:
            async with self.session.get(f"{self.worker_url}/flash/status") as response:
                if response.status == 200:
                    status = await response.json()
                    self.flash_available = status.get("flash_attn", False) or status.get("xformers", False)
                    
                    logger.info("Flash Attention Status:")
                    logger.info(f"  - Flash Attention: {status.get('flash_attn', False)}")
                    logger.info(f"  - xFormers: {status.get('xformers', False)}")
                    logger.info(f"  - Triton: {status.get('triton', False)}")
                    logger.info(f"  - CUDA: {status.get('cuda_available', False)}")
                    
                    return status
        except Exception as e:
            logger.error(f"Failed to check Flash Attention status: {e}")
        return {}
    
    async def get_gpu_info(self) -> Dict[str, Any]:
        """Get GPU info with Flash Attention support status"""
        try:
            async with self.session.get(f"{self.worker_url}/gpu/info") as response:
                if response.status == 200:
                    info = await response.json()
                    
                    for gpu in info.get("gpus", []):
                        logger.info(f"GPU: {gpu['name']}")
                        logger.info(f"  - Memory: {gpu['memory_free'] / 1024**3:.1f}GB free")
                        logger.info(f"  - Compute Cap: {gpu.get('compute_capability', 'Unknown')}")
                        logger.info(f"  - Flash Support: {gpu.get('flash_attention_support', False)}")
                    
                    return info
        except Exception as e:
            logger.error(f"Failed to get GPU info: {e}")
        return {}
    
    async def run_benchmark(self) -> Dict[str, Any]:
        """Run Flash Attention benchmark"""
        try:
            logger.info("Running Flash Attention benchmark...")
            
            async with self.session.get(f"{self.worker_url}/flash/benchmark") as response:
                if response.status == 200:
                    results = await response.json()
                    
                    logger.info("Benchmark Results:")
                    
                    if "standard_attention" in results.get("benchmarks", {}):
                        std = results["benchmarks"]["standard_attention"]
                        logger.info(f"Standard Attention:")
                        logger.info(f"  - Time: {std['time_ms']}ms")
                        logger.info(f"  - Memory: {std['memory_gb']}GB")
                    
                    if "flash_attention" in results.get("benchmarks", {}):
                        flash = results["benchmarks"]["flash_attention"]
                        if "error" not in flash:
                            logger.info(f"Flash Attention:")
                            logger.info(f"  - Time: {flash['time_ms']}ms")
                            logger.info(f"  - Memory: {flash['memory_gb']}GB")
                            logger.info(f"  - Speedup: {flash['speedup']}x")
                            logger.info(f"  - Memory Reduction: {flash['memory_reduction']}x")
                    
                    if "xformers" in results.get("benchmarks", {}):
                        xf = results["benchmarks"]["xformers"]
                        if "error" not in xf:
                            logger.info(f"xFormers:")
                            logger.info(f"  - Time: {xf['time_ms']}ms")
                            logger.info(f"  - Memory: {xf['memory_gb']}GB")
                            logger.info(f"  - Speedup: {xf['speedup']}x")
                            logger.info(f"  - Memory Reduction: {xf['memory_reduction']}x")
                    
                    return results
        except Exception as e:
            logger.error(f"Benchmark failed: {e}")
        return {}
    
    async def run_inference(
        self,
        model_type: str,
        prompt: str,
        use_flash_attention: bool = True,
        **kwargs
    ) -> Dict[str, Any]:
        """Run inference with Flash Attention optimization"""
        
        if not self.flash_available and use_flash_attention:
            logger.warning("Flash Attention not available, using standard attention")
            use_flash_attention = False
        
        request_data = {
            "model_type": model_type,
            "prompt": prompt,
            "use_flash_attention": use_flash_attention,
            **kwargs
        }
        
        try:
            logger.info(f"Running inference with Flash Attention: {use_flash_attention}")
            
            async with self.session.post(
                f"{self.worker_url}/flash/inference",
                json=request_data
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    
                    logger.info(f"Inference completed:")
                    logger.info(f"  - Method: {result.get('method', 'unknown')}")
                    logger.info(f"  - Speedup: {result.get('estimated_speedup', 'N/A')}")
                    logger.info(f"  - Status: {result.get('status', 'unknown')}")
                    
                    return result
        except Exception as e:
            logger.error(f"Inference failed: {e}")
        return {}
    
    async def optimize_model(
        self,
        model_name: str,
        optimization_level: str = "medium"
    ) -> Dict[str, Any]:
        """Optimize model configuration for Flash Attention"""
        
        request_data = {
            "model_name": model_name,
            "optimization_level": optimization_level
        }
        
        try:
            logger.info(f"Optimizing {model_name} with level: {optimization_level}")
            
            async with self.session.post(
                f"{self.worker_url}/flash/optimize",
                json=request_data
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    
                    logger.info("Optimization Applied:")
                    opts = result.get("optimizations_applied", {})
                    for key, value in opts.items():
                        logger.info(f"  - {key}: {value}")
                    
                    improvements = result.get("expected_improvements", {})
                    logger.info("Expected Improvements:")
                    for key, value in improvements.items():
                        logger.info(f"  - {key}: {value}")
                    
                    return result
        except Exception as e:
            logger.error(f"Optimization failed: {e}")
        return {}

class FlashAttentionVideoGenerator:
    """Video generator with Flash Attention optimization"""
    
    def __init__(self, use_flash: bool = True):
        self.use_flash = use_flash
        self.client = FlashAttentionClient()
        
    async def generate_video_with_flash(
        self,
        model_type: str,
        prompt: str,
        output_path: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate video using Flash Attention optimization"""
        
        async with self.client as client:
            # Check Flash Attention availability
            status = await client.check_flash_status()
            
            if not (status.get("flash_attn") or status.get("xformers")):
                logger.warning("Flash Attention not available on PopOS worker")
                self.use_flash = False
            
            # Optimize model settings
            if self.use_flash:
                optimization = await client.optimize_model(
                    model_name=f"Wan2.2-{model_type}",
                    optimization_level="high"
                )
            
            # Run inference
            result = await client.run_inference(
                model_type=model_type,
                prompt=prompt,
                use_flash_attention=self.use_flash,
                **kwargs
            )
            
            # Save result (in real implementation, this would save the actual video)
            result["output_path"] = output_path
            result["optimization_used"] = self.use_flash
            
            return result

async def main():
    """Test Flash Attention functionality"""
    
    print("=" * 60)
    print("  Flash Attention Client Test")
    print("=" * 60)
    print()
    
    client = FlashAttentionClient()
    
    async with client:
        # Check connection
        connected = await client.check_connection()
        if not connected:
            print("Failed to connect to PopOS worker")
            return
        
        print()
        
        # Check Flash Attention status
        status = await client.check_flash_status()
        
        print()
        
        # Get GPU info
        gpu_info = await client.get_gpu_info()
        
        print()
        
        # Run benchmark
        if status.get("flash_attn") or status.get("xformers"):
            benchmark = await client.run_benchmark()
        else:
            print("Flash Attention not available for benchmark")
        
        print()
        
        # Test video generation
        generator = FlashAttentionVideoGenerator(use_flash=True)
        result = await generator.generate_video_with_flash(
            model_type="T2V",
            prompt="A beautiful sunset over mountains",
            output_path="output_flash.mp4"
        )
        
        print()
        print("Video generation result:")
        print(f"  - Method: {result.get('method', 'unknown')}")
        print(f"  - Optimization: {result.get('optimization_used', False)}")
        print(f"  - Output: {result.get('output_path', 'N/A')}")
    
    print()
    print("Test completed!")

if __name__ == "__main__":
    asyncio.run(main())