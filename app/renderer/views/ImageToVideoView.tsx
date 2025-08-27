import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, Square, FolderOpen, Save, Image as ImageIcon, 
  Upload, Clock, Cpu, CheckCircle, AlertCircle,
  Settings, ChevronDown, ChevronUp, Film,
  Sliders, Download, Eye, Info, Sparkles
} from 'lucide-react';
import { theme } from '../styles/theme';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';

export const ImageToVideoView: React.FC = () => {
  const [task] = useState('i2v-A14B');
  const [size, setSize] = useState('1280*720');
  const [ckpt, setCkpt] = useState('');
  const [prompt, setPrompt] = useState('Smooth camera movement, cinematic motion, natural animation');
  const [imagePath, setImagePath] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [pythonPath, setPythonPath] = useState('python');
  const [scriptPath, setScriptPath] = useState('');
  const [outputDir, setOutputDir] = useState('');
  const [outputName, setOutputName] = useState('');
  const [lengthSec, setLengthSec] = useState(4);
  const [fps, setFps] = useState(24);
  const [steps, setSteps] = useState(40);
  const [motionBucket, setMotionBucket] = useState(127);
  const [noiseAugStrength, setNoiseAugStrength] = useState(0.02);
  const [seed, setSeed] = useState(-1);
  const [useOffload, setUseOffload] = useState(false);
  const [useConvertDtype, setUseConvertDtype] = useState(true);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('Ready');
  const [eta, setEta] = useState('');
  const [lastOutput, setLastOutput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [gpuInfo, setGpuInfo] = useState<any>(null);
  
  const logRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SIZE_OPTIONS = ['480*832', '832*480', '1280*720', '720*1280'];
  
  const motionPresets = [
    { name: 'Subtle', bucket: 50, noise: 0.01 },
    { name: 'Natural', bucket: 127, noise: 0.02 },
    { name: 'Dynamic', bucket: 200, noise: 0.03 },
    { name: 'Extreme', bucket: 255, noise: 0.05 },
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
      // Create preview URL
      setImagePreview(`file://${file.replace(/\\/g, '/')}`);
      
      // Validate image
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
      '--base_seed', String(seed),
      '--sample_solver', 'dpm++',
    ];
    // Always explicitly pass offload_model to prevent script default
    a.push('--offload_model', useOffload ? 'True' : 'False');
    if (useConvertDtype) a.push('--convert_model_dtype');
    return a;
  }, [task, size, ckpt, prompt, imagePath, lengthSec, fps, steps, seed, useOffload, useConvertDtype]);

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

      // Parse progress
      const stepMatch = data.match(/\[progress\] step=(\d+)\/(\d+)/);
      if (stepMatch) {
        const current = Number(stepMatch[1]);
        const total = Number(stepMatch[2]);
        const pct = Math.floor((current / total) * 100);
        setProgress(pct);
        setPhase('Animating frames');
        
        // Calculate ETA
        const remaining = total - current;
        const secondsPerStep = 1.5; // I2V is faster
        const remainingSeconds = remaining * secondsPerStep;
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        setEta(`${minutes}m ${seconds}s`);
      }

      // Parse phases
      if (/Loading.*model/i.test(data)) {
        setPhase('Loading I2V-A14B model');
        setProgress(10);
      } else if (/Processing.*image/i.test(data)) {
        setPhase('Processing input image');
        setProgress(20);
      } else if (/Animating/i.test(data)) {
        setPhase('Creating animation');
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
        // Loading checkpoint shards는 실제로 에러가 아니라 진행 상황임
        if (data.includes('Loading checkpoint shards')) {
          logRef.current.value += data;
        } else if (data.includes('WARNING') || data.includes('Triton')) {
          logRef.current.value += `[WARNING] ${data}`;
        } else if (!data.includes('it/s]')) {
          // 실제 에러만 ERROR로 표시
          logRef.current.value += `[ERROR] ${data}`;
        } else {
          // 진행률 표시는 그대로 출력
          logRef.current.value += data;
        }
        logRef.current.scrollTop = logRef.current.scrollHeight;
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
          Image to Video Animation
        </h1>
        <p style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.lg }}>
          Animate static images using I2V-A14B model (14 billion parameters)
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
                background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.secondaryDark})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ImageIcon size={32} color={theme.colors.text} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: theme.typography.fontSize.xl,
                  fontWeight: theme.typography.fontWeight.semibold,
                  marginBottom: theme.spacing.xs,
                }}>
                  I2V-A14B Model
                </h3>
                <p style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm }}>
                  14B parameter image-to-video model • Natural motion synthesis
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
            {/* Image Input Section */}
            <div style={{ marginBottom: theme.spacing.xl }}>
              <label style={{
                display: 'block',
                marginBottom: theme.spacing.md,
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text,
              }}>
                Input Image
              </label>
              
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                style={{
                  position: 'relative',
                  border: `2px dashed ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing.xl,
                  background: imagePreview 
                    ? `url(${imagePreview}) center/cover`
                    : theme.colors.backgroundTertiary,
                  minHeight: '300px',
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
                    top: theme.spacing.md,
                    right: theme.spacing.md,
                    display: 'flex',
                    gap: theme.spacing.sm,
                  }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Eye size={16} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.wanApi.openPath(imagePath);
                      }}
                    >
                      Preview
                    </Button>
                    <Button
                      variant="danger"
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
                    <Upload size={48} color={theme.colors.textTertiary} />
                    <h3 style={{
                      fontSize: theme.typography.fontSize.lg,
                      fontWeight: theme.typography.fontWeight.medium,
                      marginTop: theme.spacing.md,
                      marginBottom: theme.spacing.sm,
                    }}>
                      Drop image here or click to browse
                    </h3>
                    <p style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.textTertiary,
                    }}>
                      Supports JPG, PNG, WebP • Recommended: 1280×720 or higher
                    </p>
                  </>
                )}
              </div>

              {!imagePreview && (
                <div style={{
                  display: 'flex',
                  gap: theme.spacing.md,
                  marginTop: theme.spacing.md,
                }}>
                  <Button
                    variant="primary"
                    icon={<FolderOpen size={20} />}
                    onClick={handleImageSelect}
                    fullWidth
                  >
                    Select Image
                  </Button>
                </div>
              )}
            </div>

            {/* Motion Control Section */}
            <div style={{ marginBottom: theme.spacing.xl }}>
              <h3 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                marginBottom: theme.spacing.lg,
              }}>
                Motion Control
              </h3>

              <div style={{ marginBottom: theme.spacing.lg }}>
                <label style={{
                  display: 'block',
                  marginBottom: theme.spacing.sm,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.textSecondary,
                }}>
                  Motion Guidance (Optional)
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the desired motion (e.g., camera pan left, zoom in slowly)..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: theme.spacing.md,
                    background: theme.colors.backgroundTertiary,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.md,
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSize.md,
                    fontFamily: theme.typography.fontFamily,
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: theme.spacing.sm,
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                  }}>
                    Motion Intensity
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
                      min="1"
                      max="255"
                      value={motionBucket}
                      onChange={(e) => setMotionBucket(Number(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span style={{
                      minWidth: '50px',
                      textAlign: 'center',
                      fontWeight: theme.typography.fontWeight.semibold,
                    }}>
                      {motionBucket}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: theme.spacing.xs,
                    marginTop: theme.spacing.sm,
                  }}>
                    {motionPresets.map((preset) => (
                      <Button
                        key={preset.name}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setMotionBucket(preset.bucket);
                          setNoiseAugStrength(preset.noise);
                        }}
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: theme.spacing.sm,
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                  }}>
                    Noise Augmentation
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={noiseAugStrength}
                    onChange={(e) => setNoiseAugStrength(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: theme.spacing.md,
                      background: theme.colors.backgroundTertiary,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      color: theme.colors.text,
                      fontSize: theme.typography.fontSize.md,
                      outline: 'none',
                    }}
                  />
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
                      max="6"
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
                    <option value={16}>16 FPS</option>
                    <option value={24}>24 FPS</option>
                    <option value={30}>30 FPS</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: theme.spacing.sm,
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                  }}>
                    Sampling Steps
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
                    <option value={20}>Fast (20)</option>
                    <option value={30}>Standard (30)</option>
                    <option value={40}>Quality (40)</option>
                    <option value={60}>High (60)</option>
                  </select>
                </div>
              </div>
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
                    I2V-A14B Checkpoint
                  </label>
                  <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                    <input
                      value={ckpt}
                      onChange={(e) => setCkpt(e.target.value)}
                      placeholder="Select I2V-A14B checkpoint directory..."
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
                      Auto
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
                {running ? 'Stop Animation' : 'Animate Image'}
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
                    <span>I2V-A14B Processing</span>
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
                Animation Log
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
          </Card>
        </div>

        {/* Right Sidebar */}
        <div>
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
              I2V Tips
            </h3>

            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary,
              lineHeight: 1.6,
            }}>
              <ul style={{ paddingLeft: theme.spacing.lg, margin: 0 }}>
                <li style={{ marginBottom: theme.spacing.sm }}>
                  Use high-quality input images for best results
                </li>
                <li style={{ marginBottom: theme.spacing.sm }}>
                  Motion intensity 50-150 for natural movement
                </li>
                <li style={{ marginBottom: theme.spacing.sm }}>
                  Higher values create more dynamic motion
                </li>
                <li>
                  Noise augmentation adds variation to motion
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};