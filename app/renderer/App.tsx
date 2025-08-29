import * as React from 'react';
const { useState, useEffect, useCallback, useMemo, useRef } = React;
import VideoEditor from './workflow/VideoEditor';
import VideoTimeline from './workflow/VideoTimeline';
import VideoEffects from './workflow/VideoEffects';
import VideoExport from './workflow/VideoExport';
import CinematicControls from './workflow/CinematicControls';
import Flow from './workflow/Flow';
import SimpleFlow from './workflow/SimpleFlow';

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
      gpuInfo?: (pythonPath: string) => Promise<{ ok: boolean; info?: any }>;
      showInFolder?: (path: string) => void;
      openPath?: (path: string) => void;
    };
  }
}

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'wan' | 'editor' | 'timeline' | 'effects' | 'export' | 'cinematic' | 'flow' | 'node'>('wan');
  const [isAnimated, setIsAnimated] = useState(false);

  // WAN generation states
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
  const [running, setRunning] = useState(false);
  const [outputDir, setOutputDir] = useState('');
  const [outputName, setOutputName] = useState('');
  const [lastOutput, setLastOutput] = useState('');
  const [phase, setPhase] = useState('Idle');
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState('');
  
  const logRef = useRef<HTMLTextAreaElement>(null);
  const genTimerRef = useRef<any>(null);
  const genEndRef = useRef<number>(0);
  const genStartRef = useRef<number>(0);
  const initTimerRef = useRef<any>(null);
  const parsedRef = useRef<{ steps?: number; frames?: number; size?: string; task?: string }>({});

  useEffect(() => {
    setIsAnimated(true);
    // Load saved settings
    (async () => {
      if (window.wanApi) {
        const s = await window.wanApi.getSettings();
        s.pythonPath && setPythonPath(s.pythonPath);
        s.scriptPath && setScriptPath(s.scriptPath);
        s.ckpt && setCkpt(s.ckpt);
        if (s.task) {
          setTask(s.task);
          const opts = SIZE_OPTIONS[s.task as 't2v-A14B' | 'i2v-A14B' | 'ti2v-5B'];
          setSize((s.size && opts.includes(s.size)) ? s.size : opts[0]);
        }
        s.outputDir && setOutputDir(s.outputDir);
        s.outputName && setOutputName(s.outputName);
      }
    })();
  }, []);

  const navItems = [
    { id: 'wan', label: 'WAN Generate', icon: '🎬' },
    { id: 'editor', label: 'Node Editor', icon: '🎨' },
    { id: 'timeline', label: 'Timeline', icon: '⏱️' },
    { id: 'effects', label: 'Effects', icon: '✨' },
    { id: 'cinematic', label: 'Cinematic', icon: '🎥' },
    { id: 'export', label: 'Export', icon: '📤' },
    { id: 'flow', label: 'WAN Flow', icon: '🌊' }
  ];

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
    return a;
  }, [task, size, ckpt, prompt, imagePath, useOffload, useConvertDtype, useT5Cpu, lengthSec, fps, stepsState]);

  const appendLog = (line: string) => {
    if (!logRef.current) return;
    logRef.current.value += line;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  };

  const run = useCallback(async () => {
    if (running || !window.wanApi) return;
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
      }
      
      const mSave = d.match(/Saving generated video to (.*\.mp4)/i);
      if (mSave && mSave[1]) {
        setPhase('Saving');
        setLastOutput(mSave[1]);
        setProgress(99);
      }
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
    }
    
    const res = await window.wanApi.run({ pythonPath, scriptPath, args: runArgs, cwd: undefined });
    if (!res.ok) {
      appendLog(`\n[error] ${res.message}\n`);
      setRunning(false);
    }
  }, [running, pythonPath, scriptPath, args, outputDir, outputName]);

  const cancel = useCallback(async () => {
    if (!running || !window.wanApi) return;
    const res = await window.wanApi.cancel();
    if (!res.ok) appendLog(`\n[cancel-error] ${res.message}\n`);
  }, [running]);

  const saveSettings = useCallback(async () => {
    if (window.wanApi) {
      await window.wanApi.setSettings({ pythonPath, scriptPath, ckpt, size, task, outputDir, outputName });
    }
  }, [pythonPath, scriptPath, ckpt, size, task, outputDir, outputName]);

  const pickScript = useCallback(async () => {
    if (!window.wanApi) return;
    const f = await window.wanApi.openFile([{ name: 'Python', extensions: ['py'] }]);
    if (f) setScriptPath(f);
  }, []);

  const pickCkpt = useCallback(async () => {
    if (!window.wanApi) return;
    const d = await window.wanApi.openFolder();
    if (d) setCkpt(d);
  }, []);

  const pickOutputDir = useCallback(async () => {
    if (!window.wanApi) return;
    const d = await window.wanApi.openFolder();
    if (d) setOutputDir(d);
  }, []);

  const pickImage = useCallback(async () => {
    if (!window.wanApi) return;
    const f = await window.wanApi.openFile([
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }
    ]);
    if (f) setImagePath(f);
  }, []);

  const autoDetect = useCallback(async () => {
    if (!window.wanApi) return;
    const list = await window.wanApi.suggestCkpt(task);
    if (!list || list.length === 0) {
      appendLog(`\n[hint] No checkpoint candidates found for task ${task}.`);
      return;
    }
    setCkpt(list[0]);
    appendLog(`\n[hint] Auto-detected checkpoint: ${list[0]}`);
  }, [task]);

  const suggestOutputName = useCallback(() => {
    const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const safePrompt = (prompt || 'video').replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_').slice(0, 40);
    const base = `${task}_${size.replace('*','x')}_${safePrompt}_${ts}`;
    setOutputName(base + '.mp4');
  }, [task, size, prompt]);

  const quickMode = useCallback(() => {
    setLengthSec(3);
    setFps(16);
    setStepsState(30);
    setUseT5Cpu(true);
    setUseOffload(true);
  }, []);

  const disabled = !scriptPath || !ckpt || !size || !task;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      background: 'linear-gradient(180deg, #0f0f1e 0%, #1a1a2e 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        background: 'linear-gradient(90deg, rgba(30,30,60,0.95) 0%, rgba(40,40,80,0.95) 100%)',
        backdropFilter: 'blur(20px)',
        padding: '16px 24px',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
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
        
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          opacity: isAnimated ? 1 : 0,
          transform: isAnimated ? 'translateX(0)' : 'translateX(-20px)',
          transition: 'all 0.6s ease-out'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 4px 12px rgba(102,126,234,0.4)',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            🎬
          </div>
          <div>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: '800',
              background: 'linear-gradient(135deg, #fff 0%, #e0e0e0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
              letterSpacing: '-0.5px'
            }}>
              WAN 2.2 Professional
            </h1>
            <p style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.6)',
              margin: 0,
              marginTop: '2px',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              AI Video Creation Suite
            </p>
          </div>
        </div>

        <nav style={{ 
          display: 'flex', 
          gap: '4px',
          background: 'rgba(0,0,0,0.2)',
          padding: '4px',
          borderRadius: '12px'
        }}>
          {navItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as any)}
              style={{
                padding: '10px 20px',
                background: activeView === item.id 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : 'transparent',
                color: activeView === item.id ? '#fff' : 'rgba(255,255,255,0.7)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isAnimated ? 1 : 0,
                transform: isAnimated ? 'translateY(0)' : 'translateY(-10px)',
                transitionDelay: `${index * 0.05}s`,
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (activeView !== item.id) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeView !== item.id) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              <span>{item.label}</span>
              {activeView === item.id && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, #fff, transparent)',
                  animation: 'shimmer 2s ease-in-out infinite'
                }}/>
              )}
            </button>
          ))}
        </nav>
      </div>
      
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        background: 'radial-gradient(circle at 50% 50%, rgba(102,126,234,0.03) 0%, transparent 70%)',
        position: 'relative'
      }}>
        <div style={{
          opacity: isAnimated ? 1 : 0,
          transform: isAnimated ? 'scale(1)' : 'scale(0.95)',
          transition: 'all 0.6s ease-out 0.2s',
          height: '100%'
        }}>
          {activeView === 'wan' && (
            <div style={{ padding: '24px' }}>
              {/* Progress Bar */}
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#fff' }}>{phase}</span>
                    {phase === 'Generating' && (
                      <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        background: '#4ade80',
                        borderRadius: '50%',
                        animation: 'pulse 2s ease-in-out infinite'
                      }}/>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {eta && <span style={{ color: 'rgba(255,255,255,0.7)' }}>ETA: {eta}</span>}
                    <span style={{ fontWeight: '600', color: '#667eea' }}>{progress}%</span>
                  </div>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${progress}%`, 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #667eea, #764ba2)', 
                    transition: 'width 0.5s',
                    boxShadow: '0 0 10px rgba(102,126,234,0.5)'
                  }} />
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                marginBottom: '24px',
                flexWrap: 'wrap'
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

              {/* Settings Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '200px 1fr 200px 1fr', 
                gap: '16px', 
                alignItems: 'center',
                background: 'rgba(255,255,255,0.03)',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)',
                marginBottom: '24px'
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
                <div style={{ display: 'flex', gap: '8px' }}>
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

                <label style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '600' }}>Length (sec)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    style={{ 
                      width: '80px',
                      padding: '10px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px'
                    }} 
                    value={lengthSec} 
                    onChange={(e) => setLengthSec(Number(e.target.value))} />
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{estText}</span>
                </div>

                <label style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '600' }}>FPS</label>
                <input 
                  style={{ 
                    width: '80px',
                    padding: '10px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px'
                  }} 
                  value={fps} 
                  onChange={(e) => setFps(Number(e.target.value))} />

                <label style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '600' }}>Output folder</label>
                <div style={{ display: 'flex', gap: '8px' }}>
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
                    value={outputDir} 
                    onChange={(e) => setOutputDir(e.target.value)} 
                    placeholder="(optional) default: script folder" />
                  <button 
                    onClick={pickOutputDir}
                    style={{
                      padding: '10px 16px',
                      background: 'rgba(102,126,234,0.2)',
                      color: '#fff',
                      border: '1px solid rgba(102,126,234,0.3)',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >Browse</button>
                </div>

                <label style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '600' }}>Output filename</label>
                <div style={{ display: 'flex', gap: '8px' }}>
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
                    value={outputName} 
                    onChange={(e) => setOutputName(e.target.value)} 
                    placeholder="example: my_video.mp4" />
                  <button 
                    onClick={suggestOutputName}
                    style={{
                      padding: '10px 16px',
                      background: 'rgba(102,126,234,0.2)',
                      color: '#fff',
                      border: '1px solid rgba(102,126,234,0.3)',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >Suggest</button>
                </div>

                <label style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '600' }}>Image (I2V/TI2V)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
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
                    value={imagePath} 
                    onChange={(e) => setImagePath(e.target.value)} />
                  <button 
                    onClick={pickImage}
                    style={{
                      padding: '10px 16px',
                      background: 'rgba(102,126,234,0.2)',
                      color: '#fff',
                      border: '1px solid rgba(102,126,234,0.3)',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >Browse</button>
                </div>

                <label style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '600' }}>Script path</label>
                <div style={{ display: 'flex', gap: '8px' }}>
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
                    value={scriptPath} 
                    onChange={(e) => setScriptPath(e.target.value)} />
                  <button 
                    onClick={pickScript}
                    style={{
                      padding: '10px 16px',
                      background: 'rgba(102,126,234,0.2)',
                      color: '#fff',
                      border: '1px solid rgba(102,126,234,0.3)',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >Browse</button>
                </div>

                <div style={{ gridColumn: '1 / span 4', display: 'flex', gap: '24px', marginTop: '8px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={useOffload} onChange={(e) => setUseOffload(e.target.checked)} />
                    Offload Model
                  </label>
                  <label style={{ color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={useConvertDtype} onChange={(e) => setUseConvertDtype(e.target.checked)} />
                    Convert Dtype
                  </label>
                  <label style={{ color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={useT5Cpu} onChange={(e) => setUseT5Cpu(e.target.checked)} />
                    T5 CPU
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                marginBottom: '24px'
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
                >🚀 Generate</button>
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
                    opacity: !running ? 0.5 : 1
                  }}
                >❌ Cancel</button>
                {window.wanApi?.showInFolder && (
                  <button 
                    onClick={() => lastOutput && window.wanApi.showInFolder!(lastOutput)} 
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
                      opacity: !lastOutput ? 0.5 : 1
                    }}
                  >📁 Open Folder</button>
                )}
              </div>

              {/* Log Output */}
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
            </div>
          )}
          {activeView === 'editor' && <SimpleFlow />}
          {activeView === 'timeline' && <VideoTimeline />}
          {activeView === 'effects' && <VideoEffects />}
          {activeView === 'export' && <VideoExport />}
          {activeView === 'cinematic' && <CinematicControls />}
          {activeView === 'flow' && <Flow />}
        </div>
      </div>

      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
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
        select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.7)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 10px center;
          background-size: 20px;
          padding-right: 40px !important;
        }
        select option {
          background: #1a1a2e;
          color: #fff;
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
        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #667eea;
        }
      `}</style>
    </div>
  );
};

export default App;