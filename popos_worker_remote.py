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
            
            # Flash Attention status on Linux
            status = {
                "flash_attn": False,
                "xformers": False, 
                "cuda_available": False,
                "gpu_name": "",
                "compute_capability": "",
                "details": {}
            }
            
            # Check PyTorch and Flash Attention
            try:
                import torch
                status["cuda_available"] = torch.cuda.is_available()
                
                if status["cuda_available"]:
                    status["gpu_name"] = torch.cuda.get_device_name(0)
                    major, minor = torch.cuda.get_device_capability(0)
                    status["compute_capability"] = f"{major}.{minor}"
                    status["details"]["cuda_version"] = torch.version.cuda
                    status["details"]["cudnn_version"] = torch.backends.cudnn.version()
                    
                    # RTX 3090 has compute capability 8.6, supports Flash Attention
                    if major >= 8:
                        status["details"]["gpu_supports_flash"] = True
                    else:
                        status["details"]["gpu_supports_flash"] = False
                
                status["details"]["pytorch_version"] = torch.__version__
                
                # Check for Flash Attention
                try:
                    import flash_attn
                    status["flash_attn"] = True
                    status["details"]["flash_attn"] = f"Version {flash_attn.__version__}"
                except ImportError:
                    # Try alternative import
                    try:
                        from flash_attn import flash_attn_func
                        status["flash_attn"] = True
                        status["details"]["flash_attn"] = "Available (functional API)"
                    except:
                        status["details"]["flash_attn"] = "Not installed (pip install flash-attn recommended)"
                
                # Check for xFormers
                try:
                    import xformers
                    import xformers.ops
                    status["xformers"] = True
                    status["details"]["xformers"] = f"Version {xformers.__version__}"
                except ImportError:
                    status["details"]["xformers"] = "Not installed (pip install xformers recommended)"
                
                # Check for BetterTransformer (alternative)
                try:
                    from torch.nn import functional as F
                    if hasattr(F, 'scaled_dot_product_attention'):
                        status["details"]["sdpa"] = "Available (PyTorch 2.0+ SDPA)"
                except:
                    pass
                    
            except ImportError:
                status["details"]["note"] = "PyTorch not installed. Install with: pip install torch torchvision torchaudio"
            except Exception as e:
                status["details"]["error"] = str(e)
                
            self.wfile.write(json.dumps(status).encode())
            
        elif self.path == "/flash/benchmark":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            
            # Simple benchmark test
            benchmark = {"benchmarks": {}}
            
            try:
                import torch
                import time
                
                if torch.cuda.is_available():
                    # Test standard attention
                    seq_len = 2048
                    batch_size = 4
                    num_heads = 16
                    head_dim = 64
                    
                    device = torch.device("cuda")
                    query = torch.randn(batch_size, num_heads, seq_len, head_dim, device=device, dtype=torch.float16)
                    key = torch.randn(batch_size, num_heads, seq_len, head_dim, device=device, dtype=torch.float16)
                    value = torch.randn(batch_size, num_heads, seq_len, head_dim, device=device, dtype=torch.float16)
                    
                    # Standard attention benchmark
                    torch.cuda.synchronize()
                    start = time.time()
                    scores = torch.matmul(query, key.transpose(-2, -1)) / (head_dim ** 0.5)
                    attn_weights = torch.nn.functional.softmax(scores, dim=-1)
                    output = torch.matmul(attn_weights, value)
                    torch.cuda.synchronize()
                    standard_time = (time.time() - start) * 1000
                    
                    # Get memory usage
                    standard_memory = torch.cuda.max_memory_allocated() / (1024**3)
                    torch.cuda.reset_peak_memory_stats()
                    
                    benchmark["benchmarks"]["standard_attention"] = {
                        "time_ms": round(standard_time, 2),
                        "memory_gb": round(standard_memory, 2)
                    }
                    
                    # Try Flash Attention if available
                    flash_available = False
                    flash_time = standard_time
                    flash_memory = standard_memory
                    
                    try:
                        # Try PyTorch 2.0 SDPA (includes Flash Attention)
                        torch.cuda.synchronize()
                        start = time.time()
                        with torch.backends.cuda.sdp_kernel(enable_flash=True, enable_math=False, enable_mem_efficient=True):
                            output = torch.nn.functional.scaled_dot_product_attention(query, key, value)
                        torch.cuda.synchronize()
                        flash_time = (time.time() - start) * 1000
                        flash_memory = torch.cuda.max_memory_allocated() / (1024**3)
                        flash_available = True
                        method_name = "flash_attention"
                    except:
                        # Try xFormers
                        try:
                            import xformers.ops as xops
                            torch.cuda.synchronize()
                            start = time.time()
                            output = xops.memory_efficient_attention(query, key, value)
                            torch.cuda.synchronize()
                            flash_time = (time.time() - start) * 1000
                            flash_memory = torch.cuda.max_memory_allocated() / (1024**3)
                            flash_available = True
                            method_name = "xformers"
                        except:
                            pass
                    
                    if flash_available:
                        benchmark["benchmarks"][method_name] = {
                            "time_ms": round(flash_time, 2),
                            "memory_gb": round(flash_memory, 2),
                            "speedup": round(standard_time / flash_time, 2),
                            "memory_reduction": round(standard_memory / flash_memory, 2)
                        }
                    else:
                        benchmark["benchmarks"]["flash_attention"] = {
                            "error": "Not available - install flash-attn or xformers"
                        }
                else:
                    benchmark["error"] = "CUDA not available"
                    
            except Exception as e:
                benchmark["error"] = str(e)
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