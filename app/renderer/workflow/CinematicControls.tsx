import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

interface LightingSettings {
  intensity: number;
  angle: number;
  sourceType: 'natural' | 'studio' | 'dramatic' | 'volumetric' | 'cinematic';
  color: string;
  temperature: number;
  shadows: {
    enabled: boolean;
    softness: number;
    opacity: number;
  };
  timeOfDay: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'golden_hour' | 'dusk' | 'night' | 'blue_hour';
  environment: 'outdoor' | 'indoor' | 'studio' | 'abstract';
  keyLight: { intensity: number; angle: number; color: string };
  fillLight: { intensity: number; angle: number; color: string };
  backLight: { intensity: number; angle: number; color: string };
  practicalLights: Array<{ type: string; position: [number, number, number]; intensity: number }>;
  atmosphericEffects: {
    fog: number;
    haze: number;
    godRays: boolean;
    particleDensity: number;
  };
}

interface CameraSettings {
  angle: 'eye_level' | 'low_angle' | 'high_angle' | 'dutch_angle' | 'birds_eye' | 'worms_eye' | 'overhead';
  shotSize: 'extreme_close_up' | 'close_up' | 'medium_close_up' | 'medium_shot' | 'medium_wide' | 'wide_shot' | 'extreme_wide';
  movement: 'static' | 'pan' | 'tilt' | 'dolly' | 'truck' | 'pedestal' | 'zoom' | 'handheld' | 'steadicam' | 'crane' | 'orbit';
  speed: number;
  focalLength: number;
  aperture: number;
  depthOfField: {
    enabled: boolean;
    focusDistance: number;
    bokehStrength: number;
    bokehShape: 'circular' | 'hexagonal' | 'octagonal';
  };
  lens: 'normal' | 'wide' | 'telephoto' | 'macro' | 'fisheye' | 'anamorphic';
  stabilization: boolean;
  motionBlur: {
    enabled: boolean;
    strength: number;
    shutterAngle: number;
  };
}

interface CompositionSettings {
  style: 'rule_of_thirds' | 'golden_ratio' | 'symmetrical' | 'asymmetrical' | 'centered' | 'diagonal' | 'triangular' | 'frame_within_frame';
  leadingLines: boolean;
  depthLayers: 'foreground' | 'midground' | 'background' | 'all';
  balance: 'left_heavy' | 'right_heavy' | 'top_heavy' | 'bottom_heavy' | 'balanced';
  negativeSpace: number;
  aspectRatio: '16:9' | '21:9' | '4:3' | '1:1' | '9:16' | '2.39:1' | 'custom';
  framing: {
    headroom: number;
    lookSpace: number;
    margins: { top: number; bottom: number; left: number; right: number };
  };
  visualWeight: {
    focusPoint: [number, number];
    distribution: 'even' | 'weighted' | 'dynamic';
  };
}

interface ColorGradingSettings {
  saturation: number;
  vibrance: number;
  contrast: number;
  brightness: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  temperature: number;
  tint: number;
  splitToning: {
    highlightColor: string;
    shadowColor: string;
    balance: number;
  };
  colorWheels: {
    lift: { r: number; g: number; b: number };
    gamma: { r: number; g: number; b: number };
    gain: { r: number; g: number; b: number };
  };
  lut: string;
  filmEmulation: 'none' | 'kodak_portra' | 'fuji_velvia' | 'cinestill' | 'ektachrome' | 'technicolor';
}

interface CinematicPreset {
  id: string;
  name: string;
  category: string;
  lighting: LightingSettings;
  camera: CameraSettings;
  composition: CompositionSettings;
  colorGrading: ColorGradingSettings;
  description: string;
  thumbnail?: string;
}

const CinematicControls: React.FC = () => {
  const [lighting, setLighting] = useState<LightingSettings>({
    intensity: 100,
    angle: 45,
    sourceType: 'natural',
    color: '#ffffff',
    temperature: 5600,
    shadows: { enabled: true, softness: 50, opacity: 0.8 },
    timeOfDay: 'golden_hour',
    environment: 'outdoor',
    keyLight: { intensity: 100, angle: 45, color: '#ffffff' },
    fillLight: { intensity: 50, angle: -45, color: '#e8f4ff' },
    backLight: { intensity: 75, angle: 180, color: '#ffeaa7' },
    practicalLights: [],
    atmosphericEffects: {
      fog: 0,
      haze: 0,
      godRays: false,
      particleDensity: 0,
    },
  });

  const [camera, setCamera] = useState<CameraSettings>({
    angle: 'eye_level',
    shotSize: 'medium_shot',
    movement: 'static',
    speed: 1,
    focalLength: 50,
    aperture: 2.8,
    depthOfField: {
      enabled: true,
      focusDistance: 5,
      bokehStrength: 50,
      bokehShape: 'circular',
    },
    lens: 'normal',
    stabilization: true,
    motionBlur: {
      enabled: false,
      strength: 0,
      shutterAngle: 180,
    },
  });

  const [composition, setComposition] = useState<CompositionSettings>({
    style: 'rule_of_thirds',
    leadingLines: true,
    depthLayers: 'all',
    balance: 'balanced',
    negativeSpace: 30,
    aspectRatio: '16:9',
    framing: {
      headroom: 20,
      lookSpace: 30,
      margins: { top: 10, bottom: 10, left: 10, right: 10 },
    },
    visualWeight: {
      focusPoint: [0.5, 0.5],
      distribution: 'even',
    },
  });

  const [colorGrading, setColorGrading] = useState<ColorGradingSettings>({
    saturation: 100,
    vibrance: 0,
    contrast: 0,
    brightness: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    temperature: 0,
    tint: 0,
    splitToning: {
      highlightColor: '#ff9f43',
      shadowColor: '#546de5',
      balance: 50,
    },
    colorWheels: {
      lift: { r: 0, g: 0, b: 0 },
      gamma: { r: 0, g: 0, b: 0 },
      gain: { r: 0, g: 0, b: 0 },
    },
    lut: 'none',
    filmEmulation: 'none',
  });

  const [selectedPreset, setSelectedPreset] = useState<CinematicPreset | null>(null);
  const [isRealtime, setIsRealtime] = useState(true);
  const [previewMode, setPreviewMode] = useState<'split' | 'side_by_side' | 'overlay'>('split');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const cinematicPresets: CinematicPreset[] = [
    {
      id: 'hollywood_blockbuster',
      name: 'Hollywood Blockbuster',
      category: 'Film',
      description: 'Epic cinematic look with dramatic lighting and wide shots',
      lighting: {
        ...lighting,
        intensity: 120,
        sourceType: 'dramatic',
        timeOfDay: 'golden_hour',
        keyLight: { intensity: 120, angle: 30, color: '#ffaa00' },
        atmosphericEffects: { fog: 20, haze: 30, godRays: true, particleDensity: 10 },
      },
      camera: {
        ...camera,
        angle: 'low_angle',
        shotSize: 'wide_shot',
        lens: 'anamorphic',
        focalLength: 35,
      },
      composition: {
        ...composition,
        style: 'golden_ratio',
        aspectRatio: '2.39:1',
      },
      colorGrading: {
        ...colorGrading,
        contrast: 20,
        saturation: 110,
        filmEmulation: 'technicolor',
      },
    },
    {
      id: 'noir_thriller',
      name: 'Film Noir',
      category: 'Film',
      description: 'High contrast black and white with dramatic shadows',
      lighting: {
        ...lighting,
        intensity: 80,
        sourceType: 'dramatic',
        timeOfDay: 'night',
        keyLight: { intensity: 100, angle: 60, color: '#cccccc' },
        shadows: { enabled: true, softness: 10, opacity: 0.95 },
      },
      camera: {
        ...camera,
        angle: 'dutch_angle',
        shotSize: 'medium_close_up',
        lens: 'normal',
      },
      composition: {
        ...composition,
        style: 'diagonal',
        balance: 'right_heavy',
      },
      colorGrading: {
        ...colorGrading,
        saturation: 0,
        contrast: 50,
        blacks: -30,
      },
    },
    {
      id: 'wes_anderson',
      name: 'Wes Anderson Style',
      category: 'Artistic',
      description: 'Symmetrical composition with pastel colors',
      lighting: {
        ...lighting,
        intensity: 100,
        sourceType: 'natural',
        color: '#fff5e1',
      },
      camera: {
        ...camera,
        angle: 'eye_level',
        shotSize: 'wide_shot',
        movement: 'static',
      },
      composition: {
        ...composition,
        style: 'symmetrical',
        aspectRatio: '16:9',
        balance: 'balanced',
      },
      colorGrading: {
        ...colorGrading,
        saturation: 90,
        vibrance: 30,
        temperature: 10,
      },
    },
    {
      id: 'documentary_verite',
      name: 'Documentary Vérité',
      category: 'Documentary',
      description: 'Natural lighting with handheld camera movement',
      lighting: {
        ...lighting,
        intensity: 90,
        sourceType: 'natural',
        timeOfDay: 'afternoon',
      },
      camera: {
        ...camera,
        angle: 'eye_level',
        shotSize: 'medium_shot',
        movement: 'handheld',
        stabilization: false,
      },
      composition: {
        ...composition,
        style: 'rule_of_thirds',
        leadingLines: false,
      },
      colorGrading: {
        ...colorGrading,
        saturation: 95,
        contrast: 5,
      },
    },
    {
      id: 'cyberpunk_neon',
      name: 'Cyberpunk Neon',
      category: 'Sci-Fi',
      description: 'Neon-lit urban scenes with high contrast',
      lighting: {
        ...lighting,
        intensity: 110,
        sourceType: 'cinematic',
        timeOfDay: 'night',
        color: '#ff00ff',
        practicalLights: [
          { type: 'neon', position: [0, 2, -5], intensity: 150 },
          { type: 'neon', position: [3, 1, -3], intensity: 120 },
        ],
      },
      camera: {
        ...camera,
        angle: 'low_angle',
        lens: 'wide',
        depthOfField: { enabled: true, focusDistance: 3, bokehStrength: 80, bokehShape: 'hexagonal' },
      },
      composition: {
        ...composition,
        style: 'asymmetrical',
        depthLayers: 'all',
      },
      colorGrading: {
        ...colorGrading,
        saturation: 130,
        contrast: 30,
        splitToning: {
          highlightColor: '#00ffff',
          shadowColor: '#ff00ff',
          balance: 60,
        },
      },
    },
    {
      id: 'studio_portrait',
      name: 'Studio Portrait',
      category: 'Photography',
      description: 'Professional studio lighting for portraits',
      lighting: {
        ...lighting,
        intensity: 100,
        sourceType: 'studio',
        environment: 'studio',
        keyLight: { intensity: 100, angle: 45, color: '#ffffff' },
        fillLight: { intensity: 60, angle: -30, color: '#ffffff' },
        backLight: { intensity: 80, angle: 180, color: '#ffffff' },
      },
      camera: {
        ...camera,
        angle: 'eye_level',
        shotSize: 'close_up',
        lens: 'telephoto',
        focalLength: 85,
        aperture: 1.8,
      },
      composition: {
        ...composition,
        style: 'centered',
        aspectRatio: '4:3',
      },
      colorGrading: {
        ...colorGrading,
        saturation: 95,
        vibrance: 10,
        filmEmulation: 'kodak_portra',
      },
    },
    {
      id: 'landscape_epic',
      name: 'Epic Landscape',
      category: 'Nature',
      description: 'Sweeping landscape shots with natural lighting',
      lighting: {
        ...lighting,
        intensity: 110,
        sourceType: 'natural',
        timeOfDay: 'golden_hour',
        atmosphericEffects: { fog: 10, haze: 20, godRays: true, particleDensity: 5 },
      },
      camera: {
        ...camera,
        angle: 'eye_level',
        shotSize: 'extreme_wide',
        lens: 'wide',
        focalLength: 24,
      },
      composition: {
        ...composition,
        style: 'rule_of_thirds',
        depthLayers: 'all',
        aspectRatio: '21:9',
      },
      colorGrading: {
        ...colorGrading,
        saturation: 110,
        vibrance: 20,
        highlights: 10,
        shadows: -5,
      },
    },
  ];

  const applyPreset = (preset: CinematicPreset) => {
    setSelectedPreset(preset);
    setLighting(preset.lighting);
    setCamera(preset.camera);
    setComposition(preset.composition);
    setColorGrading(preset.colorGrading);
  };

  const updateLighting = useCallback((key: keyof LightingSettings, value: any) => {
    setLighting(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateCamera = useCallback((key: keyof CameraSettings, value: any) => {
    setCamera(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateComposition = useCallback((key: keyof CompositionSettings, value: any) => {
    setComposition(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateColorGrading = useCallback((key: keyof ColorGradingSettings, value: any) => {
    setColorGrading(prev => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !isRealtime) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
    
    renderer.setSize(800, 450);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    sceneRef.current = scene;
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x404040, lighting.intensity / 200);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(
      lighting.keyLight.color,
      lighting.keyLight.intensity / 100
    );
    keyLight.position.set(
      Math.cos(lighting.keyLight.angle * Math.PI / 180) * 10,
      5,
      Math.sin(lighting.keyLight.angle * Math.PI / 180) * 10
    );
    keyLight.castShadow = lighting.shadows.enabled;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(
      lighting.fillLight.color,
      lighting.fillLight.intensity / 100
    );
    fillLight.position.set(
      Math.cos(lighting.fillLight.angle * Math.PI / 180) * 10,
      3,
      Math.sin(lighting.fillLight.angle * Math.PI / 180) * 10
    );
    scene.add(fillLight);

    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff88 });
    const cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    scene.add(cube);

    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -2;
    plane.receiveShadow = true;
    scene.add(plane);

    camera.position.z = 5;

    const animate = () => {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    
    animate();

    return () => {
      renderer.dispose();
    };
  }, [lighting, isRealtime]);

  const exportSettings = () => {
    const settings = {
      lighting,
      camera,
      composition,
      colorGrading,
      timestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cinematic_settings_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="cinematic-controls">
      <style jsx>{`
        .cinematic-controls {
          display: flex;
          height: 100vh;
          background: #0a0a0a;
          color: #fff;
          font-family: 'Inter', sans-serif;
        }

        .controls-sidebar {
          width: 400px;
          background: #1a1a1a;
          overflow-y: auto;
          border-right: 1px solid #333;
        }

        .controls-header {
          padding: 20px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-bottom: 1px solid #333;
        }

        .controls-title {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .controls-subtitle {
          font-size: 12px;
          opacity: 0.9;
        }

        .preset-section {
          padding: 20px;
          border-bottom: 1px solid #333;
        }

        .section-title {
          font-size: 14px;
          text-transform: uppercase;
          color: #888;
          margin-bottom: 12px;
          font-weight: 600;
        }

        .preset-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .preset-card {
          padding: 12px;
          background: #0a0a0a;
          border: 2px solid #333;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .preset-card:hover {
          background: #1a1a1a;
          border-color: #667eea;
          transform: translateY(-2px);
        }

        .preset-card.selected {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
          border-color: #667eea;
        }

        .preset-name {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .preset-category {
          font-size: 10px;
          color: #667eea;
        }

        .control-section {
          padding: 20px;
          border-bottom: 1px solid #222;
        }

        .control-group {
          margin-bottom: 16px;
        }

        .control-label {
          font-size: 11px;
          color: #888;
          margin-bottom: 6px;
          display: block;
          text-transform: uppercase;
        }

        .control-slider {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .slider {
          flex: 1;
          -webkit-appearance: none;
          height: 4px;
          background: #333;
          border-radius: 2px;
          outline: none;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          background: #667eea;
          border-radius: 50%;
          cursor: pointer;
        }

        .slider-value {
          min-width: 40px;
          text-align: right;
          font-size: 11px;
          color: #00ff88;
        }

        .control-select {
          width: 100%;
          padding: 8px;
          background: #0a0a0a;
          border: 1px solid #444;
          border-radius: 4px;
          color: #fff;
          font-size: 12px;
          cursor: pointer;
        }

        .control-buttons {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .control-btn {
          padding: 8px;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 4px;
          color: #888;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .control-btn:hover {
          background: #3a3a3a;
          color: #fff;
        }

        .control-btn.active {
          background: #667eea;
          color: #fff;
          border-color: #667eea;
        }

        .preview-container {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .preview-header {
          padding: 16px 20px;
          background: #1a1a1a;
          border-bottom: 1px solid #333;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .preview-controls {
          display: flex;
          gap: 12px;
        }

        .preview-btn {
          padding: 8px 16px;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 4px;
          color: #fff;
          font-size: 12px;
          cursor: pointer;
        }

        .preview-btn.active {
          background: #667eea;
          border-color: #667eea;
        }

        .preview-canvas-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          position: relative;
        }

        .preview-canvas {
          max-width: 100%;
          max-height: 100%;
          border: 1px solid #333;
        }

        .preview-overlay {
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(0, 0, 0, 0.8);
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 11px;
        }

        .overlay-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .overlay-label {
          color: #888;
          margin-right: 12px;
        }

        .overlay-value {
          color: #00ff88;
        }

        .info-panel {
          background: #1a1a1a;
          border-top: 1px solid #333;
          padding: 16px 20px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
        }

        .info-label {
          font-size: 10px;
          color: #666;
          margin-bottom: 4px;
        }

        .info-value {
          font-size: 14px;
          color: #fff;
          font-weight: 600;
        }

        .color-wheel {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, red, yellow, green, cyan, blue, magenta, red);
          margin: 0 auto;
          position: relative;
        }

        .color-picker {
          position: absolute;
          width: 16px;
          height: 16px;
          background: #fff;
          border: 2px solid #000;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          cursor: pointer;
        }

        .three-way-toggle {
          display: flex;
          gap: 4px;
        }

        .toggle-option {
          flex: 1;
          padding: 6px;
          background: #2a2a2a;
          border: 1px solid #444;
          text-align: center;
          cursor: pointer;
          font-size: 11px;
          transition: all 0.2s;
        }

        .toggle-option:first-child {
          border-radius: 4px 0 0 4px;
        }

        .toggle-option:last-child {
          border-radius: 0 4px 4px 0;
        }

        .toggle-option.active {
          background: #667eea;
          color: #fff;
          border-color: #667eea;
        }

        .export-section {
          padding: 20px;
          background: #0a0a0a;
        }

        .export-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border: none;
          border-radius: 6px;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .export-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .advanced-controls {
          padding: 20px;
          background: #0a0a0a;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .matrix-control {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 8px;
        }

        .matrix-cell {
          aspect-ratio: 1;
          background: #1a1a1a;
          border: 1px solid #444;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 10px;
          color: #666;
        }

        .matrix-cell.active {
          background: #667eea;
          color: #fff;
          border-color: #667eea;
        }

        .realtime-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toggle-switch {
          width: 40px;
          height: 20px;
          background: #333;
          border-radius: 10px;
          position: relative;
          cursor: pointer;
        }

        .toggle-switch.active {
          background: #667eea;
        }

        .toggle-knob {
          width: 16px;
          height: 16px;
          background: #fff;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: transform 0.2s;
        }

        .toggle-switch.active .toggle-knob {
          transform: translateX(20px);
        }
      `}</style>

      <div className="controls-sidebar">
        <div className="controls-header">
          <h2 className="controls-title">🎬 Cinematic Controls</h2>
          <p className="controls-subtitle">WAN 2.2 Professional Cinematography Suite</p>
        </div>

        <div className="preset-section">
          <h3 className="section-title">Cinematic Presets</h3>
          <div className="preset-grid">
            {cinematicPresets.map(preset => (
              <div
                key={preset.id}
                className={`preset-card ${selectedPreset?.id === preset.id ? 'selected' : ''}`}
                onClick={() => applyPreset(preset)}
              >
                <div className="preset-name">{preset.name}</div>
                <div className="preset-category">{preset.category}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="control-section">
          <h3 className="section-title">🔦 Lighting Controls</h3>
          
          <div className="control-group">
            <label className="control-label">Light Intensity</label>
            <div className="control-slider">
              <input
                type="range"
                className="slider"
                min="0"
                max="200"
                value={lighting.intensity}
                onChange={(e) => updateLighting('intensity', Number(e.target.value))}
              />
              <span className="slider-value">{lighting.intensity}%</span>
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">Light Angle</label>
            <div className="control-slider">
              <input
                type="range"
                className="slider"
                min="0"
                max="360"
                value={lighting.angle}
                onChange={(e) => updateLighting('angle', Number(e.target.value))}
              />
              <span className="slider-value">{lighting.angle}°</span>
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">Light Source Type</label>
            <select
              className="control-select"
              value={lighting.sourceType}
              onChange={(e) => updateLighting('sourceType', e.target.value)}
            >
              <option value="natural">Natural Sunlight</option>
              <option value="studio">Studio Lighting</option>
              <option value="dramatic">Dramatic</option>
              <option value="volumetric">Volumetric</option>
              <option value="cinematic">Cinematic</option>
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Time of Day</label>
            <div className="control-buttons">
              {['dawn', 'morning', 'noon', 'afternoon', 'golden_hour', 'dusk', 'night', 'blue_hour'].map(time => (
                <button
                  key={time}
                  className={`control-btn ${lighting.timeOfDay === time ? 'active' : ''}`}
                  onClick={() => updateLighting('timeOfDay', time as any)}
                >
                  {time.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">Color Temperature</label>
            <div className="control-slider">
              <input
                type="range"
                className="slider"
                min="2000"
                max="10000"
                value={lighting.temperature}
                onChange={(e) => updateLighting('temperature', Number(e.target.value))}
              />
              <span className="slider-value">{lighting.temperature}K</span>
            </div>
          </div>

          <div className="advanced-controls">
            <label className="control-label">Three-Point Lighting</label>
            <div className="control-group">
              <label style={{ fontSize: '10px', color: '#666' }}>Key Light</label>
              <div className="control-slider">
                <input
                  type="range"
                  className="slider"
                  min="0"
                  max="200"
                  value={lighting.keyLight.intensity}
                  onChange={(e) => setLighting({
                    ...lighting,
                    keyLight: { ...lighting.keyLight, intensity: Number(e.target.value) }
                  })}
                />
                <span className="slider-value">{lighting.keyLight.intensity}%</span>
              </div>
            </div>
            <div className="control-group">
              <label style={{ fontSize: '10px', color: '#666' }}>Fill Light</label>
              <div className="control-slider">
                <input
                  type="range"
                  className="slider"
                  min="0"
                  max="200"
                  value={lighting.fillLight.intensity}
                  onChange={(e) => setLighting({
                    ...lighting,
                    fillLight: { ...lighting.fillLight, intensity: Number(e.target.value) }
                  })}
                />
                <span className="slider-value">{lighting.fillLight.intensity}%</span>
              </div>
            </div>
            <div className="control-group">
              <label style={{ fontSize: '10px', color: '#666' }}>Back Light</label>
              <div className="control-slider">
                <input
                  type="range"
                  className="slider"
                  min="0"
                  max="200"
                  value={lighting.backLight.intensity}
                  onChange={(e) => setLighting({
                    ...lighting,
                    backLight: { ...lighting.backLight, intensity: Number(e.target.value) }
                  })}
                />
                <span className="slider-value">{lighting.backLight.intensity}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="control-section">
          <h3 className="section-title">📷 Camera Controls</h3>
          
          <div className="control-group">
            <label className="control-label">Camera Angle</label>
            <select
              className="control-select"
              value={camera.angle}
              onChange={(e) => updateCamera('angle', e.target.value)}
            >
              <option value="eye_level">Eye Level</option>
              <option value="low_angle">Low Angle (Hero Shot)</option>
              <option value="high_angle">High Angle</option>
              <option value="dutch_angle">Dutch Angle</option>
              <option value="birds_eye">Bird's Eye View</option>
              <option value="worms_eye">Worm's Eye View</option>
              <option value="overhead">Overhead</option>
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Shot Size</label>
            <select
              className="control-select"
              value={camera.shotSize}
              onChange={(e) => updateCamera('shotSize', e.target.value)}
            >
              <option value="extreme_close_up">Extreme Close-Up (ECU)</option>
              <option value="close_up">Close-Up (CU)</option>
              <option value="medium_close_up">Medium Close-Up (MCU)</option>
              <option value="medium_shot">Medium Shot (MS)</option>
              <option value="medium_wide">Medium Wide (MW)</option>
              <option value="wide_shot">Wide Shot (WS)</option>
              <option value="extreme_wide">Extreme Wide (EWS)</option>
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Camera Movement</label>
            <select
              className="control-select"
              value={camera.movement}
              onChange={(e) => updateCamera('movement', e.target.value)}
            >
              <option value="static">Static</option>
              <option value="pan">Pan</option>
              <option value="tilt">Tilt</option>
              <option value="dolly">Dolly</option>
              <option value="truck">Truck</option>
              <option value="pedestal">Pedestal</option>
              <option value="zoom">Zoom</option>
              <option value="handheld">Handheld</option>
              <option value="steadicam">Steadicam</option>
              <option value="crane">Crane</option>
              <option value="orbit">Orbit</option>
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Focal Length</label>
            <div className="control-slider">
              <input
                type="range"
                className="slider"
                min="14"
                max="200"
                value={camera.focalLength}
                onChange={(e) => updateCamera('focalLength', Number(e.target.value))}
              />
              <span className="slider-value">{camera.focalLength}mm</span>
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">Aperture (f-stop)</label>
            <div className="control-slider">
              <input
                type="range"
                className="slider"
                min="1"
                max="22"
                step="0.1"
                value={camera.aperture}
                onChange={(e) => updateCamera('aperture', Number(e.target.value))}
              />
              <span className="slider-value">f/{camera.aperture}</span>
            </div>
          </div>
        </div>

        <div className="control-section">
          <h3 className="section-title">🎨 Composition & Style</h3>
          
          <div className="control-group">
            <label className="control-label">Composition Style</label>
            <select
              className="control-select"
              value={composition.style}
              onChange={(e) => updateComposition('style', e.target.value)}
            >
              <option value="rule_of_thirds">Rule of Thirds</option>
              <option value="golden_ratio">Golden Ratio</option>
              <option value="symmetrical">Symmetrical</option>
              <option value="asymmetrical">Asymmetrical</option>
              <option value="centered">Centered</option>
              <option value="diagonal">Diagonal</option>
              <option value="triangular">Triangular</option>
              <option value="frame_within_frame">Frame Within Frame</option>
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Aspect Ratio</label>
            <div className="three-way-toggle">
              {['16:9', '21:9', '4:3', '1:1', '9:16', '2.39:1'].map(ratio => (
                <div
                  key={ratio}
                  className={`toggle-option ${composition.aspectRatio === ratio ? 'active' : ''}`}
                  onClick={() => updateComposition('aspectRatio', ratio)}
                >
                  {ratio}
                </div>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">Saturation</label>
            <div className="control-slider">
              <input
                type="range"
                className="slider"
                min="0"
                max="200"
                value={colorGrading.saturation}
                onChange={(e) => updateColorGrading('saturation', Number(e.target.value))}
              />
              <span className="slider-value">{colorGrading.saturation}%</span>
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">Contrast</label>
            <div className="control-slider">
              <input
                type="range"
                className="slider"
                min="-100"
                max="100"
                value={colorGrading.contrast}
                onChange={(e) => updateColorGrading('contrast', Number(e.target.value))}
              />
              <span className="slider-value">{colorGrading.contrast}</span>
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">Film Emulation</label>
            <select
              className="control-select"
              value={colorGrading.filmEmulation}
              onChange={(e) => updateColorGrading('filmEmulation', e.target.value)}
            >
              <option value="none">None</option>
              <option value="kodak_portra">Kodak Portra</option>
              <option value="fuji_velvia">Fuji Velvia</option>
              <option value="cinestill">CineStill 800T</option>
              <option value="ektachrome">Ektachrome</option>
              <option value="technicolor">Technicolor</option>
            </select>
          </div>
        </div>

        <div className="export-section">
          <button className="export-btn" onClick={exportSettings}>
            Export Cinematic Settings
          </button>
        </div>
      </div>

      <div className="preview-container">
        <div className="preview-header">
          <div>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Live Preview</span>
          </div>
          <div className="preview-controls">
            <div className="realtime-toggle">
              <span style={{ fontSize: '12px', marginRight: '8px' }}>Real-time</span>
              <div className={`toggle-switch ${isRealtime ? 'active' : ''}`} onClick={() => setIsRealtime(!isRealtime)}>
                <div className="toggle-knob" />
              </div>
            </div>
            {['split', 'side_by_side', 'overlay'].map(mode => (
              <button
                key={mode}
                className={`preview-btn ${previewMode === mode ? 'active' : ''}`}
                onClick={() => setPreviewMode(mode as any)}
              >
                {mode.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="preview-canvas-wrapper">
          <canvas ref={canvasRef} className="preview-canvas" />
          
          <div className="preview-overlay">
            <div className="overlay-item">
              <span className="overlay-label">Lighting:</span>
              <span className="overlay-value">{lighting.sourceType}</span>
            </div>
            <div className="overlay-item">
              <span className="overlay-label">Camera:</span>
              <span className="overlay-value">{camera.angle}</span>
            </div>
            <div className="overlay-item">
              <span className="overlay-label">Composition:</span>
              <span className="overlay-value">{composition.style}</span>
            </div>
            <div className="overlay-item">
              <span className="overlay-label">Preset:</span>
              <span className="overlay-value">{selectedPreset?.name || 'Custom'}</span>
            </div>
          </div>
        </div>

        <div className="info-panel">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">INTENSITY</span>
              <span className="info-value">{lighting.intensity}%</span>
            </div>
            <div className="info-item">
              <span className="info-label">ANGLE</span>
              <span className="info-value">{lighting.angle}°</span>
            </div>
            <div className="info-item">
              <span className="info-label">FOCAL LENGTH</span>
              <span className="info-value">{camera.focalLength}mm</span>
            </div>
            <div className="info-item">
              <span className="info-label">SATURATION</span>
              <span className="info-value">{colorGrading.saturation}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CinematicControls;