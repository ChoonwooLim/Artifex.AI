import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const execAsync = promisify(exec);

export class PopOSServerManager {
  private serverPID: string | null = null;
  private isRunning: boolean = false;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private retryDelay: number = 2000;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private autoStartEnabled: boolean = true;
  private sshKeyPath: string;
  private sshUser: string = 'stevenlim';
  private sshHost: string = '10.0.0.2';
  private serverScript: string = '~/wan_server/popos_wan_server_pro.py';

  constructor() {
    // Check for SSH key
    const homeDir = os.homedir();
    this.sshKeyPath = path.join(homeDir, '.ssh', 'popos_rsa');
    
    // Check if SSH key exists, if not use config alias
    if (!fs.existsSync(this.sshKeyPath)) {
      console.log('SSH key not found, will use SSH config alias "popos"');
      this.sshKeyPath = '';
    }
  }

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
        const sshCmd = this.sshKeyPath 
          ? `ssh -i "${this.sshKeyPath}" -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o PasswordAuthentication=no ${this.sshUser}@${this.sshHost}`
          : `ssh popos`;
        
        const command = `${sshCmd} "cd ~/wan_server && nohup python3 popos_wan_server_pro.py > ~/popos_wan_server.log 2>&1 & echo \\$!"`;
        console.log('Starting PopOS server with command:', command);
        const { stdout } = await execAsync(command);
        
        this.serverPID = stdout.trim();
        
        // Wait for server to start with progressive delays
        const waitTime = 2000 + (this.retryCount * 1000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Test connection with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        try {
          const testResponse = await fetch('http://10.0.0.2:8001/', {
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
      const sshCmd = this.sshKeyPath 
        ? `ssh -i "${this.sshKeyPath}" -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o PasswordAuthentication=no ${this.sshUser}@${this.sshHost}`
        : `ssh popos`;
      
      await execAsync(`${sshCmd} "pkill -f popos_wan_server_pro.py || true"`);
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
      const sshCmd = this.sshKeyPath 
        ? `ssh -i "${this.sshKeyPath}" -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o PasswordAuthentication=no ${this.sshUser}@${this.sshHost}`
        : `ssh popos`;
      
      const command = `${sshCmd} "pkill -f popos_wan_server_pro.py"`;
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
      const response = await fetch('http://10.0.0.2:8001/system/status', { 
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

  async enableAutoStart(enabled: boolean): Promise<void> {
    this.autoStartEnabled = enabled;
    console.log(`PopOS server auto-start ${enabled ? 'enabled' : 'disabled'}`);
  }

  async autoStart(): Promise<void> {
    if (!this.autoStartEnabled) {
      console.log('PopOS server auto-start is disabled');
      return;
    }

    console.log('Auto-starting PopOS server...');
    const result = await this.startServer();
    if (result.success) {
      console.log('PopOS server auto-started successfully');
    } else {
      console.error('Failed to auto-start PopOS server:', result.message);
    }
  }

  async ensureSSHKey(): Promise<boolean> {
    // Check if SSH key exists
    if (fs.existsSync(this.sshKeyPath)) {
      return true;
    }

    // Check if SSH config alias exists
    const configPath = path.join(os.homedir(), '.ssh', 'config');
    if (fs.existsSync(configPath)) {
      const config = fs.readFileSync(configPath, 'utf-8');
      if (config.includes('Host popos')) {
        return true;
      }
    }

    console.warn('SSH key not found. Please run setup_ssh_keys.py to configure passwordless authentication.');
    return false;
  }
}

// IPC 핸들러 등록
export function registerPopOSHandlers(): PopOSServerManager {
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

  ipcMain.handle('popos:setAutoStart', async (_, enabled: boolean) => {
    await serverManager.enableAutoStart(enabled);
    return { success: true };
  });

  ipcMain.handle('popos:ensureSSHKey', async () => {
    return await serverManager.ensureSSHKey();
  });

  // 앱 종료 시 서버도 종료
  ipcMain.on('before-quit', async () => {
    if (serverManager.getStatus()) {
      console.log('Stopping PopOS server before quit...');
      await serverManager.stopServer();
    }
  });

  return serverManager;
}