import { exec, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

let ollamaProcess: ChildProcess | null = null;

export function startOllamaServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const ollamaPath = path.join(process.cwd(), '..', 'ollama-local');
    const ollamaExe = path.join(ollamaPath, 'ollama.exe');
    
    if (!fs.existsSync(ollamaExe)) {
      console.error('Ollama not found at:', ollamaExe);
      reject(new Error('Ollama not installed'));
      return;
    }
    
    // 환경변수 설정
    const env = {
      ...process.env,
      OLLAMA_HOME: ollamaPath,
      OLLAMA_MODELS: path.join(process.cwd(), '..', 'models'),
      OLLAMA_HOST: '127.0.0.1:11434'
    };
    
    // Ollama 서버 시작
    ollamaProcess = exec(`"${ollamaExe}" serve`, { env }, (error) => {
      if (error && !error.message.includes('address already in use')) {
        console.error('Failed to start Ollama:', error);
        reject(error);
      }
    });
    
    console.log('Starting local Ollama server...');
    setTimeout(() => resolve(), 3000);
  });
}

export function stopOllamaServer(): void {
  if (ollamaProcess) {
    ollamaProcess.kill();
    ollamaProcess = null;
    console.log('Ollama server stopped');
  }
}