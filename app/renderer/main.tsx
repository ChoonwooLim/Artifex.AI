import React, { useCallback, useMemo, useRef, useState } from 'react';
import Flow from './workflow/Flow';
import T2I from './t2i';
import { createRoot } from 'react-dom/client';

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
    };
  }
}

const App: React.FC = () => {
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
    // heuristic estimate before run
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
    // GPU spec correction
    let factor = 1;
    if (!gpuCuda) factor *= 8; // CPU fallback is much slower
    if (!gpuFp16) factor *= 1.4; // no FP16/bfloat16 speed
    if (gpuFlash) factor *= 0.85; // flash-attn roughly ~15% faster
    est *= factor;
    const mm = Math.max(0, Math.floor(est / 60));
    const ss = Math.max(0, Math.round(est % 60));
    return `예상 완료 ${mm}m ${ss}s`;
  }, [task, size, lengthSec, fps, gpuCuda, gpuFp16, gpuFlash, stepsState]);
  const [running, setRunning] = useState(false);
  const logRef = useRef<HTMLTextAreaElement>(null);

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
    // frame_num = 4n+1, n = round(fps*length/4)
    const n = Math.max(1, Math.round((fps * lengthSec) / 4));
    const frameNum = 4 * n + 1;
    a.push('--frame_num', String(frameNum));
    a.push('--sample_steps', String(stepsState ?? (task.includes('ti2v') ? 50 : 40)));
    // fps_override removed - not supported in well branch
    return a;
  }, [task, size, ckpt, prompt, imagePath, useOffload, useConvertDtype, useT5Cpu, lengthSec, fps, stepsState]);

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

  const toFileUrl = (p: string) => {
    if (!p) return '';
    // windows local path -> file:///C:/...
    let u = 'file:///' + p.replace(/\\/g, '/');
    return u;
  };

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true);
    logRef.current && (logRef.current.value = '');
    window.wanApi.onStdout((d) => {
      appendLog(d);
      // parse args
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
      // parse structured progress
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
        // ETA by average per step
        const elapsed = (Date.now() - (genStartRef.current || Date.now())) / 1000;
        const perStep = elapsed / Math.max(1, cur);
        const remain = (tot - cur) * perStep;
        const m = Math.floor(remain / 60);
        const s = Math.floor(remain % 60);
        setEta(`${m}m ${s}s`);
      }

      // fallback: show init progress as soon as pipeline starts
      if (/Creating Wan(TI2V|T2V|I2V) pipeline/i.test(d)) {
        setPhase('Initializing');
        clearInterval(initTimerRef.current);
        let p = 5;
        initTimerRef.current = setInterval(() => {
          p = Math.min(65, p + 2);
          setProgress(p);
        }, 800);
      }

      // loading phases
      if (/loading .*umt5.*\.pth/i.test(d)) { setPhase('Loading T5'); setProgress((p)=>Math.max(p, 10)); }
      if (/loading .*VAE.*\.pth/i.test(d)) { setPhase('Loading VAE'); setProgress((p)=>Math.max(p, 20)); }
      if (/Creating WanModel/i.test(d)) { setPhase('Building model'); setProgress((p)=>Math.max(p, 25)); }
      const mShard = d.match(/Loading checkpoint shards:\s*(\d+)%/);
      if (mShard) { setPhase('Loading checkpoints'); const pct = Number(mShard[1]); setProgress(30 + Math.floor(pct * 0.4)); }
      if (/Generating video/i.test(d)) {
        setPhase('Generating');
        clearInterval(initTimerRef.current);
        // estimate ETA heuristically
        const { steps, frames, size: sz, task: tk } = parsedRef.current;
        let baseSec = 300; // default 5min
        if (tk?.includes('ti2v')) baseSec = 540; // 9min for 50 steps @ 720p ~ README
        if (tk?.includes('t2v') && sz?.includes('480')) baseSec = 180; // guess 3min @ 40 steps
        const step = steps || 40;
        const frame = frames || 81;
        const sizeArea = (() => { const m = (sz||'').match(/(\d+)\*(\d+)/); if(!m) return 1280*704; return Number(m[1])*Number(m[2]); })();
        const refArea = (tk?.includes('ti2v')) ? (1280*704) : (480*832);
        let est = baseSec * (step / (tk?.includes('ti2v') ? 50 : 40)) * (sizeArea / refArea) * (frame / (tk?.includes('ti2v') ? 121 : 81));
        const end = Date.now() + Math.max(60*1000, est*1000);
        genEndRef.current = end;
        // show ETA immediately
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
      // try parse last "Saving generated video to ..." line
      const text = logRef.current?.value || '';
      const m = text.match(/Saving generated video to (.*\.mp4)/i);
      if (m && m[1]) {
        setLastOutput(m[1]);
      }
      setProgress(100); setPhase('Finished'); setEta(''); clearInterval(genTimerRef.current);
      setRunning(false);
    });
    // attach save_file if both dir and name provided
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

  // load saved settings
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
    // choose first for now; later we can show a picker
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
      // fetch GPU info
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
    // conservative defaults; 사용가능 VRAM 높으면 사용자가 해제 가능
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

  const [mode, setMode] = useState<'simple' | 'node' | 't2i'>('simple');

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0f0f1e 0%, #1a1a2e 100%)',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(90deg, rgba(30,30,60,0.95) 0%, rgba(40,40,80,0.95) 100%)',
        backdropFilter: 'blur(20px)',
        padding: '20px 24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #00ffff, #ff00ff, #ffff00, #00ffff)',
          backgroundSize: '200% 100%',
          animation: 'gradient 3s ease infinite'
        }}/>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              boxShadow: '0 4px 12px rgba(102,126,234,0.4)'
            }}>🎬</div>
            <div>
              <h1 style={{ 
                fontSize: '28px', 
                fontWeight: '800',
                background: 'linear-gradient(135deg, #fff 0%, #e0e0e0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
                letterSpacing: '-0.5px'
              }}>WAN 2.2 Professional</h1>
              <p style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.7)',
                margin: 0,
                marginTop: '2px',
                letterSpacing: '0.5px'
              }}>AI Video Generation Suite</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '20px',
              fontSize: '14px',
              color: 'rgba(255,255,255,0.8)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{phase}</span>
              {phase === 'Generating' && <span style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                background: '#4ade80',
                borderRadius: '50%',
                animation: 'pulse 2s ease-in-out infinite'
              }}/>}
            </div>
            {eta && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>ETA: {eta}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${progress}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, #667eea, #764ba2)', 
              transition: 'width 0.5s',
              boxShadow: '0 0 10px rgba(102,126,234,0.5)'
            }} />
          </div>
          <span style={{ 
            minWidth: '45px', 
            textAlign: 'right', 
            fontSize: '14px',
            fontWeight: '600',
            color: '#667eea'
          }}>{progress}%</span>
        </div>
      </div>
      
      <div style={{ padding: '24px' }}>
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '24px',
          background: 'rgba(255,255,255,0.05)',
          padding: '8px',
          borderRadius: '12px',
          width: 'fit-content'
        }}>
          <button 
            onClick={saveSettings}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.3s',
              boxShadow: '0 2px 8px rgba(102,126,234,0.3)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >💾 Save Defaults</button>
          <button 
            onClick={() => setMode('simple')}
            style={{
              padding: '10px 20px',
              background: mode === 'simple' ? 'rgba(102,126,234,0.3)' : 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid',
              borderColor: mode === 'simple' ? '#667eea' : 'rgba(255,255,255,0.2)',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.3s'
            }}
          >🎯 Simple</button>
          <button 
            onClick={() => setMode('node')}
            style={{
              padding: '10px 20px',
              background: mode === 'node' ? 'rgba(102,126,234,0.3)' : 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid',
              borderColor: mode === 'node' ? '#667eea' : 'rgba(255,255,255,0.2)',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.3s'
            }}
          >🔗 Node</button>
          <button 
            onClick={() => setMode('t2i')}
            style={{
              padding: '10px 20px',
              background: mode === 't2i' ? 'rgba(102,126,234,0.3)' : 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid',
              borderColor: mode === 't2i' ? '#667eea' : 'rgba(255,255,255,0.2)',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.3s'
            }}
          >🖼️ T2I</button>
          <button 
            onClick={quickMode}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #00d4ff, #00ff88)',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.3s',
              boxShadow: '0 2px 8px rgba(0,212,255,0.3)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >⚡ 빠른 모드</button>
        </div>
      {mode === 't2i' ? (
        <T2I />
      ) : mode === 'node' ? (
        <Flow />
      ) : (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '200px 1fr 200px 1fr', 
        gap: '16px', 
        alignItems: 'center',
        background: 'rgba(255,255,255,0.03)',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <label style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '600' }}>Task</label>
        <select 
          value={task} 
          onChange={(e) => { const t = e.target.value as 't2v-A14B' | 'i2v-A14B' | 'ti2v-5B'; setTask(t); setSize(SIZE_OPTIONS[t][0]); }}
          style={{
            padding: '10px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            cursor: 'pointer'
          }}>
          <option value="t2v-A14B">t2v-A14B</option>
          <option value="i2v-A14B">i2v-A14B</option>
          <option value="ti2v-5B">ti2v-5B</option>
        </select>
        <label style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '600' }}>Size</label>
        <select 
          value={size} 
          onChange={(e) => setSize(e.target.value)}
          style={{
            padding: '10px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            cursor: 'pointer'
          }}>
          {SIZE_OPTIONS[task].map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
        </select>

        <label style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '600' }}>Checkpoint dir</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input 
            style={{ 
              flex: 1,
              padding: '10px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px'
            }} 
            value={ckpt} 
            onChange={(e) => setCkpt(e.target.value)} />
          <button 
            onClick={pickCkpt}
            style={{
              padding: '10px 16px',
              background: 'rgba(102,126,234,0.2)',
              color: '#fff',
              border: '1px solid rgba(102,126,234,0.3)',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(102,126,234,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(102,126,234,0.2)'; }}
          >Browse</button>
          <button 
            onClick={autoDetect}
            style={{
              padding: '10px 16px',
              background: 'rgba(102,126,234,0.2)',
              color: '#fff',
              border: '1px solid rgba(102,126,234,0.3)',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(102,126,234,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(102,126,234,0.2)'; }}
          >Auto-detect</button>
        </div>
        <label style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '600' }}>Prompt</label>
        <input 
          value={prompt} 
          onChange={(e) => setPrompt(e.target.value)}
          style={{
            padding: '10px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px'
          }} />

        <label>Length (sec)</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input style={{ width: 80 }} value={lengthSec} onChange={(e) => setLengthSec(Number(e.target.value))} />
          <select onChange={(e)=>{ const v=e.target.value; if(v==='3s24') { setLengthSec(3); setFps(24); } else if(v==='5s24'){ setLengthSec(5); setFps(24);} else if(v==='5s16'){ setLengthSec(5); setFps(16);} }}>
            <option value="">preset</option>
            <option value="3s24">3s / 24fps</option>
            <option value="5s24">5s / 24fps</option>
            <option value="5s16">5s / 16fps</option>
          </select>
          <span style={{ opacity: 0.8 }}>{estText}</span>
        </div>
        <label>FPS</label>
        <input style={{ width: 80 }} value={fps} onChange={(e) => setFps(Number(e.target.value))} />

        <label>Output folder</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input style={{ flex: 1 }} value={outputDir} onChange={(e) => setOutputDir(e.target.value)} placeholder="(optional) default: script folder" />
          <button onClick={pickOutputDir}>Browse</button>
        </div>
        <label>Output filename</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input style={{ flex: 1 }} value={outputName} onChange={(e) => setOutputName(e.target.value)} placeholder="example: my_video.mp4" />
          <button onClick={suggestOutputName}>Suggest name</button>
        </div>

        <label>Image (for I2V/TI2V)</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input style={{ flex: 1 }} value={imagePath} onChange={(e) => setImagePath(e.target.value)} />
          <button onClick={pickImage}>Browse</button>
          <button onClick={validateImg}>Validate</button>
        </div>
        <label>Python path</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input style={{ flex: 1 }} value={pythonPath} onChange={(e) => setPythonPath(e.target.value)} />
          <button onClick={suggestPy}>Suggest</button>
          <button onClick={validatePy}>Validate</button>
        </div>
        <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 16 }}>
          <label><input type="checkbox" checked={gpuCuda} onChange={(e)=>setGpuCuda(e.target.checked)} /> CUDA</label>
          <label><input type="checkbox" checked={gpuFp16} onChange={(e)=>setGpuFp16(e.target.checked)} /> FP16/bfloat16</label>
          <label><input type="checkbox" checked={gpuFlash} onChange={(e)=>setGpuFlash(e.target.checked)} /> FlashAttention</label>
        </div>

        <label>Script path</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input style={{ flex: 1 }} value={scriptPath} onChange={(e) => setScriptPath(e.target.value)} />
          <button onClick={pickScript}>Browse</button>
          <button onClick={suggestScript}>Suggest</button>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <label><input type="checkbox" checked={useOffload} onChange={(e) => setUseOffload(e.target.checked)} /> offload</label>
          <label><input type="checkbox" checked={useConvertDtype} onChange={(e) => setUseConvertDtype(e.target.checked)} /> convert dtype</label>
          <label><input type="checkbox" checked={useT5Cpu} onChange={(e) => setUseT5Cpu(e.target.checked)} /> t5 cpu</label>
        </div>
      </div>
      )}

      {mode === 'simple' && (<div style={{ 
        marginTop: '24px', 
        display: 'flex', 
        gap: '12px', 
        flexWrap: 'wrap', 
        alignItems: 'center',
        padding: '20px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <button 
          onClick={run} 
          disabled={running || disabled}
          style={{
            padding: '12px 32px',
            background: (running || disabled) ? 'rgba(100,100,100,0.3)' : 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '700',
            cursor: (running || disabled) ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            transition: 'all 0.3s',
            boxShadow: (running || disabled) ? 'none' : '0 4px 16px rgba(102,126,234,0.4)',
            opacity: (running || disabled) ? 0.5 : 1
          }}
          onMouseEnter={(e) => { if (!running && !disabled) e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >🚀 Run</button>
        <button 
          onClick={cancel} 
          disabled={!running}
          style={{
            padding: '12px 24px',
            background: !running ? 'rgba(100,100,100,0.3)' : 'rgba(244,63,94,0.2)',
            color: '#fff',
            border: '1px solid',
            borderColor: !running ? 'rgba(100,100,100,0.3)' : 'rgba(244,63,94,0.4)',
            borderRadius: '10px',
            fontWeight: '600',
            cursor: !running ? 'not-allowed' : 'pointer',
            fontSize: '15px',
            transition: 'all 0.3s',
            opacity: !running ? 0.5 : 1
          }}
        >❌ Cancel</button>
        <button 
          onClick={() => lastOutput && window.wanApi.showInFolder(lastOutput)} 
          disabled={!lastOutput}
          style={{
            padding: '12px 24px',
            background: !lastOutput ? 'rgba(100,100,100,0.3)' : 'rgba(255,255,255,0.1)',
            color: '#fff',
            border: '1px solid',
            borderColor: !lastOutput ? 'rgba(100,100,100,0.3)' : 'rgba(255,255,255,0.2)',
            borderRadius: '10px',
            fontWeight: '600',
            cursor: !lastOutput ? 'not-allowed' : 'pointer',
            fontSize: '15px',
            transition: 'all 0.3s',
            opacity: !lastOutput ? 0.5 : 1
          }}
        >📁 Open in folder</button>
        <button 
          onClick={() => lastOutput && window.wanApi.openPath(lastOutput)} 
          disabled={!lastOutput}
          style={{
            padding: '12px 24px',
            background: !lastOutput ? 'rgba(100,100,100,0.3)' : 'rgba(255,255,255,0.1)',
            color: '#fff',
            border: '1px solid',
            borderColor: !lastOutput ? 'rgba(100,100,100,0.3)' : 'rgba(255,255,255,0.2)',
            borderRadius: '10px',
            fontWeight: '600',
            cursor: !lastOutput ? 'not-allowed' : 'pointer',
            fontSize: '15px',
            transition: 'all 0.3s',
            opacity: !lastOutput ? 0.5 : 1
          }}
        >👁️ Preview</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 240, height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#4caf50', transition: 'width 0.5s' }} />
          </div>
          <span>{phase}</span>
          {eta && <span>ETA {eta}</span>}
        </div>
      </div>)}

      {mode === 'simple' && (<div style={{ marginTop: '20px' }}>
        <textarea 
          ref={logRef} 
          style={{ 
            width: '100%', 
            height: '300px', 
            fontFamily: 'Consolas, monospace',
            background: 'rgba(0,0,0,0.5)',
            color: '#00ff88',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '13px',
            lineHeight: '1.6',
            resize: 'vertical'
          }} 
          readOnly />
        {lastOutput && (
          <video 
            src={lastOutput} 
            style={{ 
              width: '100%', 
              marginTop: '20px',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }} 
            controls />
        )}
      </div>)}
      </div>
      
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        button:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(102,126,234,0.3);
        }
        select:focus, input:focus, textarea:focus {
          outline: none;
          border-color: rgba(102,126,234,0.5) !important;
          box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
        }
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 5px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(102,126,234,0.3);
          border-radius: 5px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(102,126,234,0.5);
        }
      `}</style>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);


