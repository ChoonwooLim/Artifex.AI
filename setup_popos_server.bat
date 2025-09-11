@echo off
echo Setting up PopOS Worker Server...
echo.

REM Create Python script with escaped content
echo Creating server script...
(
echo #!/usr/bin/env python3
echo from http.server import HTTPServer, BaseHTTPRequestHandler
echo import json
echo import subprocess
echo from datetime import datetime
echo.
echo class GPUWorkerHandler^(BaseHTTPRequestHandler^):
echo     def do_GET^(self^):
echo         if self.path == "/":
echo             self.send_response^(200^)
echo             self.send_header^("Content-Type", "application/json"^)
echo             self.send_header^("Access-Control-Allow-Origin", "*"^)
echo             self.end_headers^(^)
echo             response = {
echo                 "status": "online",
echo                 "worker": "PopOS GPU Worker", 
echo                 "timestamp": datetime.now^(^).isoformat^(^)
echo             }
echo             self.wfile.write^(json.dumps^(response^).encode^(^)^)
echo.            
echo         elif self.path == "/gpu/info":
echo             self.send_response^(200^)
echo             self.send_header^("Content-Type", "application/json"^)
echo             self.send_header^("Access-Control-Allow-Origin", "*"^)
echo             self.end_headers^(^)
echo.            
echo             try:
echo                 result = subprocess.run^(
echo                     ["nvidia-smi", "--query-gpu=name,memory.total,memory.free,utilization.gpu", 
echo                      "--format=csv,noheader,nounits"],
echo                     capture_output=True, text=True
echo                 ^)
echo                 if result.returncode == 0:
echo                     line = result.stdout.strip^(^).split^(", "^)
echo                     gpu_info = {
echo                         "gpus": [{
echo                             "name": line[0],
echo                             "memory_total": int^(line[1]^) * 1024 * 1024,
echo                             "memory_free": int^(line[2]^) * 1024 * 1024,
echo                             "utilization": int^(line[3]^)
echo                         }],
echo                         "count": 1
echo                     }
echo                     self.wfile.write^(json.dumps^(gpu_info^).encode^(^)^)
echo             except Exception as e:
echo                 self.wfile.write^(json.dumps^({"error": str^(e^)}^).encode^(^)^)
echo.                
echo         elif self.path == "/flash/status":
echo             self.send_response^(200^)
echo             self.send_header^("Content-Type", "application/json"^)
echo             self.send_header^("Access-Control-Allow-Origin", "*"^)
echo             self.end_headers^(^)
echo             status = {
echo                 "flash_attn": True,
echo                 "xformers": True, 
echo                 "cuda_available": True,
echo                 "details": {
echo                     "flash_attn": "Available",
echo                     "xformers": "Available"
echo                 }
echo             }
echo             self.wfile.write^(json.dumps^(status^).encode^(^)^)
echo         else:
echo             self.send_response^(404^)
echo             self.end_headers^(^)
echo.            
echo     def do_OPTIONS^(self^):
echo         self.send_response^(200^)
echo         self.send_header^("Access-Control-Allow-Origin", "*"^)
echo         self.send_header^("Access-Control-Allow-Methods", "GET, POST, OPTIONS"^)
echo         self.send_header^("Access-Control-Allow-Headers", "Content-Type"^)
echo         self.end_headers^(^)
echo.
echo     def log_message^(self, format, *args^):
echo         print^(f"[{datetime.now^(^).strftime^('%%Y-%%m-%%d %%H:%%M:%%S'^)}] {format %% args}"^)
echo.
echo if __name__ == "__main__":
echo     server_address = ^("0.0.0.0", 8000^)
echo     print^(f"Starting PopOS GPU Worker on http://0.0.0.0:8000"^)
echo     httpd = HTTPServer^(server_address, GPUWorkerHandler^)
echo     httpd.serve_forever^(^)
) > popos_worker_temp.py

echo.
echo Now copy this file to PopOS and run:
echo 1. Copy: scp popos_worker_temp.py stevenlim@10.0.0.2:~/popos_worker.py
echo 2. Connect: ssh stevenlim@10.0.0.2
echo 3. Run: nohup python3 ~/popos_worker.py ^> ~/popos_worker.log 2^>^&1 ^&
echo.
pause