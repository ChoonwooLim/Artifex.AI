import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('wanApi', {
  run: (payload: any) => ipcRenderer.invoke('wan:run', payload),
  cancel: () => ipcRenderer.invoke('wan:cancel'),
  onStdout: (cb: (data: string) => void) => ipcRenderer.on('wan:stdout', (_, data) => cb(data)),
  onStderr: (cb: (data: string) => void) => ipcRenderer.on('wan:stderr', (_, data) => cb(data)),
  onClosed: (cb: (code: number) => void) => ipcRenderer.on('wan:closed', (_, code) => cb(code)),
  openFile: (filters?: any) => ipcRenderer.invoke('wan:openFile', filters),
  openFolder: () => ipcRenderer.invoke('wan:openFolder'),
  getSettings: () => ipcRenderer.invoke('wan:getSettings'),
  setSettings: (data: any) => ipcRenderer.invoke('wan:setSettings', data),
  suggestCkpt: (task: string) => ipcRenderer.invoke('wan:suggestCkpt', task),
  validateImage: (imagePath: string) => ipcRenderer.invoke('wan:validateImage', imagePath),
  suggestPython: () => ipcRenderer.invoke('wan:suggestPython'),
  validatePython: (pythonPath: string) => ipcRenderer.invoke('wan:validatePython', pythonPath),
  suggestScript: () => ipcRenderer.invoke('wan:suggestScript'),
  showInFolder: (path: string) => ipcRenderer.invoke('wan:showInFolder', path),
  openPath: (path: string) => ipcRenderer.invoke('wan:openPath', path),
  gpuInfo: (pythonPath: string) => ipcRenderer.invoke('wan:gpuInfo', pythonPath),
});

contextBridge.exposeInMainWorld('electronAPI', {
  generateS2V: (formData: any) => ipcRenderer.invoke('electronAPI:generateS2V', formData),
  saveVideo: (videoPath: string) => ipcRenderer.invoke('electronAPI:saveVideo', videoPath),
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
  getPerformanceInfo: () => ipcRenderer.invoke('get-performance-info'),
  clearAllData: () => ipcRenderer.invoke('clear-all-data'),
  getCacheSize: () => ipcRenderer.invoke('get-cache-size'),
  // Dual GPU APIs
  checkDualGPUConnection: () => ipcRenderer.invoke('dual-gpu:check-connection'),
  getDualGPUInfo: () => ipcRenderer.invoke('dual-gpu:get-info'),
  checkCuda: () => ipcRenderer.invoke('dual-gpu:check-cuda'),
  generateVideoWithDualGPU: (options: any) => ipcRenderer.invoke('dual-gpu:generate-video', options),
  getTaskStatus: (taskId: string) => ipcRenderer.invoke('dual-gpu:task-status', taskId),
  downloadResult: (taskId: string, outputPath: string) => ipcRenderer.invoke('dual-gpu:download-result', taskId, outputPath),
  restartWorker: () => ipcRenderer.invoke('dual-gpu:restart-worker'),
  setDualGPUMode: (enabled: boolean) => ipcRenderer.invoke('dual-gpu:set-mode', enabled),
  setFlashAttention: (enabled: boolean) => ipcRenderer.invoke('dual-gpu:set-flash-attention', enabled),
  getLocalGPUInfo: () => ipcRenderer.invoke('dual-gpu:get-local-gpu-info'),
  // PopOS Server APIs
  popOSStart: () => ipcRenderer.invoke('popos:start'),
  popOSStop: () => ipcRenderer.invoke('popos:stop'),
  popOSStatus: () => ipcRenderer.invoke('popos:status'),
});

contextBridge.exposeInMainWorld('electron', {
  startOllama: () => ipcRenderer.invoke('start-ollama'),
  stopOllama: () => ipcRenderer.invoke('stop-ollama'),
  installModels: () => ipcRenderer.invoke('install-models'),
});

// Setup context menu on right click
window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  ipcRenderer.send('show-context-menu', { x: e.x, y: e.y });
});