import React, { useState, useRef, useEffect } from 'react';

interface VideoEffect {
  id: string;
  name: string;
  category: string;
  parameters: EffectParameter[];
  preview?: string;
  gpuAccelerated: boolean;
}

interface EffectParameter {
  name: string;
  type: 'slider' | 'color' | 'select' | 'checkbox' | 'curve';
  value: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
}

interface AIEffect {
  id: string;
  name: string;
  model: string;
  processing: boolean;
  confidence: number;
}

const VideoEffects: React.FC = () => {
  const [selectedEffect, setSelectedEffect] = useState<VideoEffect | null>(null);
  const [appliedEffects, setAppliedEffects] = useState<VideoEffect[]>([]);
  const [processing, setProcessing] = useState(false);
  const [aiMode, setAiMode] = useState<'enhance' | 'generate' | 'style'>('enhance');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const effectCategories = {
    color: [
      {
        id: 'color_correction',
        name: 'Color Correction',
        category: 'color',
        gpuAccelerated: true,
        parameters: [
          { name: 'brightness', type: 'slider', value: 0, min: -100, max: 100 },
          { name: 'contrast', type: 'slider', value: 0, min: -100, max: 100 },
          { name: 'saturation', type: 'slider', value: 0, min: -100, max: 100 },
          { name: 'hue', type: 'slider', value: 0, min: -180, max: 180 },
          { name: 'temperature', type: 'slider', value: 0, min: -100, max: 100 },
          { name: 'tint', type: 'slider', value: 0, min: -100, max: 100 },
        ],
      },
      {
        id: 'lut',
        name: 'LUT (Look-Up Table)',
        category: 'color',
        gpuAccelerated: true,
        parameters: [
          { 
            name: 'preset', 
            type: 'select', 
            value: 'none',
            options: [
              { label: 'None', value: 'none' },
              { label: 'Cinematic', value: 'cinematic' },
              { label: 'Vintage', value: 'vintage' },
              { label: 'Noir', value: 'noir' },
              { label: 'Cyberpunk', value: 'cyberpunk' },
              { label: 'Warm', value: 'warm' },
              { label: 'Cold', value: 'cold' },
            ],
          },
          { name: 'intensity', type: 'slider', value: 100, min: 0, max: 100 },
        ],
      },
      {
        id: 'curves',
        name: 'Curves',
        category: 'color',
        gpuAccelerated: true,
        parameters: [
          { name: 'rgb', type: 'curve', value: [[0, 0], [255, 255]] },
          { name: 'red', type: 'curve', value: [[0, 0], [255, 255]] },
          { name: 'green', type: 'curve', value: [[0, 0], [255, 255]] },
          { name: 'blue', type: 'curve', value: [[0, 0], [255, 255]] },
        ],
      },
    ],
    blur: [
      {
        id: 'gaussian_blur',
        name: 'Gaussian Blur',
        category: 'blur',
        gpuAccelerated: true,
        parameters: [
          { name: 'radius', type: 'slider', value: 0, min: 0, max: 50 },
          { name: 'quality', type: 'select', value: 'high', options: [
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'medium' },
            { label: 'High', value: 'high' },
          ]},
        ],
      },
      {
        id: 'motion_blur',
        name: 'Motion Blur',
        category: 'blur',
        gpuAccelerated: true,
        parameters: [
          { name: 'angle', type: 'slider', value: 0, min: 0, max: 360 },
          { name: 'distance', type: 'slider', value: 0, min: 0, max: 100 },
        ],
      },
      {
        id: 'radial_blur',
        name: 'Radial Blur',
        category: 'blur',
        gpuAccelerated: true,
        parameters: [
          { name: 'centerX', type: 'slider', value: 50, min: 0, max: 100 },
          { name: 'centerY', type: 'slider', value: 50, min: 0, max: 100 },
          { name: 'amount', type: 'slider', value: 0, min: 0, max: 100 },
        ],
      },
    ],
    distortion: [
      {
        id: 'lens_distortion',
        name: 'Lens Distortion',
        category: 'distortion',
        gpuAccelerated: true,
        parameters: [
          { name: 'k1', type: 'slider', value: 0, min: -1, max: 1, step: 0.01 },
          { name: 'k2', type: 'slider', value: 0, min: -1, max: 1, step: 0.01 },
          { name: 'scale', type: 'slider', value: 100, min: 50, max: 150 },
        ],
      },
      {
        id: 'wave',
        name: 'Wave Distortion',
        category: 'distortion',
        gpuAccelerated: true,
        parameters: [
          { name: 'amplitude', type: 'slider', value: 0, min: 0, max: 50 },
          { name: 'frequency', type: 'slider', value: 1, min: 0.1, max: 10, step: 0.1 },
          { name: 'speed', type: 'slider', value: 1, min: 0, max: 10, step: 0.1 },
        ],
      },
      {
        id: 'glitch',
        name: 'Glitch',
        category: 'distortion',
        gpuAccelerated: true,
        parameters: [
          { name: 'intensity', type: 'slider', value: 0, min: 0, max: 100 },
          { name: 'frequency', type: 'slider', value: 5, min: 1, max: 60 },
          { name: 'rgbSplit', type: 'checkbox', value: false },
        ],
      },
    ],
    artistic: [
      {
        id: 'cartoon',
        name: 'Cartoon',
        category: 'artistic',
        gpuAccelerated: true,
        parameters: [
          { name: 'edges', type: 'slider', value: 50, min: 0, max: 100 },
          { name: 'detail', type: 'slider', value: 50, min: 0, max: 100 },
          { name: 'colors', type: 'slider', value: 8, min: 2, max: 32 },
        ],
      },
      {
        id: 'oil_painting',
        name: 'Oil Painting',
        category: 'artistic',
        gpuAccelerated: true,
        parameters: [
          { name: 'brushSize', type: 'slider', value: 5, min: 1, max: 20 },
          { name: 'smoothness', type: 'slider', value: 50, min: 0, max: 100 },
        ],
      },
      {
        id: 'sketch',
        name: 'Sketch',
        category: 'artistic',
        gpuAccelerated: true,
        parameters: [
          { name: 'detail', type: 'slider', value: 50, min: 0, max: 100 },
          { name: 'contrast', type: 'slider', value: 50, min: 0, max: 100 },
          { name: 'invert', type: 'checkbox', value: false },
        ],
      },
    ],
    ai: [
      {
        id: 'ai_upscale',
        name: 'AI Upscaling',
        category: 'ai',
        gpuAccelerated: true,
        parameters: [
          { name: 'scale', type: 'select', value: '2x', options: [
            { label: '2x', value: '2x' },
            { label: '4x', value: '4x' },
            { label: '8x', value: '8x' },
          ]},
          { name: 'model', type: 'select', value: 'esrgan', options: [
            { label: 'ESRGAN', value: 'esrgan' },
            { label: 'Real-ESRGAN', value: 'realesrgan' },
            { label: 'BSRGAN', value: 'bsrgan' },
          ]},
          { name: 'denoise', type: 'slider', value: 0, min: 0, max: 100 },
        ],
      },
      {
        id: 'ai_style_transfer',
        name: 'AI Style Transfer',
        category: 'ai',
        gpuAccelerated: true,
        parameters: [
          { name: 'style', type: 'select', value: 'monet', options: [
            { label: 'Monet', value: 'monet' },
            { label: 'Van Gogh', value: 'vangogh' },
            { label: 'Picasso', value: 'picasso' },
            { label: 'Anime', value: 'anime' },
            { label: 'Cyberpunk', value: 'cyberpunk' },
          ]},
          { name: 'strength', type: 'slider', value: 50, min: 0, max: 100 },
          { name: 'preserveContent', type: 'checkbox', value: true },
        ],
      },
      {
        id: 'ai_object_removal',
        name: 'AI Object Removal',
        category: 'ai',
        gpuAccelerated: true,
        parameters: [
          { name: 'mode', type: 'select', value: 'auto', options: [
            { label: 'Auto Detect', value: 'auto' },
            { label: 'Manual Selection', value: 'manual' },
            { label: 'Smart Fill', value: 'smart' },
          ]},
          { name: 'precision', type: 'slider', value: 80, min: 0, max: 100 },
        ],
      },
      {
        id: 'ai_background_removal',
        name: 'AI Background Removal',
        category: 'ai',
        gpuAccelerated: true,
        parameters: [
          { name: 'mode', type: 'select', value: 'person', options: [
            { label: 'Person', value: 'person' },
            { label: 'Object', value: 'object' },
            { label: 'Green Screen', value: 'greenscreen' },
          ]},
          { name: 'edgeSmoothing', type: 'slider', value: 50, min: 0, max: 100 },
          { name: 'spill', type: 'slider', value: 0, min: 0, max: 100 },
        ],
      },
      {
        id: 'ai_face_enhancement',
        name: 'AI Face Enhancement',
        category: 'ai',
        gpuAccelerated: true,
        parameters: [
          { name: 'smoothing', type: 'slider', value: 30, min: 0, max: 100 },
          { name: 'sharpening', type: 'slider', value: 20, min: 0, max: 100 },
          { name: 'eyeEnhance', type: 'checkbox', value: true },
          { name: 'teethWhiten', type: 'checkbox', value: false },
        ],
      },
      {
        id: 'ai_motion_interpolation',
        name: 'AI Motion Interpolation',
        category: 'ai',
        gpuAccelerated: true,
        parameters: [
          { name: 'targetFps', type: 'select', value: '60', options: [
            { label: '30 FPS', value: '30' },
            { label: '60 FPS', value: '60' },
            { label: '120 FPS', value: '120' },
            { label: '240 FPS', value: '240' },
          ]},
          { name: 'algorithm', type: 'select', value: 'rife', options: [
            { label: 'RIFE', value: 'rife' },
            { label: 'DAIN', value: 'dain' },
            { label: 'CAIN', value: 'cain' },
          ]},
        ],
      },
    ],
    wan22: [
      {
        id: 'wan22_video_gen',
        name: 'WAN 2.2 Video Generation',
        category: 'wan22',
        gpuAccelerated: true,
        parameters: [
          { name: 'mode', type: 'select', value: 't2v', options: [
            { label: 'Text to Video', value: 't2v' },
            { label: 'Image to Video', value: 'i2v' },
            { label: 'Text+Image to Video', value: 'ti2v' },
          ]},
          { name: 'quality', type: 'select', value: 'high', options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Standard', value: 'standard' },
            { label: 'High', value: 'high' },
            { label: 'Ultra', value: 'ultra' },
          ]},
          { name: 'duration', type: 'slider', value: 5, min: 1, max: 30 },
          { name: 'fps', type: 'select', value: '30', options: [
            { label: '24 FPS', value: '24' },
            { label: '30 FPS', value: '30' },
            { label: '60 FPS', value: '60' },
          ]},
        ],
      },
      {
        id: 'wan22_style_control',
        name: 'WAN 2.2 Style Control',
        category: 'wan22',
        gpuAccelerated: true,
        parameters: [
          { name: 'style', type: 'select', value: 'cinematic', options: [
            { label: 'Cinematic', value: 'cinematic' },
            { label: 'Animation', value: 'animation' },
            { label: 'Realistic', value: 'realistic' },
            { label: 'Artistic', value: 'artistic' },
            { label: 'Documentary', value: 'documentary' },
          ]},
          { name: 'strength', type: 'slider', value: 70, min: 0, max: 100 },
          { name: 'consistency', type: 'slider', value: 80, min: 0, max: 100 },
        ],
      },
      {
        id: 'wan22_motion_control',
        name: 'WAN 2.2 Motion Control',
        category: 'wan22',
        gpuAccelerated: true,
        parameters: [
          { name: 'motionType', type: 'select', value: 'natural', options: [
            { label: 'Natural', value: 'natural' },
            { label: 'Smooth', value: 'smooth' },
            { label: 'Dynamic', value: 'dynamic' },
            { label: 'Slow Motion', value: 'slow' },
            { label: 'Time-lapse', value: 'timelapse' },
          ]},
          { name: 'intensity', type: 'slider', value: 50, min: 0, max: 100 },
          { name: 'cameraMovement', type: 'select', value: 'none', options: [
            { label: 'None', value: 'none' },
            { label: 'Pan', value: 'pan' },
            { label: 'Zoom', value: 'zoom' },
            { label: 'Rotate', value: 'rotate' },
            { label: 'Dolly', value: 'dolly' },
          ]},
        ],
      },
      {
        id: 'wan22_scene_understanding',
        name: 'WAN 2.2 Scene Understanding',
        category: 'wan22',
        gpuAccelerated: true,
        parameters: [
          { name: 'analysis', type: 'select', value: 'full', options: [
            { label: 'Full Analysis', value: 'full' },
            { label: 'Objects Only', value: 'objects' },
            { label: 'Actions Only', value: 'actions' },
            { label: 'Scene Context', value: 'context' },
          ]},
          { name: 'depth', type: 'checkbox', value: true },
          { name: 'semantic', type: 'checkbox', value: true },
          { name: 'temporal', type: 'checkbox', value: true },
        ],
      },
    ],
  };

  const applyEffect = (effect: VideoEffect) => {
    setProcessing(true);
    setTimeout(() => {
      setAppliedEffects([...appliedEffects, effect]);
      setProcessing(false);
    }, 1000);
  };

  const removeEffect = (effectId: string) => {
    setAppliedEffects(appliedEffects.filter(e => e.id !== effectId));
  };

  const renderParameterControl = (param: EffectParameter) => {
    switch (param.type) {
      case 'slider':
        return (
          <div className="param-slider">
            <input
              type="range"
              min={param.min}
              max={param.max}
              step={param.step || 1}
              value={param.value}
              onChange={(e) => console.log(e.target.value)}
            />
            <span className="param-value">{param.value}</span>
          </div>
        );
      
      case 'select':
        return (
          <select value={param.value} onChange={(e) => console.log(e.target.value)}>
            {param.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <label className="param-checkbox">
            <input
              type="checkbox"
              checked={param.value}
              onChange={(e) => console.log(e.target.checked)}
            />
            <span className="checkmark" />
          </label>
        );
      
      case 'color':
        return (
          <input
            type="color"
            value={param.value}
            onChange={(e) => console.log(e.target.value)}
          />
        );
      
      case 'curve':
        return (
          <div className="param-curve">
            <canvas width="100" height="100" />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="video-effects-panel">
      <style jsx>{`
        .video-effects-panel {
          display: flex;
          height: 100%;
          background: #0a0a0a;
          color: #fff;
          font-family: 'Inter', sans-serif;
        }

        .effects-sidebar {
          width: 300px;
          background: #1a1a1a;
          border-right: 1px solid #333;
          overflow-y: auto;
        }

        .effects-header {
          padding: 16px;
          background: #2a2a2a;
          border-bottom: 1px solid #333;
        }

        .effects-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .ai-mode-selector {
          display: flex;
          gap: 6px;
        }

        .mode-btn {
          flex: 1;
          padding: 6px;
          background: #1a1a1a;
          border: 1px solid #444;
          border-radius: 4px;
          color: #888;
          cursor: pointer;
          font-size: 11px;
          transition: all 0.2s;
        }

        .mode-btn.active {
          background: #00ff88;
          color: #000;
          border-color: #00ff88;
        }

        .effect-categories {
          padding: 12px;
        }

        .effect-category {
          margin-bottom: 20px;
        }

        .category-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px;
          background: #2a2a2a;
          border-radius: 4px;
          cursor: pointer;
          margin-bottom: 8px;
        }

        .category-name {
          font-size: 12px;
          text-transform: uppercase;
          color: #888;
          font-weight: 600;
        }

        .category-icon {
          font-size: 10px;
          color: #666;
        }

        .effect-list {
          display: grid;
          gap: 6px;
        }

        .effect-item {
          padding: 10px;
          background: #0a0a0a;
          border: 1px solid #333;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .effect-item:hover {
          background: #1a1a1a;
          border-color: #00ff88;
        }

        .effect-item.selected {
          background: #00ff88;
          color: #000;
          border-color: #00ff88;
        }

        .effect-name {
          font-size: 12px;
        }

        .gpu-badge {
          padding: 2px 6px;
          background: rgba(0, 255, 136, 0.2);
          border-radius: 2px;
          font-size: 9px;
          color: #00ff88;
        }

        .effects-main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .preview-area {
          flex: 1;
          position: relative;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-canvas {
          max-width: 100%;
          max-height: 100%;
          border: 1px solid #333;
        }

        .preview-video {
          max-width: 100%;
          max-height: 100%;
          border: 1px solid #333;
        }

        .effect-controls {
          background: #1a1a1a;
          border-top: 1px solid #333;
          padding: 20px;
          max-height: 300px;
          overflow-y: auto;
        }

        .control-section {
          margin-bottom: 20px;
        }

        .control-header {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .parameter {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .param-label {
          font-size: 12px;
          color: #888;
          min-width: 100px;
        }

        .param-slider {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }

        .param-slider input {
          flex: 1;
        }

        .param-value {
          font-size: 11px;
          color: #00ff88;
          min-width: 40px;
          text-align: right;
        }

        .param-checkbox {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .param-checkbox input {
          display: none;
        }

        .checkmark {
          width: 18px;
          height: 18px;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 3px;
          position: relative;
        }

        .param-checkbox input:checked + .checkmark {
          background: #00ff88;
          border-color: #00ff88;
        }

        .param-checkbox input:checked + .checkmark::after {
          content: '✓';
          position: absolute;
          top: -2px;
          left: 3px;
          color: #000;
          font-size: 12px;
        }

        .param-curve {
          width: 100px;
          height: 100px;
          background: #0a0a0a;
          border: 1px solid #333;
          border-radius: 4px;
        }

        select {
          padding: 4px 8px;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 4px;
          color: #fff;
          font-size: 11px;
          cursor: pointer;
        }

        input[type="range"] {
          -webkit-appearance: none;
          height: 4px;
          background: #2a2a2a;
          border-radius: 2px;
          outline: none;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          background: #00ff88;
          border-radius: 50%;
          cursor: pointer;
        }

        input[type="color"] {
          width: 40px;
          height: 30px;
          border: 1px solid #444;
          border-radius: 4px;
          cursor: pointer;
        }

        .applied-effects {
          background: #1a1a1a;
          border-top: 1px solid #333;
          padding: 16px;
        }

        .applied-header {
          font-size: 12px;
          text-transform: uppercase;
          color: #888;
          margin-bottom: 12px;
        }

        .applied-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .applied-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px;
          background: #2a2a2a;
          border-radius: 4px;
        }

        .applied-name {
          font-size: 12px;
        }

        .remove-btn {
          padding: 4px 8px;
          background: #e74c3c;
          border: none;
          border-radius: 3px;
          color: #fff;
          font-size: 10px;
          cursor: pointer;
        }

        .apply-btn {
          width: 100%;
          padding: 10px;
          background: linear-gradient(90deg, #00ff88, #00aaff);
          border: none;
          border-radius: 6px;
          color: #000;
          font-weight: 600;
          cursor: pointer;
          margin-top: 12px;
        }

        .apply-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .processing-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .processing-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid #333;
          border-top: 3px solid #00ff88;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div className="effects-sidebar">
        <div className="effects-header">
          <h2 className="effects-title">Video Effects</h2>
          <div className="ai-mode-selector">
            <button 
              className={`mode-btn ${aiMode === 'enhance' ? 'active' : ''}`}
              onClick={() => setAiMode('enhance')}
            >
              Enhance
            </button>
            <button 
              className={`mode-btn ${aiMode === 'generate' ? 'active' : ''}`}
              onClick={() => setAiMode('generate')}
            >
              Generate
            </button>
            <button 
              className={`mode-btn ${aiMode === 'style' ? 'active' : ''}`}
              onClick={() => setAiMode('style')}
            >
              Style
            </button>
          </div>
        </div>

        <div className="effect-categories">
          {Object.entries(effectCategories).map(([category, effects]) => (
            <div key={category} className="effect-category">
              <div className="category-header">
                <span className="category-name">
                  {category === 'wan22' ? 'WAN 2.2 AI' : category}
                </span>
                <span className="category-icon">▼</span>
              </div>
              <div className="effect-list">
                {(effects as any).map((effect: any) => (
                  <div
                    key={effect.id}
                    className={`effect-item ${selectedEffect?.id === effect.id ? 'selected' : ''}`}
                    onClick={() => setSelectedEffect(effect)}
                  >
                    <span className="effect-name">{effect.name}</span>
                    {effect.gpuAccelerated && <span className="gpu-badge">GPU</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="effects-main">
        <div className="preview-area">
          <canvas ref={canvasRef} className="preview-canvas" width="1280" height="720" />
          <video ref={videoRef} className="preview-video" style={{ display: 'none' }} />
          {processing && (
            <div className="processing-overlay">
              <div className="processing-spinner" />
            </div>
          )}
        </div>

        {selectedEffect && (
          <div className="effect-controls">
            <div className="control-section">
              <div className="control-header">
                <span>{selectedEffect.name} Settings</span>
                {selectedEffect.gpuAccelerated && <span className="gpu-badge">GPU Accelerated</span>}
              </div>
              {selectedEffect.parameters.map(param => (
                <div key={param.name} className="parameter">
                  <span className="param-label">{param.name}</span>
                  {renderParameterControl(param)}
                </div>
              ))}
              <button 
                className="apply-btn"
                onClick={() => applyEffect(selectedEffect)}
                disabled={processing}
              >
                Apply Effect
              </button>
            </div>
          </div>
        )}

        {appliedEffects.length > 0 && (
          <div className="applied-effects">
            <div className="applied-header">Applied Effects ({appliedEffects.length})</div>
            <div className="applied-list">
              {appliedEffects.map(effect => (
                <div key={effect.id} className="applied-item">
                  <span className="applied-name">{effect.name}</span>
                  <button 
                    className="remove-btn"
                    onClick={() => removeEffect(effect.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoEffects;