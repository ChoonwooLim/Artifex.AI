import React, { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Square, Download, Upload, Sparkles, 
  Zap, Clock, Cpu, HardDrive, AlertCircle, CheckCircle,
  Settings, ChevronDown, ChevronUp, Film, Image, Type,
  Sliders, Maximize2, RefreshCw, Save, FolderOpen,
  Wand2, Layers, Grid, Monitor
} from 'lucide-react';
import { theme } from '../styles/theme';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';

interface GenerationParams {
  task: 'text-to-video' | 'image-to-video' | 'text-image-to-video';
  model: string;
  prompt: string;
  negativePrompt: string;
  imagePath: string;
  size: string;
  length: number;
  fps: number;
  steps: number;
  cfgScale: number;
  seed: number;
  scheduler: string;
  outputFormat: string;
  quality: string;
}

export const VideoGenerationView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'text-to-video' | 'image-to-video' | 'text-image-to-video'>('text-to-video');
  const [params, setParams] = useState<GenerationParams>({
    task: 'text-to-video',
    model: 'wan-ti2v-5B',
    prompt: 'A cinematic shot of a futuristic city at sunset, flying cars, neon lights, ultra realistic, 8k',
    negativePrompt: 'blurry, low quality, distorted',
    imagePath: '',
    size: '1280x720',
    length: 5,
    fps: 24,
    steps: 50,
    cfgScale: 7.5,
    seed: -1,
    scheduler: 'DPM++',
    outputFormat: 'mp4',
    quality: 'high',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState('');
  const [currentPhase, setCurrentPhase] = useState('Idle');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const presetTemplates = [
    { name: 'Cinematic', settings: { steps: 50, cfgScale: 7.5, quality: 'high' } },
    { name: 'Fast Preview', settings: { steps: 20, cfgScale: 5, quality: 'medium' } },
    { name: 'Ultra Quality', settings: { steps: 100, cfgScale: 10, quality: 'ultra' } },
    { name: 'Artistic', settings: { steps: 75, cfgScale: 12, quality: 'high' } },
  ];

  const modelOptions = {
    'text-to-video': [
      { id: 'wan-t2v-A14B', name: 'WAN T2V-A14B', vram: '16GB' },
      { id: 'stable-video', name: 'Stable Video Diffusion', vram: '12GB' },
    ],
    'image-to-video': [
      { id: 'wan-i2v-A14B', name: 'WAN I2V-A14B', vram: '16GB' },
      { id: 'animatediff', name: 'AnimateDiff', vram: '10GB' },
    ],
    'text-image-to-video': [
      { id: 'wan-ti2v-5B', name: 'WAN TI2V-5B', vram: '24GB' },
      { id: 'cogvideo', name: 'CogVideo', vram: '20GB' },
    ],
  };

  const sizePresets = [
    { label: 'SD (480p)', value: '854x480', aspect: '16:9' },
    { label: 'HD (720p)', value: '1280x720', aspect: '16:9' },
    { label: 'Full HD (1080p)', value: '1920x1080', aspect: '16:9' },
    { label: 'Portrait HD', value: '720x1280', aspect: '9:16' },
    { label: 'Square HD', value: '1024x1024', aspect: '1:1' },
    { label: 'Cinema 2K', value: '2048x1080', aspect: '2:1' },
  ];

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setProgress(0);
    setCurrentPhase('Initializing');
    
    // Simulate generation process
    const phases = [
      { name: 'Loading model', duration: 3000, progress: 20 },
      { name: 'Processing prompt', duration: 2000, progress: 30 },
      { name: 'Generating frames', duration: 15000, progress: 80 },
      { name: 'Encoding video', duration: 3000, progress: 95 },
      { name: 'Finalizing', duration: 1000, progress: 100 },
    ];

    for (const phase of phases) {
      setCurrentPhase(phase.name);
      setProgress(phase.progress);
      await new Promise(resolve => setTimeout(resolve, phase.duration));
    }

    setIsGenerating(false);
    setCurrentPhase('Complete');
    setGeneratedVideos([...generatedVideos, `/generated/video_${Date.now()}.mp4`]);
  }, [generatedVideos]);

  return (
    <div style={{
      padding: theme.spacing.xl,
      maxWidth: '1600px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        marginBottom: theme.spacing.xl,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{
            fontSize: theme.typography.fontSize['3xl'],
            fontWeight: theme.typography.fontWeight.bold,
            marginBottom: theme.spacing.sm,
            background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            AI Video Generation Studio
          </h1>
          <p style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSize.lg,
          }}>
            Create stunning videos with state-of-the-art AI models
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: theme.spacing.md }}>
          <Button variant="ghost" icon={<History size={20} />}>
            History
          </Button>
          <Button variant="ghost" icon={<FolderOpen size={20} />}>
            Load Project
          </Button>
          <Button variant="primary" icon={<Save size={20} />}>
            Save Project
          </Button>
        </div>
      </div>

      {/* Tab Selection */}
      <div style={{
        display: 'flex',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.xl,
        borderBottom: `1px solid ${theme.colors.border}`,
        paddingBottom: theme.spacing.md,
      }}>
        {[
          { id: 'text-to-video', label: 'Text to Video', icon: <Type size={18} /> },
          { id: 'image-to-video', label: 'Image to Video', icon: <Image size={18} /> },
          { id: 'text-image-to-video', label: 'Text + Image to Video', icon: <Layers size={18} /> },
        ].map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: `${theme.spacing.md} ${theme.spacing.lg}`,
              background: activeTab === tab.id 
                ? `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`
                : 'transparent',
              border: activeTab === tab.id 
                ? 'none'
                : `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              color: activeTab === tab.id ? theme.colors.text : theme.colors.textSecondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              fontSize: theme.typography.fontSize.md,
              fontWeight: activeTab === tab.id 
                ? theme.typography.fontWeight.semibold
                : theme.typography.fontWeight.normal,
              transition: `all ${theme.transitions.fast}`,
            }}
          >
            {tab.icon}
            {tab.label}
          </motion.button>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: theme.spacing.xl,
      }}>
        {/* Main Generation Panel */}
        <div>
          <Card variant="glass" style={{ marginBottom: theme.spacing.xl }}>
            {/* Model Selection */}
            <div style={{ marginBottom: theme.spacing.lg }}>
              <label style={{
                display: 'block',
                marginBottom: theme.spacing.sm,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.medium,
              }}>
                AI Model
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: theme.spacing.md,
              }}>
                {modelOptions[activeTab].map((model) => (
                  <motion.div
                    key={model.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setParams({ ...params, model: model.id })}
                    style={{
                      padding: theme.spacing.md,
                      background: params.model === model.id 
                        ? theme.colors.surface
                        : theme.colors.backgroundTertiary,
                      border: `2px solid ${params.model === model.id ? theme.colors.primary : theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      cursor: 'pointer',
                      transition: `all ${theme.transitions.fast}`,
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: theme.spacing.xs,
                    }}>
                      <span style={{
                        fontWeight: theme.typography.fontWeight.semibold,
                        color: params.model === model.id ? theme.colors.primary : theme.colors.text,
                      }}>
                        {model.name}
                      </span>
                      <span style={{
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.textTertiary,
                        background: theme.colors.backgroundSecondary,
                        padding: `2px 8px`,
                        borderRadius: theme.borderRadius.sm,
                      }}>
                        {model.vram}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Prompt Input */}
            <div style={{ marginBottom: theme.spacing.lg }}>
              <label style={{
                display: 'block',
                marginBottom: theme.spacing.sm,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.medium,
              }}>
                Prompt
              </label>
              <div style={{
                position: 'relative',
              }}>
                <textarea
                  value={params.prompt}
                  onChange={(e) => setParams({ ...params, prompt: e.target.value })}
                  placeholder="Describe your video..."
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: theme.spacing.md,
                    background: theme.colors.backgroundTertiary,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.md,
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSize.md,
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: theme.typography.fontFamily,
                    transition: `all ${theme.transitions.fast}`,
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Wand2 size={16} />}
                  style={{
                    position: 'absolute',
                    bottom: theme.spacing.sm,
                    right: theme.spacing.sm,
                  }}
                >
                  Enhance
                </Button>
              </div>
            </div>

            {/* Size Selection */}
            <div style={{ marginBottom: theme.spacing.lg }}>
              <label style={{
                display: 'block',
                marginBottom: theme.spacing.sm,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.medium,
              }}>
                Video Size
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: theme.spacing.sm,
              }}>
                {sizePresets.map((size) => (
                  <motion.button
                    key={size.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setParams({ ...params, size: size.value })}
                    style={{
                      padding: theme.spacing.md,
                      background: params.size === size.value
                        ? `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`
                        : theme.colors.backgroundTertiary,
                      border: `1px solid ${params.size === size.value ? theme.colors.primary : theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      color: params.size === size.value ? theme.colors.text : theme.colors.textSecondary,
                      cursor: 'pointer',
                      transition: `all ${theme.transitions.fast}`,
                    }}
                  >
                    <div style={{
                      fontWeight: theme.typography.fontWeight.medium,
                      marginBottom: '4px',
                    }}>
                      {size.label}
                    </div>
                    <div style={{
                      fontSize: theme.typography.fontSize.xs,
                      opacity: 0.7,
                    }}>
                      {size.aspect}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Duration and FPS */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: theme.spacing.lg,
              marginBottom: theme.spacing.lg,
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: theme.spacing.sm,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.textSecondary,
                  fontWeight: theme.typography.fontWeight.medium,
                }}>
                  Duration (seconds)
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
                    max="10"
                    value={params.length}
                    onChange={(e) => setParams({ ...params, length: Number(e.target.value) })}
                    style={{
                      flex: 1,
                    }}
                  />
                  <span style={{
                    minWidth: '40px',
                    textAlign: 'center',
                    fontWeight: theme.typography.fontWeight.semibold,
                  }}>
                    {params.length}s
                  </span>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: theme.spacing.sm,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.textSecondary,
                  fontWeight: theme.typography.fontWeight.medium,
                }}>
                  Frame Rate
                </label>
                <select
                  value={params.fps}
                  onChange={(e) => setParams({ ...params, fps: Number(e.target.value) })}
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

            {/* Advanced Settings */}
            <motion.div
              animate={{ height: showAdvanced ? 'auto' : 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                padding: theme.spacing.lg,
                background: theme.colors.backgroundTertiary,
                borderRadius: theme.borderRadius.md,
                marginBottom: theme.spacing.lg,
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: theme.spacing.lg,
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: theme.spacing.sm,
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.textSecondary,
                    }}>
                      Sampling Steps
                    </label>
                    <input
                      type="number"
                      value={params.steps}
                      onChange={(e) => setParams({ ...params, steps: Number(e.target.value) })}
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
                      CFG Scale
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={params.cfgScale}
                      onChange={(e) => setParams({ ...params, cfgScale: Number(e.target.value) })}
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
                      value={params.seed}
                      onChange={(e) => setParams({ ...params, seed: Number(e.target.value) })}
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
                      value={params.scheduler}
                      onChange={(e) => setParams({ ...params, scheduler: e.target.value })}
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
                      <option value="Euler">Euler</option>
                      <option value="Euler a">Euler a</option>
                      <option value="DDIM">DDIM</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>

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
                marginBottom: theme.spacing.lg,
                transition: `all ${theme.transitions.fast}`,
              }}
            >
              <Settings size={16} />
              Advanced Settings
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Generation Button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon={isGenerating ? <Square size={20} /> : <Sparkles size={20} />}
              onClick={isGenerating ? () => setIsGenerating(false) : handleGenerate}
              loading={isGenerating}
            >
              {isGenerating ? 'Stop Generation' : 'Generate Video'}
            </Button>

            {/* Progress Display */}
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: theme.spacing.lg,
                  padding: theme.spacing.lg,
                  background: theme.colors.backgroundTertiary,
                  borderRadius: theme.borderRadius.md,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                <ProgressBar
                  value={progress}
                  label={currentPhase}
                  variant="gradient"
                  size="lg"
                  animated
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: theme.spacing.md,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.textSecondary,
                }}>
                  <span>Estimated time: {eta || 'Calculating...'}</span>
                  <span>GPU Memory: 14.2GB / 24GB</span>
                </div>
              </motion.div>
            )}
          </Card>

          {/* Preset Templates */}
          <Card variant="glass">
            <h3 style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.lg,
            }}>
              Quick Presets
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: theme.spacing.md,
            }}>
              {presetTemplates.map((preset) => (
                <motion.button
                  key={preset.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setParams({ ...params, ...preset.settings })}
                  style={{
                    padding: theme.spacing.md,
                    background: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.md,
                    color: theme.colors.text,
                    cursor: 'pointer',
                    transition: `all ${theme.transitions.fast}`,
                  }}
                >
                  <Zap size={20} style={{ marginBottom: theme.spacing.xs }} />
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                  }}>
                    {preset.name}
                  </div>
                </motion.button>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div>
          {/* System Status */}
          <Card variant="glass" style={{ marginBottom: theme.spacing.xl }}>
            <h3 style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.lg,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
            }}>
              <Monitor size={20} />
              System Status
            </h3>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing.md,
            }}>
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: theme.spacing.xs,
                  fontSize: theme.typography.fontSize.sm,
                }}>
                  <span style={{ color: theme.colors.textSecondary }}>GPU</span>
                  <span style={{ color: theme.colors.success }}>RTX 4090</span>
                </div>
                <ProgressBar value={58} max={100} showPercentage={false} size="sm" />
              </div>

              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: theme.spacing.xs,
                  fontSize: theme.typography.fontSize.sm,
                }}>
                  <span style={{ color: theme.colors.textSecondary }}>VRAM</span>
                  <span>14.2GB / 24GB</span>
                </div>
                <ProgressBar value={59} max={100} showPercentage={false} size="sm" variant="gradient" />
              </div>

              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: theme.spacing.xs,
                  fontSize: theme.typography.fontSize.sm,
                }}>
                  <span style={{ color: theme.colors.textSecondary }}>RAM</span>
                  <span>12.5GB / 32GB</span>
                </div>
                <ProgressBar value={39} max={100} showPercentage={false} size="sm" />
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: theme.spacing.md,
                background: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                marginTop: theme.spacing.sm,
              }}>
                <CheckCircle size={16} color={theme.colors.success} />
                <span style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.success,
                }}>
                  CUDA 12.1 Ready
                </span>
              </div>
            </div>
          </Card>

          {/* Recent Generations */}
          <Card variant="glass">
            <h3 style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.lg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                <Clock size={20} />
                Recent
              </span>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </h3>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing.md,
              maxHeight: '400px',
              overflowY: 'auto',
            }}>
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  style={{
                    padding: theme.spacing.md,
                    background: theme.colors.surface,
                    borderRadius: theme.borderRadius.md,
                    cursor: 'pointer',
                    transition: `all ${theme.transitions.fast}`,
                  }}
                >
                  <div style={{
                    aspectRatio: '16/9',
                    background: `linear-gradient(135deg, ${theme.colors.surface}, ${theme.colors.surfaceHover})`,
                    borderRadius: theme.borderRadius.sm,
                    marginBottom: theme.spacing.sm,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Film size={32} color={theme.colors.textTertiary} />
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text,
                    marginBottom: '4px',
                  }}>
                    Generated Video {i}
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.textTertiary,
                  }}>
                    {5 - i} minutes ago
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};