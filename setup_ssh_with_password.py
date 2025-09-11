#!/usr/bin/env python3
"""
SSH Key Setup with Password Authentication
"""
import subprocess
import sys
from pathlib import Path

def copy_ssh_key_with_echo():
    """Copy SSH key using echo to provide password"""
    
    # Configuration
    host = "10.0.0.2"
    user = "choon"
    
    # Read public key
    ssh_dir = Path.home() / ".ssh"
    pub_key_file = ssh_dir / "popos_rsa.pub"
    
    if not pub_key_file.exists():
        print(f"[ERROR] Public key not found: {pub_key_file}")
        return False
    
    with open(pub_key_file, 'r') as f:
        pub_key = f.read().strip()
    
    print("[INFO] SSH Public Key found:")
    print(pub_key[:50] + "...")
    
    # Create a batch script that will handle the SSH key copy
    batch_content = f'''@echo off
echo [INFO] Copying SSH key to PopOS server...
echo.
echo You will be prompted for password.
echo Password is: Jiyeon71391796!
echo.

REM Create .ssh directory on remote
ssh {user}@{host} "mkdir -p ~/.ssh && chmod 700 ~/.ssh"

REM Copy the public key
echo {pub_key} | ssh {user}@{host} "cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo SSH key added successfully"

echo.
echo [INFO] Testing connection...
ssh -i "{ssh_dir}\\popos_rsa" -o BatchMode=yes {user}@{host} "echo Connection successful"

if errorlevel 1 (
    echo [WARNING] Passwordless connection not working yet
    echo Please try running this script again
) else (
    echo [SUCCESS] Passwordless SSH is now configured!
)
'''
    
    # Save batch file
    batch_file = Path("run_ssh_setup.bat")
    with open(batch_file, 'w') as f:
        f.write(batch_content)
    
    print(f"\n[INFO] Batch file created: {batch_file}")
    print("\n" + "="*60)
    print("INSTRUCTIONS:")
    print("="*60)
    print("1. Run the batch file: run_ssh_setup.bat")
    print("2. When prompted for password, enter: Jiyeon71391796!")
    print("3. You may need to enter it twice")
    print("\nOr run this PowerShell command directly:")
    print(f'\necho "{pub_key}" | ssh {user}@{host} "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"')
    print("\nThen test with:")
    print(f'ssh -i C:\\Users\\choon\\.ssh\\popos_rsa {user}@{host} "echo Success"')
    
    return True

if __name__ == "__main__":
    copy_ssh_key_with_echo()