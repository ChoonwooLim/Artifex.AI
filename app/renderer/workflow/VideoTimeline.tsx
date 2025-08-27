import React, { useState, useRef, useEffect, useCallback } from 'react';

interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text' | 'effect' | 'transition';
  clips: TimelineClip[];
  height: number;
  muted: boolean;
  solo: boolean;
  locked: boolean;
  color: string;
}

interface TimelineClip {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  inPoint: number;
  outPoint: number;
  thumbnailUrl?: string;
  waveformData?: number[];
  effects: ClipEffect[];
  transitions: ClipTransition[];
  color: string;
  selected: boolean;
}

interface ClipEffect {
  id: string;
  name: string;
  type: string;
  parameters: Record<string, any>;
  keyframes: Keyframe[];
}

interface ClipTransition {
  id: string;
  type: 'cut' | 'fade' | 'dissolve' | 'wipe' | 'slide' | '3d';
  duration: number;
  easing: string;
}

interface Keyframe {
  time: number;
  value: any;
  interpolation: 'linear' | 'bezier' | 'hold';
}

interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color: string;
  type: 'marker' | 'region';
  endTime?: number;
}

const VideoTimeline: React.FC = () => {
  const [tracks, setTracks] = useState<TimelineTrack[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(300);
  const [zoom, setZoom] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClips, setSelectedClips] = useState<string[]>([]);
  const [markers, setMarkers] = useState<TimelineMarker[]>([]);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showWaveforms, setShowWaveforms] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [rippleEdit, setRippleEdit] = useState(false);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const defaultTracks: TimelineTrack[] = [
      {
        id: 'v1',
        name: 'Video 1',
        type: 'video',
        height: 80,
        muted: false,
        solo: false,
        locked: false,
        color: '#4a90e2',
        clips: [
          {
            id: 'clip1',
            name: 'Opening Scene',
            startTime: 10,
            duration: 45,
            inPoint: 0,
            outPoint: 45,
            color: '#4a90e2',
            selected: false,
            effects: [],
            transitions: [
              { id: 't1', type: 'fade', duration: 2, easing: 'ease-in-out' }
            ],
          },
          {
            id: 'clip2',
            name: 'Main Content',
            startTime: 60,
            duration: 120,
            inPoint: 0,
            outPoint: 120,
            color: '#4a90e2',
            selected: false,
            effects: [
              {
                id: 'e1',
                name: 'Color Correction',
                type: 'color',
                parameters: { brightness: 1.2, contrast: 1.1 },
                keyframes: []
              }
            ],
            transitions: [],
          },
        ],
      },
      {
        id: 'v2',
        name: 'Video 2',
        type: 'video',
        height: 80,
        muted: false,
        solo: false,
        locked: false,
        color: '#50c878',
        clips: [
          {
            id: 'clip3',
            name: 'B-Roll',
            startTime: 30,
            duration: 25,
            inPoint: 0,
            outPoint: 25,
            color: '#50c878',
            selected: false,
            effects: [],
            transitions: [],
          },
        ],
      },
      {
        id: 'a1',
        name: 'Audio 1',
        type: 'audio',
        height: 60,
        muted: false,
        solo: false,
        locked: false,
        color: '#f39c12',
        clips: [
          {
            id: 'audio1',
            name: 'Background Music',
            startTime: 0,
            duration: 200,
            inPoint: 0,
            outPoint: 200,
            color: '#f39c12',
            selected: false,
            waveformData: generateWaveformData(200),
            effects: [],
            transitions: [],
          },
        ],
      },
      {
        id: 't1',
        name: 'Text 1',
        type: 'text',
        height: 50,
        muted: false,
        solo: false,
        locked: false,
        color: '#e74c3c',
        clips: [
          {
            id: 'text1',
            name: 'Title',
            startTime: 5,
            duration: 10,
            inPoint: 0,
            outPoint: 10,
            color: '#e74c3c',
            selected: false,
            effects: [],
            transitions: [],
          },
          {
            id: 'text2',
            name: 'Subtitle',
            startTime: 15,
            duration: 15,
            inPoint: 0,
            outPoint: 15,
            color: '#e74c3c',
            selected: false,
            effects: [],
            transitions: [],
          },
        ],
      },
    ];
    
    setTracks(defaultTracks);
    
    const defaultMarkers: TimelineMarker[] = [
      { id: 'm1', time: 50, label: 'Scene Change', color: '#ff6b6b', type: 'marker' },
      { id: 'm2', time: 100, label: 'Important', color: '#4ecdc4', type: 'marker' },
      { id: 'r1', time: 150, endTime: 180, label: 'Review Section', color: '#95e77e', type: 'region' },
    ];
    
    setMarkers(defaultMarkers);
  }, []);

  function generateWaveformData(duration: number): number[] {
    const samples = Math.floor(duration * 2);
    return Array.from({ length: samples }, () => Math.random() * 0.8 + 0.2);
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  const handleClipDrag = (trackId: string, clipId: string, deltaX: number) => {
    const pixelsPerSecond = 2 * zoom;
    const deltaTime = deltaX / pixelsPerSecond;
    
    setTracks(tracks.map(track => {
      if (track.id === trackId) {
        return {
          ...track,
          clips: track.clips.map(clip => {
            if (clip.id === clipId) {
              const newStartTime = Math.max(0, clip.startTime + deltaTime);
              if (snapEnabled) {
                return { ...clip, startTime: Math.round(newStartTime / 5) * 5 };
              }
              return { ...clip, startTime: newStartTime };
            }
            return clip;
          }),
        };
      }
      return track;
    }));
  };

  const handleClipResize = (trackId: string, clipId: string, side: 'start' | 'end', delta: number) => {
    const pixelsPerSecond = 2 * zoom;
    const deltaTime = delta / pixelsPerSecond;
    
    setTracks(tracks.map(track => {
      if (track.id === trackId) {
        return {
          ...track,
          clips: track.clips.map(clip => {
            if (clip.id === clipId) {
              if (side === 'start') {
                const newStartTime = Math.max(0, clip.startTime + deltaTime);
                const newDuration = Math.max(1, clip.duration - deltaTime);
                return { ...clip, startTime: newStartTime, duration: newDuration };
              } else {
                const newDuration = Math.max(1, clip.duration + deltaTime);
                return { ...clip, duration: newDuration };
              }
            }
            return clip;
          }),
        };
      }
      return track;
    }));
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(Math.max(0, Math.min(duration, time)));
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (direction === 'in') {
      setZoom(Math.min(5, zoom * 1.2));
    } else {
      setZoom(Math.max(0.1, zoom / 1.2));
    }
  };

  const addTrack = (type: TimelineTrack['type']) => {
    const newTrack: TimelineTrack = {
      id: `track_${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${tracks.filter(t => t.type === type).length + 1}`,
      type,
      height: type === 'video' ? 80 : type === 'audio' ? 60 : 50,
      muted: false,
      solo: false,
      locked: false,
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      clips: [],
    };
    setTracks([...tracks, newTrack]);
  };

  const deleteTrack = (trackId: string) => {
    setTracks(tracks.filter(t => t.id !== trackId));
  };

  const splitClip = (trackId: string, clipId: string, splitTime: number) => {
    setTracks(tracks.map(track => {
      if (track.id === trackId) {
        return {
          ...track,
          clips: track.clips.flatMap(clip => {
            if (clip.id === clipId && splitTime > clip.startTime && splitTime < clip.startTime + clip.duration) {
              const firstDuration = splitTime - clip.startTime;
              const secondDuration = clip.duration - firstDuration;
              
              return [
                { ...clip, duration: firstDuration },
                {
                  ...clip,
                  id: `${clip.id}_split_${Date.now()}`,
                  startTime: splitTime,
                  duration: secondDuration,
                  inPoint: clip.inPoint + firstDuration,
                },
              ];
            }
            return clip;
          }),
        };
      }
      return track;
    }));
  };

  useEffect(() => {
    if (isPlaying) {
      const startTime = performance.now();
      const startCurrentTime = currentTime;
      
      const animate = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        const newTime = startCurrentTime + elapsed;
        
        if (newTime >= duration) {
          setCurrentTime(duration);
          setIsPlaying(false);
        } else {
          setCurrentTime(newTime);
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTime, duration]);

  return (
    <div className="timeline-editor">
      <style jsx>{`
        .timeline-editor {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #0a0a0a;
          color: #fff;
          font-family: 'Inter', sans-serif;
          user-select: none;
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background: #1a1a1a;
          border-bottom: 1px solid #333;
        }

        .timeline-title {
          font-size: 16px;
          font-weight: 600;
        }

        .timeline-controls {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .control-group {
          display: flex;
          gap: 6px;
          align-items: center;
          padding: 0 12px;
          border-right: 1px solid #333;
        }

        .control-group:last-child {
          border-right: none;
        }

        .control-btn {
          padding: 6px 10px;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 4px;
          color: #fff;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .control-btn:hover {
          background: #3a3a3a;
          border-color: #00ff88;
        }

        .control-btn.active {
          background: #00ff88;
          color: #000;
          border-color: #00ff88;
        }

        .timeline-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .track-panel {
          width: 200px;
          background: #1a1a1a;
          border-right: 1px solid #333;
          overflow-y: auto;
        }

        .track-header {
          padding: 8px 12px;
          background: #2a2a2a;
          border-bottom: 1px solid #444;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .add-track-btn {
          padding: 4px 8px;
          background: #00ff88;
          border: none;
          border-radius: 4px;
          color: #000;
          font-size: 11px;
          cursor: pointer;
        }

        .track-list {
          display: flex;
          flex-direction: column;
        }

        .track-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          border-bottom: 1px solid #2a2a2a;
          background: #1a1a1a;
          transition: background 0.2s;
        }

        .track-item:hover {
          background: #222;
        }

        .track-icon {
          width: 20px;
          height: 20px;
          margin-right: 8px;
          background: var(--track-color);
          border-radius: 4px;
        }

        .track-name {
          flex: 1;
          font-size: 12px;
        }

        .track-controls {
          display: flex;
          gap: 4px;
        }

        .track-btn {
          width: 24px;
          height: 24px;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 4px;
          color: #888;
          cursor: pointer;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .track-btn:hover {
          background: #3a3a3a;
          color: #fff;
        }

        .track-btn.active {
          background: #00ff88;
          color: #000;
          border-color: #00ff88;
        }

        .timeline-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .timeline-ruler {
          height: 30px;
          background: #1a1a1a;
          border-bottom: 1px solid #333;
          position: relative;
          overflow: hidden;
        }

        .ruler-marks {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          display: flex;
        }

        .ruler-mark {
          position: absolute;
          bottom: 0;
          width: 1px;
          background: #444;
          font-size: 10px;
          color: #888;
        }

        .ruler-mark.major {
          height: 100%;
          background: #666;
        }

        .ruler-mark.minor {
          height: 50%;
        }

        .ruler-mark span {
          position: absolute;
          bottom: 100%;
          left: 2px;
          white-space: nowrap;
        }

        .timeline-tracks {
          flex: 1;
          overflow: auto;
          background: #0a0a0a;
          position: relative;
        }

        .tracks-container {
          position: relative;
          min-height: 100%;
        }

        .track-lane {
          position: relative;
          border-bottom: 1px solid #222;
          background: #0f0f0f;
        }

        .track-lane:nth-child(even) {
          background: #0a0a0a;
        }

        .clip {
          position: absolute;
          top: 4px;
          bottom: 4px;
          background: var(--clip-color);
          border-radius: 4px;
          border: 2px solid transparent;
          cursor: move;
          overflow: hidden;
          display: flex;
          align-items: center;
          padding: 4px 8px;
          transition: border-color 0.2s;
        }

        .clip:hover {
          border-color: #00ff88;
        }

        .clip.selected {
          border-color: #00ff88;
          box-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
        }

        .clip-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          pointer-events: none;
        }

        .clip-name {
          font-size: 11px;
          font-weight: 600;
          color: #fff;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .clip-info {
          font-size: 9px;
          color: rgba(255,255,255,0.7);
          margin-top: 2px;
        }

        .clip-waveform {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 30%;
          opacity: 0.3;
          pointer-events: none;
        }

        .clip-thumbnail {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0.2;
          pointer-events: none;
        }

        .clip-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .clip-resize-handle {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 8px;
          cursor: ew-resize;
          background: transparent;
        }

        .clip-resize-handle:hover {
          background: rgba(0, 255, 136, 0.3);
        }

        .clip-resize-handle.left {
          left: 0;
        }

        .clip-resize-handle.right {
          right: 0;
        }

        .playhead {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #ff3333;
          pointer-events: none;
          z-index: 100;
        }

        .playhead::before {
          content: '';
          position: absolute;
          top: -8px;
          left: -6px;
          width: 0;
          height: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-top: 8px solid #ff3333;
        }

        .time-display {
          padding: 6px 12px;
          background: #2a2a2a;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          color: #00ff88;
          min-width: 100px;
          text-align: center;
        }

        .timeline-markers {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 20px;
          pointer-events: none;
        }

        .marker {
          position: absolute;
          width: 2px;
          height: 100%;
          background: var(--marker-color);
        }

        .marker-label {
          position: absolute;
          top: -20px;
          left: 4px;
          font-size: 10px;
          color: var(--marker-color);
          white-space: nowrap;
        }

        .region-marker {
          position: absolute;
          height: 100%;
          background: var(--marker-color);
          opacity: 0.2;
        }

        .zoom-control {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .zoom-slider {
          width: 100px;
          height: 4px;
          background: #2a2a2a;
          border-radius: 2px;
          position: relative;
          cursor: pointer;
        }

        .zoom-slider-fill {
          height: 100%;
          background: #00ff88;
          border-radius: 2px;
          width: var(--zoom-percent);
        }

        .dropdown-menu {
          position: absolute;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 4px;
          padding: 4px;
          z-index: 1000;
        }

        .dropdown-item {
          padding: 6px 12px;
          font-size: 12px;
          cursor: pointer;
          border-radius: 2px;
        }

        .dropdown-item:hover {
          background: #3a3a3a;
        }

        .effect-badge {
          display: inline-block;
          padding: 2px 6px;
          background: rgba(0, 255, 136, 0.2);
          border-radius: 2px;
          font-size: 9px;
          margin-left: 4px;
        }

        .transition-indicator {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          background: #ffaa00;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
        }
      `}</style>

      <div className="timeline-header">
        <div className="timeline-title">Advanced Timeline Editor</div>
        <div className="timeline-controls">
          <div className="control-group">
            <button className="control-btn" onClick={handlePlayPause}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className="control-btn" onClick={() => handleSeek(0)}>⏮</button>
            <button className="control-btn" onClick={() => handleSeek(currentTime - 1)}>⏪</button>
            <button className="control-btn" onClick={() => handleSeek(currentTime + 1)}>⏩</button>
            <button className="control-btn" onClick={() => handleSeek(duration)}>⏭</button>
            <div className="time-display">{formatTime(currentTime)}</div>
          </div>
          
          <div className="control-group">
            <button 
              className={`control-btn ${snapEnabled ? 'active' : ''}`}
              onClick={() => setSnapEnabled(!snapEnabled)}
            >
              🧲 Snap
            </button>
            <button 
              className={`control-btn ${rippleEdit ? 'active' : ''}`}
              onClick={() => setRippleEdit(!rippleEdit)}
            >
              〰️ Ripple
            </button>
            <button 
              className={`control-btn ${autoScroll ? 'active' : ''}`}
              onClick={() => setAutoScroll(!autoScroll)}
            >
              📜 Auto
            </button>
          </div>
          
          <div className="control-group">
            <button 
              className={`control-btn ${showThumbnails ? 'active' : ''}`}
              onClick={() => setShowThumbnails(!showThumbnails)}
            >
              🖼️
            </button>
            <button 
              className={`control-btn ${showWaveforms ? 'active' : ''}`}
              onClick={() => setShowWaveforms(!showWaveforms)}
            >
              〰️
            </button>
          </div>
          
          <div className="control-group zoom-control">
            <button className="control-btn" onClick={() => handleZoom('out')}>➖</button>
            <div className="zoom-slider">
              <div className="zoom-slider-fill" style={{ '--zoom-percent': `${(zoom - 0.1) / 4.9 * 100}%` } as any} />
            </div>
            <button className="control-btn" onClick={() => handleZoom('in')}>➕</button>
            <span style={{ fontSize: '11px', color: '#888' }}>{Math.round(zoom * 100)}%</span>
          </div>
        </div>
      </div>

      <div className="timeline-body">
        <div className="track-panel">
          <div className="track-header">
            <span>Tracks</span>
            <select 
              className="add-track-btn"
              onChange={(e) => {
                if (e.target.value) {
                  addTrack(e.target.value as TimelineTrack['type']);
                  e.target.value = '';
                }
              }}
            >
              <option value="">+ Add</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="text">Text</option>
              <option value="effect">Effect</option>
            </select>
          </div>
          <div className="track-list">
            {tracks.map(track => (
              <div 
                key={track.id} 
                className="track-item"
                style={{ height: track.height, '--track-color': track.color } as any}
              >
                <div className="track-icon" />
                <span className="track-name">{track.name}</span>
                <div className="track-controls">
                  <button 
                    className={`track-btn ${track.muted ? 'active' : ''}`}
                    onClick={() => setTracks(tracks.map(t => 
                      t.id === track.id ? { ...t, muted: !t.muted } : t
                    ))}
                  >
                    🔇
                  </button>
                  <button 
                    className={`track-btn ${track.solo ? 'active' : ''}`}
                    onClick={() => setTracks(tracks.map(t => 
                      t.id === track.id ? { ...t, solo: !t.solo } : t
                    ))}
                  >
                    S
                  </button>
                  <button 
                    className={`track-btn ${track.locked ? 'active' : ''}`}
                    onClick={() => setTracks(tracks.map(t => 
                      t.id === track.id ? { ...t, locked: !t.locked } : t
                    ))}
                  >
                    🔒
                  </button>
                  <button 
                    className="track-btn"
                    onClick={() => deleteTrack(track.id)}
                  >
                    ❌
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="timeline-content">
          <div className="timeline-ruler" ref={rulerRef}>
            <div className="ruler-marks">
              {Array.from({ length: Math.ceil(duration * zoom / 10) }, (_, i) => {
                const time = i * 10;
                const isMajor = time % 30 === 0;
                return (
                  <div 
                    key={i}
                    className={`ruler-mark ${isMajor ? 'major' : 'minor'}`}
                    style={{ left: `${time * 2 * zoom}px` }}
                  >
                    {isMajor && <span>{formatTime(time)}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="timeline-tracks" ref={timelineRef}>
            <div className="tracks-container">
              {tracks.map(track => (
                <div 
                  key={track.id}
                  className="track-lane"
                  style={{ height: track.height }}
                >
                  {track.clips.map(clip => (
                    <div
                      key={clip.id}
                      className={`clip ${clip.selected ? 'selected' : ''}`}
                      style={{
                        left: `${clip.startTime * 2 * zoom}px`,
                        width: `${clip.duration * 2 * zoom}px`,
                        '--clip-color': clip.color,
                      } as any}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedClips([clip.id]);
                      }}
                    >
                      {showThumbnails && clip.thumbnailUrl && (
                        <div className="clip-thumbnail">
                          <img src={clip.thumbnailUrl} alt="" />
                        </div>
                      )}
                      {showWaveforms && clip.waveformData && (
                        <div className="clip-waveform">
                          <svg width="100%" height="100%">
                            {clip.waveformData.map((value, i) => (
                              <rect
                                key={i}
                                x={`${(i / clip.waveformData!.length) * 100}%`}
                                y={`${(1 - value) * 100}%`}
                                width={`${100 / clip.waveformData!.length}%`}
                                height={`${value * 100}%`}
                                fill="#00ff88"
                              />
                            ))}
                          </svg>
                        </div>
                      )}
                      <div className="clip-content">
                        <div className="clip-name">
                          {clip.name}
                          {clip.effects.length > 0 && (
                            <span className="effect-badge">FX: {clip.effects.length}</span>
                          )}
                        </div>
                        <div className="clip-info">
                          {formatTime(clip.duration)}
                        </div>
                      </div>
                      {clip.transitions.map((transition, i) => (
                        <div
                          key={transition.id}
                          className="transition-indicator"
                          style={{ left: i === 0 ? '0' : 'auto', right: i === 0 ? 'auto' : '0' }}
                        >
                          T
                        </div>
                      ))}
                      <div className="clip-resize-handle left" />
                      <div className="clip-resize-handle right" />
                    </div>
                  ))}
                </div>
              ))}
              
              <div className="timeline-markers">
                {markers.map(marker => 
                  marker.type === 'marker' ? (
                    <div
                      key={marker.id}
                      className="marker"
                      style={{ 
                        left: `${marker.time * 2 * zoom}px`,
                        '--marker-color': marker.color,
                      } as any}
                    >
                      <span className="marker-label">{marker.label}</span>
                    </div>
                  ) : (
                    <div
                      key={marker.id}
                      className="region-marker"
                      style={{ 
                        left: `${marker.time * 2 * zoom}px`,
                        width: `${((marker.endTime || marker.time) - marker.time) * 2 * zoom}px`,
                        '--marker-color': marker.color,
                      } as any}
                    />
                  )
                )}
              </div>
              
              <div 
                className="playhead"
                ref={playheadRef}
                style={{ left: `${currentTime * 2 * zoom}px` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoTimeline;