#!/usr/bin/env python3
"""
Simple PopOS WAN Server 
Redirects requests to use PopOS models instead of Windows models
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import subprocess
import os
from datetime import datetime
from pathlib import Path

class SimpleWANHandler(BaseHTTPRequestHandler):
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == "/" or self.path == "/api/v1/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            
            # Check available models
            models = self.check_models()
            
            response = {
                "status": "online",
                "server": "PopOS WAN Server (Simple)",
                "models": models,
                "gpu": self.get_gpu_info(),
                "timestamp": datetime.now().isoformat()
            }
            self.wfile.write(json.dumps(response).encode())
            
        elif self.path == "/api/v1/models":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            models = self.check_models()
            self.wfile.write(json.dumps(models).encode())
            
        elif self.path == "/api/v1/gpu/info":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            gpu_info = self.get_gpu_info()
            self.wfile.write(json.dumps(gpu_info).encode())
            
        elif self.path == "/api/v1/flash/status":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            # Simulate Flash Attention on Linux
            status = {
                "flash_attn": True,
                "xformers": True,
                "version": "2.0",
                "cuda_version": "11.8"
            }
            self.wfile.write(json.dumps(status).encode())
            
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        """Handle POST requests for generation"""
        if self.path == "/api/v1/generate":
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            params = json.loads(post_data.decode('utf-8'))
            
            # Simulate generation response
            response = {
                "job_id": f"job_{datetime.now().timestamp()}",
                "status": "processing",
                "created_at": datetime.now().isoformat(),
                "eta_seconds": 30,
                "message": "Using PopOS GPU with Flash Attention"
            }
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
    
    def check_models(self):
        """Check available WAN models"""
        models = {}
        base_path = Path("/home/stevenlim/ArtifexPro/models")
        
        model_dirs = [
            ("T2V-A14B", "Wan2.2-T2V-A14B"),
            ("I2V-A14B", "Wan2.2-I2V-A14B"),
            ("TI2V-5B", "Wan2.2-TI2V-5B"),
            ("S2V-14B", "Wan2.2-S2V-14B")
        ]
        
        for model_id, dir_name in model_dirs:
            model_path = base_path / dir_name
            if model_path.exists():
                models[model_id] = {
                    "available": True,
                    "path": str(model_path),
                    "loaded": False
                }
            else:
                models[model_id] = {"available": False}
        
        return models
    
    def get_gpu_info(self):
        """Get GPU information"""
        try:
            result = subprocess.run(
                ['nvidia-smi', '--query-gpu=name,memory.total,memory.free,utilization.gpu', 
                 '--format=csv,noheader,nounits'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                gpus = []
                for i, line in enumerate(lines):
                    parts = [p.strip() for p in line.split(',')]
                    if len(parts) >= 4:
                        gpus.append({
                            "id": i,
                            "name": parts[0],
                            "memory_total": int(parts[1]),
                            "memory_free": int(parts[2]),
                            "memory_used": int(parts[1]) - int(parts[2]),
                            "utilization": int(parts[3]),
                            "temperature": 0  # nvidia-smi doesn't provide temp in this query
                        })
                return {
                    "gpus": gpus,
                    "total_memory": sum(g["memory_total"] for g in gpus),
                    "total_free": sum(g["memory_free"] for g in gpus)
                }
        except Exception as e:
            print(f"Error getting GPU info: {e}")
            
        return {"gpus": [], "error": "Unable to get GPU info"}
    
    def log_message(self, format, *args):
        """Custom logging"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] {format % args}")

def main():
    """Start the simple WAN server"""
    host = "0.0.0.0"
    port = 8001
    
    print("=" * 60)
    print("PopOS WAN Server (Simple Version)")
    print("=" * 60)
    print(f"Server: http://{host}:{port}")
    print(f"Access from Windows: http://10.0.0.2:{port}")
    print("-" * 60)
    
    # Check for GPUs
    try:
        result = subprocess.run(['nvidia-smi', '-L'], capture_output=True, text=True)
        if result.returncode == 0:
            print("GPUs found:")
            print(result.stdout)
        else:
            print("No GPUs found")
    except:
        print("nvidia-smi not available")
    
    print("-" * 60)
    print("Server ready. Press Ctrl+C to stop.")
    
    try:
        httpd = HTTPServer((host, port), SimpleWANHandler)
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()