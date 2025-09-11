#!/usr/bin/env python3
"""
SSH Key Setup Script for PopOS Server
Sets up passwordless SSH authentication between Windows and PopOS
"""

import os
import sys
import subprocess
import platform
from pathlib import Path
import shutil

def run_command(cmd, shell=True, capture_output=True):
    """Run a command and return the result"""
    try:
        result = subprocess.run(cmd, shell=shell, capture_output=capture_output, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def setup_ssh_keys():
    """Set up SSH keys for passwordless authentication"""
    print("Setting up SSH keys for PopOS server...")
    
    # Determine SSH directory based on platform
    if platform.system() == "Windows":
        ssh_dir = Path.home() / ".ssh"
    else:
        ssh_dir = Path.home() / ".ssh"
    
    ssh_dir.mkdir(exist_ok=True)
    
    # Key file paths
    key_file = ssh_dir / "popos_rsa"
    pub_key_file = ssh_dir / "popos_rsa.pub"
    
    # Check if keys already exist
    if key_file.exists() and pub_key_file.exists():
        print("[OK] SSH keys already exist")
        response = input("Do you want to regenerate them? (y/N): ").lower()
        if response != 'y':
            return str(key_file), str(pub_key_file)
    
    # Generate SSH key pair
    print("Generating SSH key pair...")
    if platform.system() == "Windows":
        # Use ssh-keygen on Windows
        cmd = f'ssh-keygen -t rsa -b 4096 -f "{key_file}" -N "" -C "artifex@windows"'
    else:
        cmd = f'ssh-keygen -t rsa -b 4096 -f {key_file} -N "" -C "artifex@windows"'
    
    success, stdout, stderr = run_command(cmd)
    if not success:
        print(f"[ERROR] Failed to generate SSH keys: {stderr}")
        return None, None
    
    print("[OK] SSH keys generated successfully")
    
    # Set correct permissions on Windows
    if platform.system() == "Windows":
        # Windows requires special permissions handling
        import win32security
        import ntsecuritycon as con
        
        try:
            # Get current user SID
            username = os.environ.get('USERNAME')
            domain = os.environ.get('USERDOMAIN', '')
            
            # Set permissions to be readable only by current user
            sd = win32security.GetFileSecurity(str(key_file), win32security.DACL_SECURITY_INFORMATION)
            dacl = win32security.ACL()
            
            # Get user SID
            user_sid = win32security.LookupAccountName(domain, username)[0]
            
            # Grant full control to current user only
            dacl.AddAccessAllowedAce(win32security.ACL_REVISION, con.FILE_ALL_ACCESS, user_sid)
            
            sd.SetSecurityDescriptorDacl(1, dacl, 0)
            win32security.SetFileSecurity(str(key_file), win32security.DACL_SECURITY_INFORMATION, sd)
            print("[OK] Set correct permissions on private key")
        except:
            # Fallback for systems without pywin32
            print("[WARNING] Could not set Windows permissions (pywin32 not available)")
            print("   Please manually set permissions on the private key file")
    else:
        # Unix-like systems
        os.chmod(key_file, 0o600)
    
    return str(key_file), str(pub_key_file)

def copy_key_to_popos(pub_key_file, host="10.0.0.2", user="stevenlim"):
    """Copy public key to PopOS server"""
    print(f"\nCopying public key to PopOS server ({user}@{host})...")
    
    # Read public key
    with open(pub_key_file, 'r') as f:
        pub_key = f.read().strip()
    
    print("\n[INFO] You will be prompted for the PopOS password ONE LAST TIME")
    print("After this, SSH access will be passwordless!\n")
    
    # Use ssh-copy-id if available
    if platform.system() != "Windows" or shutil.which("ssh-copy-id"):
        cmd = f'ssh-copy-id -i "{pub_key_file}" {user}@{host}'
        success, stdout, stderr = run_command(cmd, capture_output=False)
        if success:
            print("[OK] Public key copied successfully")
            return True
    
    # Manual method for Windows or if ssh-copy-id is not available
    print("Using manual method to copy SSH key...")
    
    # Create .ssh directory on remote if it doesn't exist
    cmd = f'ssh {user}@{host} "mkdir -p ~/.ssh && chmod 700 ~/.ssh"'
    os.system(cmd)
    
    # Append key to authorized_keys
    cmd = f'echo "{pub_key}" | ssh {user}@{host} "cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"'
    result = os.system(cmd)
    
    if result == 0:
        print("[OK] Public key copied successfully")
        return True
    else:
        print("[ERROR] Failed to copy public key")
        print("\nManual instructions:")
        print(f"1. Copy the following public key:")
        print(f"   {pub_key}")
        print(f"2. SSH to PopOS: ssh {user}@{host}")
        print(f"3. Add the key to ~/.ssh/authorized_keys")
        return False

def test_connection(key_file, host="10.0.0.2", user="stevenlim"):
    """Test passwordless SSH connection"""
    print(f"\nTesting passwordless connection to {user}@{host}...")
    
    cmd = f'ssh -i "{key_file}" -o BatchMode=yes -o ConnectTimeout=5 {user}@{host} "echo Connection successful"'
    success, stdout, stderr = run_command(cmd)
    
    if success and "Connection successful" in stdout:
        print("[OK] Passwordless SSH connection successful!")
        return True
    else:
        print(f"[ERROR] Connection test failed: {stderr}")
        return False

def create_ssh_config(key_file, host="10.0.0.2", user="stevenlim"):
    """Create SSH config entry for easy access"""
    ssh_dir = Path.home() / ".ssh"
    config_file = ssh_dir / "config"
    
    print("\nCreating SSH config entry...")
    
    config_entry = f"""
# PopOS GPU Server
Host popos
    HostName {host}
    User {user}
    IdentityFile {key_file}
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
"""
    
    # Check if entry already exists
    if config_file.exists():
        with open(config_file, 'r') as f:
            existing = f.read()
            if "Host popos" in existing:
                print("[OK] SSH config entry already exists")
                return
    
    # Append to config
    with open(config_file, 'a') as f:
        f.write(config_entry)
    
    print("[OK] SSH config entry created")
    print("   You can now connect using: ssh popos")

def main():
    print("=" * 60)
    print("PopOS SSH Key Setup for Artifex.AI")
    print("=" * 60)
    
    # Setup SSH keys
    key_file, pub_key_file = setup_ssh_keys()
    if not key_file:
        print("\n[ERROR] SSH key setup failed")
        sys.exit(1)
    
    # Copy to PopOS
    if copy_key_to_popos(pub_key_file):
        # Test connection
        if test_connection(key_file):
            # Create SSH config
            create_ssh_config(key_file)
            
            print("\n" + "=" * 60)
            print("[SUCCESS] SSH Setup Complete!")
            print("=" * 60)
            print("\nYou can now:")
            print("1. Connect without password: ssh popos")
            print("2. The Artifex.AI app will automatically start the PopOS server")
            print("\nKey locations:")
            print(f"  Private key: {key_file}")
            print(f"  Public key:  {pub_key_file}")
        else:
            print("\n[WARNING] Setup completed but connection test failed")
            print("Please check your network connection and try again")
    else:
        print("\n[ERROR] Failed to copy key to PopOS")
        print("Please follow the manual instructions above")

if __name__ == "__main__":
    main()