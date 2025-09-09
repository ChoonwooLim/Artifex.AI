#!/usr/bin/env python3
"""Simplified PopOS GPU Worker for quick setup"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import subprocess
from datetime import datetime

class GPUWorkerHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {
                "status": "online",
                "worker": "PopOS GPU Worker", 
                "timestamp": datetime.now().isoformat()
            }
            self.wfile.write(json.dumps(response).encode())
            
        elif self.path == '/gpu/info':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # Get GPU info from nvidia-smi
            try:
                result = subprocess.run(
                    ["nvidia-smi", "--query-gpu=name,memory.total,memory.free,utilization.gpu", 
                     "--format=csv,noheader,nounits"],
                    capture_output=True, text=True
                )
                if result.returncode == 0:
                    line = result.stdout.strip().split(", ")
                    gpu_info = {
                        "gpus": [{
                            "name": line[0],
                            "memory_total": int(line[1]) * 1024 * 1024,
                            "memory_free": int(line[2]) * 1024 * 1024,
                            "utilization": int(line[3])
                        }],
                        "count": 1
                    }
                    self.wfile.write(json.dumps(gpu_info).encode())
            except Exception as e:
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()
            
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, format, *args):
        """Override to show logs"""
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")

if __name__ == "__main__":
    server_address = ('10.0.0.2', 8000)
    print(f"Starting PopOS GPU Worker on http://10.0.0.2:8000")
    httpd = HTTPServer(server_address, GPUWorkerHandler)
    print("Server is running... Press Ctrl+C to stop")
    httpd.serve_forever()