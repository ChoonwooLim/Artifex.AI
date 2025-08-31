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