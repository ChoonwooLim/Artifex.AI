#!/usr/bin/env python3
import socket
import urllib.request
import json
import sys

def test_ping(host):
    """Test if host is reachable"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex((host, 8000))
        sock.close()
        return result == 0
    except:
        return False

def test_http(url):
    """Test HTTP connection"""
    try:
        with urllib.request.urlopen(url, timeout=3) as response:
            data = json.loads(response.read().decode())
            return True, data
    except Exception as e:
        return False, str(e)

def main():
    print("=" * 50)
    print("PopOS Worker Connection Test")
    print("=" * 50)
    
    # Test IPs
    test_ips = [
        ("10.0.0.2", "Fixed IP (PopOS)"),
        ("localhost", "Localhost"),
        ("127.0.0.1", "Loopback")
    ]
    
    for ip, desc in test_ips:
        print(f"\nTesting {desc} ({ip})...")
        print("-" * 30)
        
        # Port test
        if test_ping(ip):
            print(f"[OK] Port 8000 is OPEN on {ip}")
            
            # HTTP test
            url = f"http://{ip}:8000/"
            success, result = test_http(url)
            
            if success:
                print(f"[OK] HTTP connection successful!")
                print(f"   Response: {json.dumps(result, indent=2)}")
                
                # GPU info test
                gpu_url = f"http://{ip}:8000/gpu/info"
                gpu_success, gpu_data = test_http(gpu_url)
                if gpu_success:
                    print(f"[OK] GPU info retrieved:")
                    print(f"   {json.dumps(gpu_data, indent=2)}")
            else:
                print(f"[FAIL] HTTP connection failed: {result}")
        else:
            print(f"[FAIL] Port 8000 is CLOSED on {ip}")
    
    print("\n" + "=" * 50)
    print("Test complete!")
    print("=" * 50)

if __name__ == "__main__":
    main()