#!/usr/bin/env python3
"""
Automated SSH key setup for PopOS server
"""
import os
import subprocess
import sys
from pathlib import Path

def setup_ssh_key():
    """Copy SSH public key to PopOS server"""
    
    # Configuration
    host = "10.0.0.2"
    user = "choon"
    password = "Jiyeon71391796!"
    
    # SSH key paths
    ssh_dir = Path.home() / ".ssh"
    pub_key_file = ssh_dir / "popos_rsa.pub"
    
    # Check if public key exists
    if not pub_key_file.exists():
        print(f"[ERROR] Public key not found: {pub_key_file}")
        return False
    
    # Read public key
    with open(pub_key_file, 'r') as f:
        pub_key = f.read().strip()
    
    print(f"[INFO] Copying SSH key to {user}@{host}...")
    
    # Create SSH command to add key
    ssh_commands = [
        "mkdir -p ~/.ssh",
        "chmod 700 ~/.ssh",
        f"echo '{pub_key}' >> ~/.ssh/authorized_keys",
        "chmod 600 ~/.ssh/authorized_keys",
        "echo 'SSH key added successfully'"
    ]
    
    # Combine commands
    remote_command = " && ".join(ssh_commands)
    
    # Use PowerShell to run SSH with password (using echo for password input)
    ps_script = f'''
    $password = "{password}"
    $command = "ssh {user}@{host} '{remote_command}'"
    
    # Create a process to run SSH
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "ssh"
    $psi.Arguments = "{user}@{host} `"{remote_command}`""
    $psi.UseShellExecute = $false
    $psi.RedirectStandardInput = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    
    $process = [System.Diagnostics.Process]::Start($psi)
    
    # Send password when prompted
    Start-Sleep -Milliseconds 500
    $process.StandardInput.WriteLine($password)
    $process.StandardInput.Close()
    
    # Wait for completion
    $process.WaitForExit()
    
    # Get output
    $output = $process.StandardOutput.ReadToEnd()
    $error = $process.StandardError.ReadToEnd()
    
    if ($process.ExitCode -eq 0) {{
        Write-Host "[OK] SSH key copied successfully"
        Write-Host $output
    }} else {{
        Write-Host "[ERROR] Failed to copy SSH key"
        Write-Host $error
    }}
    
    exit $process.ExitCode
    '''
    
    # Save PowerShell script
    ps_file = Path("setup_ssh_temp.ps1")
    with open(ps_file, 'w') as f:
        f.write(ps_script)
    
    try:
        # Execute PowerShell script
        result = subprocess.run(
            ["powershell", "-ExecutionPolicy", "Bypass", "-File", str(ps_file)],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        print(result.stdout)
        if result.stderr:
            print(result.stderr)
        
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print("[ERROR] Command timed out")
        return False
    finally:
        # Clean up temp file
        if ps_file.exists():
            ps_file.unlink()

def test_passwordless_connection():
    """Test if passwordless SSH works"""
    print("\n[INFO] Testing passwordless SSH connection...")
    
    key_file = Path.home() / ".ssh" / "popos_rsa"
    cmd = f'ssh -i "{key_file}" -o BatchMode=yes -o ConnectTimeout=5 choon@10.0.0.2 "echo Connection successful"'
    
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
    
    if result.returncode == 0 and "Connection successful" in result.stdout:
        print("[OK] Passwordless SSH connection successful!")
        return True
    else:
        print(f"[ERROR] Connection failed: {result.stderr}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Automated SSH Setup for PopOS")
    print("=" * 60)
    
    if setup_ssh_key():
        if test_passwordless_connection():
            print("\n[SUCCESS] SSH setup complete!")
            print("You can now connect without password: ssh choon@10.0.0.2")
        else:
            print("\n[WARNING] Key copied but connection test failed")
    else:
        print("\n[ERROR] Failed to copy SSH key")