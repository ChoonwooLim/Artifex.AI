import React, { useState, useEffect } from 'react';

interface CinematicControlData {
  lighting: {
    intensity: number;
    angle: number;
    sourceType: string;
    timeOfDay: string;
    temperature: number;
  };
  camera: {
    angle: string;
    shotSize: string;
    movement: string;
    focalLength: number;
    aperture: number;
  };
  composition: {
    style: string;
    aspectRatio: string;
    negativeSpace: number;
  };
  colorGrading: {
    saturation: number;
    contrast: number;
    filmEmulation: string;
  };
}

export function CinematicControlNode({ data, id, selected }: any) {
  const [expanded, setExpanded] = useState(false);
  const [settings, setSettings] = useState<CinematicControlData>({
    lighting: {
      intensity: data?.lighting?.intensity || 100,
      angle: data?.lighting?.angle || 45,
      sourceType: data?.lighting?.sourceType || 'natural',
      timeOfDay: data?.lighting?.timeOfDay || 'golden_hour',
      temperature: data?.lighting?.temperature || 5600,
    },
    camera: {
      angle: data?.camera?.angle || 'eye_level',
      shotSize: data?.camera?.shotSize || 'medium_shot',
      movement: data?.camera?.movement || 'static',
      focalLength: data?.camera?.focalLength || 50,
      aperture: data?.camera?.aperture || 2.8,
    },
    composition: {
      style: data?.composition?.style || 'rule_of_thirds',
      aspectRatio: data?.composition?.aspectRatio || '16:9',
      negativeSpace: data?.composition?.negativeSpace || 30,
    },
    colorGrading: {
      saturation: data?.colorGrading?.saturation || 100,
      contrast: data?.colorGrading?.contrast || 0,
      filmEmulation: data?.colorGrading?.filmEmulation || 'none',
    },
  });

  const quickPresets = [
    {
      name: 'Hollywood Epic',
      icon: '🎬',
      settings: {
        lighting: { intensity: 120, sourceType: 'dramatic', timeOfDay: 'golden_hour' },
        camera: { angle: 'low_angle', shotSize: 'wide_shot' },
        composition: { style: 'golden_ratio' },
        colorGrading: { saturation: 110, contrast: 20, filmEmulation: 'technicolor' },
      },
    },
    {
      name: 'Film Noir',
      icon: '🕵️',
      settings: {
        lighting: { intensity: 80, sourceType: 'dramatic', timeOfDay: 'night' },
        camera: { angle: 'dutch_angle', shotSize: 'medium_close_up' },
        composition: { style: 'diagonal' },
        colorGrading: { saturation: 0, contrast: 50, filmEmulation: 'none' },
      },
    },
    {
      name: 'Cyberpunk',
      icon: '🌃',
      settings: {
        lighting: { intensity: 110, sourceType: 'cinematic', timeOfDay: 'night' },
        camera: { angle: 'low_angle', shotSize: 'wide_shot' },
        composition: { style: 'asymmetrical' },
        colorGrading: { saturation: 130, contrast: 30, filmEmulation: 'none' },
      },
    },
    {
      name: 'Documentary',
      icon: '📹',
      settings: {
        lighting: { intensity: 90, sourceType: 'natural', timeOfDay: 'afternoon' },
        camera: { angle: 'eye_level', shotSize: 'medium_shot', movement: 'handheld' },
        composition: { style: 'rule_of_thirds' },
        colorGrading: { saturation: 95, contrast: 5, filmEmulation: 'none' },
      },
    },
  ];

  const applyPreset = (preset: any) => {
    setSettings(prevSettings => ({
      lighting: { ...prevSettings.lighting, ...preset.settings.lighting },
      camera: { ...prevSettings.camera, ...preset.settings.camera },
      composition: { ...prevSettings.composition, ...preset.settings.composition },
      colorGrading: { ...prevSettings.colorGrading, ...preset.settings.colorGrading },
    }));
  };

  return (
    <div className="cinematic-control-node" style={{
      background: selected ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#1a1a1a',
      border: `2px solid ${selected ? '#667eea' : '#444'}`,
      borderRadius: '12px',
      minWidth: '320px',
      boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
      transition: 'all 0.3s',
    }}>
      <div className="node-header" style={{
        padding: '14px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '10px 10px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontWeight: 600, fontSize: '14px' }}>🎬 Cinematic Controls</span>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      <div className="node-content" style={{ padding: '16px' }}>
        <div className="quick-presets" style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          marginBottom: '16px',
        }}>
          {quickPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset)}
              style={{
                padding: '8px',
                background: 'rgba(102, 126, 234, 0.1)',
                border: '1px solid #667eea',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>{preset.icon}</span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>

        {expanded && (
          <div className="detailed-controls" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #444',
          }}>
            <div className="control-section">
              <label style={{ fontSize: '11px', color: '#888', marginBottom: '4px', display: 'block' }}>
                LIGHTING
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: '#666' }}>Intensity</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={settings.lighting.intensity}
                    onChange={(e) => setSettings({
                      ...settings,
                      lighting: { ...settings.lighting, intensity: Number(e.target.value) }
                    })}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '10px', color: '#00ff88' }}>{settings.lighting.intensity}%</span>
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: '#666' }}>Angle</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={settings.lighting.angle}
                    onChange={(e) => setSettings({
                      ...settings,
                      lighting: { ...settings.lighting, angle: Number(e.target.value) }
                    })}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '10px', color: '#00ff88' }}>{settings.lighting.angle}°</span>
                </div>
              </div>
              <select
                value={settings.lighting.sourceType}
                onChange={(e) => setSettings({
                  ...settings,
                  lighting: { ...settings.lighting, sourceType: e.target.value }
                })}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '6px',
                  background: '#0a0a0a',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '11px',
                }}
              >
                <option value="natural">Natural Light</option>
                <option value="studio">Studio Light</option>
                <option value="dramatic">Dramatic</option>
                <option value="volumetric">Volumetric</option>
                <option value="cinematic">Cinematic</option>
              </select>
              <select
                value={settings.lighting.timeOfDay}
                onChange={(e) => setSettings({
                  ...settings,
                  lighting: { ...settings.lighting, timeOfDay: e.target.value }
                })}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '6px',
                  background: '#0a0a0a',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '11px',
                }}
              >
                <option value="dawn">Dawn</option>
                <option value="morning">Morning</option>
                <option value="noon">Noon</option>
                <option value="afternoon">Afternoon</option>
                <option value="golden_hour">Golden Hour</option>
                <option value="dusk">Dusk</option>
                <option value="night">Night</option>
                <option value="blue_hour">Blue Hour</option>
              </select>
            </div>

            <div className="control-section">
              <label style={{ fontSize: '11px', color: '#888', marginBottom: '4px', display: 'block' }}>
                CAMERA
              </label>
              <select
                value={settings.camera.angle}
                onChange={(e) => setSettings({
                  ...settings,
                  camera: { ...settings.camera, angle: e.target.value }
                })}
                style={{
                  width: '100%',
                  padding: '6px',
                  background: '#0a0a0a',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '11px',
                  marginBottom: '8px',
                }}
              >
                <option value="eye_level">Eye Level</option>
                <option value="low_angle">Low Angle</option>
                <option value="high_angle">High Angle</option>
                <option value="dutch_angle">Dutch Angle</option>
                <option value="birds_eye">Bird's Eye</option>
                <option value="worms_eye">Worm's Eye</option>
              </select>
              <select
                value={settings.camera.shotSize}
                onChange={(e) => setSettings({
                  ...settings,
                  camera: { ...settings.camera, shotSize: e.target.value }
                })}
                style={{
                  width: '100%',
                  padding: '6px',
                  background: '#0a0a0a',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '11px',
                }}
              >
                <option value="extreme_close_up">Extreme Close-Up</option>
                <option value="close_up">Close-Up</option>
                <option value="medium_close_up">Medium Close-Up</option>
                <option value="medium_shot">Medium Shot</option>
                <option value="medium_wide">Medium Wide</option>
                <option value="wide_shot">Wide Shot</option>
                <option value="extreme_wide">Extreme Wide</option>
              </select>
            </div>

            <div className="control-section">
              <label style={{ fontSize: '11px', color: '#888', marginBottom: '4px', display: 'block' }}>
                COMPOSITION
              </label>
              <select
                value={settings.composition.style}
                onChange={(e) => setSettings({
                  ...settings,
                  composition: { ...settings.composition, style: e.target.value }
                })}
                style={{
                  width: '100%',
                  padding: '6px',
                  background: '#0a0a0a',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '11px',
                }}
              >
                <option value="rule_of_thirds">Rule of Thirds</option>
                <option value="golden_ratio">Golden Ratio</option>
                <option value="symmetrical">Symmetrical</option>
                <option value="asymmetrical">Asymmetrical</option>
                <option value="centered">Centered</option>
                <option value="diagonal">Diagonal</option>
                <option value="triangular">Triangular</option>
              </select>
            </div>

            <div className="control-section">
              <label style={{ fontSize: '11px', color: '#888', marginBottom: '4px', display: 'block' }}>
                COLOR GRADING
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: '#666' }}>Saturation</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={settings.colorGrading.saturation}
                    onChange={(e) => setSettings({
                      ...settings,
                      colorGrading: { ...settings.colorGrading, saturation: Number(e.target.value) }
                    })}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '10px', color: '#00ff88' }}>{settings.colorGrading.saturation}%</span>
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: '#666' }}>Contrast</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={settings.colorGrading.contrast}
                    onChange={(e) => setSettings({
                      ...settings,
                      colorGrading: { ...settings.colorGrading, contrast: Number(e.target.value) }
                    })}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '10px', color: '#00ff88' }}>{settings.colorGrading.contrast}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="status-display" style={{
          marginTop: '12px',
          padding: '8px',
          background: 'rgba(0, 255, 136, 0.1)',
          borderRadius: '6px',
          fontSize: '10px',
          color: '#00ff88',
          textAlign: 'center',
        }}>
          {settings.lighting.sourceType} • {settings.camera.angle} • {settings.composition.style}
        </div>
      </div>

      <div className="node-ports" style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 16px',
      }}>
        <div className="output-port" style={{
          width: '12px',
          height: '12px',
          background: '#00ff88',
          borderRadius: '50%',
          border: '2px solid #000',
          marginLeft: 'auto',
        }} />
      </div>
    </div>
  );
}

export default CinematicControlNode;