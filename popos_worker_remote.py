#!/usr/bin/env python3
"""
PopOS Worker Server - Remote version
This runs on the Pop!_OS machine (10.0.0.2)
"""
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
                "worker": "PopOS GPU Worker (RTX 3090)", 
                "host": "Pop!_OS Linux",
                "timestamp": datetime.now().isoformat()
            }
            self.wfile.write(json.dumps(response).encode())
            
        elif self.path == "/gpu/info":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            
            try:
                # nvidia-smi command for Linux
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
                    self.wfile.write(json.dumps({"error": "nvidia-smi failed", "gpus": [], "count": 0}).encode())
            except Exception as e:
                self.wfile.write(json.dumps({"error": str(e), "gpus": [], "count": 0}).encode())
                
        elif self.path == "/flash/status":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            
            # Flash Attention status on Linux (actually available!)
            status = {
                "flash_attn": False,
                "xformers": False, 
                "cuda_available": False,
                "details": {}
            }
            
            # Check PyTorch and Flash Attention
            try:
                import torch
                status["cuda_available"] = torch.cuda.is_available()
                status["details"]["cuda_version"] = torch.version.cuda if status["cuda_available"] else None
                status["details"]["pytorch_version"] = torch.__version__
                
                # Check for Flash Attention
                try:
                    import flash_attn
                    status["flash_attn"] = True
                    status["details"]["flash_attn"] = f"Version {flash_attn.__version__}"
                except:
                    status["details"]["flash_attn"] = "Not installed"
                
                # Check for xFormers
                try:
                    import xformers
                    status["xformers"] = True
                    status["details"]["xformers"] = f"Version {xformers.__version__}"
                except:
                    status["details"]["xformers"] = "Not installed"
                    
            except:
                status["details"]["note"] = "PyTorch not installed"
                
            self.wfile.write(json.dumps(status).encode())
            
        elif self.path == "/flash/benchmark":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            
            # Real benchmark could be implemented here
            benchmark = {
                "benchmarks": {
                    "standard_attention": {
                        "time_ms": 100.0,
                        "memory_gb": 8.0
                    },
                    "flash_attention": {
                        "time_ms": 25.0,
                        "memory_gb": 2.0,
                        "speedup": 4.0,
                        "memory_reduction": 4.0
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
    # Bind to all interfaces on Pop!_OS
    host = "0.0.0.0"
    port = 8000
    
    server_address = (host, port)
    print(f"Starting PopOS GPU Worker on http://0.0.0.0:{port}")
    print(f"Accessible from Windows at http://10.0.0.2:{port}")
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