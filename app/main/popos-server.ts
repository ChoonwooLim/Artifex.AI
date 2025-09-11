import { exec } from 'child_process';
import { promisify } from 'util';
import { ipcMain } from 'electron';

const execAsync = promisify(exec);

export class PopOSServerManager {
  private serverPID: string | null = null;
  private isRunning: boolean = false;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private retryDelay: number = 2000;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  async startServer(): Promise<{ success: boolean; message: string }> {
    // Reset retry count
    this.retryCount = 0;
    
    // First check if server is already running
    const status = await this.checkStatus();
    if (status.running) {
      this.isRunning = true;
      this.startHealthCheck();
      return { success: true, message: 'PopOS server is already running' };
    }
    
    // Try to start the server with retries
    while (this.retryCount < this.maxRetries) {
      try {
        this.retryCount++;
        
        // Kill any existing process first
        await this.killExistingProcess();
        
        // SSH로 서버 시작 (백그라운드)
        const command = `ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no stevenlim@10.0.0.2 "nohup python3 ~/popos_worker.py > ~/popos_worker.log 2>&1 & echo \\$!"`;
        const { stdout } = await execAsync(command);
        
        this.serverPID = stdout.trim();
        
        // Wait for server to start with progressive delays
        const waitTime = 2000 + (this.retryCount * 1000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Test connection with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        try {
          const testResponse = await fetch('http://10.0.0.2:8000/', {
            signal: controller.signal
          });
          clearTimeout(timeout);
          
          if (testResponse.ok) {
            this.isRunning = true;
            this.startHealthCheck();
            return { success: true, message: `PopOS server started successfully (attempt ${this.retryCount})` };
          }
        } catch (fetchError) {
          clearTimeout(timeout);
          if (this.retryCount === this.maxRetries) {
            throw fetchError;
          }
        }
        
        // If not last retry, wait before next attempt
        if (this.retryCount < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
        
      } catch (error: any) {
        if (this.retryCount === this.maxRetries) {
          this.isRunning = false;
          return { 
            success: false, 
            message: `Failed to start server after ${this.retryCount} attempts: ${error.message}` 
          };
        }
      }
    }
    
    return { success: false, message: 'Server started but not responding after all retries' };
  }
  
  private async killExistingProcess(): Promise<void> {
    try {
      await execAsync(`ssh -o ConnectTimeout=5 stevenlim@10.0.0.2 "pkill -f popos_worker.py || true"`);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch {
      // Ignore errors - process might not exist
    }
  }
  
  private startHealthCheck(): void {
    // Clear existing interval if any
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Check server health every 60 seconds
    this.healthCheckInterval = setInterval(async () => {
      const status = await this.checkStatus();
      if (!status.running && this.isRunning) {
        console.log('PopOS server became unresponsive, attempting restart...');
        this.isRunning = false;
        // Optionally auto-restart
        // await this.startServer();
      }
    }, 60000);
  }
  
  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  async stopServer(): Promise<{ success: boolean; message: string }> {
    try {
      // Stop health check
      this.stopHealthCheck();
      
      // 서버 종료
      const command = `ssh -o ConnectTimeout=5 stevenlim@10.0.0.2 "pkill -f popos_worker.py"`;
      await execAsync(command);
      
      this.isRunning = false;
      this.serverPID = null;
      
      return { success: true, message: 'PopOS server stopped' };
    } catch (error: any) {
      this.isRunning = false;
      this.serverPID = null;
      return { success: false, message: `Failed to stop server: ${error.message}` };
    }
  }

  async checkStatus(): Promise<{ running: boolean; gpuInfo?: any; error?: string }> {
    try {
      const response = await fetch('http://10.0.0.2:8000/gpu/info', { 
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        this.isRunning = true;
        return { running: true, gpuInfo: data };
      }
      
      return { running: false, error: `Server responded with status ${response.status}` };
    } catch (error: any) {
      this.isRunning = false;
      
      // Distinguish between different error types
      if (error.name === 'AbortError') {
        return { running: false, error: 'Connection timeout - server may be starting up' };
      } else if (error.code === 'ECONNREFUSED') {
        return { running: false, error: 'Connection refused - server not running' };
      } else if (error.code === 'ENETUNREACH') {
        return { running: false, error: 'Network unreachable - check connection to 10.0.0.2' };
      }
      
      return { running: false, error: error.message || 'Unknown error' };
    }
  }

  getStatus(): boolean {
    return this.isRunning;
  }
}

// IPC 핸들러 등록
export function registerPopOSHandlers() {
  const serverManager = new PopOSServerManager();

  ipcMain.handle('popos:start', async () => {
    return await serverManager.startServer();
  });

  ipcMain.handle('popos:stop', async () => {
    return await serverManager.stopServer();
  });

  ipcMain.handle('popos:status', async () => {
    return await serverManager.checkStatus();
  });

  // 앱 종료 시 서버도 종료
  ipcMain.on('before-quit', async () => {
    if (serverManager.getStatus()) {
      await serverManager.stopServer();
    }
  });
}