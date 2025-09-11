/**
 * PopOS Model Service
 * Handles communication with high-performance PopOS WAN server
 */

import { io, Socket } from 'socket.io-client';
import axios, { AxiosInstance } from 'axios';

export interface GenerationRequest {
  prompt: string;
  negative_prompt?: string;
  model: 'T2V-A14B' | 'I2V-A14B' | 'TI2V-5B' | 'S2V-14B';
  quality: 'draft' | 'standard' | 'pro' | 'cinema' | 'ultimate';
  options?: {
    steps?: number;
    cfg_scale?: number;
    resolution?: string;
    fps?: number;
    duration?: number;
    seed?: number;
  };
  image?: string; // Base64 encoded for I2V
  audio?: string; // Base64 encoded for S2V
}

export interface GenerationResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  created_at: string;
  eta_seconds: number;
  queue_position?: number;
}

export interface JobStatus {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  eta: number;
  current_step?: number;
  total_steps?: number;
  preview_url?: string;
  output_url?: string;
  error?: string;
}

export interface GPUInfo {
  gpus: Array<{
    id: number;
    name: string;
    memory_total: number;
    memory_free: number;
    memory_used: number;
    utilization: number;
    temperature: number;
  }>;
  total_memory: number;
  total_free: number;
}

export interface FlashStatus {
  flash_attn: boolean;
  xformers: boolean;
  version?: string;
  cuda_version?: string;
}

interface ModelInfo {
  name: string;
  type: string;
  loaded: boolean;
  memory_usage?: number;
}

class PopOSModelService {
  private apiClient: AxiosInstance;
  private socket: Socket | null = null;
  private serverUrl: string;
  private wsUrl: string;
  private connected: boolean = false;
  private jobCallbacks: Map<string, (status: JobStatus) => void> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(serverUrl: string = 'http://10.0.0.2:8001') {
    this.serverUrl = serverUrl;
    this.wsUrl = serverUrl.replace('http', 'ws');
    
    this.apiClient = axios.create({
      baseURL: `${serverUrl}/api/v1`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Auto-connect on initialization
    this.connect();
  }

  /**
   * Connect to PopOS server WebSocket
   */
  public connect(): void {
    if (this.socket?.connected) {
      console.log('Already connected to PopOS server');
      return;
    }

    console.log(`Connecting to PopOS server at ${this.wsUrl}`);
    
    this.socket = io(this.wsUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to PopOS WAN server');
      this.connected = true;
      this.clearReconnectTimer();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from PopOS server');
      this.connected = false;
      this.scheduleReconnect();
    });

    this.socket.on('progress', (data: any) => {
      const callback = this.jobCallbacks.get(data.job_id);
      if (callback) {
        callback({
          job_id: data.job_id,
          status: 'processing',
          progress: data.progress,
          eta: data.eta,
          current_step: data.current_step,
          total_steps: data.total_steps,
        });
      }
    });

    this.socket.on('preview', (data: any) => {
      const callback = this.jobCallbacks.get(data.job_id);
      if (callback) {
        callback({
          job_id: data.job_id,
          status: 'processing',
          progress: data.progress || 0,
          eta: data.eta || 0,
          preview_url: data.frame_url,
        });
      }
    });

    this.socket.on('complete', (data: any) => {
      const callback = this.jobCallbacks.get(data.job_id);
      if (callback) {
        callback({
          job_id: data.job_id,
          status: 'completed',
          progress: 1,
          eta: 0,
          output_url: data.output_url,
        });
        this.jobCallbacks.delete(data.job_id);
      }
    });

    this.socket.on('error', (data: any) => {
      const callback = this.jobCallbacks.get(data.job_id);
      if (callback) {
        callback({
          job_id: data.job_id,
          status: 'failed',
          progress: 0,
          eta: 0,
          error: data.error,
        });
        this.jobCallbacks.delete(data.job_id);
      }
    });
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    
    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect to PopOS server...');
      this.connect();
    }, 5000);
  }

  /**
   * Clear reconnection timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Disconnect from server
   */
  public disconnect(): void {
    this.clearReconnectTimer();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
    this.jobCallbacks.clear();
  }

  /**
   * Check server health
   */
  public async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.serverUrl}/health`);
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Get GPU information
   */
  public async getGPUInfo(): Promise<GPUInfo> {
    const response = await this.apiClient.get<GPUInfo>('/gpu/info');
    return response.data;
  }

  /**
   * Get Flash Attention status
   */
  public async getFlashStatus(): Promise<FlashStatus> {
    const response = await this.apiClient.get<FlashStatus>('/flash/status');
    return response.data;
  }

  /**
   * Get available models
   */
  public async getModels(): Promise<{ models: ModelInfo[] }> {
    const response = await this.apiClient.get<{ models: ModelInfo[] }>('/models');
    return response.data;
  }

  /**
   * Submit generation request
   */
  public async generate(
    request: GenerationRequest,
    onProgress?: (status: JobStatus) => void
  ): Promise<GenerationResponse> {
    // Map model names to server format
    const modelMap: Record<string, string> = {
      'T2V-A14B': 't2v',
      'I2V-A14B': 'i2v',
      'TI2V-5B': 'ti2v',
      'S2V-14B': 's2v',
    };

    const serverRequest = {
      prompt: request.prompt,
      negative_prompt: request.negative_prompt,
      model: modelMap[request.model] || 't2v',
      quality: request.quality,
      options: request.options,
      image: request.image,
      audio: request.audio,
    };

    const response = await this.apiClient.post<GenerationResponse>('/generate', serverRequest);
    
    // Register progress callback if provided
    if (onProgress && response.data.job_id) {
      this.jobCallbacks.set(response.data.job_id, onProgress);
    }

    return response.data;
  }

  /**
   * Get job status
   */
  public async getJobStatus(jobId: string): Promise<JobStatus> {
    const response = await this.apiClient.get<JobStatus>(`/status/${jobId}`);
    return response.data;
  }

  /**
   * Get job result
   */
  public async getJobResult(jobId: string): Promise<any> {
    const response = await this.apiClient.get(`/result/${jobId}`);
    return response.data;
  }

  /**
   * Cancel job
   */
  public async cancelJob(jobId: string): Promise<void> {
    await this.apiClient.delete(`/job/${jobId}`);
    this.jobCallbacks.delete(jobId);
  }

  /**
   * Run benchmark
   */
  public async runBenchmark(iterations: number = 5): Promise<any> {
    const response = await this.apiClient.post('/benchmark', { iterations });
    return response.data;
  }

  /**
   * Load model into memory
   */
  public async loadModel(modelType: string): Promise<void> {
    await this.apiClient.post(`/model/load`, { model_type: modelType });
  }

  /**
   * Unload model from memory
   */
  public async unloadModel(modelType: string): Promise<void> {
    await this.apiClient.post(`/model/unload`, { model_type: modelType });
  }

  /**
   * Get server statistics
   */
  public async getStats(): Promise<any> {
    const response = await this.apiClient.get('/stats');
    return response.data;
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  /**
   * Wait for connection
   */
  public async waitForConnection(timeout: number = 10000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (this.isConnected()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return false;
  }

  /**
   * Get quality preset details
   */
  public getQualityPreset(quality: string): any {
    const presets: Record<string, any> = {
      draft: {
        steps: 10,
        cfg_scale: 7.0,
        resolution: '480p',
        fps: 24,
        name: 'Draft (Fast Preview)',
      },
      standard: {
        steps: 20,
        cfg_scale: 7.5,
        resolution: '720p',
        fps: 30,
        name: 'Standard Quality',
      },
      pro: {
        steps: 30,
        cfg_scale: 8.0,
        resolution: '1080p',
        fps: 30,
        name: 'Professional',
      },
      cinema: {
        steps: 40,
        cfg_scale: 8.5,
        resolution: '2K',
        fps: 60,
        name: 'Cinema Grade',
      },
      ultimate: {
        steps: 50,
        cfg_scale: 9.0,
        resolution: '4K',
        fps: 60,
        name: 'Ultimate (8K Ready)',
      },
    };

    return presets[quality] || presets.standard;
  }

  /**
   * Estimate generation time
   */
  public estimateTime(model: string, quality: string): number {
    // Rough estimates in seconds
    const baseTime: Record<string, number> = {
      't2v': 30,
      'i2v': 25,
      'ti2v': 20,
      's2v': 35,
    };

    const qualityMultiplier: Record<string, number> = {
      draft: 0.3,
      standard: 0.6,
      pro: 1.0,
      cinema: 1.5,
      ultimate: 2.0,
    };

    const modelKey = model.toLowerCase().replace('-', '').substring(0, 3);
    const base = baseTime[modelKey] || 30;
    const multiplier = qualityMultiplier[quality] || 1.0;

    return Math.round(base * multiplier);
  }
}

// Export singleton instance
export const popOSService = new PopOSModelService();

// Export class for custom instances
export default PopOSModelService;