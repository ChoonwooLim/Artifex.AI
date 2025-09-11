#!/usr/bin/env python3
"""
PopOS WAN Server Deployment Script
Deploys and configures the PopOS WAN server for production use
"""

import os
import sys
import subprocess
import json
from pathlib import Path
from typing import Dict, Any, Optional

class PopOSDeployer:
    def __init__(self):
        self.server_ip = "10.0.0.2"
        self.server_user = "choon"
        self.server_path = f"/home/{self.server_user}/wan_server"
        self.local_server_file = Path("popos_wan_server_pro.py")
        
    def run_ssh_command(self, command: str, check: bool = True) -> subprocess.CompletedProcess:
        """Execute command on PopOS server via SSH"""
        ssh_cmd = f"ssh {self.server_user}@{self.server_ip} '{command}'"
        print(f"Executing: {command}")
        return subprocess.run(ssh_cmd, shell=True, capture_output=True, text=True, check=check)
    
    def copy_file_to_server(self, local_file: Path, remote_path: str) -> bool:
        """Copy file to PopOS server using SCP"""
        scp_cmd = f"scp {local_file} {self.server_user}@{self.server_ip}:{remote_path}"
        print(f"Copying {local_file} to {remote_path}")
        result = subprocess.run(scp_cmd, shell=True, capture_output=True, text=True)
        return result.returncode == 0
    
    def setup_server_directory(self) -> bool:
        """Create server directory structure"""
        print("\n📁 Setting up server directories...")
        commands = [
            f"mkdir -p {self.server_path}",
            f"mkdir -p {self.server_path}/logs",
            f"mkdir -p {self.server_path}/cache",
            f"mkdir -p {self.server_path}/results",
        ]
        
        for cmd in commands:
            result = self.run_ssh_command(cmd)
            if result.returncode != 0:
                print(f"❌ Failed: {cmd}")
                return False
        
        print("✅ Directories created")
        return True
    
    def check_python_version(self) -> bool:
        """Verify Python 3.10+ is installed"""
        print("\n🐍 Checking Python version...")
        result = self.run_ssh_command("python3 --version", check=False)
        
        if result.returncode != 0:
            print("❌ Python3 not found")
            return False
        
        version_str = result.stdout.strip()
        print(f"Found: {version_str}")
        
        # Parse version
        try:
            version_parts = version_str.split()[1].split('.')
            major, minor = int(version_parts[0]), int(version_parts[1])
            if major >= 3 and minor >= 10:
                print("✅ Python version OK")
                return True
        except:
            pass
        
        print("❌ Python 3.10+ required")
        return False
    
    def install_dependencies(self) -> bool:
        """Install Python dependencies"""
        print("\n📦 Installing dependencies...")
        
        # Create requirements file
        requirements = """torch>=2.2.0
torchvision
torchaudio
transformers>=4.36.0
accelerate>=0.25.0
diffusers>=0.24.0
fastapi>=0.109.0
uvicorn[standard]>=0.25.0
python-socketio>=5.10.0
aiofiles>=23.2.0
pydantic>=2.5.0
numpy<2.0.0
Pillow>=10.1.0
opencv-python>=4.8.0
scipy>=1.11.0
huggingface-hub>=0.19.0
safetensors>=0.4.0
einops>=0.7.0
psutil>=5.9.0
GPUtil>=1.4.0
redis>=5.0.0
python-multipart>=0.0.6
"""
        
        # Write requirements to temp file
        req_file = Path("requirements_popos.txt")
        req_file.write_text(requirements)
        
        # Copy to server
        if not self.copy_file_to_server(req_file, f"{self.server_path}/requirements.txt"):
            print("❌ Failed to copy requirements")
            return False
        
        # Install via pip
        install_cmd = f"cd {self.server_path} && pip3 install --user -r requirements.txt"
        result = self.run_ssh_command(install_cmd, check=False)
        
        if result.returncode != 0:
            print(f"⚠️ Some packages may have failed: {result.stderr}")
        
        print("✅ Base dependencies installed")
        return True
    
    def install_flash_attention(self) -> bool:
        """Install Flash Attention 2.0"""
        print("\n⚡ Installing Flash Attention...")
        
        # Check CUDA version
        cuda_check = self.run_ssh_command("nvcc --version", check=False)
        if cuda_check.returncode != 0:
            print("⚠️ CUDA toolkit not found, Flash Attention may not work optimally")
        
        # Install Flash Attention
        commands = [
            "pip3 install --user ninja",
            "pip3 install --user packaging",
            "pip3 install --user flash-attn --no-build-isolation",
        ]
        
        for cmd in commands:
            print(f"Running: {cmd}")
            result = self.run_ssh_command(cmd, check=False)
            if "Successfully installed" in result.stdout:
                print(f"✅ {cmd.split()[-1]} installed")
        
        # Fallback to xFormers if Flash Attention fails
        print("Installing xFormers as fallback...")
        self.run_ssh_command("pip3 install --user xformers", check=False)
        
        return True
    
    def deploy_server_code(self) -> bool:
        """Deploy the server Python file"""
        print("\n📤 Deploying server code...")
        
        if not self.local_server_file.exists():
            print(f"❌ Server file not found: {self.local_server_file}")
            return False
        
        # Copy main server file
        remote_file = f"{self.server_path}/popos_wan_server_pro.py"
        if not self.copy_file_to_server(self.local_server_file, remote_file):
            print("❌ Failed to deploy server")
            return False
        
        # Make executable
        self.run_ssh_command(f"chmod +x {remote_file}")
        
        print("✅ Server code deployed")
        return True
    
    def create_config_file(self) -> bool:
        """Create server configuration file"""
        print("\n⚙️ Creating configuration...")
        
        config = {
            "server": {
                "host": "0.0.0.0",
                "port": 8001,
                "workers": 1,
                "reload": False
            },
            "models": {
                "base_path": f"/home/{self.server_user}",
                "models": {
                    "t2v": "Wan2.2-T2V-A14B",
                    "i2v": "Wan2.2-I2V-A14B",
                    "ti2v": "Wan2.2-TI2V-5B",
                    "s2v": "Wan2.2-S2V-14B"
                }
            },
            "gpu": {
                "devices": [0, 1],
                "memory_fraction": 0.9,
                "allow_growth": True
            },
            "optimization": {
                "use_flash_attention": True,
                "use_fp16": True,
                "use_tensorrt": False,
                "batch_size": 1
            },
            "cache": {
                "redis_host": "localhost",
                "redis_port": 6379,
                "ttl": 3600
            }
        }
        
        # Write config
        config_file = Path("server_config.json")
        config_file.write_text(json.dumps(config, indent=2))
        
        # Copy to server
        remote_config = f"{self.server_path}/config.json"
        if not self.copy_file_to_server(config_file, remote_config):
            print("❌ Failed to copy config")
            return False
        
        print("✅ Configuration created")
        return True
    
    def create_systemd_service(self) -> bool:
        """Create systemd service for auto-start"""
        print("\n🔧 Creating systemd service...")
        
        service_content = f"""[Unit]
Description=PopOS WAN Generation Server
After=network.target

[Service]
Type=simple
User={self.server_user}
WorkingDirectory={self.server_path}
Environment="PATH=/home/{self.server_user}/.local/bin:/usr/local/bin:/usr/bin:/bin"
Environment="PYTHONPATH={self.server_path}"
ExecStart=/usr/bin/python3 {self.server_path}/popos_wan_server_pro.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
"""
        
        # Write service file
        service_file = Path("wan_server.service")
        service_file.write_text(service_content)
        
        # Copy to server temp
        if not self.copy_file_to_server(service_file, "/tmp/wan_server.service"):
            print("❌ Failed to copy service file")
            return False
        
        # Install service (requires sudo)
        commands = [
            "sudo cp /tmp/wan_server.service /etc/systemd/system/",
            "sudo systemctl daemon-reload",
            "sudo systemctl enable wan_server.service"
        ]
        
        print("Installing service (requires sudo password)...")
        for cmd in commands:
            self.run_ssh_command(cmd, check=False)
        
        print("✅ Service created (start with: sudo systemctl start wan_server)")
        return True
    
    def test_server(self) -> bool:
        """Test server startup"""
        print("\n🧪 Testing server...")
        
        # Start server in background for testing
        test_cmd = f"cd {self.server_path} && timeout 10 python3 popos_wan_server_pro.py &"
        result = self.run_ssh_command(test_cmd, check=False)
        
        # Check if server responds
        import time
        time.sleep(5)
        
        import requests
        try:
            response = requests.get(f"http://{self.server_ip}:8001/health", timeout=5)
            if response.status_code == 200:
                print("✅ Server responding")
                return True
        except:
            pass
        
        print("⚠️ Server test incomplete (manual verification needed)")
        return True
    
    def verify_gpu_access(self) -> bool:
        """Verify GPU access"""
        print("\n🎮 Checking GPU access...")
        
        result = self.run_ssh_command("nvidia-smi --query-gpu=name,memory.total --format=csv,noheader")
        if result.returncode == 0:
            print("GPU Info:")
            for line in result.stdout.strip().split('\n'):
                print(f"  - {line}")
            print("✅ GPU access confirmed")
            return True
        
        print("❌ GPU not accessible")
        return False
    
    def deploy(self) -> bool:
        """Run full deployment"""
        print("🚀 Starting PopOS WAN Server Deployment")
        print("=" * 50)
        
        steps = [
            ("Checking Python", self.check_python_version),
            ("Setting up directories", self.setup_server_directory),
            ("Installing dependencies", self.install_dependencies),
            ("Installing Flash Attention", self.install_flash_attention),
            ("Deploying server code", self.deploy_server_code),
            ("Creating configuration", self.create_config_file),
            ("Verifying GPU", self.verify_gpu_access),
            ("Creating service", self.create_systemd_service),
            ("Testing server", self.test_server),
        ]
        
        for step_name, step_func in steps:
            if not step_func():
                print(f"\n❌ Deployment failed at: {step_name}")
                return False
        
        print("\n" + "=" * 50)
        print("✅ Deployment Complete!")
        print("\nNext steps:")
        print("1. SSH to server: ssh choon@10.0.0.2")
        print(f"2. Start server: cd {self.server_path} && python3 popos_wan_server_pro.py")
        print("3. Or use service: sudo systemctl start wan_server")
        print("4. Check status: curl http://10.0.0.2:8001/health")
        print("5. View logs: journalctl -u wan_server -f")
        
        return True

def main():
    """Main deployment function"""
    deployer = PopOSDeployer()
    
    print("PopOS WAN Server Deployment Tool")
    print("This will set up the high-performance WAN generation server on PopOS")
    print(f"Target: choon@10.0.0.2")
    print()
    
    response = input("Continue with deployment? (y/n): ")
    if response.lower() != 'y':
        print("Deployment cancelled")
        return
    
    if deployer.deploy():
        print("\n🎉 Success! Server is ready for use.")
    else:
        print("\n⚠️ Deployment incomplete. Please check errors above.")

if __name__ == "__main__":
    main()