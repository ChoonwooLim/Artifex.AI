import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  Panel,
  NodeTypes,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface VideoProject {
  id: string;
  name: string;
  resolution: string;
  frameRate: number;
  duration: number;
  tracks: VideoTrack[];
  effects: VideoEffect[];
  exports: ExportSettings[];
}

interface VideoTrack {
  id: string;
  type: 'video' | 'audio' | 'text' | 'effect';
  name: string;
  clips: VideoClip[];
  enabled: boolean;
  locked: boolean;
}

interface VideoClip {
  id: string;
  source: string;
  startTime: number;
  endTime: number;
  inPoint: number;
  outPoint: number;
  effects: string[];
  transitions: Transition[];
}

interface VideoEffect {
  id: string;
  name: string;
  type: string;
  parameters: Record<string, any>;
  enabled: boolean;
}

interface Transition {
  type: string;
  duration: number;
  parameters: Record<string, any>;
}

interface ExportSettings {
  format: string;
  codec: string;
  bitrate: string;
  resolution: string;
  frameRate: number;
  quality: string;
}

const nodeTypes: NodeTypes = {
  videoInput: VideoInputNode,
  textPrompt: TextPromptNode,
  imagePrompt: ImagePromptNode,
  aiGenerator: AIGeneratorNode,
  effectProcessor: EffectProcessorNode,
  audioProcessor: AudioProcessorNode,
  colorGrading: ColorGradingNode,
  motionTracking: MotionTrackingNode,
  compositor: CompositorNode,
  exportNode: ExportNode,
};

function VideoInputNode({ data, id }: any) {
  const handleSelectVideo = async () => {
    if (typeof window !== 'undefined' && (window as any).electron) {
      const result = await (window as any).electron.openFile({
        filters: [
          { name: 'Videos', extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (result && !result.canceled && result.filePaths.length > 0) {
        // Update node data with selected file
        data.path = result.filePaths[0];
        data.format = result.filePaths[0].split('.').pop()?.toUpperCase() || 'MP4';
        
        // Get video metadata if possible
        const video = document.createElement('video');
        video.src = `file://${result.filePaths[0]}`;
        video.onloadedmetadata = () => {
          data.resolution = `${video.videoWidth}x${video.videoHeight}`;
        };
      }
    }
  };

  return (
    <div className="video-node video-input-node">
      <div className="node-header">📹 Video Input</div>
      <div className="node-content">
        <input 
          type="text" 
          placeholder="Click to select video..." 
          value={data.path ? data.path.split(/[\\\/]/).pop() : ''} 
          onClick={handleSelectVideo}
          readOnly
          style={{ cursor: 'pointer' }}
        />
        <button onClick={handleSelectVideo} style={{ marginTop: '5px' }}>
          Select Video
        </button>
        <div className="node-info">
          <span>Format: {data.format || 'MP4'}</span>
          <span>Resolution: {data.resolution || '1920x1080'}</span>
        </div>
      </div>
      <div className="node-ports">
        <div className="output-port" />
      </div>
    </div>
  );
}

function TextPromptNode({ data }: any) {
  return (
    <div className="video-node text-prompt-node">
      <div className="node-header">📝 Text Prompt</div>
      <div className="node-content">
        <textarea placeholder="Enter prompt..." value={data.prompt || ''} />
        <select value={data.model || 't2v-A14B'}>
          <option value="t2v-A14B">Text to Video A14B</option>
          <option value="ti2v-5B">Text+Image to Video 5B</option>
        </select>
      </div>
      <div className="node-ports">
        <div className="output-port" />
      </div>
    </div>
  );
}

function ImagePromptNode({ data, id }: any) {
  const handleSelectImage = async () => {
    if (typeof window !== 'undefined' && (window as any).electron) {
      const result = await (window as any).electron.openFile({
        filters: [
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (result && !result.canceled && result.filePaths.length > 0) {
        // Update node data with selected file
        data.path = result.filePaths[0];
        data.preview = `file://${result.filePaths[0]}`;
      }
    }
  };

  return (
    <div className="video-node image-prompt-node">
      <div className="node-header">🖼️ Image Prompt</div>
      <div className="node-content">
        <input 
          type="text" 
          placeholder="Click to select image..." 
          value={data.path ? data.path.split(/[\\\/]/).pop() : ''} 
          onClick={handleSelectImage}
          readOnly
          style={{ cursor: 'pointer' }}
        />
        <button onClick={handleSelectImage} style={{ marginTop: '5px' }}>
          Select Image
        </button>
        <div className="image-preview" style={{ marginTop: '10px', maxHeight: '150px', overflow: 'hidden' }}>
          {data.preview && <img src={data.preview} alt="Preview" style={{ width: '100%', height: 'auto' }} />}
        </div>
      </div>
      <div className="node-ports">
        <div className="output-port" />
      </div>
    </div>
  );
}

function AIGeneratorNode({ data, cinematicSettings }: any) {
  return (
    <div className="video-node ai-generator-node">
      <div className="node-header">🤖 AI Generator</div>
      <div className="node-content">
        <select value={data.mode || 'wan2.2'}>
          <option value="wan2.2">WAN 2.2</option>
          <option value="i2v">Image to Video</option>
          <option value="t2v">Text to Video</option>
          <option value="ti2v">Text+Image to Video</option>
        </select>
        <div className="generator-settings">
          <label>
            Resolution:
            <select value={data.resolution || '1280x704'}>
              <option value="1280x704">1280x704</option>
              <option value="1920x1080">1920x1080</option>
              <option value="3840x2160">3840x2160</option>
            </select>
          </label>
          <label>
            FPS:
            <input type="number" value={data.fps || 30} />
          </label>
        </div>
        <div className="cinematic-badge">
          {cinematicSettings && (
            <span style={{ fontSize: '10px', color: '#00ff88' }}>
              🎬 Cinematic: {cinematicSettings.preset || 'Custom'}
            </span>
          )}
        </div>
      </div>
      <div className="node-ports">
        <div className="input-port" />
        <div className="output-port" />
      </div>
    </div>
  );
}

function EffectProcessorNode({ data }: any) {
  return (
    <div className="video-node effect-processor-node">
      <div className="node-header">✨ Effects Processor</div>
      <div className="node-content">
        <div className="effects-list">
          {data.effects?.map((effect: string, i: number) => (
            <div key={i} className="effect-item">
              <span>{effect}</span>
              <button>⚙️</button>
            </div>
          ))}
        </div>
        <button className="add-effect-btn">+ Add Effect</button>
      </div>
      <div className="node-ports">
        <div className="input-port" />
        <div className="output-port" />
      </div>
    </div>
  );
}

function AudioProcessorNode({ data }: any) {
  return (
    <div className="video-node audio-processor-node">
      <div className="node-header">🎵 Audio Processor</div>
      <div className="node-content">
        <div className="audio-controls">
          <label>
            Volume:
            <input type="range" min="0" max="100" value={data.volume || 50} />
          </label>
          <label>
            <input type="checkbox" checked={data.denoise || false} />
            Noise Reduction
          </label>
          <label>
            <input type="checkbox" checked={data.normalize || false} />
            Normalize
          </label>
        </div>
      </div>
      <div className="node-ports">
        <div className="input-port" />
        <div className="output-port" />
      </div>
    </div>
  );
}

function ColorGradingNode({ data }: any) {
  return (
    <div className="video-node color-grading-node">
      <div className="node-header">🎨 Color Grading</div>
      <div className="node-content">
        <div className="color-controls">
          <label>
            Brightness:
            <input type="range" min="-100" max="100" value={data.brightness || 0} />
          </label>
          <label>
            Contrast:
            <input type="range" min="-100" max="100" value={data.contrast || 0} />
          </label>
          <label>
            Saturation:
            <input type="range" min="-100" max="100" value={data.saturation || 0} />
          </label>
          <label>
            Temperature:
            <input type="range" min="-100" max="100" value={data.temperature || 0} />
          </label>
        </div>
        <select value={data.lut || 'none'}>
          <option value="none">No LUT</option>
          <option value="cinematic">Cinematic</option>
          <option value="vintage">Vintage</option>
          <option value="modern">Modern</option>
        </select>
      </div>
      <div className="node-ports">
        <div className="input-port" />
        <div className="output-port" />
      </div>
    </div>
  );
}

function MotionTrackingNode({ data }: any) {
  return (
    <div className="video-node motion-tracking-node">
      <div className="node-header">📍 Motion Tracking</div>
      <div className="node-content">
        <div className="tracking-controls">
          <select value={data.mode || 'object'}>
            <option value="object">Object Tracking</option>
            <option value="face">Face Tracking</option>
            <option value="camera">Camera Tracking</option>
            <option value="planar">Planar Tracking</option>
          </select>
          <button className="track-btn">Start Tracking</button>
          <div className="tracking-status">
            Status: {data.status || 'Ready'}
          </div>
        </div>
      </div>
      <div className="node-ports">
        <div className="input-port" />
        <div className="output-port" />
      </div>
    </div>
  );
}

function CompositorNode({ data }: any) {
  return (
    <div className="video-node compositor-node">
      <div className="node-header">🎬 Compositor</div>
      <div className="node-content">
        <div className="blend-controls">
          <select value={data.blendMode || 'normal'}>
            <option value="normal">Normal</option>
            <option value="multiply">Multiply</option>
            <option value="screen">Screen</option>
            <option value="overlay">Overlay</option>
            <option value="add">Add</option>
          </select>
          <label>
            Opacity:
            <input type="range" min="0" max="100" value={data.opacity || 100} />
          </label>
        </div>
        <div className="layer-info">
          Layers: {data.layers || 2}
        </div>
      </div>
      <div className="node-ports">
        <div className="input-port top" />
        <div className="input-port bottom" />
        <div className="output-port" />
      </div>
    </div>
  );
}

function ExportNode({ data }: any) {
  return (
    <div className="video-node export-node">
      <div className="node-header">📤 Export</div>
      <div className="node-content">
        <select value={data.format || 'mp4'}>
          <option value="mp4">MP4</option>
          <option value="mov">MOV</option>
          <option value="avi">AVI</option>
          <option value="webm">WebM</option>
          <option value="mkv">MKV</option>
        </select>
        <select value={data.codec || 'h264'}>
          <option value="h264">H.264</option>
          <option value="h265">H.265/HEVC</option>
          <option value="vp9">VP9</option>
          <option value="av1">AV1</option>
        </select>
        <select value={data.quality || 'high'}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="ultra">Ultra</option>
        </select>
        <button className="export-btn">Export</button>
      </div>
      <div className="node-ports">
        <div className="input-port" />
      </div>
    </div>
  );
}

const VideoEditor: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [project, setProject] = useState<VideoProject | null>(null);
  const [timeline, setTimeline] = useState<VideoTrack[]>([]);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `e${params.source}-${params.target}`,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#00ff88', strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `${type}_${Date.now()}`,
      type,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {},
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const initializeDefaultNodes = () => {
    const defaultNodes: Node[] = [
      {
        id: '1',
        type: 'textPrompt',
        position: { x: 100, y: 100 },
        data: { prompt: 'Cinematic video of a sunset over mountains' },
      },
      {
        id: '2',
        type: 'aiGenerator',
        position: { x: 400, y: 100 },
        data: { mode: 'wan2.2', resolution: '1280x704', fps: 30 },
      },
      {
        id: '3',
        type: 'effectProcessor',
        position: { x: 700, y: 100 },
        data: { effects: ['Stabilization', 'Sharpening'] },
      },
      {
        id: '4',
        type: 'colorGrading',
        position: { x: 400, y: 300 },
        data: { brightness: 0, contrast: 10, saturation: 15 },
      },
      {
        id: '5',
        type: 'exportNode',
        position: { x: 1000, y: 200 },
        data: { format: 'mp4', codec: 'h264', quality: 'high' },
      },
    ];

    const defaultEdges: Edge[] = [
      { id: 'e1-2', source: '1', target: '2', markerEnd: { type: MarkerType.ArrowClosed } },
      { id: 'e2-3', source: '2', target: '3', markerEnd: { type: MarkerType.ArrowClosed } },
      { id: 'e3-4', source: '3', target: '4', markerEnd: { type: MarkerType.ArrowClosed } },
      { id: 'e4-5', source: '4', target: '5', markerEnd: { type: MarkerType.ArrowClosed } },
    ];

    setNodes(defaultNodes);
    setEdges(defaultEdges);
  };

  useEffect(() => {
    initializeDefaultNodes();
  }, []);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setPlaybackTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setPlaybackTime(time);
    }
  };

  const executeWorkflow = async () => {
    console.log('Executing workflow with nodes:', nodes, 'and edges:', edges);
    
    const sortedNodes = nodes.sort((a, b) => a.position.x - b.position.x);
    
    for (const node of sortedNodes) {
      console.log(`Processing node: ${node.type}`, node.data);
      
      if (node.type === 'aiGenerator') {
        const inputNodes = edges
          .filter(e => e.target === node.id)
          .map(e => nodes.find(n => n.id === e.source));
        
        for (const inputNode of inputNodes) {
          if (inputNode?.type === 'textPrompt') {
            console.log('Generating video from prompt:', inputNode.data.prompt);
          }
        }
      }
    }
  };

  return (
    <div className="video-editor-container">
      <style jsx>{`
        .video-editor-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #0a0a0a;
          color: #fff;
          font-family: 'Inter', sans-serif;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background: linear-gradient(90deg, #1a1a1a, #2a2a2a);
          border-bottom: 1px solid #333;
        }

        .editor-title {
          font-size: 20px;
          font-weight: 600;
          background: linear-gradient(90deg, #00ff88, #00aaff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .toolbar {
          display: flex;
          gap: 8px;
        }

        .tool-btn {
          padding: 8px 16px;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 6px;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tool-btn:hover {
          background: #3a3a3a;
          border-color: #00ff88;
        }

        .main-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .node-workspace {
          flex: 1;
          position: relative;
          background: #0f0f0f;
        }

        .sidebar {
          width: 300px;
          background: #1a1a1a;
          border-left: 1px solid #333;
          padding: 20px;
          overflow-y: auto;
        }

        .node-library {
          margin-bottom: 30px;
        }

        .node-library h3 {
          font-size: 14px;
          text-transform: uppercase;
          color: #888;
          margin-bottom: 12px;
        }

        .node-list {
          display: grid;
          gap: 8px;
        }

        .node-item {
          padding: 10px;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .node-item:hover {
          background: #3a3a3a;
          border-color: #00ff88;
        }

        .preview-panel {
          height: 300px;
          background: #0a0a0a;
          border-top: 1px solid #333;
          display: flex;
          gap: 20px;
          padding: 20px;
        }

        .video-preview {
          flex: 1;
          background: #000;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
        }

        .video-preview video {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .timeline-container {
          flex: 2;
          background: #1a1a1a;
          border-radius: 8px;
          padding: 16px;
        }

        .playback-controls {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          align-items: center;
        }

        .play-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00ff88, #00aaff);
          border: none;
          color: #000;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .time-display {
          font-family: 'Courier New', monospace;
          color: #00ff88;
        }

        .timeline-tracks {
          background: #0a0a0a;
          border-radius: 4px;
          padding: 8px;
          min-height: 120px;
        }

        .video-node {
          background: #1a1a1a;
          border: 2px solid #333;
          border-radius: 8px;
          min-width: 200px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }

        .video-node:hover {
          border-color: #00ff88;
        }

        .node-header {
          padding: 10px;
          background: linear-gradient(90deg, #2a2a2a, #333);
          border-radius: 6px 6px 0 0;
          font-weight: 600;
          font-size: 14px;
        }

        .node-content {
          padding: 12px;
        }

        .node-content input,
        .node-content textarea,
        .node-content select {
          width: 100%;
          padding: 6px;
          background: #0a0a0a;
          border: 1px solid #444;
          border-radius: 4px;
          color: #fff;
          margin: 4px 0;
        }

        .node-content textarea {
          min-height: 60px;
          resize: vertical;
        }

        .node-ports {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          position: relative;
        }

        .input-port,
        .output-port {
          width: 12px;
          height: 12px;
          background: #00ff88;
          border-radius: 50%;
          border: 2px solid #000;
        }

        .export-btn {
          width: 100%;
          padding: 10px;
          background: linear-gradient(90deg, #00ff88, #00aaff);
          border: none;
          border-radius: 6px;
          color: #000;
          font-weight: 600;
          cursor: pointer;
          margin-top: 10px;
        }

        .generator-settings label,
        .color-controls label {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin: 8px 0;
          font-size: 12px;
          color: #888;
        }

        .effects-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin: 8px 0;
        }

        .effect-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 8px;
          background: #0a0a0a;
          border-radius: 4px;
        }

        .add-effect-btn {
          width: 100%;
          padding: 6px;
          background: #2a2a2a;
          border: 1px dashed #444;
          border-radius: 4px;
          color: #888;
          cursor: pointer;
        }

        .tracking-controls,
        .blend-controls {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .track-btn {
          padding: 6px;
          background: #00ff88;
          border: none;
          border-radius: 4px;
          color: #000;
          font-weight: 600;
          cursor: pointer;
        }

        .tracking-status {
          padding: 6px;
          background: #0a0a0a;
          border-radius: 4px;
          font-size: 12px;
          text-align: center;
        }

        .image-preview {
          width: 100%;
          height: 80px;
          background: #0a0a0a;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .image-preview img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .layer-info {
          padding: 6px;
          background: #0a0a0a;
          border-radius: 4px;
          text-align: center;
          font-size: 12px;
          color: #888;
        }

        .input-port.top {
          position: absolute;
          top: -6px;
          left: calc(50% - 20px);
        }

        .input-port.bottom {
          position: absolute;
          top: -6px;
          left: calc(50% + 8px);
        }
      `}</style>

      <div className="editor-header">
        <h1 className="editor-title">🎬 Professional Video Editor - WAN 2.2 Enhanced</h1>
        <div className="toolbar">
          <button className="tool-btn" onClick={() => addNode('videoInput')}>📹 Input</button>
          <button className="tool-btn" onClick={() => addNode('textPrompt')}>📝 Text</button>
          <button className="tool-btn" onClick={() => addNode('imagePrompt')}>🖼️ Image</button>
          <button className="tool-btn" onClick={() => addNode('aiGenerator')}>🤖 AI Gen</button>
          <button className="tool-btn" onClick={() => addNode('effectProcessor')}>✨ Effects</button>
          <button className="tool-btn" onClick={() => addNode('colorGrading')}>🎨 Color</button>
          <button className="tool-btn" onClick={() => addNode('motionTracking')}>📍 Track</button>
          <button className="tool-btn" onClick={executeWorkflow}>▶️ Execute</button>
        </div>
      </div>

      <div className="main-content">
        <div className="node-workspace">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background color="#222" gap={16} />
            <Controls />
            <MiniMap 
              nodeColor="#00ff88"
              style={{ background: '#0a0a0a', border: '1px solid #333' }}
            />
            <Panel position="top-left">
              <div style={{ padding: '10px', background: '#1a1a1a', borderRadius: '8px' }}>
                Nodes: {nodes.length} | Edges: {edges.length}
              </div>
            </Panel>
          </ReactFlow>
        </div>

        <div className="sidebar">
          <div className="node-library">
            <h3>Input Nodes</h3>
            <div className="node-list">
              <div className="node-item" onClick={() => addNode('videoInput')}>
                📹 Video Input
              </div>
              <div className="node-item" onClick={() => addNode('textPrompt')}>
                📝 Text Prompt
              </div>
              <div className="node-item" onClick={() => addNode('imagePrompt')}>
                🖼️ Image Prompt
              </div>
            </div>
          </div>

          <div className="node-library">
            <h3>Processing Nodes</h3>
            <div className="node-list">
              <div className="node-item" onClick={() => addNode('aiGenerator')}>
                🤖 AI Generator
              </div>
              <div className="node-item" onClick={() => addNode('effectProcessor')}>
                ✨ Effects Processor
              </div>
              <div className="node-item" onClick={() => addNode('audioProcessor')}>
                🎵 Audio Processor
              </div>
              <div className="node-item" onClick={() => addNode('colorGrading')}>
                🎨 Color Grading
              </div>
              <div className="node-item" onClick={() => addNode('motionTracking')}>
                📍 Motion Tracking
              </div>
              <div className="node-item" onClick={() => addNode('compositor')}>
                🎬 Compositor
              </div>
            </div>
          </div>

          <div className="node-library">
            <h3>Output Nodes</h3>
            <div className="node-list">
              <div className="node-item" onClick={() => addNode('exportNode')}>
                📤 Export
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="preview-panel">
        <div className="video-preview">
          <video
            ref={videoRef}
            src={previewUrl}
            onTimeUpdate={handleTimeUpdate}
            controls={false}
          />
        </div>
        <div className="timeline-container">
          <div className="playback-controls">
            <button className="play-btn" onClick={handlePlayPause}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <span className="time-display">
              {Math.floor(playbackTime / 60)}:{(playbackTime % 60).toFixed(2).padStart(5, '0')}
            </span>
          </div>
          <div className="timeline-tracks">
            {timeline.map((track, i) => (
              <div key={track.id} className="track">
                Track {i + 1}: {track.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const VideoEditorApp = () => (
  <ReactFlowProvider>
    <VideoEditor />
  </ReactFlowProvider>
);

export default VideoEditorApp;