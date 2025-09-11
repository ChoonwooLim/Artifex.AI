import { app, BrowserWindow, ipcMain, dialog, shell, Menu, globalShortcut, clipboard, session } from 'electron';
import path from 'node:path';
import { spawn, ChildProcessWithoutNullStreams, execFileSync, exec } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { getAppUpdater } from './updater';
import { setupSecurityPolicy } from './security';
import { startOllamaServer, stopOllamaServer } from './ollama';
import { setupDualGPUHandlers } from './dual-gpu-handler';
import { registerPopOSHandlers } from './popos-server';

// Promisify exec for async/await usage
const execAsync = promisify(exec);

let mainWindow: BrowserWindow | null = null;
let currentJob: ChildProcessWithoutNullStreams | null = null;

// Window state management
function getWindowState() {
  const settingsPath = path.join(app.getPath('userData'), 'window-state.json');
  try {
    if (existsSync(settingsPath)) {
      return JSON.parse(readFileSync(settingsPath, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to load window state:', e);
  }
  return {
    width: 1400,
    height: 900,
    x: undefined,
    y: undefined,
    isMaximized: false,
    isFullScreen: false
  };
}

function saveWindowState() {
  if (!mainWindow) return;
  
  const state = {
    ...mainWindow.getBounds(),
    isMaximized: mainWindow.isMaximized(),
    isFullScreen: mainWindow.isFullScreen()
  };
  
  const settingsPath = path.join(app.getPath('userData'), 'window-state.json');
  try {
    writeFileSync(settingsPath, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error('Failed to save window state:', e);
  }
}

function createWindow() {
  const windowState = getWindowState();
  
  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 800,
    minHeight: 600,
    title: 'Artifex AI Studio',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    icon: process.platform === 'win32' 
      ? path.join(__dirname, '../build-resources/icon.ico')
      : undefined,
    backgroundColor: '#1a1a1a',
    show: true, // Show window immediately
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: true
    }
  });
  
  // Restore window state
  if (windowState.isMaximized) {
    mainWindow.maximize();
  }
  if (windowState.isFullScreen) {
    mainWindow.setFullScreen(true);
  }
  
  // Window is already shown due to show: true
  
  // Save window state on close
  mainWindow.on('close', () => {
    saveWindowState();
  });

  // 자동 업데이트 설정
  const appUpdater = getAppUpdater();
  appUpdater.setMainWindow(mainWindow);

  // 메뉴 설정
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu-new-project');
          }
        },
        {
          label: 'Open Project...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow?.webContents.send('menu-open-project');
          }
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('menu-save');
          }
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            mainWindow?.webContents.send('menu-save-as');
          }
        },
        { type: 'separator' },
        {
          label: 'Clear Cache',
          click: async () => {
            const session = mainWindow?.webContents.session;
            if (session) {
              await session.clearCache();
              await session.clearStorageData();
              dialog.showMessageBox(mainWindow!, {
                type: 'info',
                title: 'Cache Cleared',
                message: 'Application cache has been cleared successfully.',
                buttons: ['OK']
              });
            }
          }
        },
        {
          label: 'Reset Application',
          click: async () => {
            const result = await dialog.showMessageBox(mainWindow!, {
              type: 'warning',
              title: 'Reset Application',
              message: 'Are you sure you want to reset the application? This will clear all settings and cache.',
              buttons: ['Cancel', 'Reset'],
              defaultId: 0,
              cancelId: 0
            });
            if (result.response === 1) {
              const session = mainWindow?.webContents.session;
              if (session) {
                await session.clearCache();
                await session.clearStorageData();
                await session.clearAuthCache();
                app.relaunch();
                app.exit();
              }
            }
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            mainWindow?.webContents.send('menu-find');
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow?.webContents.reload();
          }
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            mainWindow?.webContents.reloadIgnoringCache();
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow?.webContents.toggleDevTools();
          }
        },
        {
          label: 'Toggle Fullscreen',
          accelerator: 'F11',
          click: () => {
            const isFullScreen = mainWindow?.isFullScreen();
            mainWindow?.setFullScreen(!isFullScreen);
          }
        },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            mainWindow?.webContents.send('menu-toggle-sidebar');
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
        { type: 'separator' },
        {
          label: 'Always on Top',
          type: 'checkbox',
          checked: false,
          click: (menuItem) => {
            mainWindow?.setAlwaysOnTop(menuItem.checked);
          }
        }
      ]
    },
    {
      label: 'Developer',
      submenu: [
        {
          label: 'Open DevTools',
          accelerator: 'F12',
          click: () => {
            mainWindow?.webContents.openDevTools();
          }
        },
        {
          label: 'Open DevTools (Detached)',
          click: () => {
            mainWindow?.webContents.openDevTools({ mode: 'detach' });
          }
        },
        { type: 'separator' },
        {
          label: 'Inspect Element',
          accelerator: 'CmdOrCtrl+Shift+C',
          click: () => {
            mainWindow?.webContents.inspectElement(0, 0);
          }
        },
        { type: 'separator' },
        {
          label: 'Show App Data Path',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'App Data Path',
              message: 'Application Data Path',
              detail: app.getPath('userData'),
              buttons: ['Copy', 'OK'],
            }).then(result => {
              if (result.response === 0) {
                require('electron').clipboard.writeText(app.getPath('userData'));
              }
            });
          }
        },
        {
          label: 'Show Logs Path',
          click: () => {
            const logsPath = path.join(app.getPath('userData'), 'logs');
            shell.openPath(logsPath);
          }
        },
        { type: 'separator' },
        {
          label: 'Clear Session Data',
          click: async () => {
            const session = mainWindow?.webContents.session;
            if (session) {
              await session.clearStorageData();
              dialog.showMessageBox(mainWindow!, {
                type: 'info',
                title: 'Session Cleared',
                message: 'Session data has been cleared.',
                buttons: ['OK']
              });
            }
          }
        },
        {
          label: 'Clear Auth Cache',
          click: async () => {
            const session = mainWindow?.webContents.session;
            if (session) {
              await session.clearAuthCache();
              dialog.showMessageBox(mainWindow!, {
                type: 'info',
                title: 'Auth Cache Cleared',
                message: 'Authentication cache has been cleared.',
                buttons: ['OK']
              });
            }
          }
        },
        { type: 'separator' },
        {
          label: 'GPU Information',
          click: async () => {
            try {
              // Get both Electron GPU info and nvidia-smi info
              const [electronGpuInfo, nvidiaSmiInfo] = await Promise.all([
                app.getGPUInfo('complete'),
                (async () => {
                  try {
                    const { stdout } = await execAsync('nvidia-smi --query-gpu=index,pci.bus_id,name,memory.total,memory.free,utilization.gpu,power.draw,power.limit,temperature.gpu --format=csv');
                    return stdout;
                  } catch {
                    return 'nvidia-smi not available';
                  }
                })()
              ]);
              
              const details = [
                '=== Electron GPU Info ===',
                JSON.stringify(electronGpuInfo, null, 2),
                '',
                '=== NVIDIA SMI Info ===',
                nvidiaSmiInfo
              ].join('\n');
              
              dialog.showMessageBox(mainWindow!, {
                type: 'info',
                title: 'GPU Information',
                message: 'GPU Details (Enhanced)',
                detail: details,
                buttons: ['OK']
              });
            } catch (error: any) {
              dialog.showErrorBox('GPU Info Error', error.message);
            }
          }
        },
        {
          label: 'System Information',
          click: () => {
            const sysInfo = {
              'Platform': process.platform,
              'Architecture': process.arch,
              'Node Version': process.version,
              'Electron Version': process.versions.electron,
              'Chrome Version': process.versions.chrome,
              'V8 Version': process.versions.v8,
              'App Version': app.getVersion(),
              'App Path': app.getAppPath(),
              'User Data': app.getPath('userData')
            };
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'System Information',
              message: 'System Details',
              detail: Object.entries(sysInfo).map(([k, v]) => `${k}: ${v}`).join('\n'),
              buttons: ['Copy', 'OK']
            }).then(result => {
              if (result.response === 0) {
                require('electron').clipboard.writeText(JSON.stringify(sysInfo, null, 2));
              }
            });
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://github.com/your-repo/docs');
          }
        },
        {
          label: 'Keyboard Shortcuts',
          click: () => {
            const shortcuts = [
              'General:',
              '  Ctrl+N - New Project',
              '  Ctrl+O - Open Project',
              '  Ctrl+S - Save',
              '  Ctrl+Shift+S - Save As',
              '  Ctrl+Q - Quit',
              '',
              'View:',
              '  Ctrl+R - Reload',
              '  Ctrl+Shift+R - Force Reload',
              '  F11 - Toggle Fullscreen',
              '  Ctrl+B - Toggle Sidebar',
              '  Ctrl+Plus - Zoom In',
              '  Ctrl+Minus - Zoom Out',
              '  Ctrl+0 - Reset Zoom',
              '',
              'Developer:',
              '  F12 - Open DevTools',
              '  Ctrl+Shift+I - Toggle DevTools',
              '  Ctrl+Shift+C - Inspect Element'
            ].join('\n');
            
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'Keyboard Shortcuts',
              message: 'Available Shortcuts',
              detail: shortcuts,
              buttons: ['OK']
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Check for Updates...',
          click: () => {
            getAppUpdater().checkForUpdates();
          }
        },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/your-repo/issues');
          }
        },
        { type: 'separator' },
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'About Artifex AI Studio',
              message: 'Artifex AI Studio',
              detail: `Version: ${app.getVersion()}\nPowered by WAN 2.2 AI Models\n\nFeatures:\n- Text to Video (T2V-14B)\n- Image to Video (I2V-14B)\n- Text+Image to Video (TI2V-5B)\n- Speech to Video (S2V-14B)\n\n© 2025 Artifex AI`,
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);

  const devUrl = process.env.ELECTRON_START_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    const prodIndex = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(prodIndex);
  }

  // Enable DevTools in development
  if (process.env.VITE_DEV_SERVER || process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
  
  // Register global shortcuts
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Prevent refresh in production
    if (!process.env.VITE_DEV_SERVER && (input.key === 'F5' || (input.control && input.key === 'r'))) {
      event.preventDefault();
    }
  });
  
  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Context menu handler - Moved inside app.whenReady()
function setupContextMenu() {
  ipcMain.on('show-context-menu', (event) => {
  const template = [
    {
      label: 'Cut',
      accelerator: 'CmdOrCtrl+X',
      role: 'cut' as const,
    },
    {
      label: 'Copy',
      accelerator: 'CmdOrCtrl+C',
      role: 'copy' as const,
    },
    {
      label: 'Paste',
      accelerator: 'CmdOrCtrl+V',
      role: 'paste' as const,
    },
    { type: 'separator' as const },
    {
      label: 'Select All',
      accelerator: 'CmdOrCtrl+A',
      role: 'selectAll' as const,
    },
    { type: 'separator' as const },
    {
      label: 'Reload',
      accelerator: 'CmdOrCtrl+R',
      click: () => {
        mainWindow?.webContents.reload();
      }
    },
    {
      label: 'Toggle DevTools',
      accelerator: 'F12',
      click: () => {
        mainWindow?.webContents.toggleDevTools();
      }
    },
    { type: 'separator' as const },
    {
      label: 'Inspect Element',
      click: () => {
        mainWindow?.webContents.inspectElement(event.x as any, event.y as any);
      }
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  menu.popup({ window: BrowserWindow.fromWebContents(event.sender)! });
  });
}

// Performance monitoring - Moved inside app.whenReady()
function setupPerformanceHandlers() {
  ipcMain.handle('get-performance-info', async () => {
  const metrics = app.getAppMetrics();
  const gpuInfo = await app.getGPUInfo('complete');
  return {
    metrics,
    gpuInfo,
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  };
});

// Session management
ipcMain.handle('clear-all-data', async () => {
  const ses = session.defaultSession;
  await ses.clearCache();
  await ses.clearStorageData();
  await ses.clearAuthCache();
  return { success: true };
});

  ipcMain.handle('get-cache-size', async () => {
    const ses = session.defaultSession;
    const size = await ses.getCacheSize();
    return size;
  });
}

app.whenReady().then(async () => {
  // Setup security policy
  setupSecurityPolicy();
  
  // Setup context menu handler
  setupContextMenu();
  
  // Setup performance handlers
  setupPerformanceHandlers();
  
  // Setup PopOS Server handlers and auto-start
  const poposServerManager = registerPopOSHandlers();
  
  // Auto-start PopOS server if SSH key is configured
  setTimeout(async () => {
    const hasSSHKey = await poposServerManager.ensureSSHKey();
    if (hasSSHKey) {
      console.log('SSH key found, auto-starting PopOS server...');
      await poposServerManager.autoStart();
    } else {
      console.warn('SSH key not configured. PopOS server will not auto-start.');
      console.warn('Run "python setup_ssh_keys.py" to configure passwordless SSH.');
    }
  }, 3000); // Delay to ensure app is fully loaded
  
  // Setup Ollama IPC handlers
  ipcMain.handle('start-ollama', async () => {
    try {
      await startOllamaServer();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('stop-ollama', async () => {
    stopOllamaServer();
    return { success: true };
  });
  
  ipcMain.handle('install-models', async () => {
    try {
      const scriptPath = path.join(process.cwd(), '..', 'scripts', 'install-all-models.bat');
      exec(`start cmd /k "${scriptPath}"`, (error) => {
        if (error) {
          console.error('Failed to run install script:', error);
        }
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
  
  // Register global shortcuts
  globalShortcut.register('CommandOrControl+Shift+D', () => {
    if (mainWindow) {
      mainWindow.webContents.toggleDevTools();
    }
  });
  
  globalShortcut.register('CommandOrControl+Shift+R', () => {
    if (mainWindow) {
      mainWindow.webContents.reloadIgnoringCache();
    }
  });
  
  createWindow();
  
  // Setup Dual GPU handlers after window is created
  if (mainWindow) {
    setupDualGPUHandlers(mainWindow);
  }
  
  // 앱 시작 후 업데이트 체크 (5초 후)
  setTimeout(() => {
    getAppUpdater().checkForUpdates();
  }, 5000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
  
  // Save window state before quitting
  saveWindowState();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Clean up any running processes
  if (currentJob) {
    currentJob.kill();
  }
  // Stop Ollama server
  stopOllamaServer();
});

// Handle app crashes and errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  dialog.showErrorBox('Unexpected Error', `An unexpected error occurred: ${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

type RunArgs = {
  pythonPath: string;
  scriptPath: string;
  args: string[];
  cwd?: string;
};

ipcMain.handle('wan:run', async (_evt, payload: RunArgs) => {
  if (currentJob) {
    return { ok: false, message: 'A job is already running' };
  }
  try {
    const { pythonPath, scriptPath, args, cwd } = payload;
    if (!existsSync(scriptPath)) {
      return { ok: false, message: `Script not found: ${scriptPath}` };
    }
    const child = spawn(pythonPath, [scriptPath, ...args], {
      cwd: cwd || path.dirname(scriptPath),
      windowsHide: true,
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1'
      }
    });
    currentJob = child;

    child.stdout.on('data', (data) => {
      mainWindow?.webContents.send('wan:stdout', data.toString());
    });
    child.stderr.on('data', (data) => {
      mainWindow?.webContents.send('wan:stderr', data.toString());
    });
    child.on('close', (code) => {
      mainWindow?.webContents.send('wan:closed', code);
      currentJob = null;
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e?.message || String(e) };
  }
});

ipcMain.handle('wan:cancel', async () => {
  if (!currentJob) return { ok: false, message: 'No running job' };
  try {
    currentJob.kill('SIGTERM');
    currentJob = null;
    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e?.message || String(e) };
  }
});

// file/folder dialogs
ipcMain.handle('wan:openFile', async (_e, options: { filters?: Electron.FileFilter[] }) => {
  const res = await dialog.showOpenDialog({ properties: ['openFile'], filters: options?.filters });
  if (res.canceled || res.filePaths.length === 0) return null;
  return res.filePaths[0];
});
ipcMain.handle('wan:openFolder', async () => {
  const res = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (res.canceled || res.filePaths.length === 0) return null;
  return res.filePaths[0];
});

// settings persistence
const settingsPath = path.join(app.getPath('userData'), 'settings.json');
function ensureSettingsDir() {
  mkdirSync(app.getPath('userData'), { recursive: true });
}
ipcMain.handle('wan:getSettings', async () => {
  try {
    const txt = readFileSync(settingsPath, 'utf-8');
    return JSON.parse(txt);
  } catch {
    return {};
  }
});
ipcMain.handle('wan:setSettings', async (_e, data: any) => {
  try {
    ensureSettingsDir();
    writeFileSync(settingsPath, JSON.stringify(data, null, 2), 'utf-8');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e?.message || String(e) };
  }
});

// checkpoint suggestion
function looksLikeCkptDir(dir: string): boolean {
  try {
    const items = new Set(readdirSync(dir));
    const hasConfig = items.has('configuration.json') || items.has('config.json');
    const hasModels = items.has('high_noise_model') || items.has('low_noise_model') || items.has('google');
    const hasVae = items.has('Wan2.1_VAE.pth') || items.has('Wan2.2_VAE.pth');
    let hasIndex = items.has('diffusion_pytorch_model.safetensors.index.json');
    if (!hasIndex) {
      // search one level deeper for index json
      for (const name of items) {
        const p = path.join(dir, name);
        try {
          if (statSync(p).isDirectory()) {
            const sub = new Set(readdirSync(p));
            if (sub.has('diffusion_pytorch_model.safetensors.index.json')) { hasIndex = true; break; }
          }
        } catch {}
      }
    }
    return hasConfig && (hasModels || hasIndex || hasVae);
  } catch {
    return false;
  }
}

function listSubdirs(root: string): string[] {
  try {
    return readdirSync(root)
      .map((name) => path.join(root, name))
      .filter((p) => {
        try { return statSync(p).isDirectory(); } catch { return false; }
      });
  } catch {
    return [];
  }
}

ipcMain.handle('wan:suggestCkpt', async (_e, task: string) => {
  const roots = Array.from(new Set([
    path.resolve(process.cwd(), '..'),
    path.resolve(process.cwd(), '../..'),
    app.getPath('documents'),
    app.getPath('downloads')
  ]));

  const nameHints: string[] = (() => {
    if (task.startsWith('t2v')) return ['Wan2.2-T2V-A14B', 'T2V', 't2v'];
    if (task.startsWith('i2v')) return ['Wan2.2-I2V-A14B', 'I2V', 'i2v'];
    if (task.startsWith('ti2v')) return ['Wan2.2-TI2V-5B', 'TI2V', 'ti2v'];
    if (task.startsWith('s2v')) return ['Wan2.2-S2V-14B', 'S2V', 's2v'];
    return ['Wan2.2'];
  })();

  const candidates = new Set<string>();
  const scoreMap = new Map<string, number>();
  const score = (p: string) => {
    const b = path.basename(p).toLowerCase();
    let s = 0;
    for (const h of nameHints) if (b.includes(h.toLowerCase())) s += 2;
    if (b.includes('wan2.2')) s += 1;
    return s;
  };

  for (const r of roots) {
    if (looksLikeCkptDir(r)) { candidates.add(r); scoreMap.set(r, score(r)); }
    for (const d of listSubdirs(r)) {
      if (looksLikeCkptDir(d)) { candidates.add(d); scoreMap.set(d, score(d)); }
      for (const dd of listSubdirs(d)) {
        if (looksLikeCkptDir(dd)) { candidates.add(dd); scoreMap.set(dd, score(dd)); }
      }
    }
  }
  // Prefer exact folder names when present
  const nameOrder = {
    'ti2v-5b': 4,
    'wan2.2-ti2v-5b': 4,
    's2v-14b': 3,
    'wan2.2-s2v-14b': 3,
    'i2v-a14b': 2,
    'wan2.2-i2v-a14b': 2,
    't2v-a14b': 1,
    'wan2.2-t2v-a14b': 1
  } as Record<string, number>;
  return Array.from(candidates).sort((a, b) => {
    const ab = path.basename(a).toLowerCase();
    const bb = path.basename(b).toLowerCase();
    const na = nameOrder[ab] || 0;
    const nb = nameOrder[bb] || 0;
    if (na !== nb) return nb - na;
    return (scoreMap.get(b) || 0) - (scoreMap.get(a) || 0);
  });
});

// image validate
ipcMain.handle('wan:validateImage', async (_e, imagePath: string) => {
  try {
    if (!imagePath) return { ok: false, message: 'Empty path' };
    if (!existsSync(imagePath)) return { ok: false, message: 'File does not exist' };
    const st = statSync(imagePath);
    if (!st.isFile()) return { ok: false, message: 'Not a file' };
    return { ok: true, size: st.size };
  } catch (e: any) {
    return { ok: false, message: e?.message || String(e) };
  }
});

// python suggest & validate
function whichPythonCandidates(): string[] {
  const cands = new Set<string>();
  const guesses = [
    'python',
    'py',
    'C:/Python311/python.exe',
    'C:/Program Files/Python311/python.exe',
    process.execPath.includes('electron.exe') ? '' : process.execPath
  ].filter(Boolean) as string[];
  guesses.forEach((g) => cands.add(g));
  return Array.from(cands);
}

ipcMain.handle('wan:suggestPython', async () => whichPythonCandidates());

ipcMain.handle('wan:validatePython', async (_e, pythonPath: string) => {
  try {
    const version = execFileSync(pythonPath, ['-V'], { encoding: 'utf-8' }).trim();
    let torch = 'missing';
    let diffusers = 'missing';
    let pil = 'missing';
    let cuda = 'unknown';
    try {
      const out = execFileSync(pythonPath, ['-c', 'import torch,sys;print(torch.__version__);print(torch.cuda.is_available())'], { encoding: 'utf-8' });
      const lines = out.trim().split(/\r?\n/);
      torch = lines[0] || 'unknown';
      cuda = (lines[1] === 'True') ? 'available' : 'not available';
    } catch {}
    try {
      const out = execFileSync(pythonPath, ['-c', 'import diffusers;import PIL;print(diffusers.__version__);print(PIL.__version__)'], { encoding: 'utf-8' });
      const lines = out.trim().split(/\r?\n/);
      diffusers = lines[0] || 'unknown';
      pil = lines[1] || 'unknown';
    } catch {}
    return { ok: true, version, torch, cuda, diffusers, pil };
  } catch (e: any) {
    return { ok: false, message: e?.message || String(e) };
  }
});

// script suggest (search generate.py)
function findGenerateScripts(): string[] {
  const workspace = path.resolve(process.cwd(), '..');
  const roots = Array.from(new Set([
    process.cwd(),
    workspace,
    path.resolve(workspace, '..')
  ]));
  const results = new Set<string>();
  // Known locations first
  const known = [
    path.join(workspace, 'Wan2.2', 'generate.py'),
    path.join(workspace, 'Wan2.2_new', 'generate.py')
  ];
  for (const k of known) { try { if (statSync(k).isFile()) results.add(k); } catch {} }
  const visit = (dir: string, depth = 0) => {
    if (depth > 3) return;
    let ents: string[] = [];
    try { ents = readdirSync(dir); } catch { return; }
    for (const name of ents) {
      const full = path.join(dir, name);
      let st: any;
      try { st = statSync(full); } catch { continue; }
      if (st.isDirectory()) {
        visit(full, depth + 1);
      } else if (st.isFile() && name.toLowerCase() === 'generate.py') {
        results.add(full);
      }
    }
  };
  for (const r of roots) visit(r, 0);
  return Array.from(results);
}

ipcMain.handle('wan:suggestScript', async () => findGenerateScripts());

// open/show file or folder
ipcMain.handle('wan:showInFolder', async (_e, filePath: string) => {
  try { shell.showItemInFolder(filePath); return { ok: true }; } catch (e: any) { return { ok: false, message: e?.message || String(e) }; }
});
ipcMain.handle('wan:openPath', async (_e, targetPath: string) => {
  try { const res = await shell.openPath(targetPath); return { ok: res === '', message: res }; } catch (e: any) { return { ok: false, message: e?.message || String(e) }; }
});

// Enhanced GPU info with retry logic and PCIe details
ipcMain.handle('wan:gpuInfo', async (_e, pythonPath: string) => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const code = [
        'import json, torch, sys, subprocess',
        'import time',
        'result = {}',
        '',
        '# Basic GPU availability check',
        'avail = torch.cuda.is_available()',
        'if not avail and attempt < 3:',
        '    time.sleep(1)',
        '    torch.cuda.init()',
        '    avail = torch.cuda.is_available()',
        '',
        '# Get GPU info if available',
        'if avail:',
        '    name = torch.cuda.get_device_name(0)',
        '    mem = torch.cuda.get_device_properties(0).total_memory',
        '    bf16 = torch.cuda.is_bf16_supported()',
        '    cuda_ver = getattr(torch.version, "cuda", None)',
        '    count = torch.cuda.device_count()',
        '    result = {"available": True, "name": name, "total_memory": int(mem), "bf16": bf16, "cuda_version": cuda_ver, "gpu_count": count}',
        'else:',
        '    result = {"available": False, "name": "", "total_memory": 0, "bf16": False, "cuda_version": None, "gpu_count": 0}',
        '',
        '# Check Flash Attention',
        'has_flash = False',
        'try:',
        '    import flash_attn',
        '    has_flash = True',
        'except Exception:',
        '    pass',
        'result["flash_attn"] = has_flash',
        '',
        '# Get PCIe info via nvidia-smi',
        'try:',
        '    nv_out = subprocess.run(["nvidia-smi", "--query-gpu=index,pci.bus_id,name,power.draw,power.limit", "--format=csv,noheader"], capture_output=True, text=True)',
        '    if nv_out.returncode == 0:',
        '        lines = nv_out.stdout.strip().split("\\n")',
        '        pcie_info = []',
        '        for line in lines:',
        '            parts = [p.strip() for p in line.split(",")]',
        '            if len(parts) >= 5:',
        '                pcie_info.append({',
        '                    "index": int(parts[0]),',
        '                    "pci_bus_id": parts[1],',
        '                    "name": parts[2],',
        '                    "power_draw": parts[3],',
        '                    "power_limit": parts[4]',
        '                })',
        '        result["pcie_info"] = pcie_info',
        'except Exception as e:',
        '    result["pcie_info"] = []',
        '',
        'print(json.dumps(result))'
      ].join('\n').replace('attempt', str(attempt));
      
      const out = execFileSync(pythonPath, ['-c', code], { 
        encoding: 'utf-8',
        timeout: 10000 // 10 second timeout
      });
      
      const gpuInfo = JSON.parse(out);
      
      // If GPU is available or it's the last attempt, return the result
      if (gpuInfo.available || attempt === MAX_RETRIES) {
        return { ok: true, info: gpuInfo, attempts: attempt };
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      
    } catch (e: any) {
      if (attempt === MAX_RETRIES) {
        return { ok: false, message: e?.message || String(e), attempts: attempt };
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
  
  return { ok: false, message: 'Failed to get GPU info after retries', attempts: MAX_RETRIES };
});

// Speech to Video Generation API
ipcMain.handle('electronAPI:generateS2V', async (_e, formData: any) => {
  try {
    const pythonPath = 'python';
    const scriptPath = path.join(__dirname, '..', 'python', 's2v.py');
    
    // Create temp files for uploaded data
    const tempDir = app.getPath('temp');
    const imagePath = path.join(tempDir, `ref_${Date.now()}.jpg`);
    const audioPath = path.join(tempDir, `audio_${Date.now()}.wav`);
    
    // Write files (in real implementation, handle FormData properly)
    // This is a simplified version - actual implementation would handle multipart form data
    
    const params = {
      reference_image: imagePath,
      audio: audioPath,
      ...formData
    };
    
    // Execute Python script
    const result = await new Promise((resolve, reject) => {
      const child = spawn(pythonPath, [scriptPath], {
        cwd: path.dirname(scriptPath)
      });
      
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
          try {
            const lines = output.trim().split('\n');
            const lastLine = lines[lines.length - 1];
            const result = JSON.parse(lastLine);
            resolve(result);
          } catch (e) {
            reject(new Error('Failed to parse output'));
          }
        } else {
          reject(new Error(error || 'Process failed'));
        }
      });
      
      // Send generation command
      child.stdin.write(JSON.stringify({
        action: 'generate',
        params: params
      }) + '\n');
    });
    
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || String(error) };
  }
});

ipcMain.handle('electronAPI:saveVideo', async (_e, videoPath: string) => {
  try {
    const result = await dialog.showSaveDialog({
      defaultPath: path.basename(videoPath),
      filters: [
        { name: 'Video Files', extensions: ['mp4', 'avi', 'mov'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (!result.canceled && result.filePath) {
      const fs = require('fs').promises;
      await fs.copyFile(videoPath, result.filePath);
      return { success: true, savedPath: result.filePath };
    }
    
    return { success: false, error: 'Save cancelled' };
  } catch (error: any) {
    return { success: false, error: error.message || String(error) };
  }
});

// PopOS Server Management
let poposServerRunning = false;

ipcMain.handle('popos:start', async () => {
  try {
    // Check if server is already running
    const checkResponse = await fetch('http://10.0.0.2:8000/')
      .then(res => res.ok)
      .catch(() => false);
    
    if (checkResponse) {
      poposServerRunning = true;
      return { success: true, message: 'PopOS server already running' };
    }
    
    // Try to start via SSH (if configured)
    // This would require SSH key setup
    return { success: false, message: 'Please start the PopOS server manually on 10.0.0.2' };
  } catch (error: any) {
    return { success: false, message: error.message || String(error) };
  }
});

ipcMain.handle('popos:stop', async () => {
  try {
    poposServerRunning = false;
    return { success: true, message: 'PopOS server stop requested' };
  } catch (error: any) {
    return { success: false, message: error.message || String(error) };
  }
});

ipcMain.handle('popos:status', async () => {
  try {
    // Check if PopOS server is running
    const response = await fetch('http://10.0.0.2:8000/')
      .then(res => res.json())
      .catch(() => null);
    
    if (response && response.status === 'online') {
      poposServerRunning = true;
      
      // Try to get GPU info
      const gpuResponse = await fetch('http://10.0.0.2:8000/gpu/info')
        .then(res => res.json())
        .catch(() => null);
      
      return { 
        running: true, 
        message: 'PopOS server is online',
        gpuInfo: gpuResponse?.gpus?.[0] || null
      };
    }
    
    poposServerRunning = false;
    return { running: false, message: 'PopOS server is offline' };
  } catch (error: any) {
    poposServerRunning = false;
    return { running: false, message: error.message || String(error) };
  }
});

// Dual GPU Management
let dualGPUMode = false;
let flashAttentionEnabled = false;

ipcMain.handle('dual-gpu:set-mode', async (_e, enabled: boolean) => {
  dualGPUMode = enabled;
  return { success: true, mode: dualGPUMode };
});

ipcMain.handle('dual-gpu:set-flash-attention', async (_e, enabled: boolean) => {
  flashAttentionEnabled = enabled;
  return { success: true, enabled: flashAttentionEnabled };
});

// Moved get-local-gpu-info handler to dual-gpu-handler.ts

// Removed duplicate handlers - these are now defined in dual-gpu-handler.ts

