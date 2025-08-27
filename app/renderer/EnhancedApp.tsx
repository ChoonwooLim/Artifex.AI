import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { GlobalStyles } from './styles/GlobalStyles';
import { Layout } from './components/Layout';
import { VideoGenerationView } from './views/VideoGenerationView';
import { theme } from './styles/theme';
import { 
  Sparkles, Play, Square, FolderOpen, Save, Settings2, 
  Cpu, CheckCircle, AlertCircle, Clock, Zap 
} from 'lucide-react';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { ProgressBar } from './components/ProgressBar';

declare global {
  interface Window {
    wanApi: {
      run: (payload: { pythonPath: string; scriptPath: string; args: string[]; cwd?: string }) => Promise<{ ok: boolean; message?: string }>;
      cancel: () => Promise<{ ok: boolean; message?: string }>;
      onStdout: (cb: (data: string) => void) => void;
      onStderr: (cb: (data: string) => void) => void;
      onClosed: (cb: (code: number) => void) => void;
      openFile: (filters?: { name: string; extensions: string[] }[]) => Promise<string | null>;
      openFolder: () => Promise<string | null>;
      getSettings: () => Promise<any>;
      setSettings: (data: any) => Promise<{ ok: boolean; message?: string }>;
      suggestCkpt: (task: string) => Promise<string[]>;
      validateImage: (imagePath: string) => Promise<{ ok: boolean; message?: string; size?: number }>;
      suggestPython: () => Promise<string[]>;
      validatePython: (pythonPath: string) => Promise<{ ok: boolean; message?: string; version?: string; torch?: string; diffusers?: string; pil?: string; cuda?: string }>;
      suggestScript: () => Promise<string[]>;
      showInFolder: (path: string) => Promise<void>;
      openPath: (path: string) => Promise<void>;
      gpuInfo: (pythonPath: string) => Promise<{ ok: boolean; info?: any }>;
    };
  }
}

// WAN Generation Core - 기존 기능 100% 유지
const WANGenerationCore: React.FC = () => {
  // 기존 main.tsx의 모든 state와 기능 유지
  const [task, setTask] = useState<'t2v-A14B' | 'i2v-A14B' | 'ti2v-5B'>('ti2v-5B');
  const SIZE_OPTIONS: Record<'t2v-A14B' | 'i2v-A14B' | 'ti2v-5B', string[]> = {
    't2v-A14B': ['480*832', '832*480', '1280*720', '720*1280'],
    'i2v-A14B': ['480*832', '832*480', '1280*720', '720*1280'],
    'ti2v-5B': ['1280*704', '704*1280']
  };
  const [size, setSize] = useState('1280*704');
  const [ckpt, setCkpt] = useState('');
  const [prompt, setPrompt] = useState('A cinematic sunset over mountain lake');
  const [imagePath, setImagePath] = useState('');
  const [pythonPath, setPythonPath] = useState('python');
  const [scriptPath, setScriptPath] = useState('');
  const [useOffload, setUseOffload] = useState(true);
  const [useConvertDtype, setUseConvertDtype] = useState(true);
  const [useT5Cpu, setUseT5Cpu] = useState(true);
  const [stepsState, setStepsState] = useState<number | null>(null);
  const [lengthSec, setLengthSec] = useState(5);
  const [fps, setFps] = useState(24);
  const [gpuCuda, setGpuCuda] = useState(true);
  const [gpuFp16, setGpuFp16] = useState(true);
  const [gpuFlash, setGpuFlash] = useState(false);
  
  const estText = useMemo(() => {
    const steps = (stepsState ?? (task.includes('ti2v') ? 50 : 40));
    const n = Math.max(1, Math.round((fps * lengthSec) / 4));
    const frameNum = 4 * n + 1;
    const m = size.match(/(\d+)\*(\d+)/);
    const area = m ? Number(m[1]) * Number(m[2]) : 1280 * 704;
    let baseSec = 300;
    let baseSteps = 40;
    let baseFrames = 81;
    let refArea = 480 * 832;
    if (task.includes('ti2v')) {
      baseSec = 540; baseSteps = 50; baseFrames = 121; refArea = 1280 * 704;
    } else if (task.includes('t2v')) {
      if (size.includes('1280*720') || size.includes('720*1280')) { baseSec = 360; refArea = 1280 * 720; }
      else { baseSec = 180; refArea = 480 * 832; }
    } else if (task.includes('i2v')) {
      baseSec = 240; baseSteps = 40; baseFrames = 81; refArea = area;
    }
    let est = baseSec * (steps / baseSteps) * (area / refArea) * (frameNum / baseFrames);
    let factor = 1;
    if (!gpuCuda) factor *= 8;
    if (!gpuFp16) factor *= 1.4;
    if (gpuFlash) factor *= 0.85;
    est *= factor;
    const mm = Math.max(0, Math.floor(est / 60));
    const ss = Math.max(0, Math.round(est % 60));
    return `예상 완료 ${mm}m ${ss}s`;
  }, [task, size, lengthSec, fps, gpuCuda, gpuFp16, gpuFlash, stepsState]);
  
  const [running, setRunning] = useState(false);
  const logRef = useRef<HTMLTextAreaElement>(null);
  const [outputDir, setOutputDir] = useState('');
  const [outputName, setOutputName] = useState('');
  const [lastOutput, setLastOutput] = useState('');
  const [phase, setPhase] = useState('Idle');
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState('');
  const genTimerRef = useRef<any>(null);
  const genEndRef = useRef<number>(0);
  const genStartRef = useRef<number>(0);
  const initTimerRef = useRef<any>(null);
  const parsedRef = useRef<{ steps?: number; frames?: number; size?: string; task?: string }>({});

  const appendLog = (line: string) => {
    if (!logRef.current) return;
    logRef.current.value += line;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  };

  const args = useMemo(() => {
    const a = [
      '--task', task,
      '--size', size,
      '--ckpt_dir', ckpt,
      '--prompt', prompt
    ];
    if (task !== 't2v-A14B' && imagePath) {
      a.push('--image', imagePath);
    }
    if (useOffload) a.push('--offload_model', 'True');
    if (useConvertDtype) a.push('--convert_model_dtype');
    if (useT5Cpu) a.push('--t5_cpu');
    const n = Math.max(1, Math.round((fps * lengthSec) / 4));
    const frameNum = 4 * n + 1;
    a.push('--frame_num', String(frameNum));
    a.push('--sample_steps', String(stepsState ?? (task.includes('ti2v') ? 50 : 40)));
    a.push('--fps_override', String(fps));
    return a;
  }, [task, size, ckpt, prompt, imagePath, useOffload, useConvertDtype, useT5Cpu, lengthSec, fps, stepsState]);

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true);
    logRef.current && (logRef.current.value = '');
    window.wanApi.onStdout((d) => {
      appendLog(d);
      const mArgs = d.match(/Generation job args: Namespace\((.*)\)/);
      if (mArgs) {
        const s = mArgs[1];
        const read = (key: string) => {
          const m = s.match(new RegExp(key + "=([^,\)]+)"));
          return m ? m[1] : undefined;
        };
        const steps = Number(read('sample_steps')) || undefined;
        const frames = Number(read('frame_num')) || undefined;
        const size = (read('size') || '').replace(/'/g, '');
        const taskVal = (read('task') || '').replace(/'/g, '');
        parsedRef.current = { steps, frames, size, task: taskVal };
      }
      const mTotal = d.match(/\[progress\] steps_total=(\d+)/);
      if (mTotal) {
        parsedRef.current.steps = Number(mTotal[1]);
        genStartRef.current = Date.now();
      }
      const mStep = d.match(/\[progress\] step=(\d+)\/(\d+)/);
      if (mStep) {
        const cur = Number(mStep[1]);
        const tot = Number(mStep[2]) || parsedRef.current.steps || 1;
        const pct = 70 + Math.min(29, Math.floor((cur / tot) * 29));
        setProgress(pct);
        const elapsed = (Date.now() - (genStartRef.current || Date.now())) / 1000;
        const perStep = elapsed / Math.max(1, cur);
        const remain = (tot - cur) * perStep;
        const m = Math.floor(remain / 60);
        const s = Math.floor(remain % 60);
        setEta(`${m}m ${s}s`);
      }

      if (/Creating Wan(TI2V|T2V|I2V) pipeline/i.test(d)) {
        setPhase('Initializing');
        clearInterval(initTimerRef.current);
        let p = 5;
        initTimerRef.current = setInterval(() => {
          p = Math.min(65, p + 2);
          setProgress(p);
        }, 800);
      }

      if (/loading .*umt5.*\.pth/i.test(d)) { setPhase('Loading T5'); setProgress((p)=>Math.max(p, 10)); }
      if (/loading .*VAE.*\.pth/i.test(d)) { setPhase('Loading VAE'); setProgress((p)=>Math.max(p, 20)); }
      if (/Creating WanModel/i.test(d)) { setPhase('Building model'); setProgress((p)=>Math.max(p, 25)); }
      const mShard = d.match(/Loading checkpoint shards:\s*(\d+)%/);
      if (mShard) { setPhase('Loading checkpoints'); const pct = Number(mShard[1]); setProgress(30 + Math.floor(pct * 0.4)); }
      if (/Generating video/i.test(d)) {
        setPhase('Generating');
        clearInterval(initTimerRef.current);
        const { steps, frames, size: sz, task: tk } = parsedRef.current;
        let baseSec = 300;
        if (tk?.includes('ti2v')) baseSec = 540;
        if (tk?.includes('t2v') && sz?.includes('480')) baseSec = 180;
        const step = steps || 40;
        const frame = frames || 81;
        const sizeArea = (() => { const m = (sz||'').match(/(\d+)\*(\d+)/); if(!m) return 1280*704; return Number(m[1])*Number(m[2]); })();
        const refArea = (tk?.includes('ti2v')) ? (1280*704) : (480*832);
        let est = baseSec * (step / (tk?.includes('ti2v') ? 50 : 40)) * (sizeArea / refArea) * (frame / (tk?.includes('ti2v') ? 121 : 81));
        const end = Date.now() + Math.max(60*1000, est*1000);
        genEndRef.current = end;
        const m0 = Math.floor(est/60);
        const s0 = Math.floor(est%60);
        setEta(`${m0}m ${s0}s`);
        clearInterval(genTimerRef.current);
        genTimerRef.current = setInterval(() => {
          const now = Date.now();
          const remain = Math.max(0, end - now);
          const pct = 70 + Math.min(25, Math.floor(((est*1000 - remain) / (est*1000)) * 25));
          setProgress(pct);
          const m = Math.floor(remain/60000);
          const s = Math.floor((remain%60000)/1000);
          setEta(`${m}m ${s}s`);
        }, 1000);
      }
      const mSave = d.match(/Saving generated video to (.*\.mp4)/i);
      if (mSave && mSave[1]) {
        setPhase('Saving');
        setLastOutput(mSave[1]);
        setProgress(99);
      }
      if (/Saving generated video to/i.test(d)) { setPhase('Saving'); setProgress(98); }
    });
    window.wanApi.onStderr((d) => appendLog(d));
    window.wanApi.onClosed((code) => {
      appendLog(`\n[closed] code=${code}\n`);
      const text = logRef.current?.value || '';
      const m = text.match(/Saving generated video to (.*\.mp4)/i);
      if (m && m[1]) {
        setLastOutput(m[1]);
      }
      setProgress(100); setPhase('Finished'); setEta(''); clearInterval(genTimerRef.current);
      setRunning(false);
    });
    let runArgs = args.slice();
    if (outputDir && outputName) {
      const name = outputName.endsWith('.mp4') ? outputName : outputName + '.mp4';
      const sep = outputDir.endsWith('\\') || outputDir.endsWith('/') ? '' : '\\';
      const savePath = `${outputDir}${sep}${name}`;
      runArgs = [...runArgs, '--save_file', savePath];
      appendLog(`\n[info] Output will be saved to: ${savePath}\n`);
    } else {
      appendLog(`\n[info] Output dir/name not set, file will be saved to script directory\n`);
    }
    const res = await window.wanApi.run({ pythonPath, scriptPath, args: runArgs, cwd: undefined });
    if (!res.ok) {
      appendLog(`\n[error] ${res.message}\n`);
      setRunning(false);
    }
  }, [running, pythonPath, scriptPath, args, outputDir, outputName]);

  const cancel = useCallback(async () => {
    if (!running) return;
    const res = await window.wanApi.cancel();
    if (!res.ok) appendLog(`\n[cancel-error] ${res.message}\n`);
  }, [running]);

  React.useEffect(() => {
    (async () => {
      const s = await window.wanApi.getSettings();
      s.pythonPath && setPythonPath(s.pythonPath);
      s.scriptPath && setScriptPath(s.scriptPath);
      s.ckpt && setCkpt(s.ckpt);
      if (s.task) {
        setTask(s.task);
        const opts = SIZE_OPTIONS[s.task as 't2v-A14B' | 'i2v-A14B' | 'ti2v-5B'];
        setSize((s.size && opts.includes(s.size)) ? s.size : opts[0]);
      } else {
        const opts = SIZE_OPTIONS[task];
        setSize((s.size && opts.includes(s.size)) ? s.size : opts[0]);
      }
      s.outputDir && setOutputDir(s.outputDir);
      s.outputName && setOutputName(s.outputName);
    })();
  }, []);

  const saveSettings = useCallback(async () => {
    await window.wanApi.setSettings({ pythonPath, scriptPath, ckpt, size, task, outputDir, outputName });
  }, [pythonPath, scriptPath, ckpt, size, task, outputDir, outputName]);

  const pickScript = useCallback(async () => {
    const f = await window.wanApi.openFile([{ name: 'Python', extensions: ['py'] }]);
    if (f) setScriptPath(f);
  }, []);
  
  const pickCkpt = useCallback(async () => {
    const d = await window.wanApi.openFolder();
    if (d) setCkpt(d);
  }, []);

  const pickOutputDir = useCallback(async () => {
    const d = await window.wanApi.openFolder();
    if (d) setOutputDir(d);
  }, []);

  const suggestOutputName = useCallback(() => {
    const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const safePrompt = (prompt || 'video').replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_').slice(0, 40);
    const base = `${task}_${size.replace('*','x')}_${safePrompt}_${ts}`;
    setOutputName(base + '.mp4');
  }, [task, size, prompt]);

  const autoDetect = useCallback(async () => {
    const list = await window.wanApi.suggestCkpt(task);
    if (!list || list.length === 0) {
      appendLog(`\n[hint] No checkpoint candidates found for task ${task}.`);
      return;
    }
    setCkpt(list[0]);
    appendLog(`\n[hint] Auto-detected checkpoint: ${list[0]}`);
  }, [task]);

  const validateImg = useCallback(async () => {
    if (!imagePath) { appendLog('\n[hint] Image path is empty.'); return; }
    const r = await window.wanApi.validateImage(imagePath);
    appendLog(`\n[validate-image] ${r.ok ? 'OK' : 'FAIL'} ${r.message || ''} size=${r.size ?? '-'} bytes`);
  }, [imagePath]);

  const pickImage = useCallback(async () => {
    const f = await window.wanApi.openFile([
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }
    ]);
    if (f) setImagePath(f);
  }, []);

  const suggestPy = useCallback(async () => {
    const list = await window.wanApi.suggestPython();
    if (list && list.length) {
      setPythonPath(list[0]);
      appendLog(`\n[hint] Python candidate: ${list[0]}`);
    } else {
      appendLog('\n[hint] No python candidate found.');
    }
  }, []);

  const validatePy = useCallback(async () => {
    const r = await window.wanApi.validatePython(pythonPath);
    if (r.ok) {
      appendLog(`\n[validate-python] OK version=${r.version} torch=${r.torch} cuda=${r.cuda} diffusers=${r.diffusers} pil=${r.pil}`);
      setGpuCuda(r.cuda === 'available');
      const gi = await window.wanApi.gpuInfo(pythonPath);
      if (gi?.ok && gi.info) {
        const info = gi.info as any;
        appendLog(`\n[gpu] name=${info.name} vram=${Math.round((info.total_memory||0)/1e9)}GB cuda=${info.cuda_version} bf16=${info.bf16} flash_attn=${info.flash_attn}`);
        setGpuFp16(Boolean(info.bf16));
        setGpuFlash(Boolean(info.flash_attn));
      }
    } else {
      appendLog(`\n[validate-python] FAIL ${r.message}`);
    }
  }, [pythonPath]);

  const quickMode = useCallback(() => {
    setLengthSec(3);
    setFps(16);
    setStepsState(30);
    if (task.includes('ti2v')) {
      setUseT5Cpu(true);
      setUseOffload(true);
    } else {
      setUseT5Cpu(true);
      setUseOffload(true);
    }
  }, [task]);

  const suggestScript = useCallback(async () => {
    const list = await window.wanApi.suggestScript();
    if (list && list.length) {
      setScriptPath(list[0]);
      appendLog(`\n[hint] Script candidate: ${list[0]}`);
    } else {
      appendLog('\n[hint] No generate.py found nearby.');
    }
  }, []);

  const disabled = !scriptPath || !ckpt || !size || !task;

  return (
    <div style={{ padding: theme.spacing.xl, maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ marginBottom: theme.spacing.xl }}>
        <h1 style={{
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          marginBottom: theme.spacing.sm,
          background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          WAN 2.2 Professional Video Generation
        </h1>
        <p style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.lg }}>
          Enterprise-grade AI video synthesis with state-of-the-art models
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: theme.spacing.xl }}>
        <div>
          <Card variant="glass">
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 200px 1fr', gap: 8, alignItems: 'center' }}>
              <label>Task</label>
              <select value={task} onChange={(e) => { const t = e.target.value as 't2v-A14B' | 'i2v-A14B' | 'ti2v-5B'; setTask(t); setSize(SIZE_OPTIONS[t][0]); }}
                style={{
                  padding: theme.spacing.md,
                  background: theme.colors.backgroundTertiary,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.text,
                  cursor: 'pointer',
                  outline: 'none',
                }}>
                <option value="t2v-A14B">Text to Video (14B)</option>
                <option value="i2v-A14B">Image to Video (14B)</option>
                <option value="ti2v-5B">Text+Image to Video (5B)</option>
              </select>
              <label>Size</label>
              <select value={size} onChange={(e) => setSize(e.target.value)}
                style={{
                  padding: theme.spacing.md,
                  background: theme.colors.backgroundTertiary,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.text,
                  cursor: 'pointer',
                  outline: 'none',
                }}>
                {SIZE_OPTIONS[task].map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </select>

              <label>Checkpoint</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input style={{ flex: 1, padding: theme.spacing.sm, background: theme.colors.backgroundTertiary, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.sm, color: theme.colors.text, outline: 'none' }} value={ckpt} onChange={(e) => setCkpt(e.target.value)} />
                <Button variant="ghost" size="sm" onClick={pickCkpt}>Browse</Button>
                <Button variant="secondary" size="sm" onClick={autoDetect}>Auto</Button>
              </div>
              <label>Prompt</label>
              <input value={prompt} onChange={(e) => setPrompt(e.target.value)}
                style={{
                  padding: theme.spacing.md,
                  background: theme.colors.backgroundTertiary,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.text,
                  outline: 'none',
                }} />

              <label>Length (sec)</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input style={{ width: 80, padding: theme.spacing.sm, background: theme.colors.backgroundTertiary, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.sm, color: theme.colors.text, outline: 'none' }} value={lengthSec} onChange={(e) => setLengthSec(Number(e.target.value))} />
                <select onChange={(e)=>{ const v=e.target.value; if(v==='3s24') { setLengthSec(3); setFps(24); } else if(v==='5s24'){ setLengthSec(5); setFps(24);} else if(v==='5s16'){ setLengthSec(5); setFps(16);} }}
                  style={{
                    padding: theme.spacing.sm,
                    background: theme.colors.backgroundTertiary,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    color: theme.colors.text,
                    cursor: 'pointer',
                    outline: 'none',
                  }}>
                  <option value="">preset</option>
                  <option value="3s24">3s / 24fps</option>
                  <option value="5s24">5s / 24fps</option>
                  <option value="5s16">5s / 16fps</option>
                </select>
                <span style={{ opacity: 0.8, color: theme.colors.textSecondary }}>{estText}</span>
              </div>
              <label>FPS</label>
              <input style={{ width: 80, padding: theme.spacing.sm, background: theme.colors.backgroundTertiary, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.sm, color: theme.colors.text, outline: 'none' }} value={fps} onChange={(e) => setFps(Number(e.target.value))} />

              <label>Output folder</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input style={{ flex: 1, padding: theme.spacing.sm, background: theme.colors.backgroundTertiary, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.sm, color: theme.colors.text, outline: 'none' }} value={outputDir} onChange={(e) => setOutputDir(e.target.value)} placeholder="(optional)" />
                <Button variant="ghost" size="sm" onClick={pickOutputDir}>Browse</Button>
              </div>
              <label>Output filename</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input style={{ flex: 1, padding: theme.spacing.sm, background: theme.colors.backgroundTertiary, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.sm, color: theme.colors.text, outline: 'none' }} value={outputName} onChange={(e) => setOutputName(e.target.value)} placeholder="video.mp4" />
                <Button variant="ghost" size="sm" onClick={suggestOutputName}>Suggest</Button>
              </div>

              <label>Image (I2V/TI2V)</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input style={{ flex: 1, padding: theme.spacing.sm, background: theme.colors.backgroundTertiary, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.sm, color: theme.colors.text, outline: 'none' }} value={imagePath} onChange={(e) => setImagePath(e.target.value)} />
                <Button variant="ghost" size="sm" onClick={pickImage}>Browse</Button>
                <Button variant="ghost" size="sm" onClick={validateImg}>Validate</Button>
              </div>
              <label>Python path</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input style={{ flex: 1, padding: theme.spacing.sm, background: theme.colors.backgroundTertiary, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.sm, color: theme.colors.text, outline: 'none' }} value={pythonPath} onChange={(e) => setPythonPath(e.target.value)} />
                <Button variant="ghost" size="sm" onClick={suggestPy}>Suggest</Button>
                <Button variant="ghost" size="sm" onClick={validatePy}>Validate</Button>
              </div>
              <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={gpuCuda} onChange={(e)=>setGpuCuda(e.target.checked)} /> CUDA</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={gpuFp16} onChange={(e)=>setGpuFp16(e.target.checked)} /> FP16</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={gpuFlash} onChange={(e)=>setGpuFlash(e.target.checked)} /> FlashAttn</label>
              </div>

              <label>Script path</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input style={{ flex: 1, padding: theme.spacing.sm, background: theme.colors.backgroundTertiary, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.sm, color: theme.colors.text, outline: 'none' }} value={scriptPath} onChange={(e) => setScriptPath(e.target.value)} />
                <Button variant="ghost" size="sm" onClick={pickScript}>Browse</Button>
                <Button variant="ghost" size="sm" onClick={suggestScript}>Suggest</Button>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={useOffload} onChange={(e) => setUseOffload(e.target.checked)} /> offload</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={useConvertDtype} onChange={(e) => setUseConvertDtype(e.target.checked)} /> convert</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={useT5Cpu} onChange={(e) => setUseT5Cpu(e.target.checked)} /> t5_cpu</label>
              </div>
            </div>

            <div style={{ marginTop: theme.spacing.xl, display: 'flex', gap: theme.spacing.md }}>
              <Button onClick={run} disabled={running || disabled} variant="primary" size="lg" icon={<Play />} fullWidth>
                {running ? 'Generating...' : 'Generate Video'}
              </Button>
              <Button onClick={cancel} disabled={!running} variant="danger" size="lg" icon={<Square />}>
                Cancel
              </Button>
              <Button onClick={saveSettings} variant="ghost" size="lg" icon={<Save />}>
                Save Settings
              </Button>
              <Button onClick={quickMode} variant="secondary" size="lg" icon={<Zap />}>
                Quick Mode
              </Button>
            </div>

            {running && (
              <div style={{ marginTop: theme.spacing.lg }}>
                <ProgressBar value={progress} label={phase} showPercentage variant="gradient" size="lg" />
                {eta && <div style={{ marginTop: theme.spacing.sm, color: theme.colors.textSecondary }}>ETA: {eta}</div>}
              </div>
            )}

            <div style={{ marginTop: theme.spacing.lg }}>
              <textarea ref={logRef} style={{
                width: '100%',
                height: 300,
                fontFamily: theme.typography.fontFamilyMono,
                background: theme.colors.backgroundSecondary,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.sm,
                resize: 'vertical',
                outline: 'none',
              }} readOnly />
              {lastOutput && (
                <>
                  <video src={lastOutput} style={{ width: '100%', marginTop: theme.spacing.lg, borderRadius: theme.borderRadius.md }} controls />
                  <div style={{ marginTop: theme.spacing.md, display: 'flex', gap: theme.spacing.md }}>
                    <Button onClick={() => window.wanApi.showInFolder(lastOutput)} variant="ghost" icon={<FolderOpen />}>
                      Open in Folder
                    </Button>
                    <Button onClick={() => window.wanApi.openPath(lastOutput)} variant="secondary" icon={<Play />}>
                      Preview
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        <div>
          <Card variant="glass" style={{ marginBottom: theme.spacing.xl }}>
            <h3 style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.lg,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
            }}>
              <Cpu size={20} />
              System Status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.xs }}>
                  <span style={{ color: theme.colors.textSecondary }}>GPU</span>
                  <span style={{ color: gpuCuda ? theme.colors.success : theme.colors.error }}>
                    {gpuCuda ? 'CUDA Available' : 'CPU Mode'}
                  </span>
                </div>
                <ProgressBar value={gpuCuda ? 100 : 0} showPercentage={false} size="sm" variant={gpuCuda ? "gradient" : "default"} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.xs }}>
                  <span style={{ color: theme.colors.textSecondary }}>FP16</span>
                  <span style={{ color: gpuFp16 ? theme.colors.success : theme.colors.warning }}>
                    {gpuFp16 ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.xs }}>
                  <span style={{ color: theme.colors.textSecondary }}>Flash Attention</span>
                  <span style={{ color: gpuFlash ? theme.colors.success : theme.colors.warning }}>
                    {gpuFlash ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card variant="glass">
            <h3 style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.lg,
            }}>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
              <Button variant="ghost" fullWidth onClick={() => { setLengthSec(2); setFps(12); setStepsState(20); }}>
                Ultra Fast (2s, 12fps, 20 steps)
              </Button>
              <Button variant="ghost" fullWidth onClick={() => { setLengthSec(3); setFps(16); setStepsState(30); }}>
                Fast Preview (3s, 16fps, 30 steps)
              </Button>
              <Button variant="ghost" fullWidth onClick={() => { setLengthSec(5); setFps(24); setStepsState(50); }}>
                Standard (5s, 24fps, 50 steps)
              </Button>
              <Button variant="ghost" fullWidth onClick={() => { setLengthSec(5); setFps(30); setStepsState(75); }}>
                High Quality (5s, 30fps, 75 steps)
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export const EnhancedApp: React.FC = () => {
  const [activeView, setActiveView] = useState('gen-ti2v');

  return (
    <>
      <GlobalStyles />
      <Layout activeView={activeView} onViewChange={setActiveView}>
        <AnimatePresence mode="wait">
          {activeView.startsWith('gen-') && <WANGenerationCore key="generation" />}
          {activeView === 'dashboard' && (
            <div style={{ padding: theme.spacing.xl }}>
              <h1>Dashboard Coming Soon</h1>
            </div>
          )}
        </AnimatePresence>
      </Layout>
    </>
  );
};

export default EnhancedApp;