import React, { useState, useEffect } from 'react';

interface ExportPreset {
  id: string;
  name: string;
  category: string;
  format: string;
  codec: string;
  resolution: string;
  frameRate: number;
  bitrate: string;
  audioBitrate: string;
  profile: string;
  level: string;
  pixelFormat: string;
  colorSpace: string;
  gopSize: number;
  bFrames: number;
}

interface RenderJob {
  id: string;
  name: string;
  status: 'waiting' | 'processing' | 'completed' | 'error';
  progress: number;
  startTime: Date;
  estimatedTime: number;
  outputPath: string;
  preset: ExportPreset;
}

const VideoExport: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<ExportPreset | null>(null);
  const [customSettings, setCustomSettings] = useState<Partial<ExportPreset>>({});
  const [renderQueue, setRenderQueue] = useState<RenderJob[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [gpuAcceleration, setGpuAcceleration] = useState(true);
  const [multiPass, setMultiPass] = useState(false);
  const [exportRange, setExportRange] = useState<'all' | 'selection' | 'custom'>('all');
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  const exportPresets: Record<string, ExportPreset[]> = {
    'Web & Streaming': [
      {
        id: 'youtube_4k',
        name: 'YouTube 4K',
        category: 'Web & Streaming',
        format: 'mp4',
        codec: 'h264',
        resolution: '3840x2160',
        frameRate: 60,
        bitrate: '45000k',
        audioBitrate: '320k',
        profile: 'high',
        level: '5.2',
        pixelFormat: 'yuv420p',
        colorSpace: 'bt709',
        gopSize: 30,
        bFrames: 2,
      },
      {
        id: 'youtube_1080p',
        name: 'YouTube 1080p',
        category: 'Web & Streaming',
        format: 'mp4',
        codec: 'h264',
        resolution: '1920x1080',
        frameRate: 60,
        bitrate: '8000k',
        audioBitrate: '192k',
        profile: 'high',
        level: '4.2',
        pixelFormat: 'yuv420p',
        colorSpace: 'bt709',
        gopSize: 30,
        bFrames: 2,
      },
      {
        id: 'twitch_stream',
        name: 'Twitch Stream',
        category: 'Web & Streaming',
        format: 'flv',
        codec: 'h264',
        resolution: '1920x1080',
        frameRate: 60,
        bitrate: '6000k',
        audioBitrate: '160k',
        profile: 'main',
        level: '4.1',
        pixelFormat: 'yuv420p',
        colorSpace: 'bt709',
        gopSize: 60,
        bFrames: 0,
      },
      {
        id: 'instagram_reel',
        name: 'Instagram Reel',
        category: 'Web & Streaming',
        format: 'mp4',
        codec: 'h264',
        resolution: '1080x1920',
        frameRate: 30,
        bitrate: '5000k',
        audioBitrate: '128k',
        profile: 'baseline',
        level: '4.0',
        pixelFormat: 'yuv420p',
        colorSpace: 'bt709',
        gopSize: 15,
        bFrames: 0,
      },
      {
        id: 'tiktok',
        name: 'TikTok',
        category: 'Web & Streaming',
        format: 'mp4',
        codec: 'h264',
        resolution: '1080x1920',
        frameRate: 30,
        bitrate: '6000k',
        audioBitrate: '128k',
        profile: 'main',
        level: '4.0',
        pixelFormat: 'yuv420p',
        colorSpace: 'bt709',
        gopSize: 15,
        bFrames: 0,
      },
    ],
    'Professional': [
      {
        id: 'prores_422',
        name: 'ProRes 422',
        category: 'Professional',
        format: 'mov',
        codec: 'prores',
        resolution: '1920x1080',
        frameRate: 30,
        bitrate: '147000k',
        audioBitrate: '1536k',
        profile: '422',
        level: '0',
        pixelFormat: 'yuv422p10le',
        colorSpace: 'bt709',
        gopSize: 1,
        bFrames: 0,
      },
      {
        id: 'prores_4444',
        name: 'ProRes 4444',
        category: 'Professional',
        format: 'mov',
        codec: 'prores',
        resolution: '1920x1080',
        frameRate: 30,
        bitrate: '330000k',
        audioBitrate: '1536k',
        profile: '4444',
        level: '0',
        pixelFormat: 'yuva444p10le',
        colorSpace: 'bt709',
        gopSize: 1,
        bFrames: 0,
      },
      {
        id: 'dnxhd',
        name: 'DNxHD 1080p',
        category: 'Professional',
        format: 'mov',
        codec: 'dnxhd',
        resolution: '1920x1080',
        frameRate: 30,
        bitrate: '185000k',
        audioBitrate: '1536k',
        profile: 'dnxhd',
        level: '0',
        pixelFormat: 'yuv422p',
        colorSpace: 'bt709',
        gopSize: 1,
        bFrames: 0,
      },
      {
        id: 'cinema_dcp',
        name: 'Cinema DCP',
        category: 'Professional',
        format: 'mxf',
        codec: 'jpeg2000',
        resolution: '2048x1080',
        frameRate: 24,
        bitrate: '250000k',
        audioBitrate: '1536k',
        profile: 'cinema2k',
        level: '0',
        pixelFormat: 'xyz12le',
        colorSpace: 'xyz',
        gopSize: 1,
        bFrames: 0,
      },
    ],
    'High Efficiency': [
      {
        id: 'hevc_4k',
        name: 'HEVC 4K',
        category: 'High Efficiency',
        format: 'mp4',
        codec: 'h265',
        resolution: '3840x2160',
        frameRate: 60,
        bitrate: '25000k',
        audioBitrate: '256k',
        profile: 'main10',
        level: '5.1',
        pixelFormat: 'yuv420p10le',
        colorSpace: 'bt2020',
        gopSize: 30,
        bFrames: 3,
      },
      {
        id: 'av1_streaming',
        name: 'AV1 Streaming',
        category: 'High Efficiency',
        format: 'webm',
        codec: 'av1',
        resolution: '1920x1080',
        frameRate: 30,
        bitrate: '3000k',
        audioBitrate: '128k',
        profile: 'main',
        level: '5.0',
        pixelFormat: 'yuv420p',
        colorSpace: 'bt709',
        gopSize: 240,
        bFrames: 7,
      },
      {
        id: 'vp9_webm',
        name: 'VP9 WebM',
        category: 'High Efficiency',
        format: 'webm',
        codec: 'vp9',
        resolution: '1920x1080',
        frameRate: 30,
        bitrate: '4000k',
        audioBitrate: '128k',
        profile: '0',
        level: '0',
        pixelFormat: 'yuv420p',
        colorSpace: 'bt709',
        gopSize: 240,
        bFrames: 0,
      },
    ],
    'WAN 2.2 Optimized': [
      {
        id: 'wan22_ultra',
        name: 'WAN 2.2 Ultra Quality',
        category: 'WAN 2.2 Optimized',
        format: 'mp4',
        codec: 'h265',
        resolution: '3840x2160',
        frameRate: 60,
        bitrate: '50000k',
        audioBitrate: '512k',
        profile: 'main10',
        level: '6.2',
        pixelFormat: 'yuv420p10le',
        colorSpace: 'bt2020',
        gopSize: 30,
        bFrames: 5,
      },
      {
        id: 'wan22_balanced',
        name: 'WAN 2.2 Balanced',
        category: 'WAN 2.2 Optimized',
        format: 'mp4',
        codec: 'h264',
        resolution: '1920x1080',
        frameRate: 30,
        bitrate: '10000k',
        audioBitrate: '256k',
        profile: 'high',
        level: '5.0',
        pixelFormat: 'yuv420p',
        colorSpace: 'bt709',
        gopSize: 30,
        bFrames: 3,
      },
      {
        id: 'wan22_mobile',
        name: 'WAN 2.2 Mobile',
        category: 'WAN 2.2 Optimized',
        format: 'mp4',
        codec: 'h264',
        resolution: '1280x720',
        frameRate: 30,
        bitrate: '3000k',
        audioBitrate: '128k',
        profile: 'baseline',
        level: '3.1',
        pixelFormat: 'yuv420p',
        colorSpace: 'bt709',
        gopSize: 30,
        bFrames: 0,
      },
      {
        id: 'wan22_ai_enhanced',
        name: 'WAN 2.2 AI Enhanced',
        category: 'WAN 2.2 Optimized',
        format: 'mp4',
        codec: 'av1',
        resolution: '2560x1440',
        frameRate: 60,
        bitrate: '15000k',
        audioBitrate: '320k',
        profile: 'professional',
        level: '5.3',
        pixelFormat: 'yuv444p10le',
        colorSpace: 'bt2020',
        gopSize: 60,
        bFrames: 7,
      },
    ],
    'Archive': [
      {
        id: 'lossless',
        name: 'Lossless Archive',
        category: 'Archive',
        format: 'avi',
        codec: 'ffv1',
        resolution: '1920x1080',
        frameRate: 30,
        bitrate: '0',
        audioBitrate: '1536k',
        profile: 'lossless',
        level: '3',
        pixelFormat: 'yuv422p10le',
        colorSpace: 'bt709',
        gopSize: 1,
        bFrames: 0,
      },
      {
        id: 'raw',
        name: 'Uncompressed',
        category: 'Archive',
        format: 'mov',
        codec: 'rawvideo',
        resolution: '1920x1080',
        frameRate: 30,
        bitrate: '0',
        audioBitrate: '1536k',
        profile: 'raw',
        level: '0',
        pixelFormat: 'rgb24',
        colorSpace: 'rgb',
        gopSize: 1,
        bFrames: 0,
      },
    ],
  };

  const addToQueue = () => {
    if (!selectedPreset) return;
    
    const newJob: RenderJob = {
      id: `job_${Date.now()}`,
      name: `Export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`,
      status: 'waiting',
      progress: 0,
      startTime: new Date(),
      estimatedTime: 0,
      outputPath: '',
      preset: { ...selectedPreset, ...customSettings },
    };
    
    setRenderQueue([...renderQueue, newJob]);
  };

  const startExport = () => {
    setIsExporting(true);
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          return 100;
        }
        return prev + Math.random() * 5;
      });
    }, 500);
  };

  const cancelExport = () => {
    setIsExporting(false);
    setExportProgress(0);
  };

  const formatFileSize = (bitrate: string): string => {
    const kbps = parseInt(bitrate);
    const mbPerMinute = (kbps * 60) / 8000;
    return `~${mbPerMinute.toFixed(1)} MB/min`;
  };

  return (
    <div className="video-export-panel">
      <style jsx>{`
        .video-export-panel {
          display: flex;
          height: 100vh;
          background: #0a0a0a;
          color: #fff;
          font-family: 'Inter', sans-serif;
        }

        .export-sidebar {
          width: 350px;
          background: #1a1a1a;
          border-right: 1px solid #333;
          overflow-y: auto;
        }

        .export-header {
          padding: 20px;
          background: #2a2a2a;
          border-bottom: 1px solid #333;
        }

        .export-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .export-subtitle {
          font-size: 12px;
          color: #888;
        }

        .preset-categories {
          padding: 16px;
        }

        .preset-category {
          margin-bottom: 24px;
        }

        .category-title {
          font-size: 12px;
          text-transform: uppercase;
          color: #888;
          font-weight: 600;
          margin-bottom: 10px;
          padding-left: 8px;
        }

        .preset-list {
          display: grid;
          gap: 8px;
        }

        .preset-item {
          padding: 12px;
          background: #0a0a0a;
          border: 2px solid #333;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .preset-item:hover {
          background: #1a1a1a;
          border-color: #00ff88;
        }

        .preset-item.selected {
          background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 170, 255, 0.1));
          border-color: #00ff88;
        }

        .preset-name {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .preset-info {
          font-size: 11px;
          color: #888;
          display: flex;
          gap: 8px;
        }

        .preset-badge {
          padding: 2px 6px;
          background: rgba(0, 255, 136, 0.2);
          border-radius: 3px;
          color: #00ff88;
        }

        .export-main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .settings-panel {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
        }

        .settings-section {
          background: #1a1a1a;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .setting-row {
          display: grid;
          grid-template-columns: 140px 1fr;
          gap: 16px;
          align-items: center;
          margin-bottom: 16px;
        }

        .setting-label {
          font-size: 12px;
          color: #888;
        }

        .setting-value {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        input[type="text"],
        input[type="number"],
        select {
          flex: 1;
          padding: 8px;
          background: #0a0a0a;
          border: 1px solid #444;
          border-radius: 4px;
          color: #fff;
          font-size: 12px;
        }

        .checkbox-group {
          display: flex;
          gap: 20px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 12px;
        }

        .checkbox-label input {
          width: 18px;
          height: 18px;
        }

        .range-selector {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .range-option {
          flex: 1;
          padding: 8px;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 4px;
          text-align: center;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .range-option.selected {
          background: #00ff88;
          color: #000;
          border-color: #00ff88;
        }

        .time-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .render-queue {
          background: #1a1a1a;
          border-top: 1px solid #333;
          padding: 20px;
          max-height: 300px;
          overflow-y: auto;
        }

        .queue-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .queue-title {
          font-size: 14px;
          font-weight: 600;
        }

        .queue-count {
          padding: 4px 8px;
          background: #2a2a2a;
          border-radius: 12px;
          font-size: 11px;
        }

        .queue-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .queue-item {
          padding: 12px;
          background: #0a0a0a;
          border-radius: 6px;
          border: 1px solid #333;
        }

        .queue-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .queue-item-name {
          font-size: 12px;
          font-weight: 600;
        }

        .queue-item-status {
          padding: 3px 8px;
          background: #2a2a2a;
          border-radius: 3px;
          font-size: 10px;
        }

        .queue-item-status.processing {
          background: #f39c12;
          color: #000;
        }

        .queue-item-status.completed {
          background: #00ff88;
          color: #000;
        }

        .queue-item-status.error {
          background: #e74c3c;
        }

        .progress-bar {
          height: 4px;
          background: #2a2a2a;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 6px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00ff88, #00aaff);
          transition: width 0.3s;
        }

        .queue-item-info {
          font-size: 11px;
          color: #888;
        }

        .export-controls {
          padding: 20px;
          background: #1a1a1a;
          border-top: 1px solid #333;
          display: flex;
          gap: 12px;
        }

        .export-btn {
          flex: 1;
          padding: 12px;
          background: linear-gradient(90deg, #00ff88, #00aaff);
          border: none;
          border-radius: 6px;
          color: #000;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .export-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
        }

        .export-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .cancel-btn {
          padding: 12px 24px;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 6px;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 16px;
        }

        .stat-item {
          padding: 8px;
          background: #0a0a0a;
          border-radius: 4px;
        }

        .stat-label {
          font-size: 10px;
          color: #666;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 14px;
          color: #00ff88;
          font-weight: 600;
        }

        .gpu-indicator {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          background: rgba(0, 255, 136, 0.1);
          border-radius: 4px;
          font-size: 11px;
        }

        .gpu-indicator.active {
          background: rgba(0, 255, 136, 0.2);
          color: #00ff88;
        }

        .advanced-toggle {
          padding: 8px;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
          text-align: center;
          margin-top: 12px;
        }

        .advanced-settings {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #333;
        }
      `}</style>

      <div className="export-sidebar">
        <div className="export-header">
          <h2 className="export-title">Export Settings</h2>
          <p className="export-subtitle">Choose a preset or customize</p>
        </div>

        <div className="preset-categories">
          {Object.entries(exportPresets).map(([category, presets]) => (
            <div key={category} className="preset-category">
              <div className="category-title">{category}</div>
              <div className="preset-list">
                {presets.map(preset => (
                  <div
                    key={preset.id}
                    className={`preset-item ${selectedPreset?.id === preset.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPreset(preset)}
                  >
                    <div className="preset-name">{preset.name}</div>
                    <div className="preset-info">
                      <span>{preset.resolution}</span>
                      <span>{preset.codec.toUpperCase()}</span>
                      <span>{preset.frameRate}fps</span>
                      {preset.codec === 'h265' && <span className="preset-badge">HEVC</span>}
                      {preset.codec === 'av1' && <span className="preset-badge">AV1</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="export-main">
        <div className="settings-panel">
          {selectedPreset && (
            <>
              <div className="settings-section">
                <div className="section-title">
                  <span>Format & Codec</span>
                  <div className={`gpu-indicator ${gpuAcceleration ? 'active' : ''}`}>
                    <span>GPU</span>
                    <span>{gpuAcceleration ? '✓' : '✗'}</span>
                  </div>
                </div>
                <div className="setting-row">
                  <span className="setting-label">Container Format</span>
                  <div className="setting-value">
                    <select value={selectedPreset.format}>
                      <option value="mp4">MP4</option>
                      <option value="mov">MOV</option>
                      <option value="avi">AVI</option>
                      <option value="mkv">MKV</option>
                      <option value="webm">WebM</option>
                    </select>
                  </div>
                </div>
                <div className="setting-row">
                  <span className="setting-label">Video Codec</span>
                  <div className="setting-value">
                    <select value={selectedPreset.codec}>
                      <option value="h264">H.264 (AVC)</option>
                      <option value="h265">H.265 (HEVC)</option>
                      <option value="av1">AV1</option>
                      <option value="vp9">VP9</option>
                      <option value="prores">ProRes</option>
                    </select>
                  </div>
                </div>
                <div className="setting-row">
                  <span className="setting-label">Audio Codec</span>
                  <div className="setting-value">
                    <select>
                      <option value="aac">AAC</option>
                      <option value="opus">Opus</option>
                      <option value="mp3">MP3</option>
                      <option value="pcm">PCM</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <div className="section-title">Video Settings</div>
                <div className="setting-row">
                  <span className="setting-label">Resolution</span>
                  <div className="setting-value">
                    <select value={selectedPreset.resolution}>
                      <option value="3840x2160">4K (3840×2160)</option>
                      <option value="2560x1440">1440p (2560×1440)</option>
                      <option value="1920x1080">1080p (1920×1080)</option>
                      <option value="1280x720">720p (1280×720)</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>
                <div className="setting-row">
                  <span className="setting-label">Frame Rate</span>
                  <div className="setting-value">
                    <input type="number" value={selectedPreset.frameRate} />
                    <span style={{ color: '#888' }}>fps</span>
                  </div>
                </div>
                <div className="setting-row">
                  <span className="setting-label">Bitrate</span>
                  <div className="setting-value">
                    <input type="text" value={selectedPreset.bitrate} />
                    <span style={{ color: '#888', fontSize: '11px' }}>
                      {formatFileSize(selectedPreset.bitrate)}
                    </span>
                  </div>
                </div>
                <div className="setting-row">
                  <span className="setting-label">Color Space</span>
                  <div className="setting-value">
                    <select value={selectedPreset.colorSpace}>
                      <option value="bt709">Rec. 709</option>
                      <option value="bt2020">Rec. 2020</option>
                      <option value="srgb">sRGB</option>
                      <option value="xyz">XYZ</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <div className="section-title">Export Range</div>
                <div className="range-selector">
                  <div 
                    className={`range-option ${exportRange === 'all' ? 'selected' : ''}`}
                    onClick={() => setExportRange('all')}
                  >
                    Entire Video
                  </div>
                  <div 
                    className={`range-option ${exportRange === 'selection' ? 'selected' : ''}`}
                    onClick={() => setExportRange('selection')}
                  >
                    Selection
                  </div>
                  <div 
                    className={`range-option ${exportRange === 'custom' ? 'selected' : ''}`}
                    onClick={() => setExportRange('custom')}
                  >
                    Custom
                  </div>
                </div>
                {exportRange === 'custom' && (
                  <div className="time-inputs">
                    <div>
                      <label style={{ fontSize: '11px', color: '#888' }}>Start Time</label>
                      <input 
                        type="number" 
                        value={startTime}
                        onChange={(e) => setStartTime(Number(e.target.value))}
                        placeholder="00:00:00"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#888' }}>End Time</label>
                      <input 
                        type="number"
                        value={endTime}
                        onChange={(e) => setEndTime(Number(e.target.value))}
                        placeholder="00:00:00"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="settings-section">
                <div className="section-title">Optimization</div>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={gpuAcceleration}
                      onChange={(e) => setGpuAcceleration(e.target.checked)}
                    />
                    <span>GPU Acceleration</span>
                  </label>
                  <label className="checkbox-label">
                    <input 
                      type="checkbox"
                      checked={multiPass}
                      onChange={(e) => setMultiPass(e.target.checked)}
                    />
                    <span>Multi-pass Encoding</span>
                  </label>
                </div>

                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-label">Estimated Size</div>
                    <div className="stat-value">~1.2 GB</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Render Time</div>
                    <div className="stat-value">~5 min</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Quality</div>
                    <div className="stat-value">High</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Compatibility</div>
                    <div className="stat-value">Universal</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="render-queue">
          <div className="queue-header">
            <span className="queue-title">Render Queue</span>
            <span className="queue-count">{renderQueue.length} jobs</span>
          </div>
          <div className="queue-list">
            {renderQueue.map(job => (
              <div key={job.id} className="queue-item">
                <div className="queue-item-header">
                  <span className="queue-item-name">{job.name}</span>
                  <span className={`queue-item-status ${job.status}`}>
                    {job.status}
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${job.progress}%` }} />
                </div>
                <div className="queue-item-info">
                  {job.preset.name} • {job.preset.resolution} • {job.preset.codec.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="export-controls">
          <button 
            className="export-btn"
            onClick={isExporting ? undefined : startExport}
            disabled={!selectedPreset || isExporting}
          >
            {isExporting ? `Exporting... ${exportProgress.toFixed(0)}%` : 'Start Export'}
          </button>
          {isExporting && (
            <button className="cancel-btn" onClick={cancelExport}>
              Cancel
            </button>
          )}
          {!isExporting && renderQueue.length > 0 && (
            <button className="export-btn" onClick={addToQueue}>
              Add to Queue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoExport;