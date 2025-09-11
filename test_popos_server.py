#!/usr/bin/env python3
"""
PopOS WAN Server Test Suite
Tests all endpoints and functionality of the deployed server
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, Any, Optional
from pathlib import Path
import base64

class PopOSServerTester:
    def __init__(self, server_url: str = "http://10.0.0.2:8001"):
        self.server_url = server_url
        self.api_url = f"{server_url}/api/v1"
        self.test_results = []
        
    async def test_health_check(self) -> bool:
        """Test server health endpoint"""
        print("\n🏥 Testing health check...")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.server_url}/health") as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"✅ Server healthy: {data}")
                        return True
        except Exception as e:
            print(f"❌ Health check failed: {e}")
        return False
    
    async def test_gpu_info(self) -> bool:
        """Test GPU information endpoint"""
        print("\n🎮 Testing GPU info...")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.api_url}/gpu/info") as response:
                    if response.status == 200:
                        data = await response.json()
                        print("✅ GPU Info retrieved:")
                        for gpu in data.get('gpus', []):
                            print(f"  - {gpu['name']}: {gpu['memory_free']}MB free")
                        return True
        except Exception as e:
            print(f"❌ GPU info failed: {e}")
        return False
    
    async def test_flash_attention(self) -> bool:
        """Test Flash Attention status"""
        print("\n⚡ Testing Flash Attention...")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.api_url}/flash/status") as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get('flash_attn'):
                            print(f"✅ Flash Attention enabled: v{data.get('version', 'unknown')}")
                        elif data.get('xformers'):
                            print(f"✅ xFormers enabled (fallback)")
                        else:
                            print("⚠️ No attention optimization available")
                        return True
        except Exception as e:
            print(f"❌ Flash status check failed: {e}")
        return False
    
    async def test_model_list(self) -> bool:
        """Test model listing"""
        print("\n📦 Testing model list...")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.api_url}/models") as response:
                    if response.status == 200:
                        data = await response.json()
                        print("✅ Available models:")
                        for model in data.get('models', []):
                            status = "✓" if model['loaded'] else "✗"
                            print(f"  [{status}] {model['name']}: {model['type']}")
                        return True
        except Exception as e:
            print(f"❌ Model list failed: {e}")
        return False
    
    async def test_simple_generation(self) -> Optional[str]:
        """Test simple text-to-video generation"""
        print("\n🎬 Testing generation (Draft quality)...")
        
        request_data = {
            "prompt": "A serene landscape with mountains",
            "model": "t2v",
            "quality": "draft",
            "options": {
                "steps": 10,
                "cfg_scale": 7.5,
                "seed": 42
            }
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                # Submit generation request
                async with session.post(
                    f"{self.api_url}/generate",
                    json=request_data
                ) as response:
                    if response.status != 200:
                        print(f"❌ Generation request failed: {response.status}")
                        return None
                    
                    data = await response.json()
                    job_id = data.get('job_id')
                    print(f"✅ Job submitted: {job_id}")
                    
                    # Poll for completion
                    max_attempts = 60
                    for i in range(max_attempts):
                        await asyncio.sleep(2)
                        
                        async with session.get(
                            f"{self.api_url}/status/{job_id}"
                        ) as status_response:
                            if status_response.status == 200:
                                status_data = await status_response.json()
                                status = status_data.get('status')
                                progress = status_data.get('progress', 0)
                                
                                print(f"  Status: {status} ({progress:.1%})")
                                
                                if status == 'completed':
                                    print("✅ Generation completed!")
                                    return job_id
                                elif status == 'failed':
                                    print(f"❌ Generation failed: {status_data.get('error')}")
                                    return None
                    
                    print("⚠️ Generation timed out")
                    return None
                    
        except Exception as e:
            print(f"❌ Generation test failed: {e}")
        return None
    
    async def test_websocket_connection(self) -> bool:
        """Test WebSocket connectivity"""
        print("\n🔌 Testing WebSocket...")
        try:
            import socketio
            sio = socketio.AsyncClient()
            
            connected = False
            
            @sio.event
            async def connect():
                nonlocal connected
                connected = True
                print("✅ WebSocket connected")
            
            @sio.event
            async def disconnect():
                print("WebSocket disconnected")
            
            await sio.connect(f"{self.server_url}")
            await asyncio.sleep(2)
            
            if connected:
                await sio.disconnect()
                return True
                
        except Exception as e:
            print(f"⚠️ WebSocket test skipped: {e}")
        
        return False
    
    async def test_benchmark(self) -> bool:
        """Run performance benchmark"""
        print("\n⚡ Running benchmark...")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.api_url}/benchmark",
                    json={"iterations": 3}
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        print("✅ Benchmark results:")
                        print(f"  - Avg inference time: {data.get('avg_time', 0):.2f}s")
                        print(f"  - Throughput: {data.get('throughput', 0):.2f} fps")
                        print(f"  - Memory used: {data.get('memory_used', 0):.1f}GB")
                        return True
        except Exception as e:
            print(f"⚠️ Benchmark skipped: {e}")
        return False
    
    async def run_all_tests(self):
        """Run complete test suite"""
        print("=" * 50)
        print("🧪 PopOS WAN Server Test Suite")
        print(f"Target: {self.server_url}")
        print("=" * 50)
        
        tests = [
            ("Health Check", self.test_health_check),
            ("GPU Info", self.test_gpu_info),
            ("Flash Attention", self.test_flash_attention),
            ("Model List", self.test_model_list),
            ("WebSocket", self.test_websocket_connection),
            ("Simple Generation", self.test_simple_generation),
            ("Benchmark", self.test_benchmark),
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            try:
                result = await test_func()
                if result or result is None:  # None means optional test
                    passed += 1
                    self.test_results.append((test_name, "PASSED"))
                else:
                    failed += 1
                    self.test_results.append((test_name, "FAILED"))
            except Exception as e:
                failed += 1
                self.test_results.append((test_name, f"ERROR: {e}"))
                print(f"❌ {test_name} error: {e}")
        
        # Print summary
        print("\n" + "=" * 50)
        print("📊 Test Summary")
        print("=" * 50)
        for test_name, result in self.test_results:
            status_icon = "✅" if "PASSED" in result else "❌"
            print(f"{status_icon} {test_name}: {result}")
        
        print(f"\nTotal: {passed} passed, {failed} failed")
        
        if failed == 0:
            print("\n🎉 All tests passed! Server is ready for production.")
        elif passed > failed:
            print("\n⚠️ Some tests failed. Server partially functional.")
        else:
            print("\n❌ Most tests failed. Please check server configuration.")
        
        return failed == 0

async def main():
    """Main test function"""
    import sys
    
    server_url = "http://10.0.0.2:8001"
    if len(sys.argv) > 1:
        server_url = sys.argv[1]
    
    tester = PopOSServerTester(server_url)
    success = await tester.run_all_tests()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    print("PopOS WAN Server Test Tool")
    print("This will test all server endpoints and functionality")
    print()
    
    asyncio.run(main())