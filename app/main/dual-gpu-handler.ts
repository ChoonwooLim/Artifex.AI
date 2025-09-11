/**
 * Dual GPU IPC Handler
 * PopOS GPU Worker와 통신하여 분산 처리를 관리
 */

import { ipcMain, BrowserWindow } from 'electron';
import { spawn, execFileSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const WORKER_URL = 'http://10.0.0.2:8001';
let workerAvailable = false;

interface GPUInfo {
  name: string;
  memory_total: number;
  memory_used: number;
  memory_free: number;
  utilization: number;
  temperature: number;
  power_draw: number;
}

interface TaskStatus {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  result_path?: string;
  error?: string;
}

export function setupDualGPUHandlers(mainWindow: BrowserWindow) {
  
  // PopOS Worker 연결 상태 확인
  ipcMain.handle('dual-gpu:check-connection', async () => {
    try {
      const response = await fetch(WORKER_URL, { timeout: 5000 });
      if (response.ok) {
        const data = await response.json();
        workerAvailable = true;
        return { 
          connected: true, 
          worker: data.worker,
          timestamp: data.timestamp 
        };
      }
    } catch (error) {
      console.error('[DualGPU] Connection check failed:', error);
      workerAvailable = false;
    }
    return { connected: false };
  });

  // GPU 정보 조회
  ipcMain.handle('dual-gpu:get-info', async () => {
    const localGPU = await getLocalGPUInfo();
    let remoteGPU = null;

    if (workerAvailable) {
      try {
        const response = await fetch(`${WORKER_URL}/gpu/info`);
        if (response.ok) {
          remoteGPU = await response.json();
        }
      } catch (error) {
        console.error('[DualGPU] Failed to get remote GPU info:', error);
      }
    }

    return {
      local: localGPU,
      remote: remoteGPU,
      dualMode: localGPU && remoteGPU
    };
  });

  // CUDA 환경 확인
  ipcMain.handle('dual-gpu:check-cuda', async () => {
    const localCuda = await checkLocalCuda();
    let remoteCuda = null;

    if (workerAvailable) {
      try {
        const response = await fetch(`${WORKER_URL}/gpu/cuda`);
        if (response.ok) {
          remoteCuda = await response.json();
        }
      } catch (error) {
        console.error('[DualGPU] Failed to check remote CUDA:', error);
      }
    }

    return {
      local: localCuda,
      remote: remoteCuda
    };
  });

  // 로컬 GPU 정보 가져오기
  ipcMain.handle('dual-gpu:get-local-gpu-info', async () => {
    try {
      const pythonPath = 'python';
      const code = `
import json
result = {"name": "Unknown", "memory_total": 0, "memory_free": 0, "utilization": 0}
try:
    import torch
    if torch.cuda.is_available():
        result["name"] = torch.cuda.get_device_name(0)
        result["memory_total"] = torch.cuda.get_device_properties(0).total_memory
        result["memory_free"] = result["memory_total"] - torch.cuda.memory_allocated(0)
        # Can't get utilization from PyTorch directly
except:
    pass
print(json.dumps(result))
`;
      
      const out = execFileSync(pythonPath, ['-c', code], { 
        encoding: 'utf-8',
        timeout: 5000
      });
      
      return JSON.parse(out);
    } catch (error) {
      return null;
    }
  });

  // 비디오 생성 작업 제출
  ipcMain.handle('dual-gpu:generate-video', async (event, options) => {
    const {
      modelType,
      prompt,
      imagePath,
      audioPath,
      parameters,
      useDualGPU = true
    } = options;

    // 듀얼 GPU 모드 확인
    if (!useDualGPU || !workerAvailable) {
      // 로컬 GPU만 사용
      return await generateVideoLocal(modelType, prompt, imagePath, audioPath, parameters);
    }

    // 분산 처리 실행
    return await generateVideoDistributed(
      modelType,
      prompt,
      imagePath,
      audioPath,
      parameters,
      mainWindow
    );
  });

  // 작업 상태 조회
  ipcMain.handle('dual-gpu:task-status', async (event, taskId) => {
    if (!workerAvailable) {
      return { error: 'Worker not available' };
    }

    try {
      const response = await fetch(`${WORKER_URL}/task/status/${taskId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('[DualGPU] Failed to get task status:', error);
    }
    return { error: 'Failed to get task status' };
  });

  // 작업 결과 다운로드
  ipcMain.handle('dual-gpu:download-result', async (event, taskId, outputPath) => {
    if (!workerAvailable) {
      return { success: false, error: 'Worker not available' };
    }

    try {
      const response = await fetch(`${WORKER_URL}/task/result/${taskId}`);
      if (response.ok) {
        const buffer = await response.buffer();
        fs.writeFileSync(outputPath, buffer);
        return { success: true, path: outputPath };
      }
    } catch (error) {
      console.error('[DualGPU] Failed to download result:', error);
    }
    return { success: false, error: 'Failed to download result' };
  });

  // Worker 재시작
  ipcMain.handle('dual-gpu:restart-worker', async () => {
    try {
      // SSH를 통해 PopOS 워커 재시작
      const result = await executeSSHCommand('sudo systemctl restart gpu-worker');
      return { success: true, message: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 초기 연결 확인
  checkWorkerConnection();
  
  // 주기적 연결 확인 (30초마다)
  setInterval(checkWorkerConnection, 30000);
}

async function checkWorkerConnection() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(WORKER_URL, { signal: controller.signal });
    clearTimeout(timeout);
    
    workerAvailable = response.ok;
    console.log(`[DualGPU] Worker status: ${workerAvailable ? 'Connected' : 'Disconnected'}`);
  } catch {
    workerAvailable = false;
  }
}

async function getLocalGPUInfo(): Promise<GPUInfo[]> {
  return new Promise((resolve) => {
    const child = spawn('nvidia-smi', [
      '--query-gpu=name,memory.total,memory.used,memory.free,utilization.gpu,temperature.gpu,power.draw',
      '--format=csv,noheader,nounits'
    ]);

    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        resolve([]);
        return;
      }

      const gpus = output.trim().split('\n').map(line => {
        const [name, total, used, free, util, temp, power] = line.split(', ');
        return {
          name,
          memory_total: parseInt(total) * 1024 * 1024,
          memory_used: parseInt(used) * 1024 * 1024,
          memory_free: parseInt(free) * 1024 * 1024,
          utilization: parseInt(util),
          temperature: parseInt(temp),
          power_draw: parseFloat(power)
        };
      });

      resolve(gpus);
    });

    child.on('error', () => {
      resolve([]);
    });
  });
}

async function checkLocalCuda() {
  return new Promise((resolve) => {
    const child = spawn('nvcc', ['--version']);
    
    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        const match = output.match(/release (\d+\.\d+)/);
        resolve({
          available: true,
          version: match ? match[1] : 'unknown'
        });
      } else {
        resolve({ available: false });
      }
    });

    child.on('error', () => {
      resolve({ available: false });
    });
  });
}

async function generateVideoLocal(
  modelType: string,
  prompt: string,
  imagePath?: string,
  audioPath?: string,
  parameters?: any
) {
  // Python 스크립트 실행
  const scriptPath = path.join(__dirname, '..', '..', 'python', 'generate_video.py');
  
  return new Promise((resolve, reject) => {
    const args = [
      scriptPath,
      '--model', modelType,
      '--prompt', prompt || '',
      '--output', path.join(process.cwd(), 'output', `${Date.now()}.mp4`)
    ];

    if (imagePath) args.push('--image', imagePath);
    if (audioPath) args.push('--audio', audioPath);
    if (parameters) args.push('--params', JSON.stringify(parameters));

    const child = spawn('python', args);
    
    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output });
      } else {
        reject(new Error(error || 'Video generation failed'));
      }
    });
  });
}

async function generateVideoDistributed(
  modelType: string,
  prompt: string,
  imagePath: string | undefined,
  audioPath: string | undefined,
  parameters: any,
  mainWindow: BrowserWindow
) {
  try {
    // 작업을 두 부분으로 분할
    const taskId1 = await submitRemoteTask(modelType, `${prompt} [part 1]`, imagePath, audioPath, parameters);
    const taskId2Local = `local_${Date.now()}`;

    // 로컬 작업 시작
    const localPromise = generateVideoLocal(modelType, `${prompt} [part 2]`, imagePath, audioPath, parameters);

    // 원격 작업 모니터링
    const remoteResult = await waitForRemoteTask(taskId1, mainWindow);

    // 로컬 작업 완료 대기
    const localResult = await localPromise;

    // 결과 병합
    if (remoteResult.success && localResult.success) {
      // FFmpeg로 두 비디오 병합
      const mergedPath = await mergeVideos(remoteResult.path, localResult.output);
      return { success: true, path: mergedPath, mode: 'dual' };
    }

    // 하나만 성공한 경우
    if (remoteResult.success) {
      return { success: true, path: remoteResult.path, mode: 'remote' };
    }
    if (localResult.success) {
      return { success: true, path: localResult.output, mode: 'local' };
    }

    throw new Error('Both GPU tasks failed');

  } catch (error) {
    console.error('[DualGPU] Distributed generation failed:', error);
    // 폴백: 로컬 GPU만 사용
    return generateVideoLocal(modelType, prompt, imagePath, audioPath, parameters);
  }
}

async function submitRemoteTask(
  modelType: string,
  prompt: string,
  imagePath?: string,
  audioPath?: string,
  parameters?: any
): Promise<string> {
  const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const response = await fetch(`${WORKER_URL}/task/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task_id: taskId,
      model_type: modelType,
      prompt,
      image_path: imagePath,
      audio_path: audioPath,
      parameters: parameters || {}
    })
  });

  if (!response.ok) {
    throw new Error('Failed to submit remote task');
  }

  return taskId;
}

async function waitForRemoteTask(taskId: string, mainWindow: BrowserWindow) {
  const maxWaitTime = 600000; // 10분
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    const response = await fetch(`${WORKER_URL}/task/status/${taskId}`);
    
    if (response.ok) {
      const status: TaskStatus = await response.json();
      
      // 진행률 업데이트
      mainWindow.webContents.send('dual-gpu:progress', {
        taskId,
        progress: status.progress,
        message: status.message
      });

      if (status.status === 'completed') {
        // 결과 다운로드
        const resultPath = path.join(process.cwd(), 'output', `remote_${taskId}.mp4`);
        const downloadResponse = await fetch(`${WORKER_URL}/task/result/${taskId}`);
        
        if (downloadResponse.ok) {
          const buffer = await downloadResponse.buffer();
          fs.writeFileSync(resultPath, buffer);
          return { success: true, path: resultPath };
        }
      } else if (status.status === 'failed') {
        throw new Error(status.error || 'Remote task failed');
      }
    }

    // 1초 대기
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error('Remote task timeout');
}

async function mergeVideos(video1Path: string, video2Path: string): Promise<string> {
  const outputPath = path.join(process.cwd(), 'output', `merged_${Date.now()}.mp4`);
  
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', video1Path,
      '-i', video2Path,
      '-filter_complex', '[0:v][1:v]concat=n=2:v=1[outv]',
      '-map', '[outv]',
      outputPath
    ]);

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        // 임시 파일 정리
        fs.unlinkSync(video1Path);
        fs.unlinkSync(video2Path);
        resolve(outputPath);
      } else {
        reject(new Error('Failed to merge videos'));
      }
    });

    ffmpeg.on('error', reject);
  });
}

async function executeSSHCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const ssh = spawn('ssh', ['stevenlim@10.0.0.2', command]);
    
    let output = '';
    let error = '';

    ssh.stdout.on('data', (data) => {
      output += data.toString();
    });

    ssh.stderr.on('data', (data) => {
      error += data.toString();
    });

    ssh.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(error || 'SSH command failed'));
      }
    });
  });
}