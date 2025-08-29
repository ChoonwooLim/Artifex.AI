import React, { useCallback, useState, useRef, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Connection,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  NodeProps,
  ConnectionMode,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom Node Types
const nodeTypes = {
  prompt: 'Prompt Input',
  image: 'Image Input',
  video: 'Video Input',
  model: 'Model Loader',
  sampler: 'Sampler Settings',
  vae: 'VAE Encoder/Decoder',
  controlnet: 'ControlNet',
  upscaler: 'Upscaler',
  preprocessor: 'Preprocessor',
  output: 'Output/Save',
  merge: 'Merge/Combine',
  math: 'Math Operation',
  switch: 'Switch/Router',
  preview: 'Preview'
};

// Custom node component
const CustomNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <div style={{
      padding: '10px 15px',
      borderRadius: '8px',
      background: selected 
        ? 'linear-gradient(135deg, rgba(102,126,234,0.9), rgba(118,75,162,0.9))'
        : data.type === 'output' 
          ? 'linear-gradient(135deg, rgba(52,211,153,0.8), rgba(16,185,129,0.8))'
          : 'linear-gradient(135deg, rgba(30,30,60,0.95), rgba(40,40,80,0.95))',
      border: `2px solid ${selected ? '#667eea' : 'rgba(255,255,255,0.2)'}`,
      color: '#fff',
      minWidth: '150px',
      boxShadow: selected ? '0 8px 24px rgba(102,126,234,0.4)' : '0 4px 12px rgba(0,0,0,0.3)',
      transition: 'all 0.3s'
    }}>
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#667eea',
          width: '12px',
          height: '12px',
          border: '2px solid #fff'
        }}
      />
      <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>
        {data.label}
      </div>
      {data.type && (
        <div style={{ fontSize: '11px', opacity: 0.7 }}>
          {data.type}
        </div>
      )}
      {data.value && (
        <div style={{ 
          marginTop: '8px', 
          padding: '4px 8px', 
          background: 'rgba(0,0,0,0.3)', 
          borderRadius: '4px',
          fontSize: '11px'
        }}>
          {data.value}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#764ba2',
          width: '12px',
          height: '12px',
          border: '2px solid #fff'
        }}
      />
    </div>
  );
};

const nodeTypesConfig = {
  custom: CustomNode
};

const FlowContent: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: '1',
      type: 'custom',
      position: { x: 100, y: 100 },
      data: { label: 'Prompt Input', type: 'Text to Video', value: 'A cinematic sunset...' }
    },
    {
      id: '2',
      type: 'custom',
      position: { x: 400, y: 100 },
      data: { label: 'Model Loader', type: 'WAN 2.2 ti2v-5B' }
    },
    {
      id: '3',
      type: 'custom',
      position: { x: 700, y: 100 },
      data: { label: 'Sampler', type: 'DPM++ 2M' }
    },
    {
      id: '4',
      type: 'custom',
      position: { x: 1000, y: 100 },
      data: { label: 'Output', type: 'Save Video' }
    }
  ]);

  const [edges, setEdges] = useState<Edge[]>([
    { 
      id: 'e1-2', 
      source: '1', 
      target: '2',
      animated: true,
      style: { stroke: '#667eea', strokeWidth: 2 }
    },
    { 
      id: 'e2-3', 
      source: '2', 
      target: '3',
      animated: true,
      style: { stroke: '#667eea', strokeWidth: 2 }
    },
    { 
      id: 'e3-4', 
      source: '3', 
      target: '4',
      animated: true,
      style: { stroke: '#667eea', strokeWidth: 2 }
    }
  ]);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    show: boolean;
  }>({ x: 0, y: 0, show: false });

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodeIdCounter, setNodeIdCounter] = useState(5);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: `e${params.source}-${params.target}`,
        animated: true,
        style: { stroke: '#667eea', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#667eea'
        }
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    []
  );

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (bounds) {
        setContextMenu({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
          show: true
        });
      }
    },
    []
  );

  const onPaneClick = useCallback(() => {
    setContextMenu({ ...contextMenu, show: false });
  }, [contextMenu]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const addNode = useCallback(
    (type: string) => {
      const id = `node_${nodeIdCounter}`;
      const newNode: Node = {
        id,
        type: 'custom',
        position: project({ x: contextMenu.x, y: contextMenu.y }),
        data: { 
          label: nodeTypes[type as keyof typeof nodeTypes] || type,
          type: type
        }
      };
      setNodes((nds) => [...nds, newNode]);
      setNodeIdCounter(nodeIdCounter + 1);
      setContextMenu({ ...contextMenu, show: false });
    },
    [contextMenu, nodeIdCounter, project]
  );

  const deleteSelectedNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setEdges((eds) => eds.filter((edge) => 
        edge.source !== selectedNode.id && edge.target !== selectedNode.id
      ));
      setSelectedNode(null);
    }
  }, [selectedNode]);

  // WAN API integration
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState('');
  
  const executeFlow = useCallback(async () => {
    if (!window.wanApi) {
      setLogs('WAN API not available\n');
      return;
    }
    
    setRunning(true);
    setLogs('Executing flow...\n');
    
    // Analyze the flow and generate execution parameters
    const promptNode = nodes.find(n => n.data.type === 'Text to Video');
    const modelNode = nodes.find(n => n.data.type?.includes('WAN'));
    
    if (promptNode && modelNode) {
      setLogs(logs + `Using prompt: ${promptNode.data.value}\n`);
      setLogs(logs + `Using model: ${modelNode.data.type}\n`);
      // Here you would call the actual WAN API
    }
    
    setTimeout(() => {
      setLogs(logs + 'Flow execution completed!\n');
      setRunning(false);
    }, 2000);
  }, [nodes, logs]);

  return (
    <div style={{ 
      width: '100%', 
      height: 'calc(100vh - 120px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      overflow: 'hidden'
    }}>
      {/* Top Toolbar */}
      <div style={{
        padding: '12px 20px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={executeFlow}
            disabled={running}
            style={{
              padding: '8px 20px',
              background: running ? 'rgba(100,100,100,0.3)' : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: running ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: running ? 0.5 : 1
            }}
          >
            {running ? '⏳ Running...' : '▶️ Execute Flow'}
          </button>
          <button
            onClick={() => {
              setNodes([]);
              setEdges([]);
            }}
            style={{
              padding: '8px 20px',
              background: 'rgba(244,63,94,0.2)',
              color: '#fff',
              border: '1px solid rgba(244,63,94,0.3)',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🗑️ Clear
          </button>
          {selectedNode && (
            <button
              onClick={deleteSelectedNode}
              style={{
                padding: '8px 20px',
                background: 'rgba(255,100,100,0.2)',
                color: '#fff',
                border: '1px solid rgba(255,100,100,0.3)',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ❌ Delete Node
            </button>
          )}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
          Right-click to add nodes • Drag to connect • Click to select
        </div>
      </div>

      {/* Main Flow Area */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        gap: '16px',
        minHeight: 0,
        overflow: 'hidden'
      }}>
        <div 
          ref={reactFlowWrapper}
          style={{ 
            flex: '1 1 auto',
            minWidth: 0,
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onPaneContextMenu={onPaneContextMenu}
            onPaneClick={onPaneClick}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypesConfig}
            connectionMode={ConnectionMode.Loose}
            fitView
            attributionPosition="bottom-left"
          >
            <Background 
              color="rgba(102,126,234,0.1)" 
              gap={20}
              size={1}
            />
            <Controls 
              style={{
                background: 'rgba(30,30,60,0.9)',
                border: '1px solid rgba(102,126,234,0.3)',
                borderRadius: '8px'
              }}
            />
            <MiniMap 
              style={{
                background: 'rgba(30,30,60,0.9)',
                border: '1px solid rgba(102,126,234,0.3)',
                borderRadius: '8px'
              }}
              nodeColor={(node) => {
                if (node.id === selectedNode?.id) return '#667eea';
                return node.data.type === 'output' ? '#10b981' : '#764ba2';
              }}
            />
          </ReactFlow>

          {/* Context Menu */}
          {contextMenu.show && (
            <div
              style={{
                position: 'absolute',
                top: contextMenu.y,
                left: contextMenu.x,
                background: 'linear-gradient(135deg, rgba(30,30,60,0.98), rgba(40,40,80,0.98))',
                border: '1px solid rgba(102,126,234,0.3)',
                borderRadius: '12px',
                padding: '8px',
                minWidth: '200px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                zIndex: 1000,
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{ 
                fontSize: '12px', 
                fontWeight: '600', 
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '8px',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                Add Node
              </div>
              {Object.entries(nodeTypes).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => addNode(key)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '13px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(102,126,234,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Properties/Logs */}
        <div style={{
          width: '350px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: '4px'
        }}>
          {/* Node Properties */}
          {selectedNode && (
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600',
                marginBottom: '12px',
                color: '#fff'
              }}>
                Node Properties
              </h3>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>ID:</strong> {selectedNode.id}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Type:</strong> {selectedNode.data.type || 'Custom'}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Label:</strong>
                  <input
                    type="text"
                    value={selectedNode.data.label}
                    onChange={(e) => {
                      setNodes((nds) =>
                        nds.map((node) =>
                          node.id === selectedNode.id
                            ? { ...node, data: { ...node.data, label: e.target.value } }
                            : node
                        )
                      );
                    }}
                    style={{
                      width: '100%',
                      padding: '6px',
                      marginTop: '4px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '13px'
                    }}
                  />
                </div>
                {selectedNode.data.value !== undefined && (
                  <div>
                    <strong>Value:</strong>
                    <textarea
                      value={selectedNode.data.value}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((node) =>
                            node.id === selectedNode.id
                              ? { ...node, data: { ...node.data, value: e.target.value } }
                              : node
                          )
                        );
                      }}
                      style={{
                        width: '100%',
                        padding: '6px',
                        marginTop: '4px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '13px',
                        minHeight: '60px',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Execution Logs */}
          <div style={{
            flex: 1,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600',
              marginBottom: '12px',
              color: '#fff'
            }}>
              Execution Logs
            </h3>
            <textarea
              value={logs}
              readOnly
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.3)',
                color: '#00ff88',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12px',
                fontFamily: 'Consolas, monospace',
                resize: 'none'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const Flow: React.FC = () => {
  return (
    <ReactFlowProvider>
      <FlowContent />
    </ReactFlowProvider>
  );
};

export default Flow;