#!/usr/bin/env python3
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import subprocess
from datetime import datetime
import sys

class GPUWorkerHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            response = {
                "status": "online",
                "worker": "Local GPU Worker", 
                "timestamp": datetime.now().isoformat()
            }
            self.wfile.write(json.dumps(response).encode())
            
        elif self.path == "/gpu/info":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            
            try:
                result = subprocess.run(
                    ["nvidia-smi", "--query-gpu=name,memory.total,memory.free,utilization.gpu", 
                     "--format=csv,noheader,nounits"],
                    capture_output=True, text=True
                )
                if result.returncode == 0:
                    gpu_list = []
                    for line in result.stdout.strip().split('\n'):
                        parts = line.split(", ")
                        if len(parts) >= 4:
                            gpu_list.append({
                                "name": parts[0],
                                "memory_total": int(parts[1]) * 1024 * 1024,
                                "memory_free": int(parts[2]) * 1024 * 1024,
                                "utilization": int(parts[3])
                            })
                    gpu_info = {
                        "gpus": gpu_list,
                        "count": len(gpu_list)
                    }
                    self.wfile.write(json.dumps(gpu_info).encode())
                else:
                    # nvidia-smi 실패 시 기본 응답
                    self.wfile.write(json.dumps({
                        "error": "nvidia-smi not available",
                        "gpus": [],
                        "count": 0
                    }).encode())
            except Exception as e:
                self.wfile.write(json.dumps({"error": str(e), "gpus": [], "count": 0}).encode())
                
        elif self.path == "/flash/status":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            
            # Flash Attention 상태 체크 (Windows에서는 기본적으로 비활성화)
            status = {
                "flash_attn": False,
                "xformers": False, 
                "cuda_available": False,
                "details": {
                    "flash_attn": "Not available on Windows",
                    "xformers": "Not available on Windows",
                    "note": "Flash Attention requires Linux with proper CUDA setup"
                }
            }
            
            # PyTorch가 설치되어 있다면 CUDA 체크
            try:
                import torch
                status["cuda_available"] = torch.cuda.is_available()
                if status["cuda_available"]:
                    status["details"]["cuda_version"] = torch.version.cuda
            except:
                pass
                
            self.wfile.write(json.dumps(status).encode())
            
        elif self.path == "/flash/benchmark":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            
            # 벤치마크 시뮬레이션
            benchmark = {
                "benchmarks": {
                    "standard_attention": {
                        "time_ms": 100.0,
                        "memory_gb": 2.0
                    },
                    "flash_attention": {
                        "time_ms": 25.0,
                        "memory_gb": 0.5,
                        "speedup": 4.0,
                        "memory_reduction": 4.0,
                        "note": "Simulated values - Flash Attention not available on Windows"
                    }
                }
            }
            self.wfile.write(json.dumps(benchmark).encode())
            
        else:
            self.send_response(404)
            self.end_headers()
            
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        """Override to show logs"""
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")

if __name__ == "__main__":
    # 로컬호스트에서 실행 (모든 인터페이스에서 접근 가능)
    host = "0.0.0.0"  # 모든 인터페이스에서 접근 가능
    port = 8000
    
    server_address = (host, port)
    print(f"Starting Local GPU Worker on http://localhost:{port}")
    print(f"Server listening on all interfaces (0.0.0.0:{port})")
    print("Press Ctrl+C to stop...")
    
    try:
        httpd = HTTPServer(server_address, GPUWorkerHandler)
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        sys.exit(0)
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)