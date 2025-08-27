import React from 'react';

const presets = {
  sdxl: { w: 1024, h: 1024, steps: 30, cfg: 6.5 },
  sd15: { w: 768, h: 768, steps: 25, cfg: 7 }
};

const T2I: React.FC = () => {
  const [model, setModel] = React.useState<'sdxl' | 'sd15'>('sdxl');
  const [prompt, setPrompt] = React.useState('highly detailed photo of a cute corgi');
  const [negative, setNegative] = React.useState('low quality, artifacts, blurry');
  const [width, setWidth] = React.useState(1024);
  const [height, setHeight] = React.useState(1024);
  const [steps, setSteps] = React.useState(30);
  const [cfg, setCfg] = React.useState(6.5);
  const [seed, setSeed] = React.useState(-1);
  const [pythonPath, setPythonPath] = React.useState('python');
  const [last, setLast] = React.useState('');
  const logRef = React.useRef<HTMLTextAreaElement>(null);

  const applyPreset = (m: 'sdxl' | 'sd15') => {
    const p = presets[m];
    setWidth(p.w); setHeight(p.h); setSteps(p.steps); setCfg(p.cfg);
  };

  const append = (s: string) => { if (logRef.current) { logRef.current.value += s; logRef.current.scrollTop = logRef.current.scrollHeight; } };

  const run = async () => {
    const script = 'python/t2i.py';
    const outName = `${model}_${width}x${height}.png`;
    const args = ['--model', model, '--prompt', prompt, '--negative', negative, '--width', String(width), '--height', String(height), '--steps', String(steps), '--cfg', String(cfg), '--seed', String(seed), '--output', outName];
    logRef.current && (logRef.current.value = '');
    window.wanApi.onStdout((d) => { append(d); const m = d.match(/Saving generated image to (.*\.png)/i); if (m && m[1]) setLast(m[1]); });
    window.wanApi.onStderr((d) => append(d));
    window.wanApi.onClosed((_c) => append('\n[closed]\n'));
    await window.wanApi.run({ pythonPath, scriptPath: script, args, cwd: undefined });
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <label>Model</label>
        <select value={model} onChange={(e) => { const m = e.target.value as any; setModel(m); applyPreset(m); }}>
          <option value="sdxl">SDXL</option>
          <option value="sd15">SD1.5</option>
        </select>
        <label>Prompt</label>
        <input style={{ width: 420 }} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <label>Negative</label>
        <input style={{ width: 300 }} value={negative} onChange={(e) => setNegative(e.target.value)} />
        <label>Size</label>
        <input style={{ width: 70 }} value={width} onChange={(e) => setWidth(Number(e.target.value))} />x
        <input style={{ width: 70 }} value={height} onChange={(e) => setHeight(Number(e.target.value))} />
        <label>Steps</label>
        <input style={{ width: 60 }} value={steps} onChange={(e) => setSteps(Number(e.target.value))} />
        <label>CFG</label>
        <input style={{ width: 60 }} value={cfg} onChange={(e) => setCfg(Number(e.target.value))} />
        <label>Seed</label>
        <input style={{ width: 100 }} value={seed} onChange={(e) => setSeed(Number(e.target.value))} />
        <label>Python</label>
        <input style={{ width: 200 }} value={pythonPath} onChange={(e) => setPythonPath(e.target.value)} />
        <button onClick={run}>Generate</button>
      </div>
      <div>
        <textarea ref={logRef} style={{ width: '100%', height: 200, fontFamily: 'Consolas, monospace' }} readOnly />
        {last && <img src={last} style={{ width: 420, marginTop: 10 }} />}
      </div>
    </div>
  );
};

export default T2I;



