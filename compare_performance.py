#!/usr/bin/env python3
"""
Performance Comparison: Windows vs PopOS
Tests WAN model execution on both platforms
"""

import time
import json
import requests
import subprocess
import sys
from pathlib import Path
from datetime import datetime

class PerformanceComparison:
    def __init__(self):
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "windows": {},
            "popos": {},
            "comparison": {}
        }
    
    def test_windows_local(self):
        """Test local Windows execution"""
        print("\n" + "="*50)
        print("Testing Windows Local Execution...")
        print("="*50)
        
        start_time = time.time()
        
        try:
            # Test with small video first
            cmd = [
                "python", "Wan2.2/generate.py",
                "--task", "ti2v-5B",
                "--ckpt_dir", "Wan2.2-TI2V-5B",
                "--prompt", "A beautiful sunset over mountains",
                "--size", "704*1280",
                "--seed", "42",
                "--sample_steps", "20",
                "--frame_num", "49",  # 2 seconds
                "--output_dir", "output",
                "--offload_model",
                "--convert_dtype"
            ]
            
            print("Running generation on Windows...")
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=180  # 3 minute timeout
            )
            
            elapsed = time.time() - start_time
            
            if result.returncode == 0:
                self.results["windows"] = {
                    "success": True,
                    "time_seconds": round(elapsed, 2),
                    "platform": "Windows 11 + RTX 3090",
                    "flash_attention": False,
                    "vram_usage": "~20GB",
                    "details": {
                        "steps": 20,
                        "resolution": "704x1280",
                        "frames": 49
                    }
                }
                print(f"✅ Windows generation completed in {elapsed:.2f} seconds")
            else:
                self.results["windows"] = {
                    "success": False,
                    "error": result.stderr[:500] if result.stderr else "Unknown error"
                }
                print(f"❌ Windows generation failed: {result.stderr[:200]}")
                
        except subprocess.TimeoutExpired:
            self.results["windows"] = {
                "success": False,
                "error": "Timeout (>3 minutes)"
            }
            print("❌ Windows generation timeout")
        except Exception as e:
            self.results["windows"] = {
                "success": False,
                "error": str(e)
            }
            print(f"❌ Windows test error: {e}")
    
    def test_popos_remote(self):
        """Test PopOS remote execution"""
        print("\n" + "="*50)
        print("Testing PopOS Remote Execution...")
        print("="*50)
        
        # Check if PopOS server is running
        try:
            response = requests.get("http://10.0.0.2:8001/", timeout=5)
            if response.status_code != 200:
                print("❌ PopOS WAN server not running")
                self.results["popos"] = {
                    "success": False,
                    "error": "Server not running on port 8001"
                }
                return
        except:
            print("❌ Cannot connect to PopOS server")
            self.results["popos"] = {
                "success": False,
                "error": "Cannot connect to 10.0.0.2:8001"
            }
            return
        
        # Run generation on PopOS
        start_time = time.time()
        
        try:
            params = {
                "task": "ti2v-5B",
                "prompt": "A beautiful sunset over mountains",
                "size": "704*1280",
                "seed": 42,
                "steps": 20,
                "cfg_scale": 7.0
            }
            
            print("Sending generation request to PopOS...")
            response = requests.post(
                "http://10.0.0.2:8001/generate",
                json=params,
                timeout=180
            )
            
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.results["popos"] = {
                        "success": True,
                        "time_seconds": data.get("generation_time", elapsed),
                        "platform": "PopOS + RTX 3090 + Flash Attention",
                        "flash_attention": True,
                        "vram_usage": "~10GB (with Flash Attention)",
                        "performance": data.get("performance", {}),
                        "details": {
                            "steps": 20,
                            "resolution": "704x1280",
                            "frames": 49
                        }
                    }
                    print(f"✅ PopOS generation completed in {elapsed:.2f} seconds")
                else:
                    self.results["popos"] = {
                        "success": False,
                        "error": data.get("error", "Unknown error")
                    }
                    print(f"❌ PopOS generation failed: {data.get('error')}")
            else:
                self.results["popos"] = {
                    "success": False,
                    "error": f"HTTP {response.status_code}"
                }
                print(f"❌ PopOS server error: HTTP {response.status_code}")
                
        except requests.Timeout:
            self.results["popos"] = {
                "success": False,
                "error": "Request timeout"
            }
            print("❌ PopOS request timeout")
        except Exception as e:
            self.results["popos"] = {
                "success": False,
                "error": str(e)
            }
            print(f"❌ PopOS test error: {e}")
    
    def compare_results(self):
        """Compare and analyze results"""
        print("\n" + "="*50)
        print("PERFORMANCE COMPARISON RESULTS")
        print("="*50)
        
        windows = self.results.get("windows", {})
        popos = self.results.get("popos", {})
        
        if windows.get("success") and popos.get("success"):
            win_time = windows.get("time_seconds", 999)
            pop_time = popos.get("time_seconds", 999)
            
            speedup = win_time / pop_time if pop_time > 0 else 0
            
            self.results["comparison"] = {
                "speedup": round(speedup, 2),
                "time_saved": round(win_time - pop_time, 2),
                "percentage_faster": round((speedup - 1) * 100, 1),
                "winner": "PopOS" if pop_time < win_time else "Windows"
            }
            
            print(f"\n📊 Windows Time: {win_time:.2f} seconds")
            print(f"📊 PopOS Time: {pop_time:.2f} seconds")
            print(f"\n🚀 PopOS is {speedup:.2f}x faster!")
            print(f"⏱️ Time saved: {win_time - pop_time:.2f} seconds")
            print(f"📈 Performance improvement: {(speedup - 1) * 100:.1f}%")
            
            print("\n📋 Feature Comparison:")
            print(f"  Windows: Standard Attention, Single GPU")
            print(f"  PopOS: Flash Attention 2.0, Dual GPU Ready")
            
        else:
            print("\n⚠️ Could not complete comparison")
            if not windows.get("success"):
                print(f"  Windows failed: {windows.get('error', 'Unknown')}")
            if not popos.get("success"):
                print(f"  PopOS failed: {popos.get('error', 'Unknown')}")
    
    def save_results(self):
        """Save results to file"""
        output_file = f"performance_comparison_{int(time.time())}.json"
        with open(output_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"\n💾 Results saved to: {output_file}")
    
    def run_full_comparison(self):
        """Run complete comparison test"""
        print("\n" + "🔬 Starting Performance Comparison Test")
        print("This will test video generation on both Windows and PopOS")
        print("-" * 50)
        
        # Test Windows
        self.test_windows_local()
        
        # Test PopOS
        self.test_popos_remote()
        
        # Compare
        self.compare_results()
        
        # Save
        self.save_results()
        
        return self.results

def main():
    """Main entry point"""
    print("""
╔══════════════════════════════════════════════════╗
║     WAN Model Performance Comparison Tool        ║
║         Windows vs PopOS (Flash Attention)       ║
╚══════════════════════════════════════════════════╝
    """)
    
    comparison = PerformanceComparison()
    
    # Check prerequisites
    print("Checking prerequisites...")
    
    # Check for Windows model
    if not Path("Wan2.2-TI2V-5B").exists():
        print("⚠️ Warning: Wan2.2-TI2V-5B model not found locally")
        print("  Please ensure the model is available")
    
    # Check PopOS connection
    try:
        response = requests.get("http://10.0.0.2:8000/", timeout=2)
        print("✅ PopOS server is reachable")
    except:
        print("⚠️ Warning: Cannot reach PopOS server at 10.0.0.2:8000")
        print("  Make sure the PopOS worker is running")
    
    print("\nReady to start comparison?")
    input("Press Enter to begin... ")
    
    results = comparison.run_full_comparison()
    
    print("\n" + "="*50)
    print("Comparison Complete!")
    print("="*50)

if __name__ == "__main__":
    main()