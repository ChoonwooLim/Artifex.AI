import React from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

type RunResult = { ok: boolean; message?: string };

const Flow: React.FC = () => {
  const [task, setTask] = React.useState<'t2v-A14B' | 'i2v-A14B' | 'ti2v-5B'>('ti2v-5B');
  const [size, setSize] = React.useState('1280*704');
  const [prompt, setPrompt] = React.useState('A cinematic sunset over mountain lake');
  const [image, setImage] = React.useState('');
  const [ckpt, setCkpt] = React.useState('');
  const [pythonPath, setPythonPath] = React.useState('python');
  const [scriptPath, setScriptPath] = React.useState('');
  const [useOffload, setUseOffload] = React.useState(false);
  const [useConvertDtype, setUseConvertDtype] = React.useState(true);
  const [useT5Cpu, setUseT5Cpu] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const logRef = React.useRef<HTMLTextAreaElement>(null);

  const appendLog = (s: string) => {
    if (!logRef.current) return;
    logRef.current.value += s;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  };

  const run = async () => {
    if (running) return;
    setRunning(true);
    logRef.current && (logRef.current.value = '');
    const args: string[] = ['--task', task, '--size', size, '--ckpt_dir', ckpt, '--prompt', prompt];
    if (task !== 't2v-A14B' && image) { args.push('--image', image); }
    // Always explicitly pass offload_model to prevent script default
    args.push('--offload_model', useOffload ? 'True' : 'False');
    if (useConvertDtype) args.push('--convert_model_dtype');
    if (useT5Cpu) args.push('--t5_cpu');
    // Add missing required parameters
    args.push('--sample_guide_scale', '7.5');
    args.push('--base_seed', '-1');
    args.push('--sample_solver', 'dpm++');

    window.wanApi.onStdout((d) => appendLog(d));
    window.wanApi.onStderr((d) => appendLog(d));
    window.wanApi.onClosed((code) => { appendLog(`\n[closed] code=${code}\n`); setRunning(false); });
    const res: RunResult = await window.wanApi.run({ pythonPath, scriptPath, args });
    if (!res.ok) { appendLog(`\n[error] ${res.message}\n`); setRunning(false); }
  };

  const cancel = async () => {
    if (!running) return;
    const r = await window.wanApi.cancel();
    if (!r.ok) appendLog(`\n[cancel-error] ${r.message}\n`);
  };

  const layoutNodes = [
    { id: 'prompt', position: { x: 50, y: 40 }, data: { label: 'Prompt' }, type: 'input' },
    { id: 'image', position: { x: 50, y: 160 }, data: { label: 'Image (optional)' } },
    { id: 'settings', position: { x: 320, y: 40 }, data: { label: 'Settings (size, ckpt)' } },
    { id: 'exec', position: { x: 600, y: 100 }, data: { label: 'Generate' }, type: 'output' }
  ];
  const layoutEdges = [
    { id: 'e1', source: 'prompt', target: 'settings' },
    { id: 'e2', source: 'image', target: 'settings' },
    { id: 'e3', source: 'settings', target: 'exec' }
  ];

  const pickImage = async () => {
    const f = await window.wanApi.openFile([{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }]);
    if (f) setImage(f);
  };
  const pickScript = async () => {
    const f = await window.wanApi.openFile([{ name: 'Python', extensions: ['py'] }]);
    if (f) setScriptPath(f);
  };
  const pickCkpt = async () => {
    const d = await window.wanApi.openFolder();
    if (d) setCkpt(d);
  };
  const autoCkpt = async () => {
    const list = await window.wanApi.suggestCkpt(task);
    if (list && list.length) { setCkpt(list[0]); appendLog(`\n[hint] Auto-detected checkpoint: ${list[0]}`); }
  };

  const disabled = !scriptPath || !ckpt || !size || !task;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 12 }}>
      <div style={{ height: 420, border: '1px solid #ccc', borderRadius: 6 }}>
        <ReactFlow nodes={layoutNodes as any} edges={layoutEdges as any} fitView>
          <Background />
          <Controls />
        </ReactFlow>
      </div>
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 6 }}>
          <label>Task</label>
          <select value={task} onChange={(e) => setTask(e.target.value as any)}>
            <option value="t2v-A14B">t2v-A14B</option>
            <option value="i2v-A14B">i2v-A14B</option>
            <option value="ti2v-5B">ti2v-5B</option>
          </select>
          <label>Size</label>
          <input value={size} onChange={(e) => setSize(e.target.value)} />
          <label>Checkpoint</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input style={{ flex: 1 }} value={ckpt} onChange={(e) => setCkpt(e.target.value)} />
            <button onClick={pickCkpt}>Browse</button>
            <button onClick={autoCkpt}>Auto</button>
          </div>
          <label>Prompt</label>
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          <label>Image</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input style={{ flex: 1 }} value={image} onChange={(e) => setImage(e.target.value)} />
            <button onClick={pickImage}>Browse</button>
          </div>
          <label>Python</label>
          <input value={pythonPath} onChange={(e) => setPythonPath(e.target.value)} />
          <label>Script</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input style={{ flex: 1 }} value={scriptPath} onChange={(e) => setScriptPath(e.target.value)} />
            <button onClick={pickScript}>Browse</button>
          </div>
          <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 16 }}>
            <label><input type="checkbox" checked={useOffload} onChange={(e) => setUseOffload(e.target.checked)} /> offload</label>
            <label><input type="checkbox" checked={useConvertDtype} onChange={(e) => setUseConvertDtype(e.target.checked)} /> convert dtype</label>
            <label><input type="checkbox" checked={useT5Cpu} onChange={(e) => setUseT5Cpu(e.target.checked)} /> t5 cpu</label>
          </div>
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <button onClick={run} disabled={running || disabled}>Run</button>
          <button onClick={cancel} disabled={!running}>Cancel</button>
        </div>
        <textarea ref={logRef} style={{ width: '100%', height: 160, marginTop: 10, fontFamily: 'Consolas, monospace' }} readOnly />
      </div>
    </div>
  );
};

export default Flow;



