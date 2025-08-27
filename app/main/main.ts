import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'node:path';
import { spawn, ChildProcessWithoutNullStreams, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';

let mainWindow: BrowserWindow | null = null;
let currentJob: ChildProcessWithoutNullStreams | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Artifex.AI',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = process.env.ELECTRON_START_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    const prodIndex = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(prodIndex);
  }

  if (process.env.VITE_DEV_SERVER) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

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
    'ti2v-5b': 3,
    'wan2.2-ti2v-5b': 3,
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

// GPU info via python (torch)
ipcMain.handle('wan:gpuInfo', async (_e, pythonPath: string) => {
  try {
    const code = [
      'import json, torch, sys',
      'avail = torch.cuda.is_available()',
      'name = torch.cuda.get_device_name(0) if avail else ""',
      'mem = torch.cuda.get_device_properties(0).total_memory if avail else 0',
      'bf16 = torch.cuda.is_bf16_supported() if avail else False',
      'cuda_ver = getattr(torch.version, "cuda", None)',
      'has_flash = False',
      'try:\n import flash_attn\n has_flash=True\nexcept Exception:\n pass',
      'print(json.dumps({"available": avail, "name": name, "total_memory": int(mem), "bf16": bf16, "cuda_version": cuda_ver, "flash_attn": has_flash}))'
    ].join('\n')
    const out = execFileSync(pythonPath, ['-c', code], { encoding: 'utf-8' });
    return { ok: true, info: JSON.parse(out) };
  } catch (e: any) {
    return { ok: false, message: e?.message || String(e) };
  }
});

