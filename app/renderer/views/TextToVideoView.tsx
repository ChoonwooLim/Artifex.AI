import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, Square, FolderOpen, Save, Sparkles, 
  Zap, Clock, Cpu, CheckCircle, AlertCircle,
  Settings, ChevronDown, ChevronUp, Film,
  Sliders, Download, Wand2, Info
} from 'lucide-react';
import { theme } from '../styles/theme';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';

export const TextToVideoView: React.FC = () => {
  const [task] = useState('t2v-A14B');
  const [size, setSize] = useState('1280*720');
  const [ckpt, setCkpt] = useState('');
  const [prompt, setPrompt] = useState('A majestic eagle soaring through clouds at sunset, cinematic aerial shot, golden hour lighting, 8k quality, ultra realistic');
  const [pythonPath, setPythonPath] = useState('python');
  const [scriptPath, setScriptPath] = useState('');
  const [outputDir, setOutputDir] = useState('');
  const [outputName, setOutputName] = useState('');
  const [lengthSec, setLengthSec] = useState(5);
  const [fps, setFps] = useState(24);
  const [steps, setSteps] = useState(40);
  const [cfgScale, setCfgScale] = useState(7.5);
  const [seed, setSeed] = useState(-1);
  const [scheduler, setScheduler] = useState('DPM++');
  const [useOffload, setUseOffload] = useState(true);
  const [useConvertDtype, setUseConvertDtype] = useState(true);
  const [useT5Cpu, setUseT5Cpu] = useState(true);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('Ready');
  const [eta, setEta] = useState('');
  const [lastOutput, setLastOutput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [gpuInfo, setGpuInfo] = useState<any>(null);
  
  const logRef = useRef<HTMLTextAreaElement>(null);

  const SIZE_OPTIONS = ['480*832', '832*480', '1280*720', '720*1280'];
  
  const promptTemplates = [
    { name: 'Cinematic', prompt: 'Cinematic shot, dramatic lighting, film grain, anamorphic lens' },
    { name: 'Nature', prompt: 'Beautiful nature landscape, golden hour, serene atmosphere' },
    { name: 'Sci-Fi', prompt: 'Futuristic scene, neon lights, cyberpunk aesthetic, high tech' },
    { name: 'Animation', prompt: '3D animation style, vibrant colors, smooth motion, pixar quality' },
  ];

  useEffect(() => {
    // Load settings
    (async () => {
      const settings = await window.wanApi.getSettings();
      if (settings) {
        settings.pythonPath && setPythonPath(settings.pythonPath);
        settings.scriptPath && setScriptPath(settings.scriptPath);
        settings.ckpt && setCkpt(settings.ckpt);
        settings.outputDir && setOutputDir(settings.outputDir);
      }
    })();
  }, []);

  const args = useCallback(() => {
    const a = [
      '--task', task,
      '--size', size,
      '--ckpt_dir', ckpt,
      '--prompt', prompt,
      '--frame_num', String(4 * Math.round((fps * lengthSec) / 4) + 1),
      '--sample_steps', String(steps),
      '--fps_override', String(fps),
      '--sample_guide_scale', String(cfgScale),
      '--base_seed', String(seed),
      '--sample_solver', scheduler === 'DPM++' ? 'dpm++' : 'unipc',
    ];
    if (useOffload) a.push('--offload_model', 'True');
    if (useConvertDtype) a.push('--convert_model_dtype');
    if (useT5Cpu) a.push('--t5_cpu');
    return a;
  }, [task, size, ckpt, prompt, lengthSec, fps, steps, cfgScale, seed, scheduler, useOffload, useConvertDtype, useT5Cpu]);

  const handleRun = useCallback(async () => {
    if (running) return;
    
    setRunning(true);
    setProgress(0);
    setPhase('Initializing');

    const runArgs = args();
    
    if (outputDir && outputName) {
      const fullPath = `${outputDir}\\${outputName}.mp4`;
      runArgs.push('--save_file', fullPath);
    }

    if (logRef.current) {
      logRef.current.value = '';
    }

    window.wanApi.onStdout((data) => {
      if (logRef.current) {
        logRef.current.value += data;
        logRef.current.scrollTop = logRef.current.scrollHeight;
      }

      // Parse progress
      const stepMatch = data.match(/\[progress\] step=(\d+)\/(\d+)/);
      if (stepMatch) {
        const current = Number(stepMatch[1]);
        const total = Number(stepMatch[2]);
        const pct = Math.floor((current / total) * 100);
        setProgress(pct);
        setPhase('Generating frames');
        
        // Calculate ETA
        const remaining = total - current;
        const secondsPerStep = 2; // Approximate
        const remainingSeconds = remaining * secondsPerStep;
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        setEta(`${minutes}m ${seconds}s`);
      }

      // Parse phases
      if (/Loading.*model/i.test(data)) {
        setPhase('Loading T2V-A14B model');
        setProgress(10);
      } else if (/Processing.*prompt/i.test(data)) {
        setPhase('Processing text prompt');
        setProgress(20);
      } else if (/Generating/i.test(data)) {
        setPhase('Generating video frames');
      } else if (/Encoding/i.test(data)) {
        setPhase('Encoding to MP4');
        setProgress(90);
      }

      // Parse output
      const saveMatch = data.match(/Saving generated video to (.*\.mp4)/i);
      if (saveMatch) {
        setLastOutput(saveMatch[1]);
        setProgress(95);
      }
    });

    window.wanApi.onStderr((data) => {
      if (logRef.current) {
        logRef.current.value += `[ERROR] ${data}`;
      }
    });

    window.wanApi.onClosed((code) => {
      setRunning(false);
      setPhase(code === 0 ? 'Complete' : 'Failed');
      setProgress(100);
      setEta('');
    });

    const result = await window.wanApi.run({
      pythonPath,
      scriptPath,
      args: runArgs,
    });

    if (!result.ok) {
      setPhase('Error');
      setRunning(false);
    }
  }, [running, args, pythonPath, scriptPath, outputDir, outputName]);

  const handleCancel = useCallback(async () => {
    if (!running) return;
    await window.wanApi.cancel();
    setRunning(false);
    setPhase('Cancelled');
  }, [running]);

  const validatePython = useCallback(async () => {
    const result = await window.wanApi.validatePython(pythonPath);
    if (result.ok) {
      const info = await window.wanApi.gpuInfo(pythonPath);
      if (info?.ok) {
        setGpuInfo(info.info);
      }
    }
  }, [pythonPath]);

  return (
    <div style={{ padding: theme.spacing.xl, maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: theme.spacing.xl }}>
        <h1 style={{
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          marginBottom: theme.spacing.sm,
          background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Text to Video Generation
        </h1>
        <p style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.lg }}>
          Create videos from text descriptions using T2V-A14B model (14 billion parameters)
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: theme.spacing.xl }}>
        <div>
          {/* Model Info Card */}
          <Card variant="gradient" style={{ marginBottom: theme.spacing.xl }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: theme.borderRadius.md,
                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Film size={32} color={theme.colors.text} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: theme.typography.fontSize.xl,
                  fontWeight: theme.typography.fontWeight.semibold,
                  marginBottom: theme.spacing.xs,
                }}>
                  T2V-A14B Model
                </h3>
                <p style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm }}>
                  14B parameter text-to-video model • Optimized for cinematic quality
                </p>
              </div>
              <div style={{
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                background: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.success,
              }}>
                <Cpu size={16} style={{ display: 'inline', marginRight: theme.spacing.xs }} />
                16GB VRAM Required
              </div>
            </div>
          </Card>

          <Card variant="glass">
            {/* Prompt Section */}
            <div style={{ marginBottom: theme.spacing.xl }}>
              <label style={{
                display: 'block',
                marginBottom: theme.spacing.md,
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text,
              }}>
                Text Prompt
              </label>
              <div style={{ position: 'relative' }}>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the video you want to generate..."
                  style={{
                    width: '100%',
                    minHeight: '140px',
                    padding: theme.spacing.md,
                    paddingBottom: '50px',
                    background: theme.colors.backgroundTertiary,
                    border: `2px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.md,
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSize.md,
                    fontFamily: theme.typography.fontFamily,
                    resize: 'vertical',
                    outline: 'none',
                    transition: `all ${theme.transitions.fast}`,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = theme.colors.primary;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = theme.colors.border;
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: theme.spacing.sm,
                  left: theme.spacing.md,
                  right: theme.spacing.md,
                  display: 'flex',
                  gap: theme.spacing.sm,
                }}>
                  {promptTemplates.map((template) => (
                    <Button
                      key={template.name}
                      variant="ghost"
                      size="sm"
                      onClick={() => setPrompt(prompt + ' ' + template.prompt)}
                    >
                      {template.name}
                    </Button>
                  ))}
                  <div style={{ flex: 1 }} />
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Wand2 size={16} />}
                  >
                    Enhance
                  </Button>
                </div>
              </div>
            </div>

            {/* Video Settings */}
            <div style={{ marginBottom: theme.spacing.xl }}>
              <h3 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                marginBottom: theme.spacing.lg,
              }}>
                Video Settings
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: theme.spacing.sm,
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                  }}>
                    Resolution
                  </label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    style={{
                      width: '100%',
                      padding: theme.spacing.md,
                      background: theme.colors.backgroundTertiary,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      color: theme.colors.text,
                      fontSize: theme.typography.fontSize.md,
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value="1280*720">1280×720 (HD Landscape)</option>
                    <option value="720*1280">720×1280 (HD Portrait)</option>
                    <option value="832*480">832×480 (Wide)</option>
                    <option value="480*832">480×832 (Tall)</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: theme.spacing.sm,
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                  }}>
                    Duration
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.md,
                    background: theme.colors.backgroundTertiary,
                    padding: theme.spacing.sm,
                    borderRadius: theme.borderRadius.md,
                    border: `1px solid ${theme.colors.border}`,
                  }}>
                    <input
                      type="range"
                      min="2"
                      max="8"
                      value={lengthSec}
                      onChange={(e) => setLengthSec(Number(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span style={{
                      minWidth: '50px',
                      textAlign: 'center',
                      fontWeight: theme.typography.fontWeight.semibold,
                    }}>
                      {lengthSec}s
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: theme.spacing.sm,
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                  }}>
                    Frame Rate
                  </label>
                  <select
                    value={fps}
                    onChange={(e) => setFps(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: theme.spacing.md,
                      background: theme.colors.backgroundTertiary,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      color: theme.colors.text,
                      fontSize: theme.typography.fontSize.md,
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value={16}>16 FPS (Fast)</option>
                    <option value={24}>24 FPS (Cinema)</option>
                    <option value={30}>30 FPS (Smooth)</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: theme.spacing.sm,
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                  }}>
                    Quality Preset
                  </label>
                  <select
                    value={steps}
                    onChange={(e) => setSteps(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: theme.spacing.md,
                      background: theme.colors.backgroundTertiary,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      color: theme.colors.text,
                      fontSize: theme.typography.fontSize.md,
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value={20}>Draft (20 steps)</option>
                    <option value={30}>Fast (30 steps)</option>
                    <option value={40}>Standard (40 steps)</option>
                    <option value={60}>High (60 steps)</option>
                    <option value={80}>Ultra (80 steps)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div style={{ marginBottom: theme.spacing.xl }}>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  background: 'transparent',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.textSecondary,
                  cursor: 'pointer',
                  fontSize: theme.typography.fontSize.sm,
                  transition: `all ${theme.transitions.fast}`,
                }}
              >
                <Settings size={16} />
                Advanced Settings
                {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              <motion.div
                animate={{ height: showAdvanced ? 'auto' : 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  padding: theme.spacing.lg,
                  marginTop: theme.spacing.md,
                  background: theme.colors.backgroundTertiary,
                  borderRadius: theme.borderRadius.md,
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: theme.spacing.lg }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: theme.spacing.sm,
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.textSecondary,
                      }}>
                        CFG Scale
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={cfgScale}
                        onChange={(e) => setCfgScale(Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: theme.spacing.sm,
                          background: theme.colors.surface,
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: theme.borderRadius.sm,
                          color: theme.colors.text,
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: theme.spacing.sm,
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.textSecondary,
                      }}>
                        Seed
                      </label>
                      <input
                        type="number"
                        value={seed}
                        onChange={(e) => setSeed(Number(e.target.value))}
                        placeholder="-1 for random"
                        style={{
                          width: '100%',
                          padding: theme.spacing.sm,
                          background: theme.colors.surface,
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: theme.borderRadius.sm,
                          color: theme.colors.text,
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: theme.spacing.sm,
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.textSecondary,
                      }}>
                        Scheduler
                      </label>
                      <select
                        value={scheduler}
                        onChange={(e) => setScheduler(e.target.value)}
                        style={{
                          width: '100%',
                          padding: theme.spacing.sm,
                          background: theme.colors.surface,
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: theme.borderRadius.sm,
                          color: theme.colors.text,
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        <option value="DPM++">DPM++</option>
                        <option value="UniPC">UniPC</option>
                      </select>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: theme.spacing.xl,
                    marginTop: theme.spacing.lg,
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                      <input
                        type="checkbox"
                        checked={useOffload}
                        onChange={(e) => setUseOffload(e.target.checked)}
                      />
                      <span style={{ fontSize: theme.typography.fontSize.sm }}>Model Offload</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                      <input
                        type="checkbox"
                        checked={useConvertDtype}
                        onChange={(e) => setUseConvertDtype(e.target.checked)}
                      />
                      <span style={{ fontSize: theme.typography.fontSize.sm }}>Convert Dtype</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                      <input
                        type="checkbox"
                        checked={useT5Cpu}
                        onChange={(e) => setUseT5Cpu(e.target.checked)}
                      />
                      <span style={{ fontSize: theme.typography.fontSize.sm }}>T5 on CPU</span>
                    </label>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* System Configuration */}
            <div style={{ marginBottom: theme.spacing.xl }}>
              <h3 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                marginBottom: theme.spacing.lg,
              }}>
                System Configuration
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: theme.spacing.md }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: theme.spacing.sm,
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                  }}>
                    Checkpoint Directory
                  </label>
                  <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                    <input
                      value={ckpt}
                      onChange={(e) => setCkpt(e.target.value)}
                      placeholder="Select T2V-A14B checkpoint directory..."
                      style={{
                        flex: 1,
                        padding: theme.spacing.md,
                        background: theme.colors.backgroundTertiary,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.md,
                        color: theme.colors.text,
                        outline: 'none',
                      }}
                    />
                    <Button
                      variant="ghost"
                      icon={<FolderOpen size={20} />}
                      onClick={async () => {
                        const dir = await window.wanApi.openFolder();
                        if (dir) setCkpt(dir);
                      }}
                    >
                      Browse
                    </Button>
                    <Button
                      variant="secondary"
                      icon={<Sparkles size={20} />}
                      onClick={async () => {
                        const suggestions = await window.wanApi.suggestCkpt(task);
                        if (suggestions && suggestions[0]) {
                          setCkpt(suggestions[0]);
                        }
                      }}
                    >
                      Auto-detect
                    </Button>
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: theme.spacing.sm,
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                  }}>
                    Python Path
                  </label>
                  <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                    <input
                      value={pythonPath}
                      onChange={(e) => setPythonPath(e.target.value)}
                      style={{
                        flex: 1,
                        padding: theme.spacing.md,
                        background: theme.colors.backgroundTertiary,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.md,
                        color: theme.colors.text,
                        outline: 'none',
                      }}
                    />
                    <Button variant="ghost" onClick={validatePython}>
                      Validate
                    </Button>
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: theme.spacing.sm,
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                  }}>
                    Script Path
                  </label>
                  <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                    <input
                      value={scriptPath}
                      onChange={(e) => setScriptPath(e.target.value)}
                      placeholder="Path to generate.py script..."
                      style={{
                        flex: 1,
                        padding: theme.spacing.md,
                        background: theme.colors.backgroundTertiary,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.md,
                        color: theme.colors.text,
                        outline: 'none',
                      }}
                    />
                    <Button
                      variant="ghost"
                      icon={<FolderOpen size={20} />}
                      onClick={async () => {
                        const file = await window.wanApi.openFile([
                          { name: 'Python', extensions: ['py'] }
                        ]);
                        if (file) setScriptPath(file);
                      }}
                    >
                      Browse
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: theme.spacing.md }}>
              <Button
                variant="primary"
                size="lg"
                icon={running ? <Square size={20} /> : <Play size={20} />}
                onClick={running ? handleCancel : handleRun}
                fullWidth
                disabled={!ckpt || !scriptPath}
                loading={running}
              >
                {running ? 'Stop Generation' : 'Generate Video'}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                icon={<Save size={20} />}
                onClick={async () => {
                  await window.wanApi.setSettings({
                    pythonPath,
                    scriptPath,
                    ckpt,
                    size,
                    task,
                    outputDir,
                    outputName,
                  });
                }}
              >
                Save
              </Button>
            </div>

            {/* Progress Section */}
            {running && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: theme.spacing.xl,
                  padding: theme.spacing.lg,
                  background: theme.colors.backgroundTertiary,
                  borderRadius: theme.borderRadius.md,
                }}
              >
                <ProgressBar
                  value={progress}
                  label={phase}
                  variant="gradient"
                  size="lg"
                />
                {eta && (
                  <div style={{
                    marginTop: theme.spacing.md,
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                  }}>
                    <span>Estimated time remaining: {eta}</span>
                    <span>T2V-A14B Model Active</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Output Log */}
            <div style={{ marginTop: theme.spacing.xl }}>
              <h3 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                marginBottom: theme.spacing.md,
              }}>
                Generation Log
              </h3>
              <textarea
                ref={logRef}
                style={{
                  width: '100%',
                  height: '200px',
                  padding: theme.spacing.md,
                  background: theme.colors.backgroundSecondary,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.text,
                  fontSize: theme.typography.fontSize.sm,
                  fontFamily: theme.typography.fontFamilyMono,
                  resize: 'vertical',
                  outline: 'none',
                }}
                readOnly
              />
            </div>

            {/* Preview */}
            {lastOutput && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: theme.spacing.xl }}
              >
                <h3 style={{
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                  marginBottom: theme.spacing.md,
                }}>
                  Generated Video
                </h3>
                <video
                  src={lastOutput}
                  controls
                  style={{
                    width: '100%',
                    borderRadius: theme.borderRadius.md,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                />
                <div style={{
                  display: 'flex',
                  gap: theme.spacing.md,
                  marginTop: theme.spacing.md,
                }}>
                  <Button
                    variant="secondary"
                    icon={<Play size={20} />}
                    onClick={() => window.wanApi.openPath(lastOutput)}
                  >
                    Play in Default Player
                  </Button>
                  <Button
                    variant="ghost"
                    icon={<FolderOpen size={20} />}
                    onClick={() => window.wanApi.showInFolder(lastOutput)}
                  >
                    Show in Folder
                  </Button>
                  <Button
                    variant="ghost"
                    icon={<Download size={20} />}
                  >
                    Download
                  </Button>
                </div>
              </motion.div>
            )}
          </Card>
        </div>

        {/* Right Sidebar */}
        <div>
          {/* GPU Status */}
          <Card variant="glass" style={{ marginBottom: theme.spacing.xl }}>
            <h3 style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.lg,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
            }}>
              <Cpu size={20} />
              System Status
            </h3>

            {gpuInfo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: theme.spacing.xs,
                    fontSize: theme.typography.fontSize.sm,
                  }}>
                    <span style={{ color: theme.colors.textSecondary }}>GPU</span>
                    <span style={{ color: theme.colors.success }}>
                      {gpuInfo.name || 'RTX 4090'}
                    </span>
                  </div>
                  {gpuInfo.total_memory && (
                    <ProgressBar 
                      value={60} 
                      max={100} 
                      showPercentage={false} 
                      size="sm" 
                      variant="gradient"
                    />
                  )}
                </div>

                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: theme.typography.fontSize.sm,
                  }}>
                    <span style={{ color: theme.colors.textSecondary }}>VRAM</span>
                    <span>14.2GB / 24GB</span>
                  </div>
                </div>

                <div style={{
                  padding: theme.spacing.md,
                  background: theme.colors.surface,
                  borderRadius: theme.borderRadius.md,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                }}>
                  <CheckCircle size={16} color={theme.colors.success} />
                  <span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.success }}>
                    CUDA 12.1 Ready
                  </span>
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: theme.spacing.lg,
                color: theme.colors.textTertiary,
              }}>
                <Info size={32} style={{ marginBottom: theme.spacing.md, opacity: 0.5 }} />
                <p style={{ fontSize: theme.typography.fontSize.sm }}>
                  Click "Validate" to check GPU
                </p>
              </div>
            )}
          </Card>

          {/* Quick Presets */}
          <Card variant="glass" style={{ marginBottom: theme.spacing.xl }}>
            <h3 style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.lg,
            }}>
              Quick Presets
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
              <Button
                variant="ghost"
                fullWidth
                icon={<Zap size={16} />}
                onClick={() => {
                  setLengthSec(3);
                  setFps(16);
                  setSteps(20);
                }}
              >
                Fast Preview (3s, 16fps)
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => {
                  setLengthSec(5);
                  setFps(24);
                  setSteps(40);
                }}
              >
                Standard Quality
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => {
                  setLengthSec(5);
                  setFps(30);
                  setSteps(60);
                }}
              >
                High Quality
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => {
                  setLengthSec(8);
                  setFps(24);
                  setSteps(80);
                }}
              >
                Cinema Mode
              </Button>
            </div>
          </Card>

          {/* Tips */}
          <Card variant="gradient">
            <h3 style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.lg,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
            }}>
              <Info size={20} />
              Tips for T2V
            </h3>

            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary,
              lineHeight: 1.6,
            }}>
              <ul style={{ paddingLeft: theme.spacing.lg, margin: 0 }}>
                <li style={{ marginBottom: theme.spacing.sm }}>
                  Use descriptive prompts with cinematic terms for best results
                </li>
                <li style={{ marginBottom: theme.spacing.sm }}>
                  Higher steps (40-60) improve quality but increase generation time
                </li>
                <li style={{ marginBottom: theme.spacing.sm }}>
                  CFG scale 7-10 provides good balance between creativity and prompt adherence
                </li>
                <li>
                  Enable model offload to reduce VRAM usage on GPUs with less than 16GB
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};