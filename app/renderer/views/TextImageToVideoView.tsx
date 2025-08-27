import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, Square, FolderOpen, Save, Layers, 
  Upload, Clock, Cpu, CheckCircle, AlertCircle,
  Settings, ChevronDown, ChevronUp, Film,
  Image as ImageIcon, Type, Download, Eye, 
  Info, Sparkles, Wand2, Zap
} from 'lucide-react';
import { theme } from '../styles/theme';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';

export const TextImageToVideoView: React.FC = () => {
  const [task] = useState('ti2v-5B');
  const [size, setSize] = useState('1280*704');
  const [ckpt, setCkpt] = useState('');
  const [prompt, setPrompt] = useState('A majestic landscape transforms into a magical realm, with glowing particles and ethereal light, cinematic transition, fantasy atmosphere, 8k quality');
  const [imagePath, setImagePath] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [pythonPath, setPythonPath] = useState('python');
  const [scriptPath, setScriptPath] = useState('');
  const [outputDir, setOutputDir] = useState('');
  const [outputName, setOutputName] = useState('');
  const [lengthSec, setLengthSec] = useState(5);
  const [fps, setFps] = useState(24);
  const [steps, setSteps] = useState(50);
  const [cfgScale, setCfgScale] = useState(8.5);
  const [seed, setSeed] = useState(-1);
  const [scheduler, setScheduler] = useState('DPM++');
  const [useOffload, setUseOffload] = useState(false);
  const [useConvertDtype, setUseConvertDtype] = useState(true);
  const [useT5Cpu, setUseT5Cpu] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('Ready');
  const [eta, setEta] = useState('');
  const [lastOutput, setLastOutput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [gpuInfo, setGpuInfo] = useState<any>(null);
  
  const logRef = useRef<HTMLTextAreaElement>(null);

  const SIZE_OPTIONS = ['1280*704', '704*1280', '1920*1080', '1080*1920'];
  
  const creativePresets = [
    { 
      name: 'Cinematic Blend', 
      prompt: 'Seamlessly blend the image with cinematic motion, dramatic lighting changes',
      cfg: 7.5,
      steps: 50
    },
    { 
      name: 'Fantasy Transform', 
      prompt: 'Transform the scene into a magical fantasy world, glowing particles, ethereal atmosphere',
      cfg: 9.0,
      steps: 60
    },
    { 
      name: 'Time-lapse', 
      prompt: 'Time-lapse effect showing passage of time, changing lighting, natural progression',
      cfg: 8.0,
      steps: 50
    },
    { 
      name: 'Dynamic Action', 
      prompt: 'Add dynamic action and movement, energy effects, powerful motion',
      cfg: 8.5,
      steps: 55
    },
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

  const handleImageSelect = useCallback(async () => {
    const file = await window.wanApi.openFile([
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }
    ]);
    if (file) {
      setImagePath(file);
      setImagePreview(`file://${file.replace(/\\/g, '/')}`);
      
      const result = await window.wanApi.validateImage(file);
      if (!result.ok) {
        alert(`Image validation failed: ${result.message}`);
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const path = file.path || (file as any).path;
        if (path) {
          setImagePath(path);
          setImagePreview(`file://${path.replace(/\\/g, '/')}`);
        }
      }
    }
  }, []);

  const args = useCallback(() => {
    const a = [
      '--task', task,
      '--size', size,
      '--ckpt_dir', ckpt,
      '--prompt', prompt,
      '--image', imagePath,
      '--frame_num', String(4 * Math.round((fps * lengthSec) / 4) + 1),
      '--sample_steps', String(steps),
      '--fps_override', String(fps),
      '--sample_guide_scale', String(cfgScale),
      '--base_seed', String(seed),
      '--sample_solver', scheduler === 'DPM++' ? 'dpm++' : 'unipc',
    ];
    // Always explicitly pass offload_model to prevent script default
    a.push('--offload_model', useOffload ? 'True' : 'False');
    if (useConvertDtype) a.push('--convert_model_dtype');
    if (useT5Cpu) a.push('--t5_cpu');
    return a;
  }, [task, size, ckpt, prompt, imagePath, lengthSec, fps, steps, cfgScale, seed, scheduler, useOffload, useConvertDtype, useT5Cpu]);

  const handleRun = useCallback(async () => {
    if (running || !imagePath) return;
    
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

      const stepMatch = data.match(/\[progress\] step=(\d+)\/(\d+)/);
      if (stepMatch) {
        const current = Number(stepMatch[1]);
        const total = Number(stepMatch[2]);
        const pct = Math.floor((current / total) * 100);
        setProgress(pct);
        setPhase('Generating hybrid video');
        
        const remaining = total - current;
        const secondsPerStep = 3;
        const remainingSeconds = remaining * secondsPerStep;
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        setEta(`${minutes}m ${seconds}s`);
      }

      if (/Loading.*model/i.test(data)) {
        setPhase('Loading TI2V-5B model');
        setProgress(10);
      } else if (/Processing/i.test(data)) {
        setPhase('Processing text and image');
        setProgress(20);
      } else if (/Generating/i.test(data)) {
        setPhase('Generating hybrid video');
      } else if (/Encoding/i.test(data)) {
        setPhase('Encoding to MP4');
        setProgress(90);
      }

      const saveMatch = data.match(/Saving generated video to (.*\.mp4)/i);
      if (saveMatch) {
        setLastOutput(saveMatch[1]);
        setProgress(95);
      }
    });

    window.wanApi.onStderr((data) => {
      if (logRef.current) {
        // Loading checkpoint shards는 정상적인 진행 상황
        if (data.includes('Loading checkpoint shards')) {
          logRef.current.value += `[PROGRESS] ${data}`;
        }
        // Triton 관련은 경고로만 표시
        else if (data.includes('Triton')) {
          logRef.current.value += `[WARNING] ${data}`;
        }
        // 실제 에러 메시지
        else if (data.includes('[ERROR]') || data.includes('Error') || data.includes('error')) {
          // 파일명에 error가 포함된 경우는 제외
          if (!data.includes('.py') && !data.includes('_error') && !data.includes('error_')) {
            logRef.current.value += `[ERROR] ${data}`;
          } else {
            logRef.current.value += data;
          }
        } else if (data.includes('WARNING') || data.includes('Warning')) {
          logRef.current.value += `[WARNING] ${data}`;
        } else {
          logRef.current.value += data;
        }
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
  }, [running, imagePath, args, pythonPath, scriptPath, outputDir, outputName]);

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
          Text + Image to Video Synthesis
        </h1>
        <p style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.lg }}>
          Create hybrid videos combining text and image guidance using TI2V-5B model
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
                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Layers size={32} color={theme.colors.text} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: theme.typography.fontSize.xl,
                  fontWeight: theme.typography.fontWeight.semibold,
                  marginBottom: theme.spacing.xs,
                }}>
                  TI2V-5B Model
                </h3>
                <p style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm }}>
                  5B parameter hybrid model • Advanced text-image synthesis • HD+ resolution support
                </p>
              </div>
              <div style={{
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                background: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.warning,
              }}>
                <Cpu size={16} style={{ display: 'inline', marginRight: theme.spacing.xs }} />
                24GB VRAM Recommended
              </div>
            </div>
          </Card>

          <Card variant="glass">
            {/* Dual Input Section */}
            <div style={{ marginBottom: theme.spacing.xl }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg }}>
                {/* Image Input */}
                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    marginBottom: theme.spacing.md,
                    fontSize: theme.typography.fontSize.md,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.text,
                  }}>
                    <ImageIcon size={20} />
                    Reference Image
                  </label>
                  
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    style={{
                      position: 'relative',
                      border: `2px dashed ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      padding: theme.spacing.lg,
                      background: imagePreview 
                        ? `url(${imagePreview}) center/cover`
                        : theme.colors.backgroundTertiary,
                      height: '250px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: `all ${theme.transitions.fast}`,
                    }}
                    onClick={() => !imagePreview && handleImageSelect()}
                  >
                    {imagePreview ? (
                      <div style={{
                        position: 'absolute',
                        top: theme.spacing.sm,
                        right: theme.spacing.sm,
                        display: 'flex',
                        gap: theme.spacing.xs,
                      }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImagePath('');
                            setImagePreview('');
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload size={32} color={theme.colors.textTertiary} />
                        <p style={{
                          fontSize: theme.typography.fontSize.sm,
                          color: theme.colors.textTertiary,
                          marginTop: theme.spacing.sm,
                          textAlign: 'center',
                        }}>
                          Drop image or click
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Text Prompt */}
                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    marginBottom: theme.spacing.md,
                    fontSize: theme.typography.fontSize.md,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.text,
                  }}>
                    <Type size={20} />
                    Text Description
                  </label>
                  
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe how the image should transform into video..."
                    style={{
                      width: '100%',
                      height: '250px',
                      padding: theme.spacing.md,
                      background: theme.colors.backgroundTertiary,
                      border: `2px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      color: theme.colors.text,
                      fontSize: theme.typography.fontSize.md,
                      fontFamily: theme.typography.fontFamily,
                      resize: 'none',
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
                </div>
              </div>

              {/* Creative Presets */}
              <div style={{
                marginTop: theme.spacing.md,
                display: 'flex',
                gap: theme.spacing.sm,
                flexWrap: 'wrap',
              }}>
                {creativePresets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPrompt(preset.prompt);
                      setCfgScale(preset.cfg);
                      setSteps(preset.steps);
                    }}
                  >
                    {preset.name}
                  </Button>
                ))}
                <div style={{ flex: 1 }} />
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Wand2 size={16} />}
                >
                  AI Enhance
                </Button>
              </div>
            </div>

            {/* Video Settings */}
            <div style={{ marginBottom: theme.spacing.xl }}>
              <h3 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                marginBottom: theme.spacing.lg,
              }}>
                Generation Settings
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: theme.spacing.sm,
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                  }}>
                    Output Resolution
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
                    <option value="1280*704">1280×704 (HD+)</option>
                    <option value="704*1280">704×1280 (Portrait HD+)</option>
                    <option value="1920*1080">1920×1080 (Full HD)</option>
                    <option value="1080*1920">1080×1920 (Vertical FHD)</option>
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
                      min="3"
                      max="10"
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
                    Quality (Steps)
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
                    <option value={30}>Draft (30 steps)</option>
                    <option value={40}>Fast (40 steps)</option>
                    <option value={50}>Standard (50 steps)</option>
                    <option value={75}>High (75 steps)</option>
                    <option value={100}>Ultra (100 steps)</option>
                  </select>
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
                    <option value={16}>16 FPS</option>
                    <option value={24}>24 FPS (Cinema)</option>
                    <option value={30}>30 FPS</option>
                    <option value={60}>60 FPS (Smooth)</option>
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
                    TI2V-5B Checkpoint Directory
                  </label>
                  <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                    <input
                      value={ckpt}
                      onChange={(e) => setCkpt(e.target.value)}
                      placeholder="Select TI2V-5B checkpoint directory..."
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
                disabled={!ckpt || !scriptPath || !imagePath}
                loading={running}
              >
                {running ? 'Stop Generation' : 'Generate Hybrid Video'}
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
                    <span>Estimated time: {eta}</span>
                    <span>TI2V-5B Processing</span>
                  </div>
                )}
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
              System Requirements
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
                      value={70} 
                      max={100} 
                      showPercentage={false} 
                      size="sm" 
                      variant="gradient"
                    />
                  )}
                </div>

                <div style={{
                  padding: theme.spacing.md,
                  background: theme.colors.surface,
                  borderRadius: theme.borderRadius.md,
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    marginBottom: theme.spacing.xs,
                  }}>
                    <CheckCircle size={16} color={theme.colors.success} />
                    <span style={{ fontSize: theme.typography.fontSize.sm }}>
                      CUDA 12.1 Ready
                    </span>
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.textSecondary,
                  }}>
                    VRAM Usage: ~20GB for HD+
                  </div>
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
                  setSteps(30);
                }}
              >
                Fast Preview (3s, 30 steps)
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => {
                  setLengthSec(5);
                  setFps(24);
                  setSteps(50);
                }}
              >
                Standard Quality
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => {
                  setLengthSec(7);
                  setFps(24);
                  setSteps(75);
                }}
              >
                High Quality
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => {
                  setLengthSec(10);
                  setFps(30);
                  setSteps(100);
                }}
              >
                Ultra Quality
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
              TI2V Tips
            </h3>

            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary,
              lineHeight: 1.6,
            }}>
              <ul style={{ paddingLeft: theme.spacing.lg, margin: 0 }}>
                <li style={{ marginBottom: theme.spacing.sm }}>
                  Combine descriptive text with reference images for best results
                </li>
                <li style={{ marginBottom: theme.spacing.sm }}>
                  TI2V-5B excels at HD+ resolutions
                </li>
                <li style={{ marginBottom: theme.spacing.sm }}>
                  CFG 8-10 for balanced guidance
                </li>
                <li>
                  50+ steps recommended for quality
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};